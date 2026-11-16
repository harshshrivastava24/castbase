"use client";

import React, { useState } from "react";
import {
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { useProjectStore, type EntityColor } from "../../store/useProjectStore";

const COLOR_MAP: Record<EntityColor, string> = {
  lime: "var(--entity-lime)",
  coral: "var(--entity-coral)",
  teal: "var(--entity-teal)",
  amber: "var(--entity-amber)",
  violet: "var(--entity-violet)",
  sky: "var(--entity-sky)",
};

export const ObsidianRelationEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const ir = useProjectStore((s) => s.ir);
  const displayMode = useProjectStore((s) => s.displayMode);
  const selectedEdgeId = useProjectStore((s) => s.selectedEdgeId);
  const setSelectedEdge = useProjectStore((s) => s.setSelectedEdge);

  const relation = ir.relations.find((r) => r.id === id);
  const fromEntityId = relation?.fromEntityId || (data as any)?.fromEntityId;
  const kind = relation?.kind || (data as any)?.kind || "one-to-many";

  const sourceColorName: EntityColor =
    (fromEntityId && (ir.layout?.nodes?.[fromEntityId]?.color as EntityColor)) ||
    "teal";
  const accentColor = COLOR_MAP[sourceColorName] || "var(--accent-primary)";

  const isSelected = selected || selectedEdgeId === id;
  const isActive = isSelected || isHovered;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isManyToMany = kind === "many-to-many";

  // Label text formatted for Simple vs Advanced mode
  const getBadgeLabel = () => {
    if (displayMode === "simple") {
      switch (kind) {
        case "one-to-one":
          return "HAS ONE";
        case "many-to-many":
          return "MANY TO MANY";
        case "one-to-many":
        default:
          return "HAS MANY";
      }
    } else {
      switch (kind) {
        case "one-to-one":
          return "1 : 1";
        case "many-to-many":
          return "N : M";
        case "one-to-many":
        default:
          return "1 : N";
      }
    }
  };

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setSelectedEdge(id)}
        className="cursor-pointer"
      >
        {/* Invisible wider hit area for easy mouse clicking */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
        />

        {/* GPU Protection Rule: Outer Glow Layer rendered ONLY when hovered or selected */}
        {isActive && (
          <path
            d={edgePath}
            fill="none"
            stroke={accentColor}
            strokeWidth={6}
            strokeOpacity={0.25}
            strokeLinecap="round"
            className="transition-all duration-200"
            style={{
              filter: `drop-shadow(0 0 3px ${accentColor})`,
            }}
          />
        )}

        {/* Core Crisp 1.5px Edge Path */}
        <path
          d={edgePath}
          fill="none"
          stroke={isActive ? accentColor : "var(--border-subtle)"}
          strokeWidth={1.5}
          strokeDasharray={isManyToMany || isActive ? "5 4" : undefined}
          className={`transition-colors duration-200 ${
            isActive ? "obsidian-edge-animated" : ""
          }`}
        />
      </g>

      {/* Centered Pill Badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdge(id);
          }}
          className={`px-2 py-0.5 rounded-[6px] text-[9px] font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer select-none ${
            isActive
              ? "bg-surface-elevated text-txt-primary border-accent-primary shadow-sm scale-105"
              : "bg-surface text-txt-muted border-border-subtle hover:text-txt-secondary hover:border-border-focus"
          }`}
        >
          {getBadgeLabel()}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
