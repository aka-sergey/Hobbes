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

export type OverviewData = {
  healthyAgents: number;
  activeRuns: number;
  pendingApprovals: number;
  estimatedSpendUsd: string;
  agents: AgentCard[];
  runs: RunCard[];
  events: EventCard[];
};
