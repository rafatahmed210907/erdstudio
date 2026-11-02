import { connection } from "next/server";
import { getRepository } from "@/lib/data/json-repository";
import { StudioError } from "@/lib/data/repository";

export async function handle(work: () => Promise<unknown>) {
  await connection();
  try {
    return Response.json(await work());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status = error instanceof StudioError ? error.status : 400;
    return Response.json({ error: message }, { status });
  }
}

export function repository() {
  return getRepository();
}
