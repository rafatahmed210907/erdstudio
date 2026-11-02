import { handle, repository } from "@/lib/data/http";

export async function PATCH(request: Request) {
  const patch = (await request.json()) as { name?: string; email?: string; role?: string };
  return handle(() => repository().updateProfile(patch));
}
