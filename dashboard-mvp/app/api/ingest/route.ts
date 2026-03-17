import { z } from "zod";

const ingestSchema = z.object({
  eventType: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  severity: z.enum(["info", "warn", "error"]).default("info"),
  timestamp: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({})
});

export async function POST(request: Request) {
  const token = request.headers.get("x-ingest-token");
  const expected = process.env.INGEST_TOKEN;

  if (!expected || token !== expected) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ingestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  return Response.json({
    ok: true,
    accepted: true,
    event: parsed.data
  });
}
