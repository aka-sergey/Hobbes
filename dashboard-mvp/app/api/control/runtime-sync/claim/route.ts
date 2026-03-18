import { claimNextRuntimeSyncJob } from "../../../../../lib/control-center";

export const dynamic = "force-dynamic";

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

  const job = await claimNextRuntimeSyncJob();

  return Response.json({
    ok: true,
    job
  });
}
