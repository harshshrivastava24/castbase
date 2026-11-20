import type { IRDocument } from "@schemaflow/ir-schema";
import { generateClientOpenAPI } from "./openapi-generator";

export interface TargetOption {
  id: string;
  name: string;
  description: string;
  supported: boolean;
  statusMessage?: string;
  runtime: string;
  db: "postgres" | "mongodb";
}

export const TARGET_OPTIONS: TargetOption[] = [
  {
    id: "typescript-mongo",
    name: "TypeScript + MongoDB",
    description: "Express 5, Mongoose ODM, strict TypeScript schemas",
    supported: true,
    runtime: "Node.js 22",
    db: "mongodb",
  },
  {
    id: "typescript-postgres",
    name: "TypeScript + PostgreSQL",
    description: "Express 5, Drizzle ORM, canonical SQL migrations",
    supported: true,
    runtime: "Node.js 22",
    db: "postgres",
  },
  {
    id: "python-postgres",
    name: "Python + FastAPI",
    description: "FastAPI, SQLAlchemy 2.0, asyncpg, Pydantic v2",
    supported: false,
    statusMessage: "Compiler target in development (Task T12)",
    runtime: "Python 3.12",
    db: "postgres",
  },
  {
    id: "go-postgres",
    name: "Go + chi",
    description: "chi router, pgx/v5, lightweight low-allocation handlers",
    supported: false,
    statusMessage: "Compiler target in development (Task T13)",
    runtime: "Go 1.23",
    db: "postgres",
  },
];

export interface PreviewFile {
  path: string;
  content: string;
  size: number;
  language: string;
  isCompilerOutput: boolean;
}

export interface CompilePreviewResult {
  online: boolean;
  targetId: string;
  files: PreviewFile[];
  statusMessage: string;
  compilerVersion?: string;
  isUnsupported?: boolean;
}

/**
 * Returns authentic client-side local preview files (OpenAPI 3.1 spec and IR schema).
 * Never fabricates or labels placeholder code as compiler output.
 */
export function getLocalPreviewFiles(ir: IRDocument): PreviewFile[] {
  const openApiSpec = generateClientOpenAPI(ir);
  const openApiContent = JSON.stringify(openApiSpec, null, 2);
  const irContent = JSON.stringify(ir, null, 2);

  return [
    {
      path: "docs/openapi.json",
      content: openApiContent,
      size: new TextEncoder().encode(openApiContent).length,
      language: "json",
      isCompilerOutput: false,
    },
    {
      path: "schema/ir-contract.json",
      content: irContent,
      size: new TextEncoder().encode(irContent).length,
      language: "json",
      isCompilerOutput: false,
    },
  ];
}

/**
 * Attempts to fetch live compiled files from the compiler API (POST /api/compile/preview).
 * If the compiler API is unreachable (e.g. prior to Task T11 Fastify Control Plane),
 * returns an honest offline status without fabricating generated source files.
 */
export async function fetchCompilePreview(
  ir: IRDocument,
  targetId: string
): Promise<CompilePreviewResult> {
  const target = TARGET_OPTIONS.find((t) => t.id === targetId);

  if (!target || !target.supported) {
    return {
      online: false,
      targetId,
      files: getLocalPreviewFiles(ir),
      isUnsupported: true,
      statusMessage:
        target?.statusMessage || "Target compiler template is currently in development.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const response = await fetch("/api/compile/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ir, target: targetId }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const files: PreviewFile[] = (data.files || []).map((f: { path: string; content: string }) => ({
        path: f.path,
        content: f.content,
        size: new TextEncoder().encode(f.content).length,
        language: f.path.endsWith(".ts")
          ? "typescript"
          : f.path.endsWith(".sql")
          ? "sql"
          : f.path.endsWith(".json")
          ? "json"
          : f.path.endsWith(".py")
          ? "python"
          : f.path.endsWith(".go")
          ? "go"
          : "plaintext",
        isCompilerOutput: true,
      }));

      return {
        online: true,
        targetId,
        files: files.length > 0 ? files : getLocalPreviewFiles(ir),
        statusMessage: "Live compiler connected.",
        compilerVersion: data.compilerVersion,
      };
    }

    return {
      online: false,
      targetId,
      files: getLocalPreviewFiles(ir),
      statusMessage:
        "Compiler service offline (Fastify Control Plane T11). Target files unavailable.",
    };
  } catch {
    // API is offline: return honest offline status with client-side OpenAPI and IR
    return {
      online: false,
      targetId,
      files: getLocalPreviewFiles(ir),
      statusMessage:
        "Compiler service offline (Fastify Control Plane T11). Showing client-side OpenAPI 3.1 & IR schema.",
    };
  }
}
