"use client";

import React, { useState } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { useProjectStore, type EntityColor } from "../../store/useProjectStore";

const HEX_COLOR_MAP: Record<EntityColor, string> = {
  lime: "#2CA58D",
  coral: "#C96A5B",
  teal: "#3B8EA5",
  amber: "#C99A5B",
  violet: "#7C72A0",
  sky: "#5E9E7E",
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
  const theme = useProjectStore((s) => s.theme);
  const displayMode = useProjectStore((s) => s.displayMode);
  const selectedEdgeId = useProjectStore((s) => s.selectedEdgeId);
  const setSelectedEdge = useProjectStore((s) => s.setSelectedEdge);

  const relation = ir.relations.find((r) => r.id === id);
  const fromEntityId = relation?.fromEntityId || (data as any)?.fromEntityId;
  const kind = relation?.kind || (data as any)?.kind || "one-to-many";

  const sourceColorName: EntityColor =
    (fromEntityId && (ir.layout?.nodes?.[fromEntityId]?.color as EntityColor)) ||
    "teal";
  const activeColor = HEX_COLOR_MAP[sourceColorName] || "#2CA58D";

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
  const restColor = theme === "dark" ? "#384C57" : "#A0B0B8";
  const strokeColor = isActive ? activeColor : restColor;

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
            stroke={activeColor}
            strokeWidth={6}
            strokeOpacity={0.25}
            strokeLinecap="round"
            className="transition-all duration-200"
            style={{
              filter: `drop-shadow(0 0 4px ${activeColor})`,
            }}
          />
        )}

        {/* Core Crisp 2px BaseEdge Path */}
        <BaseEdge
          path={edgePath}
          style={{
            stroke: strokeColor,
            strokeWidth: 2,
            fill: "none",
            strokeDasharray: isManyToMany || isActive ? "5 4" : undefined,
          }}
          className={isActive ? "obsidian-edge-animated" : undefined}
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
