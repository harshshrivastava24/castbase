"use client";

import React from "react";
import {
  Plus,
  Shield,
  LayoutGrid,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useProjectStore } from "../../store/useProjectStore";

export const BottomDock: React.FC = () => {
  const addEntity = useProjectStore((s) => s.addEntity);
  const recomputeLayout = useProjectStore((s) => s.recomputeLayout);
  const auth = useProjectStore((s) => s.ir.auth);
  const setAuthEnabled = useProjectStore((s) => s.setAuthEnabled);

  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  const handleUndo = () => {
    useProjectStore.temporal?.getState()?.undo();
  };

  const handleRedo = () => {
    useProjectStore.temporal?.getState()?.redo();
  };

  const handleFit = () => {
    fitView({ padding: 0.2, duration: 400 });
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface border border-border-subtle shadow-node select-none backdrop-blur-md">
      {/* Primary Add Actions */}
      <button
        type="button"
        onClick={() => addEntity()}
        className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-surface-elevated hover:bg-border-subtle border border-border-subtle text-xs font-semibold text-txt-primary hover:text-accent-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Table</span>
      </button>

      <button
        type="button"
        onClick={() => setAuthEnabled(!auth.enabled)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-pill border text-xs font-medium transition-colors ${
          auth.enabled
            ? "bg-accent-primary/15 border-accent-primary/40 text-accent-primary font-semibold"
            : "bg-surface-elevated hover:bg-border-subtle border-border-subtle text-txt-secondary hover:text-txt-primary"
        }`}
      >
        <Shield className="w-3.5 h-3.5" />
        <span>{auth.enabled ? "Auth (Active)" : "+ Auth"}</span>
      </button>

      <button
        type="button"
        onClick={recomputeLayout}
        title="Auto-organize layout (Dagre LR)"
        className="p-1.5 rounded-full hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-border-subtle mx-0.5" />

      {/* History Controls */}
      <button
        type="button"
        onClick={handleUndo}
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded-full hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleRedo}
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded-full hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </button>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-border-subtle mx-0.5" />

      {/* Zoom Controls */}
      <button
        type="button"
        onClick={() => zoomOut({ duration: 200 })}
        title="Zoom Out"
        className="p-1.5 rounded-full hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleFit}
        title="Fit View"
        className="p-1.5 rounded-full hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => zoomIn({ duration: 200 })}
        title="Zoom In"
        className="p-1.5 rounded-full hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
