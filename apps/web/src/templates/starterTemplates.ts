import {
  blogTemplate,
  shopTemplate,
  trackerTemplate,
  type IRDocument,
} from "@schemaflow/ir-schema";

export interface TemplateCardMeta {
  id: "blog" | "shop" | "tracker";
  name: string;
  tagline: string;
  badge: string;
  entities: {
    name: string;
    badgeColor: string;
    fields: {
      name: string;
      type: string;
      isPk?: boolean;
      isFk?: boolean;
    }[];
  }[];
}

export const STARTER_TEMPLATES_META: TemplateCardMeta[] = [
  {
    id: "blog",
    name: "Blog & Publications",
    tagline: "Content publishing with authors, markdown posts, threaded comments, and taxonomy tags.",
    badge: "POSTGRESQL 16",
    entities: [
      {
        name: "User",
        badgeColor: "var(--entity-lime)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "email", type: "string" },
          { name: "role", type: "enum(ADMIN,AUTHOR,USER)" },
          { name: "createdAt", type: "timestamp" },
        ],
      },
      {
        name: "Post",
        badgeColor: "var(--entity-teal)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "title", type: "string" },
          { name: "slug", type: "string" },
          { name: "authorId", type: "uuid", isFk: true },
        ],
      },
      {
        name: "Comment",
        badgeColor: "var(--entity-coral)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "content", type: "string" },
          { name: "postId", type: "uuid", isFk: true },
        ],
      },
      {
        name: "Tag",
        badgeColor: "var(--entity-amber)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "name", type: "string" },
          { name: "slug", type: "string" },
        ],
      },
    ],
  },
  {
    id: "shop",
    name: "Online Store",
    tagline: "Full e-commerce schema with customer records, product catalog, orders, and order line items.",
    badge: "POSTGRESQL 16",
    entities: [
      {
        name: "Customer",
        badgeColor: "var(--entity-teal)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "email", type: "string" },
          { name: "name", type: "string" },
        ],
      },
      {
        name: "Product",
        badgeColor: "var(--entity-lime)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "title", type: "string" },
          { name: "price", type: "decimal" },
          { name: "sku", type: "string" },
        ],
      },
      {
        name: "Order",
        badgeColor: "var(--entity-violet)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "customerId", type: "uuid", isFk: true },
          { name: "status", type: "enum(PENDING,PAID,SHIPPED)" },
          { name: "total", type: "decimal" },
        ],
      },
      {
        name: "OrderItem",
        badgeColor: "var(--entity-amber)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "orderId", type: "uuid", isFk: true },
          { name: "productId", type: "uuid", isFk: true },
          { name: "quantity", type: "int" },
        ],
      },
    ],
  },
  {
    id: "tracker",
    name: "Task & Project Tracker",
    tagline: "Multi-tenant project workspace with task boards, role-based members, and label taxonomies.",
    badge: "POSTGRESQL 16",
    entities: [
      {
        name: "Workspace",
        badgeColor: "var(--entity-violet)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "name", type: "string" },
          { name: "slug", type: "string" },
        ],
      },
      {
        name: "Project",
        badgeColor: "var(--entity-sky)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "name", type: "string" },
          { name: "workspaceId", type: "uuid", isFk: true },
        ],
      },
      {
        name: "Task",
        badgeColor: "var(--entity-coral)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "title", type: "string" },
          { name: "status", type: "enum(TODO,IN_PROGRESS,DONE)" },
          { name: "projectId", type: "uuid", isFk: true },
        ],
      },
      {
        name: "Member",
        badgeColor: "var(--entity-lime)",
        fields: [
          { name: "id", type: "uuid", isPk: true },
          { name: "role", type: "enum(OWNER,ADMIN,MEMBER)" },
          { name: "workspaceId", type: "uuid", isFk: true },
        ],
      },
    ],
  },
];

export function getTemplateIR(id: "blog" | "shop" | "tracker"): IRDocument {
  switch (id) {
    case "blog":
      return JSON.parse(JSON.stringify(blogTemplate)) as IRDocument;
    case "shop":
      return JSON.parse(JSON.stringify(shopTemplate)) as IRDocument;
    case "tracker":
      return JSON.parse(JSON.stringify(trackerTemplate)) as IRDocument;
  }
}
