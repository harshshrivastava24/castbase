"use client";

import React, { useState } from "react";
import {
  FileCode,
  Layers,
  Database,
  Code2,
  ArrowRight,
  Sparkles,
  Command,
  CheckCircle2,
} from "lucide-react";
import { useProjectStore, type ImportKind } from "../../store/useProjectStore";
import {
  STARTER_TEMPLATES_META,
  type TemplateCardMeta,
} from "../../templates/starterTemplates";

export const WelcomeScreen: React.FC = () => {
  const [composerMode, setComposerMode] = useState<"nl" | "ddl">("nl");
  const [promptText, setPromptText] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const loadTemplate = useProjectStore((s) => s.loadTemplate);
  const importSchemaText = useProjectStore((s) => s.importSchemaText);
  const setIsImportModalOpen = useProjectStore(
    (s) => s.setIsImportModalOpen
  );
  const ir = useProjectStore((s) => s.ir);
  const updateProjectConfig = useProjectStore((s) => s.updateProjectConfig);

  const maxChars = 350;

  const presets = [
    {
      label: "Blog with Auth",
      prompt:
        "A publishing platform with Users (authors, editors), Posts (markdown content, slug), Comments (moderated), and taxonomy Tags.",
    },
    {
      label: "E-Commerce Store",
      prompt:
        "An e-commerce store backend with Customers, Products catalog, Orders with status, and OrderItem line items.",
    },
    {
      label: "Project Tracker",
      prompt:
        "A project tracking app with Workspaces, Task boards, Members with role permissions, and Label tagging.",
    },
  ];

  const handleBuildFromPrompt = () => {
    if (!promptText.trim()) return;

    setIsSynthesizing(true);
    // If prompt matches or is inspired by template, load corresponding schema or synthesize
    const lower = promptText.toLowerCase();
    setTimeout(() => {
      if (lower.includes("store") || lower.includes("commerce") || lower.includes("product")) {
        loadTemplate("shop");
      } else if (lower.includes("tracker") || lower.includes("task") || lower.includes("project")) {
        loadTemplate("tracker");
      } else if (composerMode === "ddl" || promptText.includes("model ") || promptText.includes("CREATE TABLE")) {
        importSchemaText(promptText, "auto");
      } else {
        loadTemplate("blog");
      }
      setIsSynthesizing(false);
    }, 600);
  };

  const importCards: {
    id: string;
    kind: ImportKind;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "sql",
      kind: "auto",
      title: "SQL / DDL File",
      desc: "Import PostgreSQL or MySQL CREATE TABLE statements",
      icon: <FileCode className="w-4 h-4 text-accent-secondary" />,
    },
    {
      id: "prisma",
      kind: "prisma",
      title: "Prisma Schema",
      desc: "Ingest schema.prisma models, enums, and relations",
      icon: <Layers className="w-4 h-4 text-entity-teal" />,
    },
    {
      id: "live_db",
      kind: "auto",
      title: "Live Database",
      desc: "Introspect schema from a live connection string",
      icon: <Database className="w-4 h-4 text-accent-primary" />,
    },
    {
      id: "json",
      kind: "mongodb",
      title: "JSON / OpenAPI",
      desc: "Infer from MongoDB document sample or OpenAPI 3.1",
      icon: <Code2 className="w-4 h-4 text-entity-amber" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto bg-dot-grid">
      <div className="w-full max-w-7xl mx-auto px-10 py-8 flex flex-col gap-9">
        {/* Header */}
        <div className="flex flex-col gap-1.5 text-left">
          <h1 className="text-2xl font-bold tracking-tight text-txt-primary">
            Create a data model
          </h1>
          <p className="text-xs text-txt-secondary max-w-2xl">
            Synthesize a relational or document backend with natural language, SQL DDL, or pre-built architectural blueprints.
          </p>
        </div>

        {/* 1. Unified Composer Card */}
        <div className="bg-surface border border-border-subtle rounded-lg shadow-sm flex flex-col overflow-hidden transition-all focus-within:border-border-focus">
          {/* Top toolbar */}
          <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between bg-surface-elevated">
            <div className="flex items-center gap-1 bg-canvas border border-border-subtle p-0.5 rounded-sm">
              <button
                type="button"
                onClick={() => {
                  setComposerMode("nl");
                  setPromptText("");
                }}
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${
                  composerMode === "nl"
                    ? "bg-surface text-txt-primary font-semibold shadow-sm"
                    : "text-txt-secondary hover:text-txt-primary"
                }`}
              >
                Natural Language
              </button>
              <button
                type="button"
                onClick={() => {
                  setComposerMode("ddl");
                  setPromptText(
                    "CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) NOT NULL UNIQUE,\n  role VARCHAR(50) DEFAULT 'USER'\n);"
                  );
                }}
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${
                  composerMode === "ddl"
                    ? "bg-surface text-txt-primary font-semibold shadow-sm"
                    : "text-txt-secondary hover:text-txt-primary"
                }`}
              >
                SQL / Prisma DDL
              </button>
            </div>

            <div className="text-[11px] font-mono text-txt-muted uppercase">
              {promptText.length} / {maxChars} CHARS
            </div>
          </div>

          {/* Borderless Textarea Input */}
          <textarea
            value={promptText}
            maxLength={maxChars}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={
              composerMode === "nl"
                ? "Describe your entities, relations, and business logic (e.g., A blog with authors, markdown posts, threaded comments, and tags)..."
                : "model User {\n  id String @id @default(uuid())\n  email String @unique\n  posts Post[]\n}"
            }
            className={`w-full min-h-[110px] p-4 bg-transparent outline-none resize-none text-xs text-txt-primary placeholder:text-txt-muted leading-relaxed ${
              composerMode === "ddl" ? "font-mono" : "font-sans"
            }`}
          />

          {/* Bottom Bar: Presets & Primary CTA */}
          <div className="px-4 py-2.5 border-t border-border-subtle bg-surface flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-txt-muted">Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setComposerMode("nl");
                    setPromptText(preset.prompt);
                  }}
                  className="px-2.5 py-1 rounded-pill bg-surface-elevated hover:bg-border-subtle border border-border-subtle text-[11px] text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isSynthesizing || !promptText.trim()}
              onClick={handleBuildFromPrompt}
              className={`px-4 py-1.5 rounded-pill bg-accent-primary text-accent-primary-fg font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                !promptText.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90 active:scale-[0.98]"
              }`}
            >
              <span>{isSynthesizing ? "Synthesizing..." : "Build Model"}</span>
              <span className="text-[11px]">→</span>
            </button>
          </div>
        </div>

        {/* 2. Import Existing Schema Row */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-secondary font-mono">
              Import Existing Schema
            </h2>
            <span className="text-[11px] text-txt-muted font-mono">
              ZERO-EVAL CLIENT PARSER
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {importCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setIsImportModalOpen(true, card.kind)}
                className="p-3.5 bg-surface hover:bg-surface-elevated border border-border-subtle hover:border-border-focus rounded-md text-left transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-8 h-8 rounded bg-surface-elevated border border-border-subtle flex items-center justify-center group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <span className="text-txt-muted group-hover:text-txt-primary text-xs font-mono transition-colors">
                    ↗
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-txt-primary tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-txt-secondary mt-0.5 leading-snug">
                    {card.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Start from a Template Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-secondary font-mono">
              Start from a Template
            </h2>
            <span className="text-[11px] text-txt-muted font-mono">
              DETERMINISTIC BLUEPRINTS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STARTER_TEMPLATES_META.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-surface border border-border-subtle rounded-lg p-4 flex flex-col justify-between gap-4 shadow-sm hover:border-border-focus transition-all"
              >
                {/* Card Top */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-txt-primary tracking-tight">
                      {tmpl.name}
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-accent-secondary border border-border-subtle font-bold">
                      {tmpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-txt-secondary leading-normal">
                    {tmpl.tagline}
                  </p>
                </div>

                {/* Flat Horizontal Hairline Schema Rows (No nested cards) */}
                <div className="border border-border-subtle rounded bg-canvas overflow-hidden">
                  {tmpl.entities.map((entity, eIdx) => (
                    <div
                      key={entity.name}
                      className={`p-2 flex flex-col gap-1 ${
                        eIdx > 0 ? "border-t border-border-subtle" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-txt-primary flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: entity.badgeColor }}
                          />
                          {entity.name}
                        </span>
                        <span className="text-[10px] font-mono text-txt-muted">
                          {entity.fields.length} cols
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-mono text-txt-secondary">
                        {entity.fields.map((f) => (
                          <span key={f.name} className="flex items-center gap-0.5">
                            <span className={f.isPk ? "text-accent-secondary font-bold" : ""}>
                              {f.name}
                            </span>
                            <span className="text-txt-muted">:</span>
                            <span className="text-txt-muted">{f.type}</span>
                            {f.isPk && (
                              <span className="text-[8px] px-1 bg-accent-secondary/15 text-accent-secondary rounded font-bold">
                                PK
                              </span>
                            )}
                            {f.isFk && (
                              <span className="text-[8px] px-1 bg-entity-teal/15 text-entity-teal rounded font-bold">
                                FK
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card CTA */}
                <button
                  type="button"
                  onClick={() => loadTemplate(tmpl.id)}
                  className="w-full py-1.5 px-3 rounded-md border border-border-subtle bg-surface-elevated hover:bg-accent-primary hover:text-accent-primary-fg hover:border-accent-primary font-mono text-xs font-semibold text-txt-primary flex items-center justify-center gap-1.5 transition-all group"
                >
                  <span>Use template</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Flush 36px Footer Strip */}
      <footer className="h-9 bg-footer border-t border-border-subtle px-6 flex items-center justify-between text-[11px] font-mono text-txt-muted select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
          <span className="uppercase font-semibold text-txt-secondary">
            {ir.project.database === "mongodb"
              ? "MongoDB 7 • Document Engine"
              : "PostgreSQL 16 • Default Engine"}
          </span>
          <span>•</span>
          <span>{ir.entities.length} ENTITIES CONFIGURED</span>
        </div>

        <div className="flex items-center gap-1.5 hover:text-txt-secondary cursor-pointer transition-colors">
          <Command className="w-3 h-3" />
          <span>K Command Menu</span>
        </div>
      </footer>
    </div>
  );
};
