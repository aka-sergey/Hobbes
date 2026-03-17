import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __hobbesSql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __hobbesSchemaReady: Promise<void> | undefined;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.DATABASE_PRIVATE_URL ?? null;
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!global.__hobbesSql) {
    global.__hobbesSql = postgres(databaseUrl, {
      prepare: false,
      max: 5,
      idle_timeout: 10
    });
  }

  return global.__hobbesSql;
}

export function ensureSchema() {
  if (!hasDatabase()) {
    return Promise.resolve();
  }

  if (!global.__hobbesSchemaReady) {
    const sql = getSql();

    global.__hobbesSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS dashboard_snapshots (
          id BIGSERIAL PRIMARY KEY,
          source TEXT NOT NULL,
          captured_at TIMESTAMPTZ NOT NULL,
          summary JSONB NOT NULL,
          agents JSONB NOT NULL,
          runs JSONB NOT NULL,
          events JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS dashboard_snapshots_captured_at_idx
        ON dashboard_snapshots (captured_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS dashboard_events (
          id BIGSERIAL PRIMARY KEY,
          source TEXT NOT NULL,
          event_type TEXT NOT NULL,
          agent_id TEXT,
          run_id TEXT,
          severity TEXT NOT NULL,
          event_ts TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS dashboard_events_event_ts_idx
        ON dashboard_events (event_ts DESC)
      `;
    })();
  }

  return global.__hobbesSchemaReady;
}
