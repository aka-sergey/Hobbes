import { z } from "zod";
import { completeRuntimeSyncJob } from "../../../../../lib/control-center";

export const dynamic = "force-dynamic";

const completeSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["applied", "failed"]),
  lastError: z.string().nullish()
});

function isAuthorized(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = process.env.INGEST_TOKEN;

  if (!token) {
    return false;
  }

  return auth === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = completeSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const row = await completeRuntimeSyncJob(parsed.data.id, parsed.data.status, parsed.data.lastError ?? null);

  return Response.json({
    ok: true,
    row
  });
}
