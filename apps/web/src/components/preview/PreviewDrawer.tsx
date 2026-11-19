"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  FolderTree,
  ChevronDown,
  Layers,
  Database,
  Check,
  AlertCircle,
} from "lucide-react";
import { useProjectStore } from "../../store/useProjectStore";
import { OpenApiPlayground } from "./OpenApiPlayground";
import { FileTreeViewer } from "./FileTreeViewer";
import {
  TARGET_OPTIONS,
  fetchCompilePreview,
  getLocalPreviewFiles,
  type TargetOption,
  type PreviewFile,
} from "../../lib/client-preview-fallback";

export const PreviewDrawer: React.FC = () => {
  const isPreviewOpen = useProjectStore((s) => s.isPreviewOpen);
  const setIsPreviewOpen = useProjectStore((s) => s.setIsPreviewOpen);
  const ir = useProjectStore((s) => s.ir);

  const [activeTab, setActiveTab] = useState<"api" | "files">("api");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("typescript-mongo");
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>(() => getLocalPreviewFiles(ir));
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>("docs/openapi.json");
  const [isOffline, setIsOffline] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const selectedTarget = TARGET_OPTIONS.find((t) => t.id === selectedTargetId) || TARGET_OPTIONS[0]!;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen, setIsPreviewOpen]);

  // Fetch or update preview files whenever target or IR changes
  useEffect(() => {
    if (!isPreviewOpen) return;

    let isMounted = true;
    setIsLoading(true);

    fetchCompilePreview(ir, selectedTargetId).then((result) => {
      if (!isMounted) return;
      setPreviewFiles(result.files);
      setIsOffline(!result.online);
      setStatusMessage(result.statusMessage);
      setIsLoading(false);

      // Default selected file if current is missing
      if (!result.files.some((f) => f.path === selectedFilePath)) {
        setSelectedFilePath(result.files[0]?.path || null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isPreviewOpen, ir, selectedTargetId, selectedFilePath]);

  if (!isPreviewOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instant Preview Drawer"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs select-none transition-opacity"
    >
      {/* Click outside to close backdrop */}
      <div
        onClick={() => setIsPreviewOpen(false)}
        className="absolute inset-0 cursor-default"
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-[720px] bg-inspector border-l border-border-subtle flex flex-col h-full shadow-2xl overflow-hidden"
      >
        {/* 1. Header Toolbar */}
        <div className="p-4 border-b border-border-subtle bg-surface-elevated/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-sm text-txt-primary tracking-tight">
              Instant Preview
            </h2>
            <span className="text-txt-muted text-xs font-mono">/</span>
            <span className="font-mono text-xs text-txt-secondary">
              {ir.project.name}
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-txt-muted font-bold">
              {ir.project.database}
            </span>
          </div>

          <button
            type="button"
            aria-label="Close preview drawer"
            onClick={() => setIsPreviewOpen(false)}
            className="p-1 rounded hover:bg-surface text-txt-muted hover:text-txt-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Controls & Tab Strip */}
        <div className="px-4 py-2.5 border-b border-border-subtle bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Target Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-canvas border border-border-strong text-xs font-mono text-txt-primary hover:border-border-focus transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-accent-primary" />
              <span className="font-semibold">{selectedTarget.name}</span>
              <ChevronDown className="w-3 h-3 text-txt-muted" />
            </button>

            {targetDropdownOpen && (
              <>
                <div
                  onClick={() => setTargetDropdownOpen(false)}
                  className="fixed inset-0 z-20"
                />
                <div className="absolute left-0 top-full mt-1 w-72 bg-surface-elevated border border-border-subtle rounded-md shadow-xl z-30 divide-y divide-border-subtle overflow-hidden">
                  {TARGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!opt.supported}
                      onClick={() => {
                        if (opt.supported) {
                          setSelectedTargetId(opt.id);
                          setTargetDropdownOpen(false);
                        }
                      }}
                      className={`w-full p-2.5 flex flex-col gap-1 text-left transition-colors ${
                        !opt.supported
                          ? "opacity-50 cursor-not-allowed bg-canvas/40"
                          : selectedTargetId === opt.id
                          ? "bg-surface text-txt-primary"
                          : "hover:bg-surface text-txt-secondary hover:text-txt-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-txt-primary flex items-center gap-1.5">
                          {opt.name}
                          {selectedTargetId === opt.id && (
                            <Check className="w-3.5 h-3.5 text-accent-primary" />
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-txt-muted">
                          {opt.runtime}
                        </span>
                      </div>
                      <p className="text-[11px] text-txt-secondary leading-normal">
                        {opt.description}
                      </p>
                      {!opt.supported && opt.statusMessage && (
                        <span className="text-[10px] font-mono text-accent-secondary">
                          {opt.statusMessage}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tab Switcher: API Playground vs Generated Files */}
          <div className="flex items-center bg-canvas border border-border-subtle p-0.5 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === "api"
                  ? "bg-surface text-txt-primary font-bold shadow-sm"
                  : "text-txt-secondary hover:text-txt-primary"
              }`}
            >
              <Play className="w-3 h-3 text-accent-primary fill-current" />
              <span>API Playground</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === "files"
                  ? "bg-surface text-txt-primary font-bold shadow-sm"
                  : "text-txt-secondary hover:text-txt-primary"
              }`}
            >
              <FolderTree className="w-3 h-3 text-accent-secondary" />
              <span>Generated Files</span>
            </button>
          </div>
        </div>

        {/* 3. Main Body */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === "api" ? (
            <OpenApiPlayground ir={ir} />
          ) : (
            <FileTreeViewer
              files={previewFiles}
              selectedPath={selectedFilePath}
              onSelectPath={setSelectedFilePath}
              isOffline={isOffline}
              statusMessage={statusMessage}
              isUnsupportedTarget={!selectedTarget.supported}
            />
          )}
        </div>

        {/* 4. Footer */}
        <div className="p-3 border-t border-border-subtle bg-surface-elevated flex items-center justify-between text-xs font-mono text-txt-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-primary" />
            <span className="text-txt-secondary">
              {ir.entities.length} {ir.entities.length === 1 ? "Entity" : "Entities"} |{" "}
              {ir.relations.length} {ir.relations.length === 1 ? "Relation" : "Relations"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-3 py-1 rounded-pill bg-surface-elevated border border-border-subtle text-txt-secondary hover:text-txt-primary transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
