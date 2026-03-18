import { getControlFiles } from "../../../../lib/control-center";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = await getControlFiles();
  return Response.json({
    ok: true,
    files
  });
}
