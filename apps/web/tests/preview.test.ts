import { describe, it, expect } from "vitest";
import type { IRDocument, Entity } from "@schemaflow/ir-schema";
import {
  generateClientOpenAPI,
  generateMockFieldValue,
  generateMockEntity,
  generateMockResponse,
} from "../src/lib/openapi-generator";
import {
  TARGET_OPTIONS,
  getLocalPreviewFiles,
  fetchCompilePreview,
} from "../src/lib/client-preview-fallback";

const createMockIR = (options?: { authEnabled?: boolean }): IRDocument => ({
  irVersion: "1.0",
  project: {
    name: "test-blog",
    database: "postgres",
  },
  entities: [
    {
      id: "ent_users",
      name: "User",
      tableName: "users",
      fields: [
        { id: "f1", name: "id", type: "uuid", required: true, isPrimaryKey: true },
        { id: "f2", name: "email", type: "string", required: true, unique: true },
        { id: "f3", name: "age", type: "int", required: false },
        { id: "f4", name: "balance", type: "decimal", required: false },
        { id: "f5", name: "isActive", type: "bool", required: true, default: true },
        { id: "f6", name: "createdAt", type: "timestamp", required: true },
        { id: "f7", name: "role", type: "enum", enumValues: ["ADMIN", "MEMBER"], required: true },
        { id: "f8", name: "metadata", type: "json", required: false },
      ],
    },
    {
      id: "ent_posts",
      name: "Post",
      tableName: "posts",
      fields: [
        { id: "p1", name: "id", type: "uuid", required: true, isPrimaryKey: true },
        { id: "p2", name: "title", type: "string", required: true },
        { id: "p3", name: "authorId", type: "uuid", required: true },
      ],
    },
  ],
  relations: [
    {
      id: "rel_1",
      fromEntityId: "ent_users",
      toEntityId: "ent_posts",
      kind: "one-to-many",
      foreignKeyField: "authorId",
    },
  ],
  endpoints: [
    {
      entityId: "ent_users",
      ops: ["list", "get", "create", "update", "delete"],
      authRequired: true,
    },
    {
      entityId: "ent_posts",
      ops: ["list", "create"],
      authRequired: false,
    },
  ],
  auth: {
    enabled: Boolean(options?.authEnabled),
    strategy: "jwt",
    roles: ["ADMIN", "MEMBER"],
  },
  layout: {
    nodes: {},
  },
});

describe("Client OpenAPI 3.1 Generator", () => {
  it("generates valid OpenAPI 3.1 structure with components schemas", () => {
    const ir = createMockIR();
    const spec = generateClientOpenAPI(ir);

    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBe("test-blog API");
    expect(spec.components.schemas).toHaveProperty("User");
    expect(spec.components.schemas).toHaveProperty("UserCreate");
    expect(spec.components.schemas).toHaveProperty("UserUpdate");
    expect(spec.components.schemas).toHaveProperty("Post");
    expect(spec.components.schemas).toHaveProperty("Error");

    // Primary key should be omitted from Create schema
    const userCreate = spec.components.schemas["UserCreate"] as any;
    expect(userCreate.properties).not.toHaveProperty("id");
    expect(userCreate.properties).toHaveProperty("email");
  });

  it("generates correct CRUD endpoint paths based on endpoint operations", () => {
    const ir = createMockIR();
    const spec = generateClientOpenAPI(ir);

    // Users has list, get, create, update, delete
    expect(spec.paths["/api/users"]).toHaveProperty("get");
    expect(spec.paths["/api/users"]).toHaveProperty("post");
    expect(spec.paths["/api/users/{id}"]).toHaveProperty("get");
    expect(spec.paths["/api/users/{id}"]).toHaveProperty("patch");
    expect(spec.paths["/api/users/{id}"]).toHaveProperty("delete");

    // Posts only has list and create
    expect(spec.paths["/api/posts"]).toHaveProperty("get");
    expect(spec.paths["/api/posts"]).toHaveProperty("post");
    expect(spec.paths).not.toHaveProperty("/api/posts/{id}");
  });

  it("attaches security requirements and auth endpoints when auth is enabled", () => {
    const irWithAuth = createMockIR({ authEnabled: true });
    const spec = generateClientOpenAPI(irWithAuth);

    expect(spec.components.securitySchemes).toHaveProperty("BearerAuth");
    expect(spec.paths).toHaveProperty("/api/auth/register");
    expect(spec.paths).toHaveProperty("/api/auth/login");

    // Users endpoint requires auth
    const userGetOp = spec.paths["/api/users"]?.["get"] as any;
    expect(userGetOp.security).toEqual([{ BearerAuth: [] }]);

    // Posts endpoint does not require auth
    const postGetOp = spec.paths["/api/posts"]?.["get"] as any;
    expect(postGetOp.security).toBeUndefined();
  });

  it("omits auth endpoints when auth is disabled", () => {
    const irNoAuth = createMockIR({ authEnabled: false });
    const spec = generateClientOpenAPI(irNoAuth);

    expect(spec.components.securitySchemes).toBeUndefined();
    expect(spec.paths).not.toHaveProperty("/api/auth/register");
    expect(spec.paths).not.toHaveProperty("/api/auth/login");
  });
});

describe("Mock Data & Response Generator", () => {
  it("generates realistic mock field values for all supported types", () => {
    const entity = createMockIR().entities[0]!;

    for (const field of entity.fields) {
      const val = generateMockFieldValue(field);
      expect(val).toBeDefined();

      if (field.type === "uuid") {
        expect(typeof val).toBe("string");
        expect(val).toContain("-");
      } else if (field.type === "string") {
        expect(typeof val).toBe("string");
      } else if (field.type === "int") {
        expect(typeof val).toBe("number");
      } else if (field.type === "decimal") {
        expect(typeof val).toBe("number");
      } else if (field.type === "bool") {
        expect(typeof val).toBe("boolean");
      } else if (field.type === "timestamp") {
        expect(typeof val).toBe("string");
        expect(() => new Date(val as string)).not.toThrow();
      } else if (field.type === "enum") {
        expect(["ADMIN", "MEMBER"]).toContain(val);
      } else if (field.type === "json") {
        expect(typeof val).toBe("object");
      }
    }
  });

  it("generates valid mock response objects for operations", () => {
    const entity = createMockIR().entities[0]!;

    const listRes = generateMockResponse(entity, "list");
    expect(listRes.status).toBe(200);
    expect((listRes.body as any).data).toHaveLength(2);
    expect((listRes.body as any).total).toBe(2);

    const createRes = generateMockResponse(entity, "create");
    expect(createRes.status).toBe(201);
    expect((createRes.body as any).email).toBeDefined();

    const deleteRes = generateMockResponse(entity, "delete");
    expect(deleteRes.status).toBe(200);
    expect((deleteRes.body as any).success).toBe(true);
  });
});

describe("Compiler Target Support Matrix & Fallback Protocol", () => {
  it("enforces target enablement: typescript active, python and go disabled with status message", () => {
    const tsMongo = TARGET_OPTIONS.find((t) => t.id === "typescript-mongo");
    const tsPostgres = TARGET_OPTIONS.find((t) => t.id === "typescript-postgres");
    const py = TARGET_OPTIONS.find((t) => t.id === "python-postgres");
    const go = TARGET_OPTIONS.find((t) => t.id === "go-postgres");

    expect(tsMongo?.supported).toBe(true);
    expect(tsPostgres?.supported).toBe(true);

    expect(py?.supported).toBe(false);
    expect(py?.statusMessage).toContain("Task T12");

    expect(go?.supported).toBe(false);
    expect(go?.statusMessage).toContain("Task T13");
  });

  it("returns un-fabricated client-side files when compiler API is offline", async () => {
    const ir = createMockIR();
    const result = await fetchCompilePreview(ir, "typescript-mongo");

    expect(result.online).toBe(false);
    expect(result.files.length).toBeGreaterThan(0);

    // Must never label files as compiler output when offline
    for (const file of result.files) {
      expect(file.isCompilerOutput).toBe(false);
    }

    const openApiFile = result.files.find((f) => f.path === "docs/openapi.json");
    expect(openApiFile).toBeDefined();
    expect(openApiFile?.content).toContain("test-blog API");

    const schemaFile = result.files.find((f) => f.path === "schema/ir-contract.json");
    expect(schemaFile).toBeDefined();
    expect(schemaFile?.content).toContain("test-blog");
  });

  it("rejects unsupported target preview requests with clear status", async () => {
    const ir = createMockIR();
    const result = await fetchCompilePreview(ir, "python-postgres");

    expect(result.online).toBe(false);
    expect(result.isUnsupported).toBe(true);
    expect(result.statusMessage).toContain("Task T12");
  });
});
