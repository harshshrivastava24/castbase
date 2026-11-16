"use client";

import React, { useState } from "react";
import {
  Layers,
  Database,
  FileCode,
  LayoutGrid,
  Settings,
  HelpCircle,
  Plus,
  Route,
  MousePointer,
  Hand,
  GitFork,
  Grid,
} from "lucide-react";
import { useProjectStore } from "../../store/useProjectStore";

export const LeftRail: React.FC = () => {
  const [activeTool, setActiveTool] = useState<"select" | "pan">("select");
  const activeTab = useProjectStore((s) => s.activeTab);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);
  const addEntity = useProjectStore((s) => s.addEntity);
  const recomputeLayout = useProjectStore((s) => s.recomputeLayout);
  const setIsImportModalOpen = useProjectStore(
    (s) => s.setIsImportModalOpen
  );
  const toggleInspector = useProjectStore((s) => s.toggleInspector);

  return (
    <aside className="w-[52px] bg-surface border-r border-border-subtle flex flex-col items-center justify-between py-3 select-none z-30 shrink-0">
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Add Entity Quick Trigger */}
        <button
          onClick={() => addEntity()}
          title="Add Table / Entity (+)"
          className="w-8 h-8 rounded-md bg-surface-elevated hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-txt-primary hover:text-accent-primary transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="w-6 h-[1px] bg-border-subtle my-1" />

        {/* Pointer / Pan tool */}
        <button
          onClick={() => setActiveTool("select")}
          title="Select Tool (V)"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            activeTool === "select"
              ? "bg-surface-elevated text-accent-primary border border-border-subtle"
              : "text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent"
          }`}
        >
          <MousePointer className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setActiveTool("pan")}
          title="Pan Canvas (H)"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            activeTool === "pan"
              ? "bg-surface-elevated text-accent-primary border border-border-subtle"
              : "text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent"
          }`}
        >
          <Hand className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="w-6 h-[1px] bg-border-subtle my-1" />

        {/* Navigation & Panels */}
        <button
          onClick={() => {
            setActiveTab("model");
            toggleInspector();
          }}
          title="Schema Tables & Inspector"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            activeTab === "model"
              ? "bg-surface-elevated text-accent-primary border border-border-subtle"
              : "text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent"
          }`}
        >
          <Layers className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setActiveTab("api")}
          title="Endpoints & Routes"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            activeTab === "api"
              ? "bg-surface-elevated text-accent-primary border border-border-subtle"
              : "text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent"
          }`}
        >
          <Route className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setIsImportModalOpen(true, "auto")}
          title="Import Existing Schema (SQL, Prisma, Mongoose)"
          className="w-8 h-8 rounded-md flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent transition-colors"
        >
          <FileCode className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <button
          onClick={recomputeLayout}
          title="Auto-Layout Graph (Dagre LR)"
          className="w-8 h-8 rounded-md flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent transition-colors"
        >
          <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          title="Documentation & Shortcuts"
          className="w-8 h-8 rounded-md flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-elevated transition-colors"
        >
          <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
        </a>
        <button
          title="Project Settings"
          className="w-8 h-8 rounded-md flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-elevated transition-colors"
        >
          <Settings className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
};
