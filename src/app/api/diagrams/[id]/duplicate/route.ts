import { handle, repository } from "@/lib/data/http";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await context.params;
    return repository().duplicateDiagram(id);
  });
}
