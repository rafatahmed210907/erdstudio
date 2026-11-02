import type { Diagram, Engine, Field, Table } from "@/lib/data/types";

function quote(name: string, engine: Engine) {
  if (engine === "mysql") return `\`${name.replace(/`/g, "")}\``;
  return `"${name.replace(/"/g, "")}"`;
}

function mapType(type: string, engine: Engine) {
  if (engine !== "mysql") return type;
  if (type === "UUID") return "CHAR(36)";
  if (type === "JSONB") return "JSON";
  if (type === "TIMESTAMP") return "DATETIME";
  return type;
}

function columnLine(field: Field, engine: Engine) {
  const parts = [`  ${quote(field.name, engine)} ${mapType(field.type, engine)}`];
  if (field.key === "pk") parts.push("PRIMARY KEY");
  if (field.notNull && field.key !== "pk") parts.push("NOT NULL");
  if (field.unique && field.key !== "pk") parts.push("UNIQUE");
  if (field.defaultValue) parts.push(`DEFAULT ${field.defaultValue}`);
  return parts.join(" ");
}

function createTable(table: Table, engine: Engine) {
  const name =
    engine === "mysql" || table.schema === table.name
      ? quote(table.name, engine)
      : `${quote(table.schema || "public", engine)}.${quote(table.name, engine)}`;
  const columns = table.fields.map((field) => columnLine(field, engine)).join(",\n");
  const comment = table.description ? `-- ${table.description}\n` : "";
  return `${comment}CREATE TABLE ${name} (\n${columns}\n);`;
}

function foreignKeys(diagram: Diagram, engine: Engine) {
  return diagram.relationships.flatMap((relationship) => {
    const from = diagram.tables.find((table) => table.id === relationship.fromTableId);
    const to = diagram.tables.find((table) => table.id === relationship.toTableId);
    const fromField = from?.fields.find((field) => field.id === relationship.fromFieldId);
    const toField = to?.fields.find((field) => field.id === relationship.toFieldId);
    if (!from || !to || !fromField || !toField) return [];
    const constraint = `fk_${to.name}_${toField.name}`;
    return [
      `ALTER TABLE ${quote(to.schema || "public", engine)}.${quote(to.name, engine)}\n  ADD CONSTRAINT ${quote(constraint, engine)}\n  FOREIGN KEY (${quote(toField.name, engine)}) REFERENCES ${quote(from.schema || "public", engine)}.${quote(from.name, engine)} (${quote(fromField.name, engine)}); -- ${relationship.label} ${relationship.cardinality}`,
    ];
  });
}

function mongoSketch(diagram: Diagram) {
  const blocks = diagram.tables.map((table) => {
    const shape = table.fields
      .map((field) => `    "${field.name}": "${field.type}"`)
      .join(",\n");
    return `// ${table.name} collection${table.description ? ` — ${table.description}` : ""}\n{\n${shape}\n}`;
  });
  const refs = diagram.relationships.map((relationship) => {
    const from = diagram.tables.find((table) => table.id === relationship.fromTableId);
    const to = diagram.tables.find((table) => table.id === relationship.toTableId);
    return `// ${relationship.label}: ${from?.name ?? "?"} ${relationship.cardinality} ${to?.name ?? "?"}`;
  });
  return [...blocks, ...refs].join("\n\n");
}

export function generateSql(diagram: Diagram) {
  if (diagram.engine === "mongodb") return mongoSketch(diagram);
  const engine = diagram.engine === "mysql" ? "mysql" : "postgresql";
  const header = `-- ${diagram.name}\n-- Engine: ${diagram.engine}\n`;
  const tables = diagram.tables.map((table) => createTable(table, engine)).join("\n\n");
  const keys = foreignKeys(diagram, engine).join("\n\n");
  const sql = [header, tables, keys].filter(Boolean).join("\n\n");
  if (diagram.engine === "hybrid") {
    return `${sql}\n\n-- Document collections\n${mongoSketch(diagram)}`;
  }
  return sql;
}

export function previewTable(table: Table, engine: Engine) {
  return generateSql({
    id: "preview",
    name: table.name,
    description: table.description,
    engine: engine === "hybrid" ? table.engine : engine,
    createdAt: "",
    updatedAt: "",
    tables: [table],
    relationships: [],
  });
}
