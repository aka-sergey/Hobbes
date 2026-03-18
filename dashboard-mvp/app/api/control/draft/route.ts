import { z } from "zod";
import { getControlFile, saveDraft, validateControlContent } from "../../../../lib/control-center";

export const dynamic = "force-dynamic";

const saveDraftSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  kind: z.enum(["markdown", "json"])
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = saveDraftSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const file = await getControlFile(parsed.data.path);

  if (!file) {
    return Response.json({ ok: false, error: "file_not_allowed" }, { status: 404 });
  }

  const validation = await validateControlContent(parsed.data.kind, parsed.data.content, parsed.data.path);

  if (!validation.ok) {
    return Response.json({ ok: false, error: "validation_failed", message: validation.message }, { status: 400 });
  }

  try {
    const draft = await saveDraft(parsed.data.path, parsed.data.kind, parsed.data.content);
    return Response.json({
      ok: true,
      draft,
      validation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
