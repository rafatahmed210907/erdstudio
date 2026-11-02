import type { Diagram, Field, StudioSnapshot, Table, TableStyle, Template } from "@/lib/data/types";
import { COLOR_PRESETS } from "@/lib/data/types";

const ANCHOR = new Date("2026-11-02T12:00:00.000Z").getTime();

function ago(hours: number) {
  return new Date(ANCHOR - hours * 60 * 60 * 1000).toISOString();
}

function field(
  id: string,
  name: string,
  type: string,
  extras: Partial<Field> = {},
): Field {
  return {
    id,
    name,
    type,
    key: "none",
    notNull: false,
    unique: false,
    ...extras,
  };
}

function table(
  id: string,
  name: string,
  position: { x: number; y: number },
  style: TableStyle,
  fields: Field[],
  extras: Partial<Table> = {},
): Table {
  return {
    id,
    name,
    schema: "public",
    engine: "postgresql",
    description: "",
    position,
    style,
    fields,
    ...extras,
  };
}

function ecommerce(): Diagram {
  const blue = COLOR_PRESETS[0];
  const teal = COLOR_PRESETS[1];
  const green = COLOR_PRESETS[2];
  const orange = COLOR_PRESETS[3];
  const purple = COLOR_PRESETS[4];
  return {
    id: "diag_ecom",
    name: "E-commerce Database",
    description: "Customers, orders, products, and inventory.",
    engine: "postgresql",
    createdAt: ago(72),
    updatedAt: ago(2),
    tables: [
      table("tbl_users", "users", { x: 40, y: 36 }, blue, [
        field("fld_users_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
        field("fld_users_name", "name", "VARCHAR(100)", { notNull: true }),
        field("fld_users_email", "email", "VARCHAR(255)", { notNull: true, unique: true }),
        field("fld_users_created", "created_at", "TIMESTAMP", { notNull: true }),
      ], { description: "Accounts that place orders." }),
      table("tbl_orders", "orders", { x: 420, y: 24 }, green, [
        field("fld_orders_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
        field("fld_orders_user", "user_id", "UUID", { key: "fk", notNull: true }),
        field("fld_orders_status", "status", "VARCHAR(32)", { notNull: true }),
        field("fld_orders_total", "total", "DECIMAL(10,2)", { notNull: true }),
        field("fld_orders_created", "created_at", "TIMESTAMP", { notNull: true }),
      ], { description: "Customer orders and payment totals." }),
      table("tbl_products", "products", { x: 40, y: 310 }, orange, [
        field("fld_products_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
        field("fld_products_name", "name", "VARCHAR(160)", { notNull: true }),
        field("fld_products_price", "price", "DECIMAL(10,2)", { notNull: true }),
        field("fld_products_description", "description", "TEXT"),
        field("fld_products_stock", "stock", "INTEGER"),
        field("fld_products_created", "created_at", "TIMESTAMP", { notNull: true }),
      ], { description: "Stores product information including pricing and inventory details." }),
      table("tbl_items", "order_items", { x: 440, y: 330 }, purple, [
        field("fld_items_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
        field("fld_items_order", "order_id", "UUID", { key: "fk", notNull: true }),
        field("fld_items_product", "product_id", "UUID", { key: "fk", notNull: true }),
        field("fld_items_qty", "quantity", "INTEGER", { notNull: true }),
        field("fld_items_price", "price", "DECIMAL(10,2)", { notNull: true }),
      ], { description: "Line items that connect orders to products." }),
      table("tbl_customers", "customers", { x: 800, y: 150 }, teal, [
        field("fld_customers_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
        field("fld_customers_name", "full_name", "VARCHAR(120)", { notNull: true }),
        field("fld_customers_email", "email", "VARCHAR(255)", { notNull: true, unique: true }),
        field("fld_customers_created", "created_at", "TIMESTAMP", { notNull: true }),
      ], { description: "Billing profiles linked to the storefront." }),
    ],
    relationships: [
      {
        id: "rel_places",
        fromTableId: "tbl_users",
        fromFieldId: "fld_users_id",
        toTableId: "tbl_orders",
        toFieldId: "fld_orders_user",
        cardinality: "1:N",
        label: "places",
      },
      {
        id: "rel_contains",
        fromTableId: "tbl_orders",
        fromFieldId: "fld_orders_id",
        toTableId: "tbl_items",
        toFieldId: "fld_items_order",
        cardinality: "1:N",
        label: "contains",
      },
      {
        id: "rel_references",
        fromTableId: "tbl_products",
        fromFieldId: "fld_products_id",
        toTableId: "tbl_items",
        toFieldId: "fld_items_product",
        cardinality: "1:N",
        label: "references",
      },
    ],
  };
}

function simpleDiagram(
  id: string,
  name: string,
  description: string,
  engine: Diagram["engine"],
  hours: number,
  tables: Table[],
): Diagram {
  return {
    id,
    name,
    description,
    engine,
    createdAt: ago(hours + 20),
    updatedAt: ago(hours),
    tables,
    relationships: [],
  };
}

function templates(): Template[] {
  const postgres = ecommerce();
  return [
    {
      id: "tpl_postgres",
      name: "PostgreSQL Schema",
      description: "Relational database template with common tables.",
      engine: "postgresql",
      kind: "sql",
      diagram: {
        name: "PostgreSQL Schema",
        description: "Users, orders, and products for a relational app.",
        engine: "postgresql",
        tables: postgres.tables.slice(0, 3).map((item) => ({ ...item, engine: "postgresql" })),
        relationships: [],
      },
    },
    {
      id: "tpl_mysql",
      name: "MySQL Schema",
      description: "Popular MySQL database structure template.",
      engine: "mysql",
      kind: "sql",
      diagram: {
        name: "MySQL Schema",
        description: "A compact MySQL starter schema.",
        engine: "mysql",
        tables: [
          table("tpl_mysql_users", "users", { x: 40, y: 40 }, COLOR_PRESETS[0], [
            field("tpl_mysql_users_id", "id", "BIGINT", { key: "pk", notNull: true, unique: true }),
            field("tpl_mysql_users_email", "email", "VARCHAR(255)", { notNull: true, unique: true }),
          ], { engine: "mysql" }),
          table("tpl_mysql_posts", "posts", { x: 380, y: 40 }, COLOR_PRESETS[3], [
            field("tpl_mysql_posts_id", "id", "BIGINT", { key: "pk", notNull: true, unique: true }),
            field("tpl_mysql_posts_title", "title", "VARCHAR(160)", { notNull: true }),
            field("tpl_mysql_posts_user", "user_id", "BIGINT", { key: "fk", notNull: true }),
          ], { engine: "mysql" }),
        ],
        relationships: [],
      },
    },
    {
      id: "tpl_mongo",
      name: "MongoDB Schema",
      description: "NoSQL collection structure template.",
      engine: "mongodb",
      kind: "nosql",
      diagram: {
        name: "MongoDB Schema",
        description: "Collections for a document store.",
        engine: "mongodb",
        tables: [
          table("tpl_mongo_products", "products", { x: 48, y: 48 }, COLOR_PRESETS[2], [
            field("tpl_mongo_products_id", "_id", "ObjectId", { key: "pk", notNull: true, unique: true }),
            field("tpl_mongo_products_name", "name", "String", { notNull: true }),
            field("tpl_mongo_products_price", "price", "Number"),
          ], { engine: "mongodb", schema: "products" }),
        ],
        relationships: [],
      },
    },
    {
      id: "tpl_hybrid",
      name: "SQL + NoSQL Hybrid",
      description: "Combine relational and NoSQL for modern applications.",
      engine: "hybrid",
      kind: "mixed",
      diagram: {
        name: "SQL + NoSQL Hybrid",
        description: "Orders in Postgres, product documents in MongoDB.",
        engine: "hybrid",
        tables: [
          table("tpl_hybrid_orders", "orders", { x: 40, y: 40 }, COLOR_PRESETS[0], [
            field("tpl_hybrid_orders_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
            field("tpl_hybrid_orders_total", "total", "DECIMAL(10,2)", { notNull: true }),
          ], { engine: "postgresql" }),
          table("tpl_hybrid_catalog", "catalog", { x: 380, y: 40 }, COLOR_PRESETS[2], [
            field("tpl_hybrid_catalog_id", "_id", "ObjectId", { key: "pk", notNull: true, unique: true }),
            field("tpl_hybrid_catalog_name", "name", "String", { notNull: true }),
          ], { engine: "mongodb", schema: "catalog" }),
        ],
        relationships: [],
      },
    },
  ];
}

export function createSeed(): StudioSnapshot {
  const shop = ecommerce();
  return {
    revision: 1,
    session: { signedIn: true },
    user: {
      id: "user_john",
      name: "John Doe",
      email: "john.doe@erdstudio.app",
      role: "Owner",
      initials: "JD",
    },
    settings: {
      applicationName: "ERD Studio",
      language: "English",
      defaultEngine: "postgresql",
      theme: "dark",
      accent: "#2f6bff",
      defaultView: "table",
      gridSize: 20,
      canvasBackground: "#0b1220",
      lightCanvasBackground: "#f8fafc",
      snapToGrid: true,
      showMinimap: true,
      showConnectionHandles: true,
      keyboardShortcuts: true,
      showNotifications: true,
      aiAssistant: false,
      autosave: true,
      currentDiagramId: shop.id,
    },
    notifications: [
      {
        id: "note_autosave",
        title: "Autosave complete",
        body: "E-commerce Database was saved on this device.",
        createdAt: ago(1),
        read: false,
      },
      {
        id: "note_template",
        title: "Template ready",
        body: "PostgreSQL Schema can be cloned into a new diagram.",
        createdAt: ago(5),
        read: false,
      },
    ],
    team: [
      { id: "member_john", name: "John Doe", email: "john.doe@erdstudio.app", role: "Owner" },
      { id: "member_alex", name: "Alex Kim", email: "alex.kim@erdstudio.app", role: "Editor" },
      { id: "member_sam", name: "Sam Patel", email: "sam.patel@erdstudio.app", role: "Viewer" },
    ],
    templates: templates(),
    diagrams: [
      shop,
      simpleDiagram("diag_saas", "SaaS Application", "Users, teams, subscriptions.", "postgresql", 5, [
        table("saas_users", "users", { x: 40, y: 40 }, COLOR_PRESETS[0], [
          field("saas_users_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
          field("saas_users_email", "email", "VARCHAR(255)", { notNull: true, unique: true }),
        ]),
        table("saas_teams", "teams", { x: 360, y: 40 }, COLOR_PRESETS[4], [
          field("saas_teams_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
          field("saas_teams_name", "name", "VARCHAR(120)", { notNull: true }),
        ]),
      ]),
      simpleDiagram("diag_inventory", "Inventory System", "Products, warehouses, stock.", "mysql", 26, [
        table("inv_products", "products", { x: 40, y: 40 }, COLOR_PRESETS[3], [
          field("inv_products_id", "id", "BIGINT", { key: "pk", notNull: true, unique: true }),
          field("inv_products_sku", "sku", "VARCHAR(64)", { notNull: true, unique: true }),
        ], { engine: "mysql" }),
        table("inv_warehouses", "warehouses", { x: 360, y: 40 }, COLOR_PRESETS[1], [
          field("inv_warehouses_id", "id", "BIGINT", { key: "pk", notNull: true, unique: true }),
          field("inv_warehouses_name", "name", "VARCHAR(120)", { notNull: true }),
        ], { engine: "mysql" }),
      ]),
      simpleDiagram("diag_blog", "Blog Platform", "Users, posts, comments.", "postgresql", 50, [
        table("blog_posts", "posts", { x: 40, y: 40 }, COLOR_PRESETS[2], [
          field("blog_posts_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
          field("blog_posts_title", "title", "VARCHAR(160)", { notNull: true }),
        ]),
        table("blog_comments", "comments", { x: 360, y: 40 }, COLOR_PRESETS[5], [
          field("blog_comments_id", "id", "UUID", { key: "pk", notNull: true, unique: true }),
          field("blog_comments_body", "body", "TEXT", { notNull: true }),
        ]),
      ]),
    ],
  };
}
