import { connection } from "next/server";
import { getRepository } from "@/lib/data/json-repository";
import { StudioError } from "@/lib/data/repository";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const { id } = await context.params;
    const format = new URL(request.url).searchParams.get("format") === "sql" ? "sql" : "json";
    const file = await getRepository().exportDiagram(id, format);
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    const status = error instanceof StudioError ? error.status : 400;
    return Response.json({ error: message }, { status });
  }
}
