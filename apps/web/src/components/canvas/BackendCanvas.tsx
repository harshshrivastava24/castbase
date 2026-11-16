"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  type OnNodeDrag,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from "@xyflow/react";
import { EntityNode } from "./EntityNode";
import { ObsidianRelationEdge } from "./ObsidianRelationEdge";
import { BottomDock } from "./BottomDock";
import { useProjectStore, type EntityColor } from "../../store/useProjectStore";

const nodeTypes = {
  entityNode: EntityNode,
};

const edgeTypes = {
  obsidianEdge: ObsidianRelationEdge,
};

const COLOR_MAP: Record<EntityColor, string> = {
  lime: "#2CA58D",
  coral: "#C96A5B",
  teal: "#3B8EA5",
  amber: "#C99A5B",
  violet: "#7C72A0",
  sky: "#5E9E7E",
};

export const BackendCanvasInner: React.FC = () => {
  const ir = useProjectStore((s) => s.ir);
  const theme = useProjectStore((s) => s.theme);
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const selectedEdgeId = useProjectStore((s) => s.selectedEdgeId);
  const setSelectedNode = useProjectStore((s) => s.setSelectedNode);
  const setSelectedEdge = useProjectStore((s) => s.setSelectedEdge);
  const updateNodePosition = useProjectStore((s) => s.updateNodePosition);
  const connectRelation = useProjectStore((s) => s.connectRelation);
  const deleteEntity = useProjectStore((s) => s.deleteEntity);
  const deleteRelation = useProjectStore((s) => s.deleteRelation);

  // Transform IR entities into React Flow nodes
  const nodes: Node[] = useMemo(() => {
    return ir.entities.map((entity, idx) => {
      const nodeLayout = ir.layout?.nodes?.[entity.id];
      const position = nodeLayout
        ? { x: nodeLayout.x, y: nodeLayout.y }
        : { x: 100 + (idx % 3) * 300, y: 100 + Math.floor(idx / 3) * 260 };

      return {
        id: entity.id,
        type: "entityNode",
        position,
        data: {
          entity,
          color: nodeLayout?.color || "lime",
        },
        selected: selectedNodeId === entity.id,
      };
    });
  }, [ir.entities, ir.layout, selectedNodeId]);

  // Transform IR relations into React Flow edges
  const edges: Edge[] = useMemo(() => {
    return ir.relations.map((relation) => {
      const isSelected = selectedEdgeId === relation.id;
      return {
        id: relation.id,
        type: "obsidianEdge",
        source: relation.fromEntityId,
        target: relation.toEntityId,
        sourceHandle: relation.foreignKeyField
          ? `source-${relation.foreignKeyField}`
          : undefined,
        targetHandle: relation.foreignKeyField
          ? `target-${relation.foreignKeyField}`
          : undefined,
        data: {
          fromEntityId: relation.fromEntityId,
          toEntityId: relation.toEntityId,
          kind: relation.kind,
        },
        selected: isSelected,
      };
    });
  }, [ir.relations, selectedEdgeId]);

  // Sync node drag completion to ir.layout.nodes[id] (FR-14)
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      updateNodePosition(node.id, {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      });
    },
    [updateNodePosition]
  );

  // Edge connection handler
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return; // Prevent self-connections without explicit intent

      connectRelation({
        fromEntityId: connection.source,
        toEntityId: connection.target,
        kind: "one-to-many",
      });
    },
    [connectRelation]
  );

  // Keyboard shortcuts (Delete, Undo, Redo, Save) (FR-06)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or select
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT";
      if (isInput) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          deleteEntity(selectedNodeId);
          setSelectedNode(null);
        } else if (selectedEdgeId) {
          deleteRelation(selectedEdgeId);
          setSelectedEdge(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useProjectStore.temporal?.getState()?.redo();
        } else {
          useProjectStore.temporal?.getState()?.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useProjectStore.temporal?.getState()?.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Guest mode saves to localStorage automatically
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNodeId,
    selectedEdgeId,
    deleteEntity,
    deleteRelation,
    setSelectedNode,
    setSelectedEdge,
  ]);

  return (
    <div className="w-full h-full relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={(_e, node) => setSelectedNode(node.id)}
        onEdgeClick={(_e, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={theme === "dark" ? "#1B2830" : "#CBD5D8"}
        />

        <MiniMap
          nodeColor={(n) => {
            const color = (n.data as any)?.color as EntityColor;
            return COLOR_MAP[color] || "#2CA58D";
          }}
          nodeStrokeWidth={2}
          maskColor={theme === "dark" ? "rgba(12, 19, 23, 0.75)" : "rgba(238, 242, 243, 0.75)"}
          className="!bottom-6 !right-6"
        />

        <BottomDock />
      </ReactFlow>
    </div>
  );
};

export const BackendCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <BackendCanvasInner />
    </ReactFlowProvider>
  );
};
