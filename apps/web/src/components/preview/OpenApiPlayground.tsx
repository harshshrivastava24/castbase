"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Lock,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  Code,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { IRDocument, EndpointOp } from "@schemaflow/ir-schema";
import {
  generateClientOpenAPI,
  generateMockResponse,
  type OpenAPISpec,
} from "../../lib/openapi-generator";

interface OpenApiPlaygroundProps {
  ir: IRDocument;
}

interface EndpointItem {
  id: string;
  tag: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  authRequired: boolean;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: { type?: string };
    description?: string;
  }>;
  requestBodyRef?: string;
  entityId?: string;
  op: EndpointOp;
}

export const OpenApiPlayground: React.FC<OpenApiPlaygroundProps> = ({ ir }) => {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawSpecOpen, setRawSpecOpen] = useState(false);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [copiedResponseId, setCopiedResponseId] = useState<string | null>(null);
  const [loadingEndpointId, setLoadingEndpointId] = useState<string | null>(null);
  const [mockResults, setMockResults] = useState<
    Record<string, { status: number; body: unknown; timeMs: number }>
  >({});

  const spec: OpenAPISpec = useMemo(() => generateClientOpenAPI(ir), [ir]);

  // Extract endpoints from OpenAPI spec
  const endpoints = useMemo<EndpointItem[]>(() => {
    const list: EndpointItem[] = [];

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [methodKey, operation] of Object.entries(methods)) {
        const opData = operation as {
          tags?: string[];
          summary?: string;
          description?: string;
          security?: unknown[];
          parameters?: EndpointItem["parameters"];
          requestBody?: {
            content?: {
              "application/json"?: {
                schema?: { $ref?: string };
              };
            };
          };
        };

        const method = methodKey.toUpperCase() as EndpointItem["method"];
        const tag = opData.tags?.[0] || "General";
        const authRequired = Boolean(opData.security && opData.security.length > 0);

        // Map to SchemaFlow EndpointOp
        let op: EndpointOp = "list";
        if (method === "GET") {
          op = path.includes("{id}") ? "get" : "list";
        } else if (method === "POST") {
          op = "create";
        } else if (method === "PATCH") {
          op = "update";
        } else if (method === "DELETE") {
          op = "delete";
        }

        const matchedEntity = ir.entities.find((e) => e.name === tag);

        list.push({
          id: `${method}_${path}`,
          tag,
          method,
          path,
          summary: opData.summary || `${method} ${path}`,
          description: opData.description,
          authRequired,
          parameters: opData.parameters,
          requestBodyRef: opData.requestBody?.content?.["application/json"]?.schema?.$ref,
          entityId: matchedEntity?.id,
          op,
        });
      }
    }

    return list;
  }, [spec, ir.entities]);

  // Available tags
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const ep of endpoints) {
      set.add(ep.tag);
    }
    return Array.from(set);
  }, [endpoints]);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesTag = selectedTag === "all" || ep.tag === selectedTag;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.tag.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    });
  }, [endpoints, selectedTag, search]);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  const handleCopyResponse = (id: string, body: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(body, null, 2));
    setCopiedResponseId(id);
    setTimeout(() => setCopiedResponseId(null), 2000);
  };

  const handleSendMockRequest = (ep: EndpointItem) => {
    setLoadingEndpointId(ep.id);
    setTimeout(() => {
      const matchedEntity = ir.entities.find((e) => e.name === ep.tag);
      if (matchedEntity) {
        const result = generateMockResponse(matchedEntity, ep.op);
        setMockResults((prev) => ({
          ...prev,
          [ep.id]: {
            status: result.status,
            body: result.body,
            timeMs: Math.floor(Math.random() * 12) + 6,
          },
        }));
      } else {
        // Fallback mock (e.g. auth)
        setMockResults((prev) => ({
          ...prev,
          [ep.id]: {
            status: ep.method === "POST" ? 201 : 200,
            body: {
              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_mock_jwt_token",
              message: "Authentication successful",
            },
            timeMs: 14,
          },
        }));
      }
      setLoadingEndpointId(null);
    }, 120);
  };

  const methodBadgeStyle = (method: EndpointItem["method"]) => {
    switch (method) {
      case "GET":
        return "bg-surface-elevated text-accent-primary border border-border-subtle";
      case "POST":
        return "bg-accent-primary text-accent-primary-fg";
      case "PATCH":
        return "bg-surface-elevated text-accent-secondary border border-border-subtle";
      case "DELETE":
        return "bg-surface-elevated text-accent-danger border border-border-subtle";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* 1. Subheader toolbar */}
      <div className="p-4 border-b border-border-subtle bg-surface-elevated/40 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search endpoints by path or summary..."
              className="w-full pl-8 pr-3 py-1.5 bg-canvas border border-border-strong rounded-md text-txt-primary placeholder:text-txt-muted outline-none focus:border-border-focus font-mono text-xs transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setRawSpecOpen(!rawSpecOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors ${
                rawSpecOpen
                  ? "bg-accent-primary text-accent-primary-fg border-accent-primary font-semibold"
                  : "bg-surface-elevated border-border-subtle text-txt-secondary hover:text-txt-primary"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{rawSpecOpen ? "Hide Raw JSON" : "Raw OpenAPI"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySpec}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-surface-elevated border border-border-subtle text-txt-secondary hover:text-txt-primary text-xs font-mono transition-colors"
              title="Copy OpenAPI 3.1 specification"
            >
              {copiedSpec ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent-primary" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Spec</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`px-2 py-0.5 rounded-sm font-mono text-[11px] transition-colors whitespace-nowrap ${
              selectedTag === "all"
                ? "bg-surface text-txt-primary border border-border-subtle font-semibold shadow-sm"
                : "text-txt-muted hover:text-txt-secondary"
            }`}
          >
            All ({endpoints.length})
          </button>
          {tags.map((tag) => {
            const count = endpoints.filter((e) => e.tag === tag).length;
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-0.5 rounded-sm font-mono text-[11px] transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-surface text-txt-primary border border-border-subtle font-semibold shadow-sm"
                    : "text-txt-muted hover:text-txt-secondary"
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {rawSpecOpen ? (
          /* Raw OpenAPI JSON Viewer */
          <div className="p-4">
            <div className="p-3 bg-canvas border border-border-subtle rounded-md overflow-x-auto">
              <pre className="font-mono text-[11px] text-txt-primary leading-relaxed whitespace-pre">
                {JSON.stringify(spec, null, 2)}
              </pre>
            </div>
          </div>
        ) : filteredEndpoints.length === 0 ? (
          /* Empty state: exactly one plain sentence per Castbase UI skill */
          <div className="p-10 text-center text-txt-muted">
            No API endpoints match the selected filter criteria.
          </div>
        ) : (
          /* Flat list of endpoints separated by 1px hairlines */
          <div className="divide-y divide-border-subtle">
            {filteredEndpoints.map((ep) => {
              const isExpanded = expandedId === ep.id;
              const mockResult = mockResults[ep.id];
              const isExecuting = loadingEndpointId === ep.id;

              return (
                <div key={ep.id} className="flex flex-col">
                  {/* Endpoint Header Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-surface-elevated cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                      )}

                      <span
                        className={`px-1.5 py-0.5 rounded-sm font-mono font-bold text-[10px] shrink-0 tracking-wider ${methodBadgeStyle(
                          ep.method
                        )}`}
                      >
                        {ep.method}
                      </span>

                      <span className="font-mono text-txt-primary truncate">
                        {ep.path}
                      </span>

                      {ep.authRequired && (
                        <span
                          title="Requires Bearer JWT Authorization header"
                          className="flex items-center gap-1 text-[10px] font-mono text-accent-secondary bg-surface border border-border-subtle px-1.5 py-0.5 rounded-sm shrink-0"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>AUTH</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-txt-muted hidden sm:inline truncate max-w-[200px]">
                        {ep.summary}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-txt-muted px-1.5 py-0.5 rounded bg-surface border border-border-subtle">
                        {ep.tag}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Inspector Panel */}
                  {isExpanded && (
                    <div className="p-4 bg-surface border-t border-border-subtle flex flex-col gap-4">
                      {/* Description & Operation Info */}
                      {ep.description && (
                        <p className="text-txt-secondary leading-relaxed">
                          {ep.description}
                        </p>
                      )}

                      {/* Request Parameters Table if any */}
                      {ep.parameters && ep.parameters.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[11px] text-txt-secondary font-semibold uppercase">
                            Parameters
                          </span>
                          <div className="border border-border-subtle rounded-md bg-canvas divide-y divide-border-subtle overflow-hidden">
                            {ep.parameters.map((param) => (
                              <div
                                key={param.name}
                                className="p-2 flex items-center justify-between font-mono text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-txt-primary font-bold">
                                    {param.name}
                                  </span>
                                  <span className="text-txt-muted text-[10px]">
                                    ({param.in})
                                  </span>
                                  {param.required && (
                                    <span className="text-accent-danger text-[10px]">
                                      required
                                    </span>
                                  )}
                                </div>
                                <span className="text-txt-secondary">
                                  {param.schema?.type || "string"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Schema Reference */}
                      {ep.requestBodyRef && (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[11px] text-txt-secondary font-semibold uppercase">
                            Request Body Schema
                          </span>
                          <div className="p-2.5 bg-canvas border border-border-subtle rounded-md font-mono text-[11px] text-txt-secondary flex items-center justify-between">
                            <span>$ref: {ep.requestBodyRef}</span>
                            <span className="text-txt-muted text-[10px]">
                              application/json
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Interactive Mock Runner CTA */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          disabled={isExecuting}
                          onClick={() => handleSendMockRequest(ep)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-accent-primary text-accent-primary-fg font-mono text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isExecuting ? "Executing..." : "Send Mock Request"}</span>
                        </button>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-txt-muted">
                          <span>Target:</span>
                          <span className="text-txt-secondary">http://localhost:3000{ep.path}</span>
                        </div>
                      </div>

                      {/* Mock Response Display */}
                      {mockResult && (
                        <div className="mt-2 flex flex-col gap-2 p-3 bg-canvas border border-border-subtle rounded-md">
                          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span
                                className={`px-2 py-0.5 rounded-sm font-bold ${
                                  mockResult.status >= 200 && mockResult.status < 300
                                    ? "bg-surface-elevated text-accent-primary border border-border-subtle"
                                    : "bg-surface-elevated text-accent-danger border border-border-subtle"
                                }`}
                              >
                                {mockResult.status}{" "}
                                {mockResult.status === 200
                                  ? "OK"
                                  : mockResult.status === 201
                                  ? "Created"
                                  : "Error"}
                              </span>
                              <span className="text-txt-muted">
                                {mockResult.timeMs}ms
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyResponse(ep.id, mockResult.body)}
                              className="flex items-center gap-1 text-[11px] font-mono text-txt-secondary hover:text-txt-primary p-1 rounded transition-colors"
                              title="Copy response body"
                            >
                              {copiedResponseId === ep.id ? (
                                <>
                                  <Check className="w-3 h-3 text-accent-primary" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <pre className="font-mono text-[11px] text-txt-primary overflow-x-auto p-1 leading-relaxed whitespace-pre">
                            {JSON.stringify(mockResult.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
