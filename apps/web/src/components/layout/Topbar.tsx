"use client";

import React from "react";
import {
  Moon,
  Sun,
  Undo2,
  Redo2,
  Layers,
  Code2,
  Shield,
  Hammer,
  Eye,
  Sparkles,
  Settings,
  User,
} from "lucide-react";
import { APP_NAME } from "../../config/brand";
import { useProjectStore, type ActiveTab } from "../../store/useProjectStore";

export const Topbar: React.FC = () => {
  const ir = useProjectStore((s) => s.ir);
  const theme = useProjectStore((s) => s.theme);
  const toggleTheme = useProjectStore((s) => s.toggleTheme);
  const activeTab = useProjectStore((s) => s.activeTab);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);
  const displayMode = useProjectStore((s) => s.displayMode);
  const setDisplayMode = useProjectStore((s) => s.setDisplayMode);
  const updateProjectConfig = useProjectStore((s) => s.updateProjectConfig);

  // Undo / Redo via zundo temporal
  const temporal = useProjectStore.temporal?.getState();
  const handleUndo = () => {
    useProjectStore.temporal?.getState()?.undo();
  };
  const handleRedo = () => {
    useProjectStore.temporal?.getState()?.redo();
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "model", label: "Model", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "api", label: "API", icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: "auth", label: "Auth", icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "build", label: "Build", icon: <Hammer className="w-3.5 h-3.5" /> },
    { id: "preview", label: "Preview", icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-[52px] bg-surface border-b border-border-subtle px-4 flex items-center justify-between select-none z-40 relative">
      {/* Left: Brand & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-primary flex items-center justify-center text-accent-primary-fg font-mono font-bold text-xs shadow-sm">
            {APP_NAME.slice(0, 1).toUpperCase()}
          </div>
          <span className="font-semibold text-sm tracking-tight text-txt-primary">
            {APP_NAME}
          </span>
        </div>
        <span className="text-txt-muted text-xs font-mono">/</span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={ir.project.name}
            onChange={(e) => updateProjectConfig({ name: e.target.value })}
            className="bg-transparent font-mono text-xs text-txt-secondary hover:text-txt-primary focus:text-txt-primary border border-transparent hover:border-border-subtle focus:border-border-focus px-1.5 py-0.5 rounded outline-none transition-colors max-w-[160px]"
            title="Rename project"
          />
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface-elevated text-txt-muted border border-border-subtle">
            {ir.project.database}
          </span>
        </div>
      </div>

      {/* Center: Workflow Tabs */}
      <nav className="flex items-center gap-1 bg-canvas border border-border-subtle p-0.5 rounded-md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                isActive
                  ? "bg-surface text-txt-primary shadow-sm border border-border-subtle"
                  : "text-txt-secondary hover:text-txt-primary hover:bg-surface/50 border border-transparent"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Simple / Advanced View Toggle */}
        <div className="flex items-center bg-canvas border border-border-subtle p-0.5 rounded-md text-[11px] font-mono">
          <button
            onClick={() => setDisplayMode("simple")}
            className={`px-2 py-0.5 rounded transition-all ${
              displayMode === "simple"
                ? "bg-surface text-txt-primary font-semibold"
                : "text-txt-muted hover:text-txt-secondary"
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setDisplayMode("advanced")}
            className={`px-2 py-0.5 rounded transition-all ${
              displayMode === "advanced"
                ? "bg-surface text-txt-primary font-semibold"
                : "text-txt-muted hover:text-txt-secondary"
            }`}
          >
            Advanced
          </button>
        </div>

        {/* History: Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-r border-border-subtle px-1">
          <button
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="p-1.5 rounded-md border border-border-subtle hover:bg-surface-elevated text-txt-secondary hover:text-txt-primary transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Primary Generate Button */}
        <button
          onClick={() => setActiveTab("build")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill bg-accent-primary text-accent-primary-fg font-mono text-xs font-bold tracking-tight hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
        >
          <span>Generate</span>
          <span className="text-[10px] opacity-75">→</span>
        </button>

        {/* Guest Avatar */}
        <div
          title="Guest Mode (Local Storage)"
          className="w-7 h-7 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-txt-secondary hover:text-txt-primary cursor-pointer transition-colors"
        >
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    </header>
  );
};
