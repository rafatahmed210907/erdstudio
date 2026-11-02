import type { Table } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const table = (await request.json()) as Table;
  return handle(async () => {
    const { id } = await context.params;
    return repository().saveTable(id, table);
  });
}
