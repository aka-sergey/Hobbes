import { getControlFile } from "../../../../lib/control-center";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathValue = searchParams.get("path");

  if (!pathValue) {
    return Response.json({ ok: false, error: "missing_path" }, { status: 400 });
  }

  const file = await getControlFile(pathValue);

  if (!file) {
    return Response.json({ ok: false, error: "file_not_allowed" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    file
  });
}
