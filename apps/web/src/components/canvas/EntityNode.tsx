"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertCircle, Plus, Key, Link2, Sparkles, MoreHorizontal } from "lucide-react";
import { useProjectStore, type EntityColor } from "../../store/useProjectStore";
import type { Entity, Field, Relation } from "@schemaflow/ir-schema";

export interface EntityNodeData {
  entity: Entity;
  color?: EntityColor;
  relations?: Relation[];
}

const COLOR_MAP: Record<EntityColor, string> = {
  lime: "var(--entity-lime)",
  coral: "var(--entity-coral)",
  teal: "var(--entity-teal)",
  amber: "var(--entity-amber)",
  violet: "var(--entity-violet)",
  sky: "var(--entity-sky)",
};

export const EntityNode = memo(function EntityNode({
  id,
  selected,
}: NodeProps) {
  const ir = useProjectStore((s) => s.ir);
  const displayMode = useProjectStore((s) => s.displayMode);
  const validationErrors = useProjectStore((s) => s.validationErrors);
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode);
  const addField = useProjectStore((s) => s.addField);

  const entity = ir.entities.find((e) => e.id === id);
  if (!entity) return null;

  const nodeColor: EntityColor =
    (ir.layout?.nodes?.[id]?.color as EntityColor) || "lime";
  const accentColor = COLOR_MAP[nodeColor] || COLOR_MAP.lime;

  const isSelected = selected || selectedNodeId === id;

  // Validation errors pointing to this entity
  const entityErrors = validationErrors.filter(
    (err) => err.entityId === id
  );
  const hasErrors = entityErrors.length > 0;

  // Outgoing and incoming relations for this entity
  const outgoingRelations = ir.relations.filter((r) => r.fromEntityId === id);
  const incomingRelations = ir.relations.filter((r) => r.toEntityId === id);

  const formatSimpleType = (field: Field): string => {
    if (field.isPrimaryKey) return "Identifier";
    const fkRel = incomingRelations.find(
      (r) => r.foreignKeyField === field.name
    );
    if (fkRel) {
      const targetEntity = ir.entities.find((e) => e.id === fkRel.fromEntityId);
      return `Link to ${targetEntity?.name || "Record"}`;
    }
    switch (field.type) {
      case "string":
        return "Text";
      case "int":
      case "decimal":
        return "Number";
      case "bool":
        return "Yes / No";
      case "timestamp":
        return "Date & Time";
      case "enum":
        return "Choice";
      case "json":
        return "Custom Data";
      case "uuid":
        return "UUID";
      default:
        return "Text";
    }
  };

  const formatAdvancedType = (field: Field): string => {
    switch (field.type) {
      case "uuid":
        return "UUID";
      case "string":
        return "String(255)";
      case "int":
        return "Int";
      case "decimal":
        return "Numeric(10,2)";
      case "bool":
        return "Boolean";
      case "timestamp":
        return "Timestamp";
      case "enum":
        return "Enum";
      case "json":
        return "Jsonb";
      default:
        return String((field as any).type || "UNKNOWN").toUpperCase();
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNode(id);
      }}
      className={`w-[260px] bg-surface rounded-lg border transition-all text-xs select-none relative overflow-hidden group ${
        isSelected
          ? "border-accent-primary ring-1 ring-accent-primary shadow-selected"
          : hasErrors
          ? "border-accent-danger/70 shadow-node"
          : "border-border-subtle hover:border-border-focus shadow-node"
      }`}
    >
      {/* 3px Top Colored Accent Bar */}
      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Node Header */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-border-subtle bg-surface-elevated/60 relative">
        {/* Table-level Target Handle (Left) */}
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          isConnectable={true}
          className="!left-[-5px] !w-2.5 !h-2.5 !bg-[#2CA58D] !border-2 !border-[#0C1317] !z-20 cursor-crosshair transition-transform hover:scale-125"
          style={{ pointerEvents: "all" }}
        />

        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span className="font-semibold text-txt-primary truncate text-xs tracking-tight">
            {entity.name}
          </span>
          {displayMode === "advanced" && (
            <span className="font-mono text-[10px] text-txt-muted truncate">
              {entity.tableName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasErrors && (
            <span
              title={entityErrors.map((e) => e.message).join("\n")}
              className="w-4 h-4 rounded-full bg-accent-danger/15 text-accent-danger flex items-center justify-center cursor-pointer"
            >
              <AlertCircle className="w-3 h-3" />
            </span>
          )}

          {isSelected && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
              ACTIVE
            </span>
          )}
        </div>

        {/* Table-level Source Handle (Right) */}
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          isConnectable={true}
          className="!right-[-5px] !w-2.5 !h-2.5 !bg-[#2CA58D] !border-2 !border-[#0C1317] !z-20 cursor-crosshair transition-transform hover:scale-125"
          style={{ pointerEvents: "all" }}
        />
      </div>

      {/* Field Rows — Flat horizontal hairlines (no nested boxes) */}
      <div className="flex flex-col bg-surface">
        {entity.fields.map((field, idx) => {
          const isFk = incomingRelations.some(
            (r) => r.foreignKeyField === field.name
          );
          const fieldErrors = entityErrors.filter(
            (err) => err.fieldId === field.id
          );

          return (
            <div
              key={field.id}
              className={`px-3 py-1.5 flex items-center justify-between text-[11px] relative hover:bg-surface-elevated/50 transition-colors ${
                idx > 0 ? "border-t border-border-subtle" : ""
              }`}
            >
              {/* Left Handle for Incoming Relations */}
              <Handle
                type="target"
                position={Position.Left}
                id={`target-${field.name}`}
                isConnectable={true}
                className="!left-[-5px] !w-2.5 !h-2.5 !bg-[#2CA58D] !border-2 !border-[#0C1317] !z-20 cursor-crosshair transition-transform hover:scale-125"
                style={{ pointerEvents: "all" }}
              />

              {/* Left: Metadata Badges & Field Name */}
              <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                {displayMode === "advanced" ? (
                  <>
                    {field.isPrimaryKey && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30">
                        PK
                      </span>
                    )}
                    {isFk && !field.isPrimaryKey && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-entity-teal/20 text-entity-teal border border-entity-teal/30">
                        FK
                      </span>
                    )}
                    {field.unique && !field.isPrimaryKey && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-surface-elevated text-txt-muted border border-border-subtle">
                        UQ
                      </span>
                    )}
                  </>
                ) : (
                  field.isPrimaryKey && (
                    <Key className="w-2.5 h-2.5 text-accent-secondary shrink-0" />
                  )
                )}

                <span
                  className={`truncate ${
                    field.isPrimaryKey
                      ? "font-semibold text-txt-primary"
                      : "text-txt-primary"
                  } ${displayMode === "advanced" ? "font-mono" : "font-sans"}`}
                >
                  {field.name}
                </span>

                {field.required && displayMode === "advanced" && !field.isPrimaryKey && (
                  <span className="text-accent-danger font-mono text-[9px]">*</span>
                )}
              </div>

              {/* Right: Data Type pill/tag */}
              <div className="shrink-0 flex items-center gap-1">
                {fieldErrors.length > 0 && (
                  <span
                    title={fieldErrors.map((e) => e.message).join("\n")}
                    className="w-1.5 h-1.5 rounded-full bg-accent-danger animate-pulse"
                  />
                )}
                <span
                  className={`text-[10px] font-mono ${
                    field.isPrimaryKey
                      ? "text-accent-secondary"
                      : isFk
                      ? "text-entity-teal"
                      : "text-txt-secondary"
                  }`}
                >
                  {displayMode === "simple"
                    ? formatSimpleType(field)
                    : formatAdvancedType(field)}
                </span>
              </div>

              {/* Right Handle for Outgoing Relations */}
              <Handle
                type="source"
                position={Position.Right}
                id={`source-${field.name}`}
                isConnectable={true}
                className="!right-[-5px] !w-2.5 !h-2.5 !bg-[#2CA58D] !border-2 !border-[#0C1317] !z-20 cursor-crosshair transition-transform hover:scale-125"
                style={{ pointerEvents: "all" }}
              />
            </div>
          );
        })}
      </div>

      {/* Node Footer: Add Field Shortcut */}
      <div className="px-3 py-1.5 bg-surface-elevated/40 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addField(id);
          }}
          className="text-txt-muted hover:text-accent-primary flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>{displayMode === "simple" ? "Add field" : "Add column"}</span>
        </button>
        <span className="text-[10px] text-txt-muted">
          {entity.fields.length} {entity.fields.length === 1 ? "col" : "cols"}
        </span>
      </div>
    </div>
  );
});
