import { z } from "zod";
import { applyControlFileToRepo, getControlFile } from "../../../../lib/control-center";

export const dynamic = "force-dynamic";

const applyRepoSchema = z.object({
  path: z.string().min(1),
  content: z.string()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = applyRepoSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const file = await getControlFile(parsed.data.path);

  if (!file) {
    return Response.json({ ok: false, error: "file_not_allowed" }, { status: 404 });
  }

  try {
    const result = await applyControlFileToRepo(parsed.data.path, parsed.data.content);

    return Response.json({
      ok: true,
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    return Response.json(
      {
        ok: false,
        error: "apply_failed",
        message
      },
      { status: 400 }
    );
  }
}
