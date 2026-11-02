import type { Settings } from "@/lib/data/types";
import { handle, repository } from "@/lib/data/http";

export async function PATCH(request: Request) {
  const patch = (await request.json()) as Partial<Settings>;
  return handle(() => repository().updateSettings(patch));
}
