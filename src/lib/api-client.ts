import type { Mutation, StudioSnapshot } from "@/lib/data/types";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let data: { error?: string } = {};
  try {
    data = text ? (JSON.parse(text) as { error?: string }) : {};
  } catch {
    throw new Error(response.ok ? "The studio API returned an unreadable response." : `Request failed (${response.status})`);
  }
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data as T;
}

export async function readExport(id: string, format: "json" | "sql") {
  const response = await fetch(`/api/diagrams/${id}/export?format=${format}`);
  const body = await response.text();
  if (!response.ok) {
    let message = "Export failed";
    try {
      message = (JSON.parse(body) as { error?: string }).error ?? message;
    } catch {
      message = body || message;
    }
    throw new Error(message);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = disposition.match(/filename="(.+)"/)?.[1] ?? `diagram.${format === "sql" ? "sql" : "json"}`;
  return { filename, body };
}

export type SnapshotResponse = StudioSnapshot;
export type MutationResponse<T> = Mutation<T>;
