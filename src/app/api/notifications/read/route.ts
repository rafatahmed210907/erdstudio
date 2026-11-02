import { handle, repository } from "@/lib/data/http";

export async function POST() {
  return handle(() => repository().markNotificationsRead());
}
