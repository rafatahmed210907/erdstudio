import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { cloneDiagram } from "@/lib/data/clone";
import { layoutDiagram } from "@/lib/layout-diagram";
import { StudioError, type StudioRepository } from "@/lib/data/repository";
import { createSeed } from "@/lib/data/seed";
import { generateSql } from "@/lib/sql";
import { initialsFromName } from "@/lib/utils";
import type {
  Diagram,
  Field,
  Mutation,
  Relationship,
  Settings,
  StudioSnapshot,
  Table,
  User,
} from "@/lib/data/types";
import { isReadOnlyDataStore } from "@/lib/data/storage-mode";

const dbPath = path.join(process.cwd(), "data", "db.json");
const readOnlyStore = isReadOnlyDataStore();
let memorySnapshot: StudioSnapshot | null = null;
const changes = new EventEmitter();
changes.setMaxListeners(0);

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureFile() {
  if (readOnlyStore) return;
  try {
    await fs.access(dbPath);
  } catch {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(createSeed(), null, 2));
  }
}

async function readSnapshot() {
  if (readOnlyStore) {
    if (memorySnapshot) return structuredClone(memorySnapshot);
    try {
      const raw = await fs.readFile(dbPath, "utf8");
      memorySnapshot = JSON.parse(raw) as StudioSnapshot;
    } catch {
      memorySnapshot = createSeed();
    }
    return structuredClone(memorySnapshot);
  }
  await ensureFile();
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw) as StudioSnapshot;
}

async function writeSnapshot(snapshot: StudioSnapshot) {
  if (readOnlyStore) {
    memorySnapshot = structuredClone(snapshot);
    changes.emit("revision", snapshot.revision);
    return;
  }
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(snapshot, null, 2));
  changes.emit("revision", snapshot.revision);
}

function mutation<T>(snapshot: StudioSnapshot, data: T): Mutation<T> {
  return { revision: snapshot.revision, snapshot, data };
}

function touch(diagram: Diagram) {
  diagram.updatedAt = new Date().toISOString();
}

function notify(snapshot: StudioSnapshot, title: string, body: string) {
  if (!snapshot.settings.showNotifications) return;
  snapshot.notifications.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  });
  snapshot.notifications = snapshot.notifications.slice(0, 30);
}

function requireDiagram(snapshot: StudioSnapshot, id: string) {
  const diagram = snapshot.diagrams.find((item) => item.id === id);
  if (!diagram) throw new StudioError("Diagram not found", 404);
  return diagram;
}

function assertTable(diagram: Diagram, table: Table) {
  if (!table.name.trim()) throw new StudioError("Table name is required");
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table.name.trim())) {
    throw new StudioError("Table name must start with a letter and use only letters, numbers, and underscores");
  }
  const duplicate = diagram.tables.find(
    (item) => item.id !== table.id && item.name.toLowerCase() === table.name.trim().toLowerCase(),
  );
  if (duplicate) throw new StudioError("A table with that name already exists");
  if (table.fields.length === 0) throw new StudioError("Add at least one field");
  const names = new Set<string>();
  for (const field of table.fields) {
    if (!field.name.trim()) throw new StudioError("Every field needs a name");
    const key = field.name.trim().toLowerCase();
    if (names.has(key)) throw new StudioError(`Duplicate field "${field.name}"`);
    names.add(key);
  }
}

function normalizeTable(table: Table): Table {
  return {
    ...table,
    name: table.name.trim(),
    schema: table.schema.trim() || "public",
    description: table.description ?? "",
    position: {
      x: Math.round(table.position?.x ?? 80),
      y: Math.round(table.position?.y ?? 80),
    },
    fields: table.fields.map((field) => ({
      ...field,
      name: field.name.trim(),
      id: field.id || crypto.randomUUID(),
    })),
  };
}

function assertRelationship(diagram: Diagram, relationship: Relationship) {
  const from = diagram.tables.find((table) => table.id === relationship.fromTableId);
  const to = diagram.tables.find((table) => table.id === relationship.toTableId);
  if (!from || !to) throw new StudioError("Relationship tables were not found");
  if (!from.fields.some((field) => field.id === relationship.fromFieldId)) {
    throw new StudioError("Source field was not found");
  }
  if (!to.fields.some((field) => field.id === relationship.toFieldId)) {
    throw new StudioError("Target field was not found");
  }
  if (relationship.fromTableId === relationship.toTableId && relationship.fromFieldId === relationship.toFieldId) {
    throw new StudioError("A field cannot reference itself");
  }
  if (!relationship.label.trim()) throw new StudioError("Relationship label is required");
}

export function watchDatabase(onChange: (revision: number) => void) {
  const listener = (revision: number) => onChange(revision);
  changes.on("revision", listener);
  return () => changes.off("revision", listener);
}

async function update(work: (snapshot: StudioSnapshot) => void) {
  return withLock(async () => {
    const snapshot = await readSnapshot();
    work(snapshot);
    snapshot.revision += 1;
    await writeSnapshot(snapshot);
    return snapshot;
  });
}

export function createJsonRepository(): StudioRepository {
  return {
    async getSnapshot() {
      return withLock(readSnapshot);
    },

    async createDiagram(input) {
      if (!input.name.trim()) throw new StudioError("Diagram name is required");
      const diagram: Diagram = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        engine: input.engine,
        tables: [],
        relationships: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const snapshot = await update((draft) => {
        draft.diagrams.unshift(diagram);
        draft.settings.currentDiagramId = diagram.id;
        notify(draft, "Diagram created", `${diagram.name} is ready to edit.`);
      });
      return mutation(snapshot, diagram);
    },

    async createFromTemplate(templateId) {
      const current = await readSnapshot();
      const template = current.templates.find((item) => item.id === templateId);
      if (!template) throw new StudioError("Template not found", 404);
      const diagram = cloneDiagram(template.diagram, template.name);
      const snapshot = await update((draft) => {
        draft.diagrams.unshift(diagram);
        draft.settings.currentDiagramId = diagram.id;
        notify(draft, "Template applied", `${template.name} was cloned into your diagrams.`);
      });
      return mutation(snapshot, diagram);
    },

    async updateDiagram(id, patch) {
      let saved!: Diagram;
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, id);
        if (patch.name !== undefined) {
          if (!patch.name.trim()) throw new StudioError("Diagram name is required");
          diagram.name = patch.name.trim();
        }
        if (patch.description !== undefined) diagram.description = patch.description;
        if (patch.engine !== undefined) diagram.engine = patch.engine;
        touch(diagram);
        saved = diagram;
      });
      return mutation(snapshot, saved);
    },

    async deleteDiagram(id) {
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, id);
        draft.diagrams = draft.diagrams.filter((item) => item.id !== id);
        if (draft.settings.currentDiagramId === id) {
          draft.settings.currentDiagramId = draft.diagrams[0]?.id ?? null;
        }
        notify(draft, "Diagram deleted", `${diagram.name} was removed from this device.`);
      });
      return mutation(snapshot, null);
    },

    async duplicateDiagram(id) {
      const current = await readSnapshot();
      const source = requireDiagram(current, id);
      const diagram = cloneDiagram(source, `${source.name} copy`);
      const snapshot = await update((draft) => {
        draft.diagrams.unshift(diagram);
        draft.settings.currentDiagramId = diagram.id;
      });
      return mutation(snapshot, diagram);
    },

    async importDiagram(input) {
      if (!input.tables || !Array.isArray(input.tables)) throw new StudioError("Import needs a tables array");
      const diagram = cloneDiagram(
        {
          name: input.name?.trim() || "Imported diagram",
          description: input.description ?? "",
          engine: input.engine ?? "postgresql",
          tables: input.tables as Table[],
          relationships: (input.relationships as Relationship[]) ?? [],
        },
        input.name?.trim() || "Imported diagram",
      );
      const snapshot = await update((draft) => {
        draft.diagrams.unshift(diagram);
        draft.settings.currentDiagramId = diagram.id;
        notify(draft, "Diagram imported", `${diagram.name} is now stored locally.`);
      });
      return mutation(snapshot, diagram);
    },

    async saveTable(diagramId, table) {
      const next = normalizeTable({ ...table, id: table.id || crypto.randomUUID() });
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, diagramId);
        assertTable(diagram, next);
        const index = diagram.tables.findIndex((item) => item.id === next.id);
        if (index >= 0) diagram.tables[index] = next;
        else diagram.tables.push(next);
        touch(diagram);
        notify(draft, "Table saved", `${next.name} was updated in ${diagram.name}.`);
      });
      return mutation(snapshot, next);
    },

    async updateTable(diagramId, tableId, patch) {
      let saved!: Table;
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, diagramId);
        const current = diagram.tables.find((item) => item.id === tableId);
        if (!current) throw new StudioError("Table not found", 404);
        const next = normalizeTable({
          ...current,
          ...patch,
          id: tableId,
          style: { ...current.style, ...patch.style },
          position: { ...current.position, ...patch.position },
          fields: (patch.fields as Field[] | undefined) ?? current.fields,
        });
        assertTable(diagram, next);
        Object.assign(current, next);
        touch(diagram);
        saved = current;
      });
      return mutation(snapshot, saved);
    },

    async deleteTable(diagramId, tableId) {
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, diagramId);
        const table = diagram.tables.find((item) => item.id === tableId);
        if (!table) throw new StudioError("Table not found", 404);
        diagram.tables = diagram.tables.filter((item) => item.id !== tableId);
        diagram.relationships = diagram.relationships.filter(
          (item) => item.fromTableId !== tableId && item.toTableId !== tableId,
        );
        touch(diagram);
        notify(draft, "Table removed", `${table.name} was deleted.`);
      });
      return mutation(snapshot, null);
    },

    async saveRelationship(diagramId, relationship) {
      const next: Relationship = {
        ...relationship,
        id: relationship.id || crypto.randomUUID(),
        label: relationship.label.trim(),
      };
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, diagramId);
        assertRelationship(diagram, next);
        const to = diagram.tables.find((table) => table.id === next.toTableId);
        const field = to?.fields.find((item) => item.id === next.toFieldId);
        if (field && field.key === "none") field.key = "fk";
        const index = diagram.relationships.findIndex((item) => item.id === next.id);
        if (index >= 0) diagram.relationships[index] = next;
        else diagram.relationships.push(next);
        touch(diagram);
        notify(draft, "Relationship saved", `${next.label} now connects the selected fields.`);
      });
      return mutation(snapshot, next);
    },

    async deleteRelationship(diagramId, relationshipId) {
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, diagramId);
        const exists = diagram.relationships.some((item) => item.id === relationshipId);
        if (!exists) throw new StudioError("Relationship not found", 404);
        diagram.relationships = diagram.relationships.filter((item) => item.id !== relationshipId);
        touch(diagram);
      });
      return mutation(snapshot, null);
    },

    async autoLayout(diagramId) {
      let saved!: Diagram;
      const snapshot = await update((draft) => {
        const diagram = requireDiagram(draft, diagramId);
        const laidOut = layoutDiagram(diagram);
        diagram.tables = laidOut.tables;
        touch(diagram);
        saved = diagram;
      });
      return mutation(snapshot, saved);
    },

    async updateSettings(patch) {
      let saved!: Settings;
      const snapshot = await update((draft) => {
        draft.settings = { ...draft.settings, ...patch };
        if (patch.currentDiagramId && !draft.diagrams.some((item) => item.id === patch.currentDiagramId)) {
          throw new StudioError("Diagram not found", 404);
        }
        saved = draft.settings;
      });
      return mutation(snapshot, saved);
    },

    async updateProfile(patch) {
      let saved!: User;
      const snapshot = await update((draft) => {
        if (patch.name !== undefined) {
          if (!patch.name.trim()) throw new StudioError("Name is required");
          draft.user.name = patch.name.trim();
          draft.user.initials = initialsFromName(draft.user.name);
        }
        if (patch.email !== undefined) {
          if (!patch.email.includes("@")) throw new StudioError("Enter a valid email");
          draft.user.email = patch.email.trim();
        }
        if (patch.role !== undefined) draft.user.role = patch.role.trim() || "Owner";
        const member = draft.team.find((item) => item.id === "member_john") ?? draft.team[0];
        if (member) {
          member.name = draft.user.name;
          member.email = draft.user.email;
          member.role = draft.user.role;
        }
        saved = draft.user;
      });
      return mutation(snapshot, saved);
    },

    async setSession(signedIn) {
      const snapshot = await update((draft) => {
        draft.session.signedIn = signedIn;
      });
      return mutation(snapshot, null);
    },

    async markNotificationsRead() {
      const snapshot = await update((draft) => {
        draft.notifications = draft.notifications.map((item) => ({ ...item, read: true }));
      });
      return mutation(snapshot, null);
    },

    async exportDiagram(id, format) {
      const snapshot = await readSnapshot();
      const diagram = requireDiagram(snapshot, id);
      const slug = diagram.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "diagram";
      if (format === "sql") {
        return {
          filename: `${slug}.sql`,
          contentType: "text/plain; charset=utf-8",
          body: generateSql(diagram),
        };
      }
      return {
        filename: `${slug}.json`,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(diagram, null, 2),
      };
    },
  };
}

let repository: StudioRepository | null = null;

export function getRepository() {
  repository ??= createJsonRepository();
  return repository;
}
