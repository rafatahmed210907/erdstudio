import { handle, repository } from "@/lib/data/http";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; relationshipId: string }> }) {
  return handle(async () => {
    const { id, relationshipId } = await context.params;
    return repository().deleteRelationship(id, relationshipId);
  });
}
