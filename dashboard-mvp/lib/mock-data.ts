import type { OverviewData } from "./types";

export const overviewData: OverviewData = {
  source: "mock",
  healthyAgents: 7,
  activeRuns: 3,
  pendingApprovals: 1,
  estimatedSpendUsd: "$4.83",
  agents: [
    { id: "main", displayName: "Main", role: "Telegram front door", health: "healthy", lastLatencyMs: 4200, activeRuns: 1 },
    { id: "chief", displayName: "Chief", role: "Planner and coordinator", health: "healthy", lastLatencyMs: 5800, activeRuns: 1 },
    { id: "comms", displayName: "Comms", role: "Final answer polisher", health: "healthy", lastLatencyMs: 2100, activeRuns: 0 },
    { id: "guard", displayName: "Guard", role: "Risk gate", health: "healthy", lastLatencyMs: 1800, activeRuns: 0 },
    { id: "research", displayName: "Research", role: "Source-grounded work", health: "healthy", lastLatencyMs: 3200, activeRuns: 1 },
    { id: "memorykeeper", displayName: "Memory", role: "Durable memory governance", health: "healthy", lastLatencyMs: 1400, activeRuns: 0 },
    { id: "bookingprep", displayName: "Booking", role: "Approval-aware booking prep", health: "degraded", lastLatencyMs: 3900, activeRuns: 0, lastError: "No recent live approval flow observed yet" }
  ],
  runs: [
    { id: "run_019", chain: "main -> chief -> comms", status: "running", ageLabel: "started 14s ago", tokenLabel: "14.2k tok", costLabel: "$0.02" },
    { id: "run_018", chain: "chief -> research", status: "completed", ageLabel: "finished 1m ago", tokenLabel: "9.3k tok", costLabel: "$0.01" },
    { id: "run_017", chain: "main -> guard", status: "completed", ageLabel: "finished 2m ago", tokenLabel: "15.7k tok", costLabel: "$0.02" },
    { id: "run_016", chain: "chief -> bookingprep", status: "queued", ageLabel: "waiting 8s", tokenLabel: "pending", costLabel: "-" }
  ],
  events: [
    { id: "evt_3", severity: "warn", title: "Booking path still lightly exercised", when: "2m ago", detail: "Direct smoke is green, but live approval coverage is still thin." },
    { id: "evt_2", severity: "info", title: "Phase 3 routing regression passed", when: "5m ago", detail: "Research, memorykeeper, and bookingprep all completed bounded routing checks." },
    { id: "evt_1", severity: "info", title: "Gateway healthy", when: "just now", detail: "Health endpoint returned OK and all seven agents are registered." }
  ],
  searches: [
    {
      id: "search_001",
      agentId: "research",
      backend: "tavily",
      routeType: "news_current",
      preferredBackend: "tavily_news",
      preferredAgent: "research",
      status: "mixed",
      when: "1m ago",
      query: "commercial tankers Strait of Hormuz recent incidents",
      summary: "Traffic continues, but sources also mention attacks and elevated risk. Mixed evidence is surfaced instead of flattened.",
      sources: [
        { title: "Reuters shipping update", url: "https://www.reuters.com/", domain: "reuters.com" },
        { title: "gCaptain Strait of Hormuz", url: "https://gcaptain.com/", domain: "gcaptain.com" }
      ]
    }
  ]
};
