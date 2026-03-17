export type Health = "healthy" | "degraded" | "failed";

export type AgentCard = {
  id: string;
  displayName: string;
  role: string;
  health: Health;
  lastLatencyMs: number;
  activeRuns: number;
  lastError?: string;
};

export type RunCard = {
  id: string;
  chain: string;
  status: "running" | "queued" | "failed" | "completed";
  ageLabel: string;
  tokenLabel: string;
  costLabel: string;
};

export type EventCard = {
  id: string;
  severity: "info" | "warn" | "error";
  title: string;
  when: string;
  detail: string;
};

export type SearchSource = {
  title: string;
  url: string;
  domain: string;
};

export type SearchCard = {
  id: string;
  agentId: string;
  backend: string;
  status: "ok" | "mixed" | "fallback" | "error";
  when: string;
  query: string;
  summary: string;
  sources: SearchSource[];
};

export type OverviewData = {
  source: "mock" | "live";
  capturedAt?: string;
  healthyAgents: number;
  activeRuns: number;
  pendingApprovals: number;
  estimatedSpendUsd: string;
  agents: AgentCard[];
  runs: RunCard[];
  events: EventCard[];
  searches: SearchCard[];
};
