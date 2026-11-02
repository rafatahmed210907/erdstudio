import type { Diagram } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";

export async function POST(request: Request) {
  const body = (await request.json()) as { diagram?: Partial<Diagram> };
  return handle(() => repository().importDiagram(body.diagram ?? {}));
}
