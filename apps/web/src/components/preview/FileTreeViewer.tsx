"use client";

import React, { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Database,
  CloudOff,
} from "lucide-react";
import type { PreviewFile } from "../../lib/client-preview-fallback";

interface FileTreeViewerProps {
  files: PreviewFile[];
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  isOffline: boolean;
  statusMessage: string;
  isUnsupportedTarget?: boolean;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isDir: boolean;
  children: Record<string, TreeNode>;
  file?: PreviewFile;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function buildTree(files: PreviewFile[]): TreeNode {
  const root: TreeNode = {
    name: "root",
    fullPath: "",
    isDir: true,
    children: {},
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isLast = i === parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: {},
          file: isLast ? file : undefined,
        };
      }
      current = current.children[part]!;
    }
  }

  return root;
}

export const FileTreeViewer: React.FC<FileTreeViewerProps> = ({
  files,
  selectedPath,
  onSelectPath,
  isOffline,
  statusMessage,
  isUnsupportedTarget,
}) => {
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Build tree from files
  const root = useMemo(() => buildTree(files), [files]);

  // Selected file
  const activeFile = useMemo(() => {
    return files.find((f) => f.path === selectedPath) || files[0] || null;
  }, [files, selectedPath]);

  const toggleDir = (dirPath: string) => {
    setCollapsedDirs((prev) => ({
      ...prev,
      [dirPath]: !prev[dirPath],
    }));
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith(".ts")) return <FileCode className="w-3.5 h-3.5 text-accent-primary" />;
    if (path.endsWith(".sql")) return <Database className="w-3.5 h-3.5 text-accent-secondary" />;
    if (path.endsWith(".json")) return <FileCode className="w-3.5 h-3.5 text-txt-secondary" />;
    return <FileText className="w-3.5 h-3.5 text-txt-muted" />;
  };

  const renderTree = (node: TreeNode, depth = 0) => {
    const entries = Object.values(node.children).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="flex flex-col">
        {entries.map((item) => {
          if (item.isDir) {
            const isCollapsed = Boolean(collapsedDirs[item.fullPath]);
            return (
              <div key={item.fullPath} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleDir(item.fullPath)}
                  style={{ paddingLeft: `${depth * 14 + 10}px` }}
                  className="py-1.5 pr-2 flex items-center gap-1.5 text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated text-xs font-mono transition-colors text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                  )}
                  {isCollapsed ? (
                    <Folder className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-accent-secondary shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
                {!isCollapsed && renderTree(item, depth + 1)}
              </div>
            );
          }

          const isSelected = activeFile?.path === item.fullPath;

          return (
            <button
              key={item.fullPath}
              type="button"
              onClick={() => onSelectPath(item.fullPath)}
              style={{ paddingLeft: `${depth * 14 + 24}px` }}
              className={`py-1.5 pr-2 flex items-center justify-between gap-2 text-xs font-mono transition-colors text-left ${
                isSelected
                  ? "bg-surface text-txt-primary font-semibold border-l-2 border-accent-primary"
                  : "text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated/50"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {getFileIcon(item.name)}
                <span className="truncate">{item.name}</span>
              </div>
              {item.file && (
                <span className="text-[10px] text-txt-muted shrink-0">
                  {formatBytes(item.file.size)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* 1. Offline or Target Status Notification Banner */}
      {(isOffline || isUnsupportedTarget) && (
        <div className="p-3 bg-surface border-b border-border-subtle flex items-start gap-2.5 shrink-0">
          {isUnsupportedTarget ? (
            <AlertCircle className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
          ) : (
            <CloudOff className="w-4 h-4 text-txt-muted shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-txt-primary">
              {isUnsupportedTarget ? "Target Under Construction" : "Offline Preview Mode"}
            </span>
            <p className="text-txt-secondary leading-normal">
              {statusMessage}
            </p>
          </div>
        </div>
      )}

      {/* 2. Main Dual-Pane View: File Tree + Code Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Directory Explorer */}
        <div className="w-[220px] bg-canvas border-r border-border-subtle flex flex-col shrink-0 overflow-y-auto">
          <div className="p-2.5 border-b border-border-subtle font-mono text-[10px] uppercase text-txt-muted font-bold tracking-wider">
            Files ({files.length})
          </div>
          <div className="py-1">
            {renderTree(root)}
          </div>
        </div>

        {/* Right Side: Syntax Code View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {activeFile ? (
            <>
              {/* Code Pane Header */}
              <div className="p-3 border-b border-border-subtle bg-surface-elevated/40 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0 font-mono text-[11px]">
                  <span className="text-txt-primary font-bold truncate">
                    {activeFile.path}
                  </span>
                  <span className="text-txt-muted shrink-0">
                    ({formatBytes(activeFile.size)})
                  </span>
                  {!activeFile.isCompilerOutput && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-canvas border border-border-subtle text-accent-primary shrink-0">
                      Client Spec
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-elevated border border-border-subtle text-txt-secondary hover:text-txt-primary text-xs font-mono transition-colors shrink-0"
                  title="Copy file contents"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-accent-primary" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Container */}
              <div className="flex-1 p-4 overflow-auto bg-canvas">
                <pre className="font-mono text-[11px] text-txt-primary leading-relaxed whitespace-pre selection:bg-accent-primary/20">
                  <code>{activeFile.content}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-txt-muted">
              Select a file to preview its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
