import { z } from "zod";
import { getControlFile, syncControlFileToRuntime } from "../../../../lib/control-center";

export const dynamic = "force-dynamic";

const syncRuntimeSchema = z.object({
  path: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = syncRuntimeSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const file = await getControlFile(parsed.data.path);

  if (!file) {
    return Response.json({ ok: false, error: "file_not_allowed" }, { status: 404 });
  }

  try {
    const result = await syncControlFileToRuntime(parsed.data.path);

    return Response.json({
      ok: true,
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    return Response.json(
      {
        ok: false,
        error: "runtime_sync_failed",
        message
      },
      { status: 400 }
    );
  }
}
