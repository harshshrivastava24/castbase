"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Shield,
  Key,
  Layers,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  Database,
} from "lucide-react";
import {
  useProjectStore,
  type EntityColor,
  type DisplayMode,
} from "../../store/useProjectStore";
import type { FieldType, Field, RelationKind, OnDeleteAction } from "@schemaflow/ir-schema";

const PALETTE: { key: EntityColor; colorVar: string; label: string }[] = [
  { key: "lime", colorVar: "var(--entity-lime)", label: "Seafoam" },
  { key: "coral", colorVar: "var(--entity-coral)", label: "Terracotta" },
  { key: "teal", colorVar: "var(--entity-teal)", label: "Teal" },
  { key: "amber", colorVar: "var(--entity-amber)", label: "Ochre" },
  { key: "violet", colorVar: "var(--entity-violet)", label: "Iris" },
  { key: "sky", colorVar: "var(--entity-sky)", label: "Sage" },
];

const FIELD_TYPES: { type: FieldType; label: string; simpleLabel: string }[] = [
  { type: "uuid", label: "UUID (Primary Key)", simpleLabel: "Identifier" },
  { type: "string", label: "String / Varchar", simpleLabel: "Text" },
  { type: "int", label: "Integer (32/64)", simpleLabel: "Number (Integer)" },
  { type: "decimal", label: "Decimal / Numeric", simpleLabel: "Number (Decimal)" },
  { type: "bool", label: "Boolean (True/False)", simpleLabel: "Yes / No" },
  { type: "timestamp", label: "Timestamp (ISO 8601)", simpleLabel: "Date & Time" },
  { type: "enum", label: "Enum (Single Choice)", simpleLabel: "Choice (Dropdown)" },
  { type: "json", label: "JSON / Document Object", simpleLabel: "Custom Data (JSON)" },
];

export const RightInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"fields" | "api" | "rules">("fields");
  const [newRelTargetId, setNewRelTargetId] = useState<string>("");
  const [newRelKind, setNewRelKind] = useState<RelationKind>("one-to-many");

  const ir = useProjectStore((s) => s.ir);
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode);
  const isInspectorOpen = useProjectStore((s) => s.isInspectorOpen);
  const setIsInspectorOpen = useProjectStore((s) => s.setIsInspectorOpen);

  const displayMode = useProjectStore((s) => s.displayMode);
  const setDisplayMode = useProjectStore((s) => s.setDisplayMode);

  const updateEntity = useProjectStore((s) => s.updateEntity);
  const deleteEntity = useProjectStore((s) => s.deleteEntity);
  const addField = useProjectStore((s) => s.addField);
  const updateField = useProjectStore((s) => s.updateField);
  const removeField = useProjectStore((s) => s.removeField);
  const updateEntityColor = useProjectStore((s) => s.updateEntityColor);

  const toggleEndpointOp = useProjectStore((s) => s.toggleEndpointOp);
  const setEndpointAuthRequired = useProjectStore(
    (s) => s.setEndpointAuthRequired
  );

  const connectRelation = useProjectStore((s) => s.connectRelation);
  const deleteRelation = useProjectStore((s) => s.deleteRelation);
  const updateRelation = useProjectStore((s) => s.updateRelation);

  const setAuthEnabled = useProjectStore((s) => s.setAuthEnabled);
  const toggleAuthRole = useProjectStore((s) => s.toggleAuthRole);

  const selectedEntity = ir.entities.find((e) => e.id === selectedNodeId);

  if (!isInspectorOpen || !selectedEntity) {
    return null;
  }

  const currentColor: EntityColor =
    (ir.layout?.nodes?.[selectedEntity.id]?.color as EntityColor) || "lime";

  const endpointConfig = ir.endpoints.find(
    (ep) => ep.entityId === selectedEntity.id
  ) || {
    entityId: selectedEntity.id,
    ops: ["list", "get", "create", "update", "delete"],
    authRequired: false,
  };

  const entityRelations = ir.relations.filter(
    (r) =>
      r.fromEntityId === selectedEntity.id ||
      r.toEntityId === selectedEntity.id
  );

  const availableTargets = ir.entities.filter(
    (e) => e.id !== selectedEntity.id
  );

  const handleAddRelation = () => {
    if (!newRelTargetId) return;
    connectRelation({
      fromEntityId: selectedEntity.id,
      toEntityId: newRelTargetId,
      kind: newRelKind,
    });
    setNewRelTargetId("");
  };

  return (
    <aside className="w-[340px] bg-inspector border-l border-border-subtle flex flex-col justify-between select-none z-30 shrink-0 h-full overflow-hidden shadow-2xl">
      {/* 1. Top Header */}
      <div className="border-b border-border-subtle bg-surface-elevated/80 flex flex-col">
        {/* Mode & Close toolbar */}
        <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-txt-muted">MODE:</span>
            <div className="flex bg-canvas border border-border-subtle p-0.5 rounded">
              <button
                type="button"
                onClick={() => setDisplayMode("simple")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  displayMode === "simple"
                    ? "bg-surface text-txt-primary font-bold shadow-sm"
                    : "text-txt-secondary hover:text-txt-primary"
                }`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("advanced")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  displayMode === "advanced"
                    ? "bg-surface text-txt-primary font-bold shadow-sm"
                    : "text-txt-secondary hover:text-txt-primary"
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedNode(null);
            }}
            className="p-1 rounded hover:bg-surface text-txt-muted hover:text-txt-primary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected Entity Identity Bar */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: `var(--entity-${currentColor})`,
                }}
              />
              <h2 className="font-semibold text-sm text-txt-primary tracking-tight">
                {selectedEntity.name}
              </h2>
            </div>
            <p className="font-mono text-[11px] text-txt-secondary mt-0.5">
              dbo.{selectedEntity.tableName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-canvas border border-border-subtle text-txt-muted font-bold">
              {ir.project.database}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-accent-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              <span>SYNCED</span>
            </div>
          </div>
        </div>

        {/* Underline Tabs */}
        <div className="flex items-center border-t border-border-subtle px-4 text-xs font-medium">
          {(["fields", "api", "rules"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-3 border-b-2 capitalize transition-colors ${
                  isActive
                    ? "border-accent-primary text-txt-primary font-semibold"
                    : "border-transparent text-txt-secondary hover:text-txt-primary"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-xs">
        {/* TAB 1: FIELDS */}
        {activeTab === "fields" && (
          <div className="flex flex-col gap-4">
            {/* Entity Name & Color Row */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono uppercase text-txt-secondary">
                Entity Configuration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={selectedEntity.name}
                  onChange={(e) =>
                    updateEntity(selectedEntity.id, { name: e.target.value })
                  }
                  className="px-2.5 py-1.5 bg-surface border border-border-subtle rounded-md text-xs font-semibold text-txt-primary focus:border-border-focus outline-none"
                  placeholder="Entity Name"
                />
                <input
                  type="text"
                  value={selectedEntity.tableName}
                  onChange={(e) =>
                    updateEntity(selectedEntity.id, { tableName: e.target.value })
                  }
                  className="px-2.5 py-1.5 bg-surface border border-border-subtle rounded-md text-xs font-mono text-txt-secondary focus:border-border-focus outline-none"
                  placeholder="Table Name"
                />
              </div>

              {/* Color Swatch Selector */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-txt-muted mr-1">
                  Color:
                </span>
                {PALETTE.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    title={p.label}
                    onClick={() => updateEntityColor(selectedEntity.id, p.key)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-transform ${
                      currentColor === p.key
                        ? "ring-2 ring-accent-primary scale-110 border-transparent"
                        : "border-border-subtle hover:scale-105"
                    }`}
                    style={{ backgroundColor: p.colorVar }}
                  >
                    {currentColor === p.key && (
                      <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Flat Un-nested Columns List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-txt-secondary">
                  Columns ({selectedEntity.fields.length})
                </label>
                <span className="text-[10px] font-mono text-txt-muted">
                  HAIRLINE DIVIDERS
                </span>
              </div>

              <div className="border border-border-subtle rounded-md bg-surface overflow-hidden">
                {selectedEntity.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className={`p-3 flex flex-col gap-2 ${
                      idx > 0 ? "border-t border-border-subtle" : ""
                    }`}
                  >
                    {/* Row 1: Name & Type Selector */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={field.name}
                        disabled={field.isPrimaryKey}
                        onChange={(e) =>
                          updateField(selectedEntity.id, field.id, {
                            name: e.target.value,
                          })
                        }
                        className={`flex-1 px-2 py-1 bg-canvas border border-border-subtle rounded text-xs text-txt-primary focus:border-border-focus outline-none ${
                          field.isPrimaryKey ? "font-semibold" : "font-mono"
                        }`}
                      />

                      <select
                        value={field.type}
                        disabled={field.isPrimaryKey}
                        onChange={(e) =>
                          updateField(selectedEntity.id, field.id, {
                            type: e.target.value as FieldType,
                          })
                        }
                        className="w-28 px-1.5 py-1 bg-canvas border border-border-subtle rounded font-mono text-[10px] text-txt-secondary focus:border-border-focus outline-none"
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft.type} value={ft.type}>
                            {displayMode === "simple" ? ft.simpleLabel : ft.type}
                          </option>
                        ))}
                      </select>

                      {!field.isPrimaryKey && (
                        <button
                          type="button"
                          onClick={() =>
                            removeField(selectedEntity.id, field.id)
                          }
                          title="Remove column"
                          className="p-1 rounded text-txt-muted hover:text-accent-danger hover:bg-surface-elevated transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Row 2: Constraints (Required, Unique) & Default */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-txt-secondary">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            disabled={field.isPrimaryKey}
                            onChange={(e) =>
                              updateField(selectedEntity.id, field.id, {
                                required: e.target.checked,
                              })
                            }
                            className="rounded border-border-subtle text-accent-primary"
                          />
                          <span>Required</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.unique}
                            disabled={field.isPrimaryKey}
                            onChange={(e) =>
                              updateField(selectedEntity.id, field.id, {
                                unique: e.target.checked,
                              })
                            }
                            className="rounded border-border-subtle text-accent-primary"
                          />
                          <span>Unique</span>
                        </label>
                      </div>

                      {field.isPrimaryKey && (
                        <span className="text-[10px] text-accent-secondary font-bold">
                          PRIMARY KEY
                        </span>
                      )}

                      {!field.isPrimaryKey && (
                        <input
                          type="text"
                          value={
                            typeof field.default === "boolean"
                              ? String(field.default)
                              : field.default ?? ""
                          }
                          placeholder="default: null"
                          onChange={(e) =>
                            updateField(selectedEntity.id, field.id, {
                              default: e.target.value || undefined,
                            })
                          }
                          className="w-24 px-1.5 py-0.5 bg-canvas border border-border-subtle rounded text-[10px] font-mono text-txt-muted focus:text-txt-primary outline-none"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashed + Add Column button */}
              <button
                type="button"
                onClick={() => addField(selectedEntity.id)}
                className="w-full py-2 border border-dashed border-border-subtle hover:border-accent-primary rounded-md text-xs font-mono text-txt-secondary hover:text-accent-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {displayMode === "simple" ? "+ Add Field" : "+ Add Column"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: API & ENDPOINTS */}
        {activeTab === "api" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase text-txt-secondary">
                REST CRUD Endpoints
              </label>
              <p className="text-[11px] text-txt-muted leading-relaxed">
                Toggle auto-generated Express 5 endpoints and JWT security lock for {selectedEntity.name}.
              </p>
            </div>

            {/* Auth Required Lock Switch */}
            <div className="p-3 bg-surface border border-border-subtle rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                {endpointConfig.authRequired ? (
                  <Lock className="w-4 h-4 text-accent-primary" />
                ) : (
                  <Unlock className="w-4 h-4 text-txt-muted" />
                )}
                <div>
                  <div className="font-semibold text-txt-primary text-xs">
                    Require JWT Authentication
                  </div>
                  <div className="text-[10px] text-txt-muted">
                    Requires Authorization Bearer token header
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={endpointConfig.authRequired}
                onChange={(e) =>
                  setEndpointAuthRequired(selectedEntity.id, e.target.checked)
                }
                className="rounded border-border-subtle text-accent-primary cursor-pointer w-4 h-4"
              />
            </div>

            {/* Route Operations */}
            <div className="border border-border-subtle rounded-md bg-surface divide-y divide-border-subtle font-mono text-xs">
              {(
                [
                  { op: "list", method: "GET", path: `/api/${selectedEntity.tableName}` },
                  { op: "get", method: "GET", path: `/api/${selectedEntity.tableName}/:id` },
                  { op: "create", method: "POST", path: `/api/${selectedEntity.tableName}` },
                  { op: "update", method: "PATCH", path: `/api/${selectedEntity.tableName}/:id` },
                  { op: "delete", method: "DELETE", path: `/api/${selectedEntity.tableName}/:id` },
                ] as const
              ).map((endpoint) => {
                const isEnabled = endpointConfig.ops.includes(endpoint.op);
                return (
                  <div
                    key={endpoint.op}
                    className="p-2.5 flex items-center justify-between hover:bg-surface-elevated/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          endpoint.method === "GET"
                            ? "bg-entity-teal/15 text-entity-teal"
                            : endpoint.method === "POST"
                            ? "bg-accent-primary/15 text-accent-primary"
                            : endpoint.method === "PATCH"
                            ? "bg-entity-amber/15 text-entity-amber"
                            : "bg-accent-danger/15 text-accent-danger"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="text-[11px] text-txt-primary">
                        {endpoint.path}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() =>
                        toggleEndpointOp(selectedEntity.id, endpoint.op)
                      }
                      className="rounded border-border-subtle text-accent-primary cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RULES / RELATIONS & AUTH */}
        {activeTab === "rules" && (
          <div className="flex flex-col gap-5">
            {/* Relations Section */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono uppercase text-txt-secondary">
                Entity Relations ({entityRelations.length})
              </label>

              {entityRelations.length === 0 ? (
                <div className="p-3 bg-surface border border-border-subtle rounded-md text-[11px] text-txt-muted text-center">
                  No relations connected to {selectedEntity.name}.
                </div>
              ) : (
                <div className="border border-border-subtle rounded-md bg-surface divide-y divide-border-subtle">
                  {entityRelations.map((rel) => {
                    const isSource = rel.fromEntityId === selectedEntity.id;
                    const otherEntityId = isSource ? rel.toEntityId : rel.fromEntityId;
                    const otherEntity = ir.entities.find((e) => e.id === otherEntityId);

                    return (
                      <div key={rel.id} className="p-2.5 flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-txt-primary flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-txt-muted">
                              {isSource ? "→" : "←"}
                            </span>
                            <span>{otherEntity?.name || "Unknown"}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteRelation(rel.id)}
                            className="p-1 rounded text-txt-muted hover:text-accent-danger hover:bg-surface-elevated transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <select
                            value={rel.kind}
                            onChange={(e) =>
                              updateRelation(rel.id, {
                                kind: e.target.value as RelationKind,
                              })
                            }
                            className="px-1.5 py-0.5 bg-canvas border border-border-subtle rounded text-txt-secondary outline-none text-[10px]"
                          >
                            <option value="one-to-one">1 : 1 (One-to-One)</option>
                            <option value="one-to-many">1 : N (One-to-Many)</option>
                            <option value="many-to-many">N : M (Many-to-Many)</option>
                          </select>

                          <select
                            value={rel.onDelete || "CASCADE"}
                            onChange={(e) =>
                              updateRelation(rel.id, {
                                onDelete: e.target.value as OnDeleteAction,
                              })
                            }
                            className="px-1.5 py-0.5 bg-canvas border border-border-subtle rounded text-txt-secondary outline-none text-[10px]"
                          >
                            <option value="CASCADE">ON DELETE CASCADE</option>
                            <option value="SET_NULL">ON DELETE SET NULL</option>
                            <option value="RESTRICT">ON DELETE RESTRICT</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Relation Inline Form */}
              {availableTargets.length > 0 && (
                <div className="p-2.5 bg-surface border border-border-subtle rounded-md flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase text-txt-muted">
                    Connect New Relation:
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={newRelTargetId}
                      onChange={(e) => setNewRelTargetId(e.target.value)}
                      className="flex-1 px-2 py-1 bg-canvas border border-border-subtle rounded text-xs text-txt-primary outline-none"
                    >
                      <option value="">Select Target Entity...</option>
                      {availableTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!newRelTargetId}
                      onClick={handleAddRelation}
                      className={`px-2.5 py-1 rounded bg-accent-primary text-accent-primary-fg font-mono text-xs font-bold transition-all ${
                        !newRelTargetId ? "opacity-50" : "hover:opacity-90"
                      }`}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Global Project Auth Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-txt-secondary">
                  Project JWT Authentication
                </label>
                <input
                  type="checkbox"
                  checked={ir.auth.enabled}
                  onChange={(e) => setAuthEnabled(e.target.checked)}
                  className="rounded border-border-subtle text-accent-primary cursor-pointer w-4 h-4"
                />
              </div>

              {ir.auth.enabled && (
                <div className="p-3 bg-surface border border-border-subtle rounded-md flex flex-col gap-2">
                  <div className="text-[11px] text-txt-muted">
                    Allowed user roles encoded in JWT token:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["ADMIN", "AUTHOR", "USER", "MEMBER"].map((role) => {
                      const hasRole = (ir.auth.roles || []).includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleAuthRole(role)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                            hasRole
                              ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/40"
                              : "bg-canvas text-txt-muted border border-border-subtle hover:text-txt-primary"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel Footer: Drop Table Button */}
      <div className="p-4 border-t border-border-subtle bg-surface-elevated flex items-center justify-between">
        <span className="font-mono text-[11px] text-txt-muted">
          Table: dbo.{selectedEntity.tableName}
        </span>
        <button
          type="button"
          onClick={() => {
            deleteEntity(selectedEntity.id);
            setSelectedNode(null);
          }}
          className="px-2.5 py-1 rounded bg-accent-danger/10 hover:bg-accent-danger/20 border border-accent-danger/30 text-accent-danger font-mono text-[11px] font-semibold transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3 h-3" />
          <span>Drop table</span>
        </button>
      </div>
    </aside>
  );
};
