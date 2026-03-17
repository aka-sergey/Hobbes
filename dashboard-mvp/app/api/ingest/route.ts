import { z } from "zod";
import { ensureSchema, getSql, hasDatabase } from "../../../lib/db";

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

const ingestSchema = z.object({
  eventType: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  severity: z.enum(["info", "warn", "error"]).default("info"),
  timestamp: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({})
});

const snapshotSchema = z.object({
  snapshotType: z.literal("overview_snapshot"),
  source: z.string().min(1),
  timestamp: z.string().min(1),
  summary: z.object({
    healthyAgents: z.number().int().nonnegative(),
    activeRuns: z.number().int().nonnegative(),
    pendingApprovals: z.number().int().nonnegative(),
    estimatedSpendUsd: z.string().min(1)
  }),
  agents: z.array(
    z.object({
      id: z.string().min(1),
      displayName: z.string().min(1),
      role: z.string().min(1),
      health: z.enum(["healthy", "degraded", "failed"]),
      lastLatencyMs: z.number().int().nonnegative(),
      activeRuns: z.number().int().nonnegative(),
      lastError: z.string().optional()
    })
  ),
  runs: z.array(
    z.object({
      id: z.string().min(1),
      chain: z.string().min(1),
      status: z.enum(["running", "queued", "failed", "completed"]),
      ageLabel: z.string().min(1),
      tokenLabel: z.string().min(1),
      costLabel: z.string().min(1)
    })
  ),
  events: z.array(
    z.object({
      id: z.string().min(1),
      severity: z.enum(["info", "warn", "error"]),
      title: z.string().min(1),
      when: z.string().min(1),
      detail: z.string().min(1)
    })
  ),
  searches: z.array(
    z.object({
      id: z.string().min(1),
      agentId: z.string().min(1),
      backend: z.string().min(1),
      routeType: z.string().min(1),
      preferredBackend: z.string().min(1),
      preferredAgent: z.string().min(1),
      status: z.enum(["ok", "mixed", "fallback", "error"]),
      when: z.string().min(1),
      query: z.string().min(1),
      summary: z.string().min(1),
      sources: z.array(
        z.object({
          title: z.string().min(1),
          url: z.string().min(1),
          domain: z.string().min(1)
        })
      ).default([])
    })
  ).default([])
});

export async function POST(request: Request) {
  const token = request.headers.get("x-ingest-token");
  const expected = process.env.INGEST_TOKEN;

  if (!expected || token !== expected) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const snapshot = snapshotSchema.safeParse(body);

  if (snapshot.success) {
    if (!hasDatabase()) {
      return Response.json({ ok: false, error: "database_not_configured" }, { status: 503 });
    }

    await ensureSchema();
    const sql = getSql();

    await sql`
      INSERT INTO dashboard_snapshots (source, captured_at, summary, agents, runs, events, searches)
      VALUES (
        ${snapshot.data.source},
        ${snapshot.data.timestamp},
        ${sql.json(toJsonValue(snapshot.data.summary))},
        ${sql.json(toJsonValue(snapshot.data.agents))},
        ${sql.json(toJsonValue(snapshot.data.runs))},
        ${sql.json(toJsonValue(snapshot.data.events))},
        ${sql.json(toJsonValue(snapshot.data.searches))}
      )
    `;

    return Response.json({
      ok: true,
      accepted: true,
      snapshot: {
        source: snapshot.data.source,
        timestamp: snapshot.data.timestamp
      }
    });
  }

  const parsed = ingestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!hasDatabase()) {
    return Response.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO dashboard_events (source, event_type, agent_id, run_id, severity, event_ts, payload)
    VALUES (
      ${"hobbes"},
      ${parsed.data.eventType},
      ${parsed.data.agentId},
      ${parsed.data.runId},
      ${parsed.data.severity},
      ${parsed.data.timestamp},
      ${sql.json(toJsonValue(parsed.data.payload))}
    )
  `;

  return Response.json({
    ok: true,
    accepted: true,
    event: parsed.data
  });
}
