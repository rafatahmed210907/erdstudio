import type { Diagram, Relationship, Table } from "@/lib/data/types";

export function cloneDiagram(source: Pick<Diagram, "name" | "description" | "engine" | "tables" | "relationships">, name?: string): Diagram {
  const tableIds = new Map<string, string>();
  const fieldIds = new Map<string, string>();
  const tables: Table[] = source.tables.map((table) => {
    const id = crypto.randomUUID();
    tableIds.set(table.id, id);
    return {
      ...table,
      id,
      position: { ...table.position },
      style: { ...table.style },
      fields: table.fields.map((field) => {
        const fieldId = crypto.randomUUID();
        fieldIds.set(field.id, fieldId);
        return { ...field, id: fieldId };
      }),
    };
  });
  const relationships: Relationship[] = source.relationships.map((relationship) => ({
    ...relationship,
    id: crypto.randomUUID(),
    fromTableId: tableIds.get(relationship.fromTableId) ?? relationship.fromTableId,
    toTableId: tableIds.get(relationship.toTableId) ?? relationship.toTableId,
    fromFieldId: fieldIds.get(relationship.fromFieldId) ?? relationship.fromFieldId,
    toFieldId: fieldIds.get(relationship.toFieldId) ?? relationship.toFieldId,
  }));
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name ?? source.name,
    description: source.description,
    engine: source.engine,
    tables,
    relationships,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
