import { getOverviewData } from "../lib/overview";

export const dynamic = "force-dynamic";

function statusClass(health: string) {
  if (health === "healthy") return "pill ok";
  if (health === "degraded") return "pill warn";
  return "pill danger";
}

function runClass(status: string) {
  if (status === "failed") return "pill danger";
  if (status === "queued") return "pill warn";
  if (status === "running") return "pill warn";
  return "pill ok";
}

function sourceClass(source: "mock" | "live") {
  return source === "live" ? "pill ok" : "pill warn";
}

function searchClass(status: "ok" | "mixed" | "fallback" | "error") {
  if (status === "error") return "pill danger";
  if (status === "mixed" || status === "fallback") return "pill warn";
  return "pill ok";
}

export default async function HomePage() {
  const data = await getOverviewData();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <div className="eyebrow">Hobbes Command Center</div>
          <h1>See the agent team in one glance.</h1>
          <p>
            This MVP is optimized for fast operational clarity: healthy agents, active runs,
            pending approvals, and token burn without diving into raw logs.
          </p>
          <div className="row" style={{ marginTop: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className={sourceClass(data.source)}>{data.source === "live" ? "live data" : "mock data"}</span>
            {data.capturedAt ? <span className="muted mono">captured {new Date(data.capturedAt).toLocaleString()}</span> : null}
          </div>
        </section>

        <section className="grid">
          <div className="card span-12">
            <h2 className="section-title">Overview</h2>
            <div className="grid">
              <div className="kpi span-3">
                <div className="kpi-label">Healthy Agents</div>
                <div className="kpi-value">{data.healthyAgents}/7</div>
              </div>
              <div className="kpi span-3">
                <div className="kpi-label">Active Runs</div>
                <div className="kpi-value">{data.activeRuns}</div>
              </div>
              <div className="kpi span-3">
                <div className="kpi-label">Pending Approvals</div>
                <div className="kpi-value">{data.pendingApprovals}</div>
              </div>
              <div className="kpi span-3">
                <div className="kpi-label">Estimated Spend</div>
                <div className="kpi-value">{data.estimatedSpendUsd}</div>
              </div>
            </div>
          </div>

          <div className="card span-7">
            <h2 className="section-title">Runs</h2>
            <div className="run-list">
              {data.runs.map((run) => (
                <div className="run-item" key={run.id}>
                  <div className="row">
                    <strong className="mono">{run.chain}</strong>
                    <span className={runClass(run.status)}>{run.status}</span>
                  </div>
                  <div className="row muted">
                    <span>{run.ageLabel}</span>
                    <span>{run.tokenLabel}</span>
                    <span>{run.costLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card span-5">
            <h2 className="section-title">Recent Events</h2>
            <div className="event-list">
              {data.events.map((event) => (
                <div className="event-item" key={event.id}>
                  <div className="row">
                    <strong>{event.title}</strong>
                    <span className={event.severity === "error" ? "pill danger" : event.severity === "warn" ? "pill warn" : "pill ok"}>
                      {event.severity}
                    </span>
                  </div>
                  <div className="muted">{event.detail}</div>
                  <div className="muted mono">{event.when}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card span-12">
            <h2 className="section-title">Searches</h2>
            <div className="event-list">
              {data.searches.length === 0 ? (
                <div className="muted">No recent web research captured yet.</div>
              ) : (
                data.searches.map((search) => (
                  <div className="event-item" key={search.id}>
                    <div className="row">
                      <strong>{search.query}</strong>
                      <span className={searchClass(search.status)}>{search.status}</span>
                    </div>
                    <div className="row muted">
                      <span className="mono">{search.agentId}</span>
                      <span>{search.routeType}</span>
                      <span>{search.backend}</span>
                      <span>{search.preferredBackend}</span>
                      <span>{search.when}</span>
                    </div>
                    <div className="muted">
                      routed to <span className="mono">{search.preferredAgent}</span>
                    </div>
                    <div className="muted">{search.summary}</div>
                    <div className="muted">
                      {search.sources.map((source) => (
                        <span key={`${search.id}-${source.url}`} style={{ display: "inline-block", marginRight: "0.75rem" }}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.domain}
                          </a>
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card span-12">
            <h2 className="section-title">Agents</h2>
            <div className="agent-list">
              {data.agents.map((agent) => (
                <div className="agent-item" key={agent.id}>
                  <div className="row">
                    <div>
                      <strong>{agent.displayName}</strong>
                      <div className="muted">{agent.role}</div>
                    </div>
                    <span className={statusClass(agent.health)}>{agent.health}</span>
                  </div>
                  <div className="row muted">
                    <span className="mono">{agent.id}</span>
                    <span>{agent.lastLatencyMs} ms last latency</span>
                    <span>{agent.activeRuns} active runs</span>
                  </div>
                  {agent.lastError ? <div className="muted">Risk: {agent.lastError}</div> : <div className="spark" />}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
