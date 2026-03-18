#!/usr/bin/env python3
import json
import os
import re
from copy import deepcopy


POLICIES_PATH = os.environ.get("HOBBES_CHAT_POLICIES_PATH", "/home/hobbes/.openclaw/policies/chat_policies.json")
PROFILES_PATH = os.environ.get("HOBBES_BEHAVIOR_PROFILES_PATH", "/home/hobbes/.openclaw/policies/behavior_profiles.json")
OPENCLAW_PATH = os.environ.get("HOBBES_OPENCLAW_PATH", "/home/hobbes/.openclaw/openclaw.json")
COMPILED_DIR = os.environ.get("HOBBES_COMPILED_DIR", "/home/hobbes/.openclaw/runtime")
COMPILED_JSON_PATH = os.path.join(COMPILED_DIR, "telegram-group-runtime.json")
COMPILED_MD_PATH = os.path.join(COMPILED_DIR, "TELEGRAM_GROUP_POLICIES.md")


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_optional_json(path: str, fallback: dict):
    if not os.path.exists(path):
        return deepcopy(fallback)
    return load_json(path)


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
    for item in items or []:
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


def merge_topic_policy(base: dict | None, profile: dict | None, chat: dict | None):
    return {
        "allow": unique_strings(
            [
                *((base or {}).get("allow") or []),
                *((profile or {}).get("allow") or []),
                *((chat or {}).get("allow") or []),
            ]
        ),
        "deny": unique_strings(
            [
                *((base or {}).get("deny") or []),
                *((profile or {}).get("deny") or []),
                *((chat or {}).get("deny") or []),
            ]
        ),
    }


def normalize_profiles(payload: dict):
    defaults = payload.get("defaults", {})
    profiles = payload.get("profiles", [])
    normalized = {}

    for index, entry in enumerate(profiles):
        if not isinstance(entry, dict):
            raise ValueError("behavior_profiles: each profile must be an object")

        profile_id = entry.get("id")
        if not isinstance(profile_id, str) or not profile_id.strip():
            raise ValueError(f"behavior_profiles: profile at index {index} must contain a non-empty id")

        if profile_id in normalized:
            raise ValueError(f"behavior_profiles: duplicate profile id detected: {profile_id}")

        merged = {
            "id": profile_id,
            "label": entry.get("label", profile_id),
            "persona": entry.get("persona", "default_operator"),
            "description": entry.get("description", ""),
            "systemPrompt": entry.get("systemPrompt", ""),
            "expertise": unique_strings(entry.get("expertise", [])),
            "style": merge_dict(defaults.get("style"), entry.get("style")),
            "moderation": merge_dict(defaults.get("moderation"), entry.get("moderation")),
            "topicPolicy": merge_topic_policy(defaults.get("topicPolicy"), {}, entry.get("topicPolicy")),
            "memoryDefaults": merge_dict(defaults.get("memoryDefaults"), entry.get("memoryDefaults")),
        }
        normalized[profile_id] = merged

    return normalized


def validate_policies(policies: dict, profiles: dict):
    chats = policies.get("chats")
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

        profile_id = entry.get("profileId")
        persona = entry.get("persona")
        if isinstance(profile_id, str) and profile_id and profile_id not in profiles and not isinstance(persona, str):
            raise ValueError(f"chat_policies: missing profileId {profile_id} for chat {chat_id}")


def mode_requires_signal(mode: str, react_without_signal: bool) -> bool:
    if react_without_signal:
        return False
    return mode in {"mention_or_reply", "mention_or_reply_or_keyword"}


def compile_group_system_prompt(chat: dict):
    persona = chat.get("persona", "default_operator")
    profile_id = chat.get("profileId", "inline")
    display_name = (chat.get("displayName") or "").strip()
    chat_title = (chat.get("chatTitle") or "").strip()
    chat_username = (chat.get("chatUsername") or "").strip()
    chat_type = (chat.get("chatType") or "").strip()
    known_chat_name = display_name or chat_title or chat.get("slug") or chat.get("chatId") or "unknown_chat"
    description = chat.get("description", "")
    language = chat.get("style", {}).get("language", "ru")
    tone = chat.get("style", {}).get("tone", "calm_operator")
    max_shape = chat.get("style", {}).get("maxAnswerShape", "short_paragraph")
    allow_topics = unique_strings(chat.get("topicPolicy", {}).get("allow", []))
    deny_topics = unique_strings(chat.get("topicPolicy", {}).get("deny", []))
    keywords = unique_strings(chat.get("activationKeywords", []))
    prompt_override = chat.get("promptOverride", "")
    system_prompt = chat.get("systemPrompt", "")
    memory_mode = chat.get("memoryPolicy", {}).get("mode", "chat_isolated")
    allow_sharp = bool(chat.get("moderation", {}).get("allowSharpTone", False))
    uses_slang = bool(chat.get("style", {}).get("usesSlang", False))
    step_by_step = bool(chat.get("style", {}).get("stepByStep", False))

    lines = [
        "You are Hobbes in a Telegram chat.",
        f"Primary persona: {persona}.",
        f"Profile: {profile_id}.",
        f"Known chat name: {known_chat_name}.",
        f"Chat description: {description}" if description else "Chat description: not specified.",
        f"Preferred answer language: {language}.",
        f"Preferred tone: {tone}.",
        f"Preferred answer shape: {max_shape}.",
        f"Memory mode: {memory_mode}.",
        "Use concise and useful answers. Do not become noisy.",
        "Answer only within the role and topic scope of this chat.",
        "If the request is outside the allowed scope or crosses a denied boundary, refuse briefly and safely.",
        "Do not pretend you are a licensed professional, regulated advisor, or guaranteed authority beyond the configured persona scope.",
    ]

    if chat_title:
        lines.append(f"Telegram chat title: {chat_title}.")

    if chat_username:
        lines.append(f"Telegram username: {chat_username}.")

    if chat_type:
        lines.append(f"Telegram chat type: {chat_type}.")

    lines.append(
        "Controlled slang is allowed when it improves fit for the chat."
        if uses_slang
        else "Avoid unnecessary slang."
    )
    lines.append(
        "Prefer step-by-step answers when useful."
        if step_by_step
        else "Do not over-structure short answers."
    )
    lines.append(
        "A sharp or dry tone is allowed, but never turn it into abuse or harassment."
        if allow_sharp
        else "Keep the tone controlled and non-hostile."
    )

    if system_prompt:
        lines.append("Profile system prompt:")
        lines.append(system_prompt)

    if prompt_override:
        lines.append("Chat-specific override:")
        lines.append(prompt_override)

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


def resolve_chat(chat_defaults: dict, raw_chat: dict, profiles: dict):
    merged = merge_dict(chat_defaults, raw_chat)
    profile = profiles.get(merged.get("profileId"), {})

    resolved = merge_dict(merged, {})
    resolved["profileId"] = merged.get("profileId") or profile.get("id") or "default_operator"
    resolved["persona"] = profile.get("persona") or merged.get("persona") or chat_defaults.get("persona") or "default_operator"
    resolved["systemPrompt"] = profile.get("systemPrompt", "")
    resolved["expertise"] = unique_strings(profile.get("expertise", []))
    resolved["style"] = merge_dict(chat_defaults.get("style"), profile.get("style"))
    resolved["style"] = merge_dict(resolved.get("style"), raw_chat.get("style"))
    resolved["moderation"] = merge_dict(chat_defaults.get("moderation"), profile.get("moderation"))
    resolved["moderation"] = merge_dict(resolved.get("moderation"), raw_chat.get("moderation"))
    resolved["memoryPolicy"] = merge_dict(chat_defaults.get("memoryPolicy"), profile.get("memoryDefaults"))
    resolved["memoryPolicy"] = merge_dict(resolved.get("memoryPolicy"), raw_chat.get("memoryPolicy"))
    if "memoryScope" in raw_chat and "mode" not in raw_chat.get("memoryPolicy", {}):
        resolved["memoryPolicy"]["mode"] = raw_chat.get("memoryScope")
    resolved["topicPolicy"] = merge_topic_policy(chat_defaults.get("topicPolicy"), profile.get("topicPolicy"), raw_chat.get("topicPolicy"))
    resolved["activationKeywords"] = unique_strings(raw_chat.get("activationKeywords", []))
    resolved["compiledPrompt"] = compile_group_system_prompt(resolved)
    return resolved


def build_runtime(policies: dict, profiles_payload: dict, openclaw: dict):
    defaults = policies.get("defaults", {})
    profiles = normalize_profiles(profiles_payload)
    chats = policies.get("chats", [])

    enabled_chats = []
    for raw_chat in chats:
        resolved = resolve_chat(defaults, raw_chat, profiles)
        if resolved.get("enabled") is True:
            enabled_chats.append(resolved)

    channels = openclaw.setdefault("channels", {})
    telegram = channels.setdefault("telegram", {})
    telegram["groupPolicy"] = "allowlist"

    compiled_groups: dict[str, dict] = {}
    activation_keywords: list[str] = []
    resolved_snapshot_groups: dict[str, dict] = {}

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
            "requireMention": require_mention,
            "systemPrompt": chat["compiledPrompt"]
        }

        resolved_snapshot_groups[chat_id] = {
            "chatId": chat_id,
            "slug": chat.get("slug", chat_id),
            "displayName": chat.get("displayName", ""),
            "chatTitle": chat.get("chatTitle", ""),
            "chatUsername": chat.get("chatUsername", ""),
            "chatType": chat.get("chatType", ""),
            "enabled": True,
            "profileId": chat.get("profileId", "default_operator"),
            "persona": chat.get("persona", "default_operator"),
            "description": chat.get("description", ""),
            "compiledPrompt": chat["compiledPrompt"],
            "replyPolicy": chat.get("replyPolicy", {}),
            "memoryPolicy": chat.get("memoryPolicy", {}),
            "moderation": chat.get("moderation", {}),
            "topicPolicy": chat.get("topicPolicy", {}),
            "style": chat.get("style", {}),
            "activationKeywords": keywords,
            "expertise": chat.get("expertise", []),
            "telegramContext": {
                "chatId": chat_id,
                "profileId": chat.get("profileId", "default_operator"),
                "persona": chat.get("persona", "default_operator"),
                "displayName": chat.get("displayName", ""),
                "chatTitle": chat.get("chatTitle", ""),
                "chatUsername": chat.get("chatUsername", ""),
                "chatType": chat.get("chatType", ""),
                "memoryMode": chat.get("memoryPolicy", {}).get("mode", "chat_isolated"),
                "replyMode": mode,
            },
        }

    telegram["groups"] = compiled_groups
    telegram["groupAllowFrom"] = ["*"] if enabled_chats else []

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
        "groups": resolved_snapshot_groups,
        "profiles": sorted(list(profiles.keys())),
    }

    markdown_lines = [
        "# Telegram Group Runtime",
        "",
        "Compiled from `chat_policies.json` and `behavior_profiles.json`.",
        "",
        f"- enabled chats: {len(enabled_chats)}",
        f"- top-level groupPolicy: {telegram.get('groupPolicy')}",
        f"- known profiles: {', '.join(sorted(list(profiles.keys()))) or 'none'}",
        "",
    ]

    for chat in enabled_chats:
        markdown_lines.extend(
            [
                f"## {chat.get('slug', chat['chatId'])}",
                "",
                f"- displayName: `{chat.get('displayName', '') or 'none'}`",
                f"- chatTitle: `{chat.get('chatTitle', '') or 'none'}`",
                f"- chatUsername: `{chat.get('chatUsername', '') or 'none'}`",
                f"- chatType: `{chat.get('chatType', '') or 'none'}`",
                f"- chatId: `{chat['chatId']}`",
                f"- profileId: `{chat.get('profileId', 'default_operator')}`",
                f"- persona: `{chat.get('persona', 'default_operator')}`",
                f"- memoryMode: `{chat.get('memoryPolicy', {}).get('mode', 'chat_isolated')}`",
                f"- mode: `{chat.get('replyPolicy', {}).get('mode', 'mention_or_reply')}`",
                f"- requireMention: `{compiled_groups[chat['chatId']]['requireMention']}`",
                f"- activation keywords: {', '.join(unique_strings(chat.get('activationKeywords', []))) or 'none'}",
                "",
                "### Prompt summary",
                "",
                chat["compiledPrompt"],
                "",
            ]
        )

    return openclaw, runtime_snapshot, "\n".join(markdown_lines)


def main():
    policies = load_json(POLICIES_PATH)
    profiles_payload = load_optional_json(
        PROFILES_PATH,
        {
            "version": 1,
            "defaults": {},
            "profiles": []
        },
    )
    profiles = normalize_profiles(profiles_payload)
    validate_policies(policies, profiles)
    openclaw = load_json(OPENCLAW_PATH)
    updated_openclaw, runtime_snapshot, markdown = build_runtime(policies, profiles_payload, openclaw)
    write_json(OPENCLAW_PATH, updated_openclaw)
    write_json(COMPILED_JSON_PATH, runtime_snapshot)
    write_text(COMPILED_MD_PATH, markdown)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
