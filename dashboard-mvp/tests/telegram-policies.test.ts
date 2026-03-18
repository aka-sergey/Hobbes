import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseBehaviorProfilesContent,
  parseChatPoliciesContent,
  parsePersonaIdsFromMarkdown,
  resolveChatBehavior,
  validateBehaviorProfilesDocument,
  validateChatPoliciesDocument
} from "../lib/telegram-policies.ts";

const repoRoot = path.resolve(process.cwd(), "..");
const behaviorProfilesContent = readFileSync(path.join(repoRoot, "config/telegram/behavior_profiles.example.json"), "utf8");
const chatPoliciesContent = readFileSync(path.join(repoRoot, "config/telegram/chat_policies.example.json"), "utf8");
const personasContent = readFileSync(path.join(repoRoot, "config/agents/comms/workspace/PERSONAS.md"), "utf8");

test("parses persona ids from PERSONAS.md", () => {
  const personaIds = parsePersonaIdsFromMarkdown(personasContent);

  assert.ok(personaIds.includes("default_operator"));
  assert.ok(personaIds.includes("it_specialist"));
  assert.ok(personaIds.includes("sharp_sarcastic_operator"));
  assert.ok(personaIds.includes("rude_street_operator"));
  assert.ok(personaIds.includes("unfiltered_ham"));
});

test("resolves chat behavior from profile plus chat overrides", () => {
  const profileDoc = parseBehaviorProfilesContent(behaviorProfilesContent);
  const chatDoc = parseChatPoliciesContent(chatPoliciesContent);
  const cryptoChat = chatDoc.chats.find((chat) => chat.slug === "crypto_operations_group");

  assert.ok(cryptoChat);

  const resolved = resolveChatBehavior(chatDoc, profileDoc, cryptoChat);

  assert.equal(resolved.profileId, "unfiltered_ham");
  assert.equal(resolved.persona, "unfiltered_ham");
  assert.equal(resolved.displayName, "Crypto Operations");
  assert.equal(resolved.chatTitle, "Crypto Operations RU");
  assert.equal(resolved.chatUsername, "crypto_ops_ru");
  assert.equal(resolved.chatType, "supergroup");
  assert.equal(resolved.memoryPolicy.mode, "chat_isolated");
  assert.equal(resolved.style.usesSlang, false);
  assert.match(resolved.compiledPrompt, /Memory mode: chat_isolated/);
  assert.match(resolved.compiledPrompt, /Known chat name: Crypto Operations\./);
  assert.match(resolved.compiledPrompt, /Telegram chat title: Crypto Operations RU\./);
});

test("validates behavior profiles against known personas", () => {
  const profileDoc = parseBehaviorProfilesContent(behaviorProfilesContent);
  const personaIds = parsePersonaIdsFromMarkdown(personasContent);
  const issues = validateBehaviorProfilesDocument(profileDoc, personaIds);

  assert.equal(issues.filter((issue) => issue.level === "error").length, 0);
});

test("validates chat policies against behavior profiles", () => {
  const profileDoc = parseBehaviorProfilesContent(behaviorProfilesContent);
  const chatDoc = parseChatPoliciesContent(chatPoliciesContent);
  const issues = validateChatPoliciesDocument(chatDoc, profileDoc);

  assert.equal(issues.filter((issue) => issue.level === "error").length, 0);
});
