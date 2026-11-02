import type {
  Diagram,
  Mutation,
  Relationship,
  Settings,
  StudioSnapshot,
  Table,
  User,
} from "@/lib/data/types";

/**
 * Storage seam for ERD Studio.
 * The UI talks only to HTTP routes. Those routes call this interface.
 * Replace JsonRepository with an HTTP-backed repository when the backend lands.
 * Do not import filesystem code from React components.
 */
export interface StudioRepository {
  getSnapshot(): Promise<StudioSnapshot>;
  createDiagram(input: { name: string; engine: Diagram["engine"]; description?: string }): Promise<Mutation<Diagram>>;
  createFromTemplate(templateId: string): Promise<Mutation<Diagram>>;
  updateDiagram(id: string, patch: Partial<Pick<Diagram, "name" | "description" | "engine">>): Promise<Mutation<Diagram>>;
  deleteDiagram(id: string): Promise<Mutation<null>>;
  duplicateDiagram(id: string): Promise<Mutation<Diagram>>;
  importDiagram(diagram: Partial<Diagram> & { name?: string }): Promise<Mutation<Diagram>>;
  saveTable(diagramId: string, table: Table): Promise<Mutation<Table>>;
  updateTable(diagramId: string, tableId: string, patch: Partial<Table>): Promise<Mutation<Table>>;
  deleteTable(diagramId: string, tableId: string): Promise<Mutation<null>>;
  saveRelationship(diagramId: string, relationship: Relationship): Promise<Mutation<Relationship>>;
  deleteRelationship(diagramId: string, relationshipId: string): Promise<Mutation<null>>;
  autoLayout(diagramId: string): Promise<Mutation<Diagram>>;
  updateSettings(patch: Partial<Settings>): Promise<Mutation<Settings>>;
  updateProfile(patch: Partial<Pick<User, "name" | "email" | "role">>): Promise<Mutation<User>>;
  setSession(signedIn: boolean): Promise<Mutation<null>>;
  markNotificationsRead(): Promise<Mutation<null>>;
  exportDiagram(id: string, format: "json" | "sql"): Promise<{ filename: string; contentType: string; body: string }>;
}

export class StudioError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
