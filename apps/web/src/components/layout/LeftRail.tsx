"use client";

import React from "react";
import {
  Layers,
  Database,
  FileCode,
  LayoutGrid,
  Settings,
  HelpCircle,
  Plus,
  Route,
} from "lucide-react";
import { useProjectStore } from "../../store/useProjectStore";

export const LeftRail: React.FC = () => {
  const activeTab = useProjectStore((s) => s.activeTab);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);
  const addEntity = useProjectStore((s) => s.addEntity);
  const setIsImportModalOpen = useProjectStore(
    (s) => s.setIsImportModalOpen
  );

  const navItems = [
    {
      id: "model",
      label: "Schema Model",
      icon: <Layers className="w-4 h-4" strokeWidth={1.5} />,
      onClick: () => setActiveTab("model"),
    },
    {
      id: "api",
      label: "Endpoints & API",
      icon: <Route className="w-4 h-4" strokeWidth={1.5} />,
      onClick: () => setActiveTab("api"),
    },
    {
      id: "import",
      label: "Import Schema",
      icon: <FileCode className="w-4 h-4" strokeWidth={1.5} />,
      onClick: () => setIsImportModalOpen(true, "auto"),
    },
  ];

  return (
    <aside className="w-[52px] bg-surface border-r border-border-subtle flex flex-col items-center justify-between py-3 select-none z-30 shrink-0">
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          onClick={() => addEntity()}
          title="Add Entity (+)"
          className="w-8 h-8 rounded-md bg-surface-elevated hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-txt-primary hover:text-accent-primary transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="w-6 h-[1px] bg-border-subtle my-1" />

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              title={item.label}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                isActive
                  ? "bg-surface-elevated text-accent-primary border border-border-subtle"
                  : "text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated border border-transparent"
              }`}
            >
              {item.icon}
            </button>
          );
        })}
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
