import type { Relationship } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const relationship = (await request.json()) as Relationship;
  return handle(async () => {
    const { id } = await context.params;
    return repository().saveRelationship(id, relationship);
  });
}
