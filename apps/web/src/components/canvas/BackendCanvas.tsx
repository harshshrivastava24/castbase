"use client";

import "@xyflow/react/dist/style.css";
import React, { useCallback, useMemo, useEffect, useState } from "react";
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

  const edgeTypes = useMemo(
    () => ({
      obsidian: ObsidianRelationEdge,
      obsidianEdge: ObsidianRelationEdge,
    }),
    []
  );

  // Helper to build nodes from IR
  const buildNodes = useCallback((): Node[] => {
    return ir.entities.map((entity, idx) => {
      const nodeLayout = ir.layout?.nodes?.[entity.id];
      const position = nodeLayout
        ? { x: nodeLayout.x, y: nodeLayout.y }
        : { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 280 };

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

  // Helper to build edges from IR
  const buildEdges = useCallback((): Edge[] => {
    return ir.relations.map((relation) => {
      const isSelected = selectedEdgeId === relation.id;
      return {
        id: relation.id,
        source: relation.fromEntityId,
        target: relation.toEntityId,
        type: "obsidian",
        data: relation as unknown as Record<string, unknown>,
        selected: isSelected,
      };
    });
  }, [ir.relations, selectedEdgeId]);

  // Local state for 60fps real-time dragging & interactive rendering
  const [nodes, setNodes] = useState<Node[]>(buildNodes);
  const [edges, setEdges] = useState<Edge[]>(buildEdges);

  // Sync nodes when ir.entities, ir.layout, or selectedNodeId changes
  useEffect(() => {
    setNodes(buildNodes());
  }, [buildNodes]);

  // Sync edges when ir.relations or selectedEdgeId changes
  useEffect(() => {
    setEdges(buildEdges());
  }, [buildEdges]);

  // Live node movement on every animation frame during mouse drag
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Sync final coordinates to Zustand ir.layout.nodes[id] on drag release
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      updateNodePosition(node.id, {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      });
    },
    [updateNodePosition]
  );

  // Edge connection handler creating valid relations in store
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
          nodeColor={(_node) => (theme === "dark" ? "#2CA58D" : "#135E54")}
          nodeStrokeColor={theme === "dark" ? "#24353F" : "#D6DFE2"}
          maskColor={
            theme === "dark"
              ? "rgba(12, 19, 23, 0.75)"
              : "rgba(238, 242, 243, 0.75)"
          }
          style={{
            backgroundColor: theme === "dark" ? "#131D23" : "#FFFFFF",
            border: `1px solid ${theme === "dark" ? "#24353F" : "#D6DFE2"}`,
            borderRadius: "8px",
          }}
          pannable
          zoomable
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
