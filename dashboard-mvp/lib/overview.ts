import { overviewData } from "./mock-data";
import type { AgentCard, EventCard, OverviewData, RunCard, SearchCard } from "./types";
import { ensureSchema, getSql, hasDatabase } from "./db";

type StoredSnapshotRow = {
  captured_at: string;
  summary: {
    healthyAgents?: number;
    activeRuns?: number;
    pendingApprovals?: number;
    estimatedSpendUsd?: string;
  };
  agents: AgentCard[];
  runs: RunCard[];
  events: EventCard[];
  searches?: SearchCard[];
};

function asOverviewData(row: StoredSnapshotRow): OverviewData {
  return {
    source: "live",
    capturedAt: row.captured_at,
    healthyAgents: row.summary.healthyAgents ?? 0,
    activeRuns: row.summary.activeRuns ?? 0,
    pendingApprovals: row.summary.pendingApprovals ?? 0,
    estimatedSpendUsd: row.summary.estimatedSpendUsd ?? "n/a",
    agents: Array.isArray(row.agents) ? row.agents : [],
    runs: Array.isArray(row.runs) ? row.runs : [],
    events: Array.isArray(row.events) ? row.events : [],
    searches: Array.isArray(row.searches) ? row.searches : []
  };
}

export async function getOverviewData(): Promise<OverviewData> {
  if (!hasDatabase()) {
    return overviewData;
  }

  await ensureSchema();

  const sql = getSql();
  const rows = await sql<StoredSnapshotRow[]>`
    SELECT captured_at, summary, agents, runs, events, searches
    FROM dashboard_snapshots
    ORDER BY captured_at DESC, id DESC
    LIMIT 1
  `;

  if (rows.length === 0) {
    return overviewData;
  }

  return asOverviewData(rows[0]);
}
