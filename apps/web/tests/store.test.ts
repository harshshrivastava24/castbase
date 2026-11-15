import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "../src/store/useProjectStore";

describe("useProjectStore (Zustand + Zundo + Schema Importer)", () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject();
    useProjectStore.temporal?.getState()?.clear();
  });

  it("initializes with default empty IR, dark theme, and simple mode", () => {
    const state = useProjectStore.getState();
    expect(state.ir.irVersion).toBe("1.0");
    expect(state.ir.entities).toEqual([]);
    expect(state.theme).toBe("dark");
    expect(state.displayMode).toBe("simple");
    expect(state.activeTab).toBe("model");
    expect(state.validationErrors).toEqual([]);
  });

  it("toggles displayMode between simple and advanced", () => {
    const store = useProjectStore.getState();
    expect(store.displayMode).toBe("simple");

    store.setDisplayMode("advanced");
    expect(useProjectStore.getState().displayMode).toBe("advanced");

    store.setDisplayMode("simple");
    expect(useProjectStore.getState().displayMode).toBe("simple");
  });

  it("toggles theme between dark and light", () => {
    const store = useProjectStore.getState();
    expect(store.theme).toBe("dark");

    store.toggleTheme();
    expect(useProjectStore.getState().theme).toBe("light");

    store.toggleTheme();
    expect(useProjectStore.getState().theme).toBe("dark");
  });

  it("loads blog template with positioned layout nodes and valid IR", () => {
    const store = useProjectStore.getState();
    store.loadTemplate("blog");

    const state = useProjectStore.getState();
    expect(state.ir.entities.length).toBe(4);
    const entityNames = state.ir.entities.map((e) => e.name);
    expect(entityNames).toContain("User");
    expect(entityNames).toContain("Post");
    expect(entityNames).toContain("Comment");
    expect(entityNames).toContain("Tag");

    expect(state.ir.layout).toBeDefined();
    expect(Object.keys(state.ir.layout!.nodes).length).toBe(4);
    expect(state.validationErrors).toEqual([]);
  });

  it("loads shop template and tracker template", () => {
    const store = useProjectStore.getState();

    store.loadTemplate("shop");
    let state = useProjectStore.getState();
    expect(state.ir.entities.length).toBe(4);
    expect(state.ir.entities.map((e) => e.name)).toContain("Product");

    store.loadTemplate("tracker");
    state = useProjectStore.getState();
    expect(state.ir.entities.length).toBe(4);
    expect(state.ir.entities.map((e) => e.name)).toContain("Workspace");
  });

  it("imports Prisma schema into store with Dagre layout", () => {
    const prismaSchema = `
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      model Author {
        id        String   @id @default(uuid())
        email     String   @unique
        articles  Article[]
      }

      model Article {
        id        String   @id @default(uuid())
        title     String
        authorId  String
        author    Author   @relation(fields: [authorId], references: [id])
      }
    `;

    const store = useProjectStore.getState();
    const res = store.importSchemaText(prismaSchema, "prisma");
    expect(res.success).toBe(true);

    const state = useProjectStore.getState();
    expect(state.ir.entities.length).toBe(2);
    expect(state.ir.project.database).toBe("postgres");
    expect(state.ir.layout).toBeDefined();
    expect(Object.keys(state.ir.layout!.nodes).length).toBe(2);
    expect(state.validationErrors).toEqual([]);
  });

  it("imports Mongoose AST schema into store with zero-eval safety", () => {
    const mongooseSchema = `
      import { Schema } from 'mongoose';

      const CustomerSchema = new Schema({
        email: { type: String, required: true, unique: true },
        name: { type: String }
      });

      const InvoiceSchema = new Schema({
        amount: { type: Number, required: true },
        customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true }
      });
    `;

    const store = useProjectStore.getState();
    const res = store.importSchemaText(mongooseSchema, "mongodb");
    expect(res.success).toBe(true);

    const state = useProjectStore.getState();
    expect(state.ir.entities.length).toBe(2);
    expect(state.ir.project.database).toBe("mongodb");
    expect(state.ir.layout).toBeDefined();
    expect(Object.keys(state.ir.layout!.nodes).length).toBe(2);
  });

  it("supports Undo and Redo operations via Zundo temporal middleware", () => {
    const store = useProjectStore.getState();
    expect(store.ir.entities.length).toBe(0);

    // Step 1: Add Entity
    const entityId = store.addEntity({ name: "Widget", tableName: "widgets" });
    expect(useProjectStore.getState().ir.entities.length).toBe(1);
    expect(useProjectStore.getState().ir.entities[0]!.name).toBe("Widget");

    // Step 2: Add Field to Entity
    useProjectStore.getState().addField(entityId, {
      name: "sku",
      type: "string",
      required: true,
    });
    expect(useProjectStore.getState().ir.entities[0]!.fields.length).toBe(2); // PK id + sku

    // Undo Step 2
    useProjectStore.temporal?.getState()?.undo();
    expect(useProjectStore.getState().ir.entities[0]!.fields.length).toBe(1);

    // Undo Step 1
    useProjectStore.temporal?.getState()?.undo();
    expect(useProjectStore.getState().ir.entities.length).toBe(0);

    // Redo Step 1
    useProjectStore.temporal?.getState()?.redo();
    expect(useProjectStore.getState().ir.entities.length).toBe(1);
    expect(useProjectStore.getState().ir.entities[0]!.name).toBe("Widget");

    // Redo Step 2
    useProjectStore.temporal?.getState()?.redo();
    expect(useProjectStore.getState().ir.entities[0]!.fields.length).toBe(2);
  });
});
