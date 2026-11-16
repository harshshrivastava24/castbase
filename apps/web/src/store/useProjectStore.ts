import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { temporal } from "zundo";
import {
  validateIR,
  importSchema,
  computeDagreLayout,
  type IRDocument,
  type Entity,
  type Field,
  type Relation,
  type IRValidationError,
  type SchemaFormat,
  type EndpointOp,
} from "@schemaflow/ir-schema";
import { getTemplateIR } from "../templates/starterTemplates";

export type DisplayMode = "simple" | "advanced";
export type ThemeMode = "dark" | "light";
export type ActiveTab = "model" | "api" | "auth" | "build" | "preview";
export type ImportKind = SchemaFormat;
export type EntityColor = "lime" | "coral" | "teal" | "amber" | "violet" | "sky";

export const createEmptyIR = (
  name = "untitled-project",
  database: "postgres" | "mongodb" = "postgres"
): IRDocument => ({
  irVersion: "1.0",
  project: {
    name,
    database,
  },
  entities: [],
  relations: [],
  endpoints: [],
  auth: {
    enabled: false,
    strategy: "jwt",
    roles: ["USER", "ADMIN"],
  },
  layout: {
    nodes: {},
  },
});

export interface ProjectState {
  ir: IRDocument;
  validationErrors: IRValidationError[];
  displayMode: DisplayMode;
  theme: ThemeMode;
  activeTab: ActiveTab;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isPreviewOpen: boolean;
  isImportModalOpen: boolean;
  importModalKind: ImportKind;
  isInspectorOpen: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setIsPreviewOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean, kind?: ImportKind) => void;
  setIsInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;

  loadTemplate: (name: "blog" | "shop" | "tracker") => void;
  importSchemaText: (
    text: string,
    kind?: ImportKind
  ) => { success: boolean; errors: string[] };

  setIR: (ir: IRDocument) => void;
  updateProjectConfig: (patch: Partial<IRDocument["project"]>) => void;
  addEntity: (entity?: Partial<Entity>) => string;
  updateEntity: (id: string, patch: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addField: (entityId: string, field?: Partial<Field>) => string;
  updateField: (
    entityId: string,
    fieldId: string,
    patch: Partial<Field>
  ) => void;
  removeField: (entityId: string, fieldId: string) => void;
  addRelation: (relation: Relation) => void;
  updateRelation: (id: string, patch: Partial<Relation>) => void;
  deleteRelation: (id: string) => void;
  connectRelation: (params: {
    fromEntityId: string;
    toEntityId: string;
    kind?: "one-to-one" | "one-to-many" | "many-to-many";
  }) => void;
  updateEntityColor: (entityId: string, color: EntityColor) => void;
  recomputeLayout: () => void;
  updateNodePosition: (
    entityId: string,
    pos: { x: number; y: number }
  ) => void;
  toggleEndpointOp: (
    entityId: string,
    op: "list" | "get" | "create" | "update" | "delete"
  ) => void;
  setEndpointAuthRequired: (entityId: string, authRequired: boolean) => void;
  setAuthEnabled: (enabled: boolean) => void;
  setAuthRoles: (roles: string[]) => void;
  toggleAuthRole: (role: string) => void;
  resetProject: () => void;
}

const PALETTE: ("lime" | "coral" | "teal" | "amber" | "violet" | "sky")[] = [
  "lime",
  "coral",
  "teal",
  "amber",
  "violet",
  "sky",
];

const safeLocalStorage: StateStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

export const useProjectStore = create<ProjectState>()(
  temporal(
    persist(
      (set, get) => ({
        ir: createEmptyIR(),
        validationErrors: [],
        displayMode: "simple",
        theme: "dark",
        activeTab: "model",
        selectedNodeId: null,
        selectedEdgeId: null,
        isPreviewOpen: false,
        isImportModalOpen: false,
        importModalKind: "auto",
        isInspectorOpen: true,

        setTheme: (theme) => {
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", theme);
          }
          set({ theme });
        },

        toggleTheme: () => {
          const nextTheme: ThemeMode =
            get().theme === "dark" ? "light" : "dark";
          get().setTheme(nextTheme);
        },

        setDisplayMode: (displayMode) => set({ displayMode }),
        setActiveTab: (activeTab) => set({ activeTab }),
        setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
        setSelectedEdge: (selectedEdgeId) => set({ selectedEdgeId }),
        setIsPreviewOpen: (isPreviewOpen) => set({ isPreviewOpen }),
        setIsImportModalOpen: (isImportModalOpen, kind = "auto") =>
          set({ isImportModalOpen, importModalKind: kind }),
        setIsInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
        toggleInspector: () =>
          set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),

        loadTemplate: (name) => {
          const template = getTemplateIR(name);
          // Ensure auto-layout exists
          if (!template.layout || Object.keys(template.layout.nodes).length === 0) {
            template.layout = computeDagreLayout(
              template.entities,
              template.relations
            );
          }
          const validation = validateIR(template);
          set({
            ir: template,
            validationErrors: validation.errors,
            selectedNodeId: null,
            selectedEdgeId: null,
          });
        },

        importSchemaText: (text, kind = "auto") => {
          const result = importSchema(text, kind, { layout: true });
          if (!result.success || !result.ir) {
            const errMsgs = result.diagnostics
              .filter((d) => d.severity === "error")
              .map((d) => d.message);
            return {
              success: false,
              errors: errMsgs.length > 0 ? errMsgs : ["Failed to parse schema"],
            };
          }

          const validation = validateIR(result.ir);
          set({
            ir: result.ir,
            validationErrors: validation.errors,
            selectedNodeId: null,
            selectedEdgeId: null,
            isImportModalOpen: false,
          });

          return {
            success: true,
            errors: [],
          };
        },

        setIR: (ir) => {
          const validation = validateIR(ir);
          set({ ir, validationErrors: validation.errors });
        },

        updateProjectConfig: (patch) => {
          const current = get().ir;
          const nextIR: IRDocument = {
            ...current,
            project: {
              ...current.project,
              ...patch,
            },
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        addEntity: (partialEntity) => {
          const current = get().ir;
          const count = current.entities.length + 1;
          const id = partialEntity?.id || `ent_entity_${Date.now().toString(36)}`;
          const name = partialEntity?.name || `Entity${count}`;
          const tableName = partialEntity?.tableName || name.toLowerCase() + "s";

          const pkField: Field = {
            id: `fld_${id}_id`,
            name: "id",
            type: "uuid",
            required: true,
            unique: true,
            isPrimaryKey: true,
            default: "uuid()",
          };

          const newEntity: Entity = {
            id,
            name,
            tableName,
            fields: partialEntity?.fields || [pkField],
          };

          // Palette color assignment
          const color = PALETTE[(count - 1) % PALETTE.length] || "lime";
          const currentLayout = current.layout || { nodes: {} };

          const nextIR: IRDocument = {
            ...current,
            entities: [...current.entities, newEntity],
            endpoints: [
              ...current.endpoints,
              {
                entityId: id,
                ops: ["list", "get", "create", "update", "delete"],
                authRequired: false,
              },
            ],
            layout: {
              ...currentLayout,
              nodes: {
                ...currentLayout.nodes,
                [id]: {
                  x: 100 + (count - 1) * 260,
                  y: 120 + ((count - 1) % 2) * 80,
                  color,
                },
              },
            },
          };

          const validation = validateIR(nextIR);
          set({
            ir: nextIR,
            validationErrors: validation.errors,
            selectedNodeId: id,
          });
          return id;
        },

        updateEntity: (id, patch) => {
          const current = get().ir;
          const nextEntities = current.entities.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          );
          const nextIR: IRDocument = {
            ...current,
            entities: nextEntities,
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        deleteEntity: (id) => {
          const current = get().ir;
          const nextEntities = current.entities.filter((e) => e.id !== id);
          const nextRelations = current.relations.filter(
            (r) => r.fromEntityId !== id && r.toEntityId !== id
          );
          const nextEndpoints = current.endpoints.filter(
            (ep) => ep.entityId !== id
          );

          const nextLayoutNodes = { ...(current.layout?.nodes || {}) };
          delete nextLayoutNodes[id];

          const nextIR: IRDocument = {
            ...current,
            entities: nextEntities,
            relations: nextRelations,
            endpoints: nextEndpoints,
            layout: {
              nodes: nextLayoutNodes,
            },
          };

          const validation = validateIR(nextIR);
          set({
            ir: nextIR,
            validationErrors: validation.errors,
            selectedNodeId:
              get().selectedNodeId === id ? null : get().selectedNodeId,
          });
        },

        addField: (entityId, partialField) => {
          const current = get().ir;
          const fieldId =
            partialField?.id || `fld_${Date.now().toString(36)}`;
          const fieldName =
            partialField?.name || `field_${Date.now().toString(36).slice(-4)}`;

          const newField: Field = {
            id: fieldId,
            name: fieldName,
            type: partialField?.type || "string",
            required: partialField?.required ?? false,
            unique: partialField?.unique ?? false,
            ...(partialField?.default !== undefined
              ? { default: partialField.default }
              : {}),
            ...(partialField?.enumValues
              ? { enumValues: partialField.enumValues }
              : {}),
          };

          const nextEntities = current.entities.map((e) => {
            if (e.id !== entityId) return e;
            return {
              ...e,
              fields: [...e.fields, newField],
            };
          });

          const nextIR: IRDocument = {
            ...current,
            entities: nextEntities,
          };

          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
          return fieldId;
        },

        updateField: (entityId, fieldId, patch) => {
          const current = get().ir;
          const nextEntities = current.entities.map((e) => {
            if (e.id !== entityId) return e;
            return {
              ...e,
              fields: e.fields.map((f) =>
                f.id === fieldId ? { ...f, ...patch } : f
              ),
            };
          });

          const nextIR: IRDocument = {
            ...current,
            entities: nextEntities,
          };

          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        removeField: (entityId, fieldId) => {
          const current = get().ir;
          const nextEntities = current.entities.map((e) => {
            if (e.id !== entityId) return e;
            return {
              ...e,
              fields: e.fields.filter((f) => f.id !== fieldId),
            };
          });

          const nextIR: IRDocument = {
            ...current,
            entities: nextEntities,
          };

          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        addRelation: (relation) => {
          const current = get().ir;
          const nextIR: IRDocument = {
            ...current,
            relations: [...current.relations, relation],
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        updateRelation: (id, patch) => {
          const current = get().ir;
          const nextRelations = current.relations.map((r) =>
            r.id === id ? { ...r, ...patch } : r
          );
          const nextIR: IRDocument = {
            ...current,
            relations: nextRelations,
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        connectRelation: ({ fromEntityId, toEntityId, kind = "one-to-many" }) => {
          const current = get().ir;
          // Avoid duplicate relations
          const existing = current.relations.find(
            (r) => r.fromEntityId === fromEntityId && r.toEntityId === toEntityId
          );
          if (existing) return;

          const toEntity = current.entities.find((e) => e.id === toEntityId);
          const fromEntity = current.entities.find((e) => e.id === fromEntityId);
          if (!toEntity || !fromEntity) return;

          const relId = `rel_${fromEntity.name.toLowerCase()}_${toEntity.name.toLowerCase()}_${Date.now().toString(36)}`;
          
          let foreignKeyField: string | undefined = undefined;
          let nextEntities = current.entities;

          if (kind !== "many-to-many") {
            // Find or create FK field on toEntity
            const targetPk = fromEntity.fields.find((f) => f.isPrimaryKey);
            const fkName = `${fromEntity.name.toLowerCase()}Id`;
            const existingFk = toEntity.fields.find((f) => f.name === fkName);
            if (!existingFk) {
              const newFk: Field = {
                id: `fld_${toEntity.id}_${fkName}`,
                name: fkName,
                type: targetPk?.type || "uuid",
                required: false,
                unique: kind === "one-to-one",
              };
              nextEntities = current.entities.map((e) =>
                e.id === toEntityId
                  ? { ...e, fields: [...e.fields, newFk] }
                  : e
              );
            }
            foreignKeyField = fkName;
          }

          const newRelation: Relation = {
            id: relId,
            fromEntityId,
            toEntityId,
            kind,
            ...(foreignKeyField ? { foreignKeyField, onDelete: "CASCADE" } : {}),
          };

          const nextIR: IRDocument = {
            ...current,
            entities: nextEntities,
            relations: [...current.relations, newRelation],
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        updateEntityColor: (entityId, color) => {
          const current = get().ir;
          const currentLayout = current.layout || { nodes: {} };
          const currentNode = currentLayout.nodes[entityId] || { x: 100, y: 100 };

          const nextIR: IRDocument = {
            ...current,
            layout: {
              ...currentLayout,
              nodes: {
                ...currentLayout.nodes,
                [entityId]: {
                  ...currentNode,
                  color,
                },
              },
            },
          };
          set({ ir: nextIR });
        },

        recomputeLayout: () => {
          const current = get().ir;
          if (current.entities.length === 0) return;
          const computed = computeDagreLayout(
            current.entities,
            current.relations
          );
          const nextIR: IRDocument = {
            ...current,
            layout: computed,
          };
          set({ ir: nextIR });
        },

        deleteRelation: (id) => {
          const current = get().ir;
          const nextIR: IRDocument = {
            ...current,
            relations: current.relations.filter((r) => r.id !== id),
          };
          const validation = validateIR(nextIR);
          set({
            ir: nextIR,
            validationErrors: validation.errors,
            selectedEdgeId:
              get().selectedEdgeId === id ? null : get().selectedEdgeId,
          });
        },

        updateNodePosition: (entityId, pos) => {
          const current = get().ir;
          const currentLayout = current.layout || { nodes: {} };
          const currentNode = currentLayout.nodes[entityId] || {
            color: "lime",
          };

          const nextIR: IRDocument = {
            ...current,
            layout: {
              ...currentLayout,
              nodes: {
                ...currentLayout.nodes,
                [entityId]: {
                  ...currentNode,
                  x: pos.x,
                  y: pos.y,
                },
              },
            },
          };
          // Node position changes do not invalidate semantics, but we preserve IR
          set({ ir: nextIR });
        },

        toggleEndpointOp: (entityId, op) => {
          const current = get().ir;
          const existing = current.endpoints.find((ep) => ep.entityId === entityId);
          let nextEndpoints;
          if (!existing) {
            nextEndpoints = [
              ...current.endpoints,
              { entityId, ops: [op], authRequired: false },
            ];
          } else {
            const hasOp = existing.ops.includes(op);
            const nextOps = hasOp
              ? existing.ops.filter((o) => o !== op)
              : [...existing.ops, op];
            nextEndpoints = current.endpoints.map((ep) =>
              ep.entityId === entityId ? { ...ep, ops: nextOps } : ep
            );
          }

          const nextIR: IRDocument = {
            ...current,
            endpoints: nextEndpoints,
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        setEndpointAuthRequired: (entityId, authRequired) => {
          const current = get().ir;
          const existing = current.endpoints.find((ep) => ep.entityId === entityId);
          let nextEndpoints;
          if (!existing) {
            nextEndpoints = [
              ...current.endpoints,
              {
                entityId,
                ops: ["list", "get", "create", "update", "delete"] as EndpointOp[],
                authRequired,
              },
            ];
          } else {
            nextEndpoints = current.endpoints.map((ep) =>
              ep.entityId === entityId ? { ...ep, authRequired } : ep
            );
          }
          const nextIR: IRDocument = {
            ...current,
            endpoints: nextEndpoints,
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        setAuthRoles: (roles) => {
          const current = get().ir;
          const nextIR: IRDocument = {
            ...current,
            auth: {
              ...current.auth,
              roles,
            },
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        toggleAuthRole: (role) => {
          const current = get().ir;
          const roles = current.auth.roles || [];
          const nextRoles = roles.includes(role)
            ? roles.filter((r) => r !== role)
            : [...roles, role];
          const nextIR: IRDocument = {
            ...current,
            auth: {
              ...current.auth,
              roles: nextRoles,
            },
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        setAuthEnabled: (enabled) => {
          const current = get().ir;
          const nextIR: IRDocument = {
            ...current,
            auth: {
              ...current.auth,
              enabled,
            },
          };
          const validation = validateIR(nextIR);
          set({ ir: nextIR, validationErrors: validation.errors });
        },

        resetProject: () => {
          const empty = createEmptyIR();
          set({
            ir: empty,
            validationErrors: [],
            selectedNodeId: null,
            selectedEdgeId: null,
          });
        },
      }),
      {
        name: "schemaflow-project",
        storage: createJSONStorage(() => safeLocalStorage),
        partialize: (state) => ({
          ir: state.ir,
          theme: state.theme,
          displayMode: state.displayMode,
        }),
      }
    ),
    {
      limit: 100,
      partialize: (state) => ({ ir: state.ir }),
    }
  )
);
