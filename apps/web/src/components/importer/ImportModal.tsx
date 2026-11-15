"use client";

import React, { useState } from "react";
import { X, UploadCloud, AlertCircle, CheckCircle, FileCode } from "lucide-react";
import { useProjectStore, type ImportKind } from "../../store/useProjectStore";

const SAMPLE_PRISMA = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      String   @default("USER")
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}`;

const SAMPLE_MONGOOSE = `import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' }
});

const PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});`;

export const ImportModal: React.FC = () => {
  const isOpen = useProjectStore((s) => s.isImportModalOpen);
  const modalKind = useProjectStore((s) => s.importModalKind);
  const setIsOpen = useProjectStore((s) => s.setIsImportModalOpen);
  const importSchemaText = useProjectStore((s) => s.importSchemaText);

  const [selectedKind, setSelectedKind] = useState<ImportKind>(modalKind || "auto");
  const [schemaText, setSchemaText] = useState<string>("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sync modalKind when opened
  React.useEffect(() => {
    if (modalKind) {
      setSelectedKind(modalKind);
    }
    setImportErrors([]);
    setIsSuccess(false);
  }, [modalKind, isOpen]);

  if (!isOpen) return null;

  const handleImport = () => {
    setImportErrors([]);
    if (!schemaText.trim()) {
      setImportErrors(["Please paste or enter a schema definition."]);
      return;
    }

    const res = importSchemaText(schemaText, selectedKind);
    if (!res.success) {
      setImportErrors(res.errors);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSchemaText("");
        setIsSuccess(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface border border-border-subtle rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-surface border border-border-subtle flex items-center justify-center text-accent-primary">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-txt-primary">
                Import Existing Schema
              </h2>
              <p className="text-[11px] text-txt-secondary">
                Ingest Prisma DDL, Mongoose schemas, or MongoDB JSON with automatic Dagre layout
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded hover:bg-surface text-txt-muted hover:text-txt-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector & Presets */}
        <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between bg-surface gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-txt-muted text-[11px] uppercase font-mono">
              Format:
            </span>
            <div className="flex bg-canvas border border-border-subtle p-0.5 rounded font-mono text-[11px]">
              {(["auto", "prisma", "mongodb"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedKind(fmt)}
                  className={`px-2.5 py-0.5 rounded uppercase transition-colors ${
                    selectedKind === fmt
                      ? "bg-surface-elevated text-txt-primary font-bold shadow-sm"
                      : "text-txt-secondary hover:text-txt-primary"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-txt-muted text-[11px]">Insert sample:</span>
            <button
              onClick={() => {
                setSchemaText(SAMPLE_PRISMA);
                setSelectedKind("prisma");
              }}
              className="px-2 py-0.5 rounded border border-border-subtle text-[11px] font-mono text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated transition-colors"
            >
              Prisma
            </button>
            <button
              onClick={() => {
                setSchemaText(SAMPLE_MONGOOSE);
                setSelectedKind("mongodb");
              }}
              className="px-2 py-0.5 rounded border border-border-subtle text-[11px] font-mono text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated transition-colors"
            >
              Mongoose
            </button>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="p-5 flex-1 overflow-auto flex flex-col gap-3">
          <textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder="// Paste your schema.prisma, Mongoose schema, or MongoDB JSON here..."
            className="w-full flex-1 min-h-[240px] bg-canvas border border-border-subtle focus:border-border-focus rounded-md p-3.5 font-mono text-xs text-txt-primary placeholder:text-txt-muted outline-none resize-none leading-relaxed transition-colors"
          />

          {/* Validation / Parsing Errors */}
          {importErrors.length > 0 && (
            <div className="p-3 rounded-md bg-accent-danger/10 border border-accent-danger/30 flex flex-col gap-1 text-xs text-accent-danger">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Import Failed</span>
              </div>
              <ul className="list-disc pl-5 font-mono text-[11px] space-y-0.5">
                {importErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-md bg-accent-primary/10 border border-accent-primary/30 flex items-center gap-2 text-xs text-accent-primary font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Schema imported and layout generated successfully!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-elevated flex items-center justify-between">
          <span className="text-[11px] font-mono text-txt-muted">
            AST / Tokenizer executed client-side with zero-eval safety
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-md border border-border-subtle text-xs text-txt-secondary hover:text-txt-primary hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-1.5 rounded-pill bg-accent-primary text-accent-primary-fg font-mono text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Parse & Import Schema →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
