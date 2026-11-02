import type { Engine } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";
import { StudioError } from "@/lib/data/repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    const snapshot = await repository().getSnapshot();
    const diagram = snapshot.diagrams.find((item) => item.id === id);
    if (!diagram) throw new StudioError("Diagram not found", 404);
    return { revision: snapshot.revision, diagram };
  });
}

export async function PATCH(request: Request, context: Context) {
  const body = (await request.json()) as { name?: string; description?: string; engine?: Engine };
  return handle(async () => {
    const { id } = await context.params;
    return repository().updateDiagram(id, body);
  });
}

export async function DELETE(_request: Request, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    return repository().deleteDiagram(id);
  });
}
