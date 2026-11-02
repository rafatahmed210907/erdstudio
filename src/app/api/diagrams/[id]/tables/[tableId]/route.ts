import type { Table } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";

type Context = { params: Promise<{ id: string; tableId: string }> };

export async function PATCH(request: Request, context: Context) {
  const patch = (await request.json()) as Partial<Table>;
  return handle(async () => {
    const { id, tableId } = await context.params;
    return repository().updateTable(id, tableId, patch);
  });
}

export async function DELETE(_request: Request, context: Context) {
  return handle(async () => {
    const { id, tableId } = await context.params;
    return repository().deleteTable(id, tableId);
  });
}
