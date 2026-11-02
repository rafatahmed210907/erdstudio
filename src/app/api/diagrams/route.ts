import type { Engine } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";

export async function GET() {
  return handle(async () => {
    const snapshot = await repository().getSnapshot();
    return { revision: snapshot.revision, diagrams: snapshot.diagrams };
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    engine?: Engine;
    description?: string;
    templateId?: string;
  };
  return handle(() => {
    if (body.templateId) return repository().createFromTemplate(body.templateId);
    return repository().createDiagram({
      name: body.name ?? "",
      engine: body.engine ?? "postgresql",
      description: body.description,
    });
  });
}
