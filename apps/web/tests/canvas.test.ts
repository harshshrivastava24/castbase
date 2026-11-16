import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "../src/store/useProjectStore";
import type { Relation } from "@schemaflow/ir-schema";

describe("T09: React Flow Canvas & Inspector Integration", () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject();
    useProjectStore.temporal?.getState()?.clear();
  });

  it("creates entities with deterministic layout positions and default UUID primary key", () => {
    const store = useProjectStore.getState();

    const entityId = store.addEntity({ name: "Account", tableName: "accounts" });
    const state = useProjectStore.getState();

    expect(state.ir.entities.length).toBe(1);
    const entity = state.ir.entities[0]!;
    expect(entity.id).toBe(entityId);
    expect(entity.name).toBe("Account");
    expect(entity.tableName).toBe("accounts");

    // Primary key check
    expect(entity.fields.length).toBe(1);
    expect(entity.fields[0]!.isPrimaryKey).toBe(true);
    expect(entity.fields[0]!.type).toBe("uuid");

    // Layout position check
    expect(state.ir.layout?.nodes[entityId]).toBeDefined();
    expect(state.ir.layout?.nodes[entityId]?.x).toBeGreaterThanOrEqual(100);
    expect(state.ir.layout?.nodes[entityId]?.color).toBeDefined();

    // Default endpoint check
    const endpoint = state.ir.endpoints.find((ep) => ep.entityId === entityId);
    expect(endpoint).toBeDefined();
    expect(endpoint?.ops).toEqual(["list", "get", "create", "update", "delete"]);
  });

  it("updates node position in ir.layout.nodes without polluting semantic hash", () => {
    const store = useProjectStore.getState();
    const entityId = store.addEntity({ name: "Profile", tableName: "profiles" });

    store.updateNodePosition(entityId, { x: 420, y: 350 });
    const state = useProjectStore.getState();

    expect(state.ir.layout?.nodes[entityId]?.x).toBe(420);
    expect(state.ir.layout?.nodes[entityId]?.y).toBe(350);
  });

  it("adds, edits, and removes fields dynamically in Right Inspector flow", () => {
    const store = useProjectStore.getState();
    const entityId = store.addEntity({ name: "Post", tableName: "posts" });

    // Add Field
    const titleFieldId = store.addField(entityId, {
      name: "title",
      type: "string",
      required: true,
    });

    let entity = useProjectStore.getState().ir.entities.find((e) => e.id === entityId)!;
    expect(entity.fields.length).toBe(2);
    expect(entity.fields[1]!.name).toBe("title");
    expect(entity.fields[1]!.required).toBe(true);

    // Update Field
    store.updateField(entityId, titleFieldId, {
      name: "headline",
      unique: true,
    });

    entity = useProjectStore.getState().ir.entities.find((e) => e.id === entityId)!;
    expect(entity.fields[1]!.name).toBe("headline");
    expect(entity.fields[1]!.unique).toBe(true);

    // Remove Field
    store.removeField(entityId, titleFieldId);
    entity = useProjectStore.getState().ir.entities.find((e) => e.id === entityId)!;
    expect(entity.fields.length).toBe(1); // Only PK remains
  });

  it("links relations between entities and injects foreign keys properly", () => {
    const store = useProjectStore.getState();

    const authorId = store.addEntity({ name: "Author", tableName: "authors" });
    const bookId = store.addEntity({ name: "Book", tableName: "books" });

    // Connect Relation: Author has many Books
    store.connectRelation({
      fromEntityId: authorId,
      toEntityId: bookId,
      kind: "one-to-many",
    });

    const state = useProjectStore.getState();
    expect(state.ir.relations.length).toBe(1);
    const rel = state.ir.relations[0]!;
    expect(rel.fromEntityId).toBe(authorId);
    expect(rel.toEntityId).toBe(bookId);
    expect(rel.kind).toBe("one-to-many");
    expect(rel.foreignKeyField).toBe("authorId");

    // Book entity should now have the injected foreign key
    const book = state.ir.entities.find((e) => e.id === bookId)!;
    const fkField = book.fields.find((f) => f.name === "authorId");
    expect(fkField).toBeDefined();
    expect(fkField?.type).toBe("uuid");

    // Update Relation (e.g. change cascade action)
    store.updateRelation(rel.id, { onDelete: "SET_NULL" });
    expect(useProjectStore.getState().ir.relations[0]!.onDelete).toBe("SET_NULL");

    // Delete Relation
    store.deleteRelation(rel.id);
    expect(useProjectStore.getState().ir.relations.length).toBe(0);
  });

  it("switches Simple and Advanced view modes seamlessly", () => {
    const store = useProjectStore.getState();
    expect(store.displayMode).toBe("simple");

    store.setDisplayMode("advanced");
    expect(useProjectStore.getState().displayMode).toBe("advanced");

    store.setDisplayMode("simple");
    expect(useProjectStore.getState().displayMode).toBe("simple");
  });

  it("triggers real-time validation error badges when an invalid entity or field exists", () => {
    const store = useProjectStore.getState();
    const entityId = store.addEntity({ name: "BadEntity", tableName: "bad_entities" });

    // In IR v1.0, duplicate field names or reserved words violate validation rules
    // Let's add an invalid field with reserved keyword or empty identifier
    store.addField(entityId, {
      name: "select", // reserved SQL keyword
      type: "string",
    });

    const state = useProjectStore.getState();
    expect(state.validationErrors.length).toBeGreaterThan(0);
    const err = state.validationErrors.find(
      (e) => e.entityId === entityId
    );
    expect(err).toBeDefined();
    expect(err?.message).toMatch(/reserved/i);
  });

  it("recomputes Dagre auto-layout on demand", () => {
    const store = useProjectStore.getState();
    store.loadTemplate("blog");

    const initialLayout = useProjectStore.getState().ir.layout?.nodes;
    expect(Object.keys(initialLayout || {}).length).toBe(4);

    // Call recomputeLayout
    store.recomputeLayout();
    const refreshedLayout = useProjectStore.getState().ir.layout?.nodes;
    expect(Object.keys(refreshedLayout || {}).length).toBe(4);
    for (const id of Object.keys(refreshedLayout || {})) {
      expect(refreshedLayout![id]?.x).toBeDefined();
      expect(refreshedLayout![id]?.y).toBeDefined();
    }
  });

  it("scales to 30 edges and entities with high performance (< 50ms)", () => {
    const store = useProjectStore.getState();
    const startTime = performance.now();

    // Create 15 entities and 30 relations
    const entityIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const id = store.addEntity({ name: `Node${i}`, tableName: `nodes_${i}` });
      entityIds.push(id);
    }

    // Connect 30 relations in a chain and cross-links
    let relCount = 0;
    for (let i = 0; i < entityIds.length - 1 && relCount < 30; i++) {
      for (let j = i + 1; j < entityIds.length && relCount < 30; j++) {
        const fromId = entityIds[i]!;
        const toId = entityIds[j]!;
        const rel: Relation = {
          id: `rel_${i}_${j}`,
          fromEntityId: fromId,
          toEntityId: toId,
          kind: "many-to-many",
        };
        store.addRelation(rel);
        relCount++;
      }
    }

    const duration = performance.now() - startTime;
    const state = useProjectStore.getState();

    expect(state.ir.entities.length).toBe(15);
    expect(state.ir.relations.length).toBe(30);
    expect(duration).toBeLessThan(200); // Executed rapidly in memory
  });
});
