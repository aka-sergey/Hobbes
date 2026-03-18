import { z } from "zod";
import { enqueueControlRuntimeSync, getControlFile, syncControlFileToRuntime } from "../../../../lib/control-center";

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
      mode: "direct",
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    if (message.includes("Timed out while waiting for handshake")) {
      try {
        const queued = await enqueueControlRuntimeSync(parsed.data.path);

        return Response.json({
          ok: true,
          mode: "queued",
          result: {
            jobId: queued.id,
            status: queued.status
          }
        });
      } catch (queueError) {
        const queueMessage = queueError instanceof Error ? queueError.message : "queue_failed";
        return Response.json(
          {
            ok: false,
            error: "runtime_sync_failed",
            message: `${message}; queue fallback failed: ${queueMessage}`
          },
          { status: 400 }
        );
      }
    }

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
