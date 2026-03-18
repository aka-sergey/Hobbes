#!/usr/bin/env python3
import copy
import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("compile_telegram_group_policies.py")
compiler = SourceFileLoader("compile_telegram_group_policies", str(MODULE_PATH)).load_module()


class CompileTelegramGroupPoliciesTest(unittest.TestCase):
    def test_build_runtime_emits_snapshot_metadata_without_polluting_openclaw_group_shape(self):
        policies = {
            "defaults": {
                "enabled": False,
                "profileId": "default_operator",
                "replyPolicy": {
                    "mode": "mention_or_reply",
                    "reactWithoutSignal": False,
                },
                "memoryPolicy": {
                    "mode": "chat_isolated",
                    "retainRecentMessages": 40,
                    "retainRollingSummary": True,
                    "storeFacts": True,
                    "sharedDomainKey": "",
                },
                "style": {
                    "language": "ru",
                    "tone": "calm_operator",
                    "maxAnswerShape": "short_paragraph",
                    "usesSlang": False,
                    "stepByStep": False,
                },
                "topicPolicy": {
                    "allow": [],
                    "deny": ["secret handling"],
                },
                "moderation": {
                    "allowSharpTone": False,
                    "forbidAbuse": True,
                    "forbidHarassment": True,
                    "forbidHate": True,
                },
            },
            "chats": [
                {
                    "chatId": "-10001",
                    "slug": "it_team",
                    "enabled": True,
                    "profileId": "it_specialist",
                    "persona": "it_specialist",
                    "description": "IT chat",
                    "promptOverride": "Start with likely causes.",
                    "replyPolicy": {
                        "mode": "mention_or_reply_or_keyword",
                        "reactWithoutSignal": False,
                    },
                    "activationKeywords": ["infra", "deploy"],
                }
            ],
        }
        profiles = {
            "defaults": {
                "style": {
                    "language": "ru",
                    "tone": "calm_operator",
                    "maxAnswerShape": "short_paragraph",
                    "usesSlang": False,
                    "stepByStep": False,
                },
                "moderation": {
                    "allowSharpTone": False,
                    "forbidAbuse": True,
                    "forbidHarassment": True,
                    "forbidHate": True,
                },
                "topicPolicy": {
                    "allow": [],
                    "deny": [],
                },
                "memoryDefaults": {
                    "mode": "chat_isolated",
                    "retainRecentMessages": 40,
                    "retainRollingSummary": True,
                    "storeFacts": True,
                    "sharedDomainKey": "",
                },
            },
            "profiles": [
                {
                    "id": "it_specialist",
                    "label": "IT Specialist",
                    "persona": "it_specialist",
                    "systemPrompt": "Diagnose before prescribing.",
                    "style": {
                        "tone": "technical_direct",
                        "maxAnswerShape": "compact_bullets",
                        "stepByStep": True,
                    },
                    "topicPolicy": {
                        "allow": ["incident triage"],
                        "deny": ["malware instructions"],
                    },
                }
            ],
        }
        openclaw = {
            "channels": {
                "telegram": {}
            },
            "agents": {
                "list": [
                    {
                        "id": "main"
                    }
                ]
            },
        }

        updated_openclaw, runtime_snapshot, markdown = compiler.build_runtime(
            policies,
            profiles,
            copy.deepcopy(openclaw),
        )

        compiled_group = updated_openclaw["channels"]["telegram"]["groups"]["-10001"]
        self.assertEqual(sorted(compiled_group.keys()), ["groupPolicy", "requireMention", "systemPrompt"])
        self.assertEqual(runtime_snapshot["groups"]["-10001"]["profileId"], "it_specialist")
        self.assertEqual(runtime_snapshot["groups"]["-10001"]["memoryPolicy"]["mode"], "chat_isolated")
        self.assertIn("telegramContext", runtime_snapshot["groups"]["-10001"])
        self.assertIn("Diagnose before prescribing.", markdown)


if __name__ == "__main__":
    unittest.main()
