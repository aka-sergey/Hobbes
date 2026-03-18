#!/usr/bin/env python3
import json
import os
import re
import sys
from copy import deepcopy


POLICIES_PATH = os.environ.get("HOBBES_CHAT_POLICIES_PATH", "/home/hobbes/.openclaw/policies/chat_policies.json")
OPENCLAW_PATH = os.environ.get("HOBBES_OPENCLAW_PATH", "/home/hobbes/.openclaw/openclaw.json")
COMPILED_DIR = os.environ.get("HOBBES_COMPILED_DIR", "/home/hobbes/.openclaw/runtime")
COMPILED_JSON_PATH = os.path.join(COMPILED_DIR, "telegram-group-runtime.json")
COMPILED_MD_PATH = os.path.join(COMPILED_DIR, "TELEGRAM_GROUP_POLICIES.md")


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: str, payload: dict):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def write_text(path: str, content: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)


def unique_strings(items):
    seen = set()
    result = []
    for item in items:
        if not isinstance(item, str):
            continue
        value = item.strip()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def merge_dict(base: dict | None, override: dict | None):
    result = deepcopy(base or {})
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge_dict(result[key], value)
        else:
            result[key] = deepcopy(value)
    return result


def validate_policies(payload: dict):
    chats = payload.get("chats")
    if not isinstance(chats, list):
        raise ValueError("chat_policies: `chats` must be a list")

    seen_chat_ids: dict[str, str] = {}
    for entry in chats:
        if not isinstance(entry, dict):
            raise ValueError("chat_policies: each chat entry must be an object")
        chat_id = entry.get("chatId")
        slug = entry.get("slug", "<missing-slug>")
        if not isinstance(chat_id, str) or not chat_id.strip():
            raise ValueError("chat_policies: each chat must have a non-empty string chatId")
        if chat_id in seen_chat_ids:
            raise ValueError(f"chat_policies: duplicate chatId detected: {chat_id} ({seen_chat_ids[chat_id]} and {slug})")
        seen_chat_ids[chat_id] = str(slug)


def mode_requires_signal(mode: str, react_without_signal: bool) -> bool:
    if react_without_signal:
        return False
    return mode in {"mention_or_reply", "mention_or_reply_or_keyword"}


def compile_group_system_prompt(chat: dict):
    persona = chat.get("persona", "default_operator")
    description = chat.get("description", "")
    language = chat.get("style", {}).get("language", "ru")
    tone = chat.get("style", {}).get("tone", "calm_operator")
    max_shape = chat.get("style", {}).get("maxAnswerShape", "short_paragraph")
    allow_topics = unique_strings(chat.get("topicPolicy", {}).get("allow", []))
    deny_topics = unique_strings(chat.get("topicPolicy", {}).get("deny", []))
    keywords = unique_strings(chat.get("activationKeywords", []))

    lines = [
        "You are Hobbes in a Telegram group chat.",
        f"Primary persona: {persona}.",
        f"Chat description: {description}" if description else "Chat description: not specified.",
        f"Preferred answer language: {language}.",
        f"Preferred tone: {tone}.",
        f"Preferred answer shape: {max_shape}.",
        "Use concise and useful answers. Do not become noisy.",
        "Answer only within the role and topic scope of this group.",
        "If the request is outside the allowed scope or crosses a denied boundary, refuse briefly and safely.",
        "Do not improvise a different persona for this chat.",
        "Do not pretend you are a licensed professional, regulated advisor, or guaranteed authority beyond the configured persona scope.",
    ]

    if allow_topics:
        lines.append("Allowed topics:")
        lines.extend([f"- {item}" for item in allow_topics])

    if deny_topics:
        lines.append("Denied topics:")
        lines.extend([f"- {item}" for item in deny_topics])

    if keywords:
        lines.append("Typical activation keywords in this chat:")
        lines.extend([f"- {item}" for item in keywords])

    return "\n".join(lines)


def keyword_to_pattern(keyword: str):
    escaped = re.escape(keyword.strip())
    if not escaped:
        return None
    return escaped


def build_runtime(policies: dict, openclaw: dict):
    defaults = policies.get("defaults", {})
    chats = policies.get("chats", [])

    enabled_chats = []
    for raw_chat in chats:
        merged = merge_dict(defaults, raw_chat)
        if merged.get("enabled") is True:
            enabled_chats.append(merged)

    channels = openclaw.setdefault("channels", {})
    telegram = channels.setdefault("telegram", {})
    telegram["groupPolicy"] = "allowlist"

    compiled_groups: dict[str, dict] = {}
    activation_keywords: list[str] = []

    for chat in enabled_chats:
        chat_id = chat["chatId"]
        reply_policy = chat.get("replyPolicy", {})
        mode = reply_policy.get("mode", "mention_or_reply")
        react_without_signal = bool(reply_policy.get("reactWithoutSignal", False))
        require_mention = mode_requires_signal(str(mode), react_without_signal)
        keywords = unique_strings(chat.get("activationKeywords", []))
        activation_keywords.extend(keywords)

        compiled_groups[chat_id] = {
            "groupPolicy": "open",
            "agentId": "main",
            "requireMention": require_mention,
            "systemPrompt": compile_group_system_prompt(chat)
        }

    telegram["groups"] = compiled_groups

    agents = openclaw.setdefault("agents", {})
    agent_list = agents.setdefault("list", [])
    main_agent = None
    for entry in agent_list:
        if isinstance(entry, dict) and entry.get("id") == "main":
            main_agent = entry
            break

    if main_agent is None:
        main_agent = {"id": "main"}
        agent_list.insert(0, main_agent)

    mention_patterns = unique_strings(
        [
            "хоббс",
            "hobbes",
            *activation_keywords,
        ]
    )
    compiled_patterns = [pattern for pattern in (keyword_to_pattern(item) for item in mention_patterns) if pattern]

    main_group_chat = main_agent.setdefault("groupChat", {})
    main_group_chat["mentionPatterns"] = compiled_patterns

    runtime_snapshot = {
        "enabledChatCount": len(enabled_chats),
        "chatIds": [chat["chatId"] for chat in enabled_chats],
        "mentionPatterns": compiled_patterns,
        "groups": compiled_groups,
    }

    markdown_lines = [
        "# Telegram Group Runtime",
        "",
        "Compiled from `chat_policies.json`.",
        "",
        f"- enabled chats: {len(enabled_chats)}",
        f"- top-level groupPolicy: {telegram.get('groupPolicy')}",
        "",
    ]

    for chat in enabled_chats:
        markdown_lines.extend(
            [
                f"## {chat.get('slug', chat['chatId'])}",
                "",
                f"- chatId: `{chat['chatId']}`",
                f"- persona: `{chat.get('persona', 'default_operator')}`",
                f"- mode: `{chat.get('replyPolicy', {}).get('mode', 'mention_or_reply')}`",
                f"- requireMention: `{compiled_groups[chat['chatId']]['requireMention']}`",
                f"- activation keywords: {', '.join(unique_strings(chat.get('activationKeywords', []))) or 'none'}",
                "",
            ]
        )

    return openclaw, runtime_snapshot, "\n".join(markdown_lines)


def main():
    policies = load_json(POLICIES_PATH)
    validate_policies(policies)
    openclaw = load_json(OPENCLAW_PATH)
    updated_openclaw, runtime_snapshot, markdown = build_runtime(policies, openclaw)
    write_json(OPENCLAW_PATH, updated_openclaw)
    write_json(COMPILED_JSON_PATH, runtime_snapshot)
    write_text(COMPILED_MD_PATH, markdown)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
