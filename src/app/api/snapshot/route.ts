import { handle, repository } from "@/lib/data/http";

export async function GET() {
  return handle(() => repository().getSnapshot());
}
