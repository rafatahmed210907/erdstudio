export type Engine = "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | "hybrid";

export type FieldKey = "pk" | "fk" | "none";

export type Cardinality = "1:1" | "1:N" | "N:M";

export interface Field {
  id: string;
  name: string;
  type: string;
  key: FieldKey;
  notNull: boolean;
  unique: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface TableStyle {
  header: string;
  title: string;
  text: string;
  border: string;
}

export interface Table {
  id: string;
  name: string;
  schema: string;
  engine: Engine;
  description: string;
  position: { x: number; y: number };
  style: TableStyle;
  fields: Field[];
}

export interface Relationship {
  id: string;
  fromTableId: string;
  fromFieldId: string;
  toTableId: string;
  toFieldId: string;
  cardinality: Cardinality;
  label: string;
}

export interface Diagram {
  id: string;
  name: string;
  description: string;
  engine: Engine;
  updatedAt: string;
  createdAt: string;
  tables: Table[];
  relationships: Relationship[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

export interface Settings {
  applicationName: string;
  language: string;
  defaultEngine: Engine;
  theme: "dark" | "light";
  accent: string;
  defaultView: "table" | "sql";
  gridSize: number;
  canvasBackground: string;
  lightCanvasBackground: string;
  snapToGrid: boolean;
  showMinimap: boolean;
  showConnectionHandles: boolean;
  keyboardShortcuts: boolean;
  showNotifications: boolean;
  aiAssistant: boolean;
  autosave: boolean;
  currentDiagramId: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  engine: Engine;
  kind: "sql" | "nosql" | "mixed";
  diagram: Pick<Diagram, "name" | "description" | "engine" | "tables" | "relationships">;
}

export interface StudioSnapshot {
  revision: number;
  session: { signedIn: boolean };
  user: User;
  settings: Settings;
  notifications: NotificationItem[];
  team: TeamMember[];
  templates: Template[];
  diagrams: Diagram[];
}

export interface Mutation<T> {
  revision: number;
  snapshot: StudioSnapshot;
  data: T;
}

export const ENGINE_LABEL: Record<Engine, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  sqlserver: "SQL Server",
  mongodb: "MongoDB",
  hybrid: "SQL + NoSQL",
};

export const ENGINES: Engine[] = ["postgresql", "mysql", "sqlite", "sqlserver", "mongodb", "hybrid"];

export const SQL_TYPES = [
  "UUID",
  "VARCHAR(100)",
  "VARCHAR(160)",
  "VARCHAR(255)",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "DECIMAL(10,2)",
  "BOOLEAN",
  "TIMESTAMP",
  "DATE",
  "JSONB",
];

export const MONGO_TYPES = ["ObjectId", "String", "Number", "Boolean", "Date", "Object", "Array"];

export const COLOR_PRESETS: TableStyle[] = [
  { header: "#3b82f6", title: "#ffffff", text: "#dbeafe", border: "#60a5fa" },
  { header: "#0d9488", title: "#ffffff", text: "#ccfbf1", border: "#2dd4bf" },
  { header: "#16a34a", title: "#ffffff", text: "#dcfce7", border: "#4ade80" },
  { header: "#ea580c", title: "#ffffff", text: "#ffedd5", border: "#fb923c" },
  { header: "#7c3aed", title: "#ffffff", text: "#ede9fe", border: "#a78bfa" },
  { header: "#db2777", title: "#ffffff", text: "#fce7f3", border: "#f472b6" },
];

export const ACCENT_COLORS = ["#2f6bff", "#0d9488", "#16a34a", "#ea580c", "#db2777", "#7c3aed"];

export function engineBadge(engine: Engine) {
  if (engine === "mongodb") return "NoSQL";
  if (engine === "hybrid") return "Mixed";
  return "SQL";
}

export function typesForEngine(engine: Engine) {
  return engine === "mongodb" ? MONGO_TYPES : SQL_TYPES;
}
