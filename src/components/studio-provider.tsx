"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { api, type MutationResponse, type SnapshotResponse } from "@/lib/api-client";
import type { Diagram, Engine, Relationship, Settings, StudioSnapshot, Table, User } from "@/lib/data/types";
import { hexToHslChannels } from "@/lib/utils";

type SaveState = "saved" | "saving" | "error";

interface StudioContextValue {
  snapshot: StudioSnapshot | null;
  currentDiagram: Diagram | null;
  loading: boolean;
  loadError: string | null;
  saveState: SaveState;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  createDiagram: (input: { name: string; engine: Engine; description?: string }) => Promise<Diagram>;
  createFromTemplate: (templateId: string) => Promise<Diagram>;
  updateDiagram: (id: string, patch: Partial<Pick<Diagram, "name" | "description" | "engine">>) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
  duplicateDiagram: (id: string) => Promise<Diagram>;
  importDiagram: (diagram: Partial<Diagram>) => Promise<Diagram>;
  saveTable: (diagramId: string, table: Table) => Promise<void>;
  updateTable: (diagramId: string, tableId: string, patch: Partial<Table>) => Promise<void>;
  deleteTable: (diagramId: string, tableId: string) => Promise<void>;
  saveRelationship: (diagramId: string, relationship: Relationship) => Promise<void>;
  deleteRelationship: (diagramId: string, relationshipId: string) => Promise<void>;
  autoLayout: (diagramId: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<Settings>;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "role">>) => Promise<void>;
  setSession: (signedIn: boolean) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const localRevision = useRef(0);
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const refresh = useCallback(async () => {
    const data = await api<SnapshotResponse>("/api/snapshot");
    localRevision.current = data.revision;
    setSnapshot(data);
    setLoadError(null);
  }, []);

  const commit = useCallback(async <T,>(path: string, init?: RequestInit) => {
    setSaveState("saving");
    try {
      const result = await api<MutationResponse<T>>(path, init);
      localRevision.current = result.revision;
      setSnapshot(result.snapshot);
      setSaveState("saved");
      return result;
    } catch (error) {
      setSaveState("error");
      toast.error(error instanceof Error ? error.message : "Save failed");
      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<SnapshotResponse>("/api/snapshot")
      .then((data) => {
        if (cancelled) return;
        localRevision.current = data.revision;
        setSnapshot(data);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Could not load the studio");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { revision: number };
        if (payload.revision !== localRevision.current) void refresh();
      } catch {
        // Ignore malformed events.
      }
    };
    return () => source.close();
  }, [refresh]);

  const savedTheme = snapshot?.settings.theme;
  const savedAccent = snapshot?.settings.accent;
  useEffect(() => {
    if (!savedTheme || !savedAccent) return;
    setTheme(savedTheme);
    document.documentElement.style.setProperty("--primary", hexToHslChannels(savedAccent));
  }, [savedAccent, savedTheme, setTheme]);

  const currentDiagram = useMemo(() => {
    if (!snapshot) return null;
    return (
      snapshot.diagrams.find((diagram) => diagram.id === snapshot.settings.currentDiagramId) ??
      snapshot.diagrams[0] ??
      null
    );
  }, [snapshot]);

  const value = useMemo<StudioContextValue>(
    () => ({
      snapshot,
      currentDiagram,
      loading,
      loadError,
      saveState,
      searchOpen,
      setSearchOpen,
      helpOpen,
      setHelpOpen,
      refresh,
      async createDiagram(input) {
        const result = await commit<Diagram>("/api/diagrams", { method: "POST", body: JSON.stringify(input) });
        return result.data;
      },
      async createFromTemplate(templateId) {
        const result = await commit<Diagram>("/api/diagrams", {
          method: "POST",
          body: JSON.stringify({ templateId }),
        });
        return result.data;
      },
      async updateDiagram(id, patch) {
        await commit(`/api/diagrams/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      },
      async deleteDiagram(id) {
        await commit(`/api/diagrams/${id}`, { method: "DELETE" });
      },
      async duplicateDiagram(id) {
        const result = await commit<Diagram>(`/api/diagrams/${id}/duplicate`, { method: "POST" });
        return result.data;
      },
      async importDiagram(diagram) {
        const result = await commit<Diagram>("/api/import", { method: "POST", body: JSON.stringify({ diagram }) });
        return result.data;
      },
      async saveTable(diagramId, table) {
        await commit(`/api/diagrams/${diagramId}/tables`, { method: "POST", body: JSON.stringify(table) });
      },
      async updateTable(diagramId, tableId, patch) {
        await commit(`/api/diagrams/${diagramId}/tables/${tableId}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
      },
      async deleteTable(diagramId, tableId) {
        await commit(`/api/diagrams/${diagramId}/tables/${tableId}`, { method: "DELETE" });
      },
      async saveRelationship(diagramId, relationship) {
        await commit(`/api/diagrams/${diagramId}/relationships`, {
          method: "POST",
          body: JSON.stringify(relationship),
        });
      },
      async deleteRelationship(diagramId, relationshipId) {
        await commit(`/api/diagrams/${diagramId}/relationships/${relationshipId}`, { method: "DELETE" });
      },
      async autoLayout(diagramId) {
        await commit(`/api/diagrams/${diagramId}/layout`, { method: "POST" });
      },
      async updateSettings(patch) {
        const result = await commit<Settings>("/api/settings", { method: "PATCH", body: JSON.stringify(patch) });
        return result.data;
      },
      async updateProfile(patch) {
        await commit("/api/profile", { method: "PATCH", body: JSON.stringify(patch) });
      },
      async setSession(signedIn) {
        await commit(signedIn ? "/api/session/login" : "/api/session/logout", { method: "POST" });
      },
      async markNotificationsRead() {
        await commit("/api/notifications/read", { method: "POST" });
      },
    }),
    [snapshot, currentDiagram, loading, loadError, saveState, searchOpen, helpOpen, refresh, commit],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used within StudioProvider");
  return context;
}
