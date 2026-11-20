import type {
  IRDocument,
  Entity,
  Field,
  EndpointOp,
} from "@schemaflow/ir-schema";

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

/**
 * Maps SchemaFlow FieldType to OpenAPI 3.1 JSON Schema properties.
 */
function fieldToProperty(field: Field): Record<string, unknown> {
  switch (field.type) {
    case "uuid":
      return {
        type: "string",
        format: "uuid",
        description: field.isPrimaryKey ? "Primary key UUID" : undefined,
      };
    case "string":
      return {
        type: "string",
        enum: field.enumValues && field.enumValues.length > 0 ? field.enumValues : undefined,
        default: field.default,
      };
    case "int":
      return {
        type: "integer",
        format: "int32",
        default: typeof field.default === "number" ? field.default : undefined,
      };
    case "decimal":
      return {
        type: "number",
        format: "double",
        default: typeof field.default === "number" ? field.default : undefined,
      };
    case "bool":
      return {
        type: "boolean",
        default: typeof field.default === "boolean" ? field.default : undefined,
      };
    case "timestamp":
      return {
        type: "string",
        format: "date-time",
        description: "ISO 8601 timestamp",
      };
    case "enum":
      return {
        type: "string",
        enum: field.enumValues && field.enumValues.length > 0 ? field.enumValues : ["VALUE_1", "VALUE_2"],
        default: field.default,
      };
    case "json":
      return {
        type: "object",
        description: "Arbitrary JSON payload",
      };
    default:
      return { type: "string" };
  }
}

/**
 * Builds standard Entity schema, Create schema, and Update schema.
 */
function buildEntitySchemas(entity: Entity) {
  const fullProperties: Record<string, unknown> = {};
  const createProperties: Record<string, unknown> = {};
  const updateProperties: Record<string, unknown> = {};
  const requiredFields: string[] = [];
  const createRequiredFields: string[] = [];

  for (const field of entity.fields) {
    const prop = fieldToProperty(field);
    fullProperties[field.name] = prop;

    if (field.required) {
      requiredFields.push(field.name);
    }

    // Omit primary key and generated fields from Create schema
    if (!field.isPrimaryKey) {
      createProperties[field.name] = prop;
      updateProperties[field.name] = prop;

      if (field.required && field.default === undefined) {
        createRequiredFields.push(field.name);
      }
    }
  }

  return {
    [entity.name]: {
      type: "object",
      properties: fullProperties,
      required: requiredFields.length > 0 ? requiredFields : undefined,
    },
    [`${entity.name}Create`]: {
      type: "object",
      properties: createProperties,
      required: createRequiredFields.length > 0 ? createRequiredFields : undefined,
    },
    [`${entity.name}Update`]: {
      type: "object",
      properties: updateProperties,
    },
  };
}

/**
 * Generates deterministic OpenAPI 3.1.0 document from the active IRDocument.
 */
export function generateClientOpenAPI(ir: IRDocument): OpenAPISpec {
  const schemas: Record<string, unknown> = {};
  const paths: Record<string, Record<string, unknown>> = {};

  // Standard Error schema
  schemas["Error"] = {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      statusCode: { type: "integer" },
    },
    required: ["error", "message"],
  };

  // Add entity schemas
  for (const entity of ir.entities) {
    const entitySchemas = buildEntitySchemas(entity);
    Object.assign(schemas, entitySchemas);
  }

  // Global Auth Endpoints if auth is enabled
  if (ir.auth.enabled) {
    schemas["AuthRegisterRequest"] = {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" },
        role: {
          type: "string",
          enum: ir.auth.roles && ir.auth.roles.length > 0 ? ir.auth.roles : ["USER"],
        },
      },
      required: ["email", "password"],
    };

    schemas["AuthLoginRequest"] = {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" },
      },
      required: ["email", "password"],
    };

    schemas["AuthResponse"] = {
      type: "object",
      properties: {
        token: { type: "string", description: "JWT Access Token" },
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
          },
        },
      },
      required: ["token"],
    };

    paths["/api/auth/register"] = {
      post: {
        tags: ["Auth"],
        summary: "Register new user account",
        description: "Creates credentials and issues an initial JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthRegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Invalid registration payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    };

    paths["/api/auth/login"] = {
      post: {
        tags: ["Auth"],
        summary: "Login with email & password",
        description: "Authenticates credentials and returns a signed JWT Bearer token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthLoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    };
  }

  // Generate paths for each entity based on configured endpoints
  for (const entity of ir.entities) {
    const config = ir.endpoints.find((ep) => ep.entityId === entity.id) || {
      entityId: entity.id,
      ops: ["list", "get", "create", "update", "delete"] as EndpointOp[],
      authRequired: false,
    };

    const basePath = `/api/${entity.tableName}`;
    const itemPath = `/api/${entity.tableName}/{id}`;
    const security = config.authRequired ? [{ BearerAuth: [] }] : undefined;

    // Collection route (/api/<tableName>)
    const collectionMethods: Record<string, unknown> = {};

    if (config.ops.includes("list")) {
      collectionMethods["get"] = {
        tags: [entity.name],
        summary: `List ${entity.name} records`,
        description: `Returns paginated list of ${entity.name} entities`,
        security,
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20 },
            description: "Maximum number of records to return",
          },
          {
            name: "offset",
            in: "query",
            required: false,
            schema: { type: "integer", default: 0 },
            description: "Number of records to skip",
          },
        ],
        responses: {
          "200": {
            description: "List retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: `#/components/schemas/${entity.name}` },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          ...(config.authRequired
            ? {
                "401": {
                  description: "Unauthorized",
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/Error" },
                    },
                  },
                },
              }
            : {}),
        },
      };
    }

    if (config.ops.includes("create")) {
      collectionMethods["post"] = {
        tags: [entity.name],
        summary: `Create a new ${entity.name}`,
        description: `Creates a single ${entity.name} record`,
        security,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entity.name}Create` },
            },
          },
        },
        responses: {
          "201": {
            description: `${entity.name} created successfully`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entity.name}` },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      };
    }

    if (Object.keys(collectionMethods).length > 0) {
      paths[basePath] = collectionMethods;
    }

    // Item route (/api/<tableName>/{id})
    const itemMethods: Record<string, unknown> = {};

    if (config.ops.includes("get")) {
      itemMethods["get"] = {
        tags: [entity.name],
        summary: `Get ${entity.name} by ID`,
        description: `Finds and returns a single ${entity.name} record`,
        security,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Unique entity identifier",
          },
        ],
        responses: {
          "200": {
            description: "Record found",
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entity.name}` },
              },
            },
          },
          "404": {
            description: "Record not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      };
    }

    if (config.ops.includes("update")) {
      itemMethods["patch"] = {
        tags: [entity.name],
        summary: `Update ${entity.name}`,
        description: `Partially updates fields of an existing ${entity.name}`,
        security,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entity.name}Update` },
            },
          },
        },
        responses: {
          "200": {
            description: "Record updated",
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entity.name}` },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Record not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      };
    }

    if (config.ops.includes("delete")) {
      itemMethods["delete"] = {
        tags: [entity.name],
        summary: `Delete ${entity.name}`,
        description: `Permanently drops a ${entity.name} record`,
        security,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Record deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    id: { type: "string" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Record not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      };
    }

    if (Object.keys(itemMethods).length > 0) {
      paths[itemPath] = itemMethods;
    }
  }

  const spec: OpenAPISpec = {
    openapi: "3.1.0",
    info: {
      title: `${ir.project.name} API`,
      version: "1.0.0",
      description: `Instant interactive API for ${ir.project.name} on ${ir.project.database}`,
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    paths,
    components: {
      schemas,
      ...(ir.auth.enabled
        ? {
            securitySchemes: {
              BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT Bearer token authentication header",
              },
            },
          }
        : {}),
    },
  };

  return spec;
}

/**
 * Generates realistic mock field value based on field type and name.
 */
export function generateMockFieldValue(field: Field): unknown {
  const nameLower = field.name.toLowerCase();

  switch (field.type) {
    case "uuid":
      return "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    case "string":
      if (nameLower.includes("email")) return "alex.founder@castbase.dev";
      if (nameLower.includes("name") || nameLower.includes("title")) {
        return `Sample ${field.name.replace(/_/g, " ")}`;
      }
      if (nameLower.includes("url") || nameLower.includes("avatar")) {
        return "https://images.unsplash.com/photo-sample";
      }
      if (nameLower.includes("slug")) return "sample-post-entry";
      if (nameLower.includes("description") || nameLower.includes("content")) {
        return "High-performance low-latency architecture synthesizer designed for systems founders.";
      }
      return `${field.name}_val`;
    case "int":
      if (nameLower.includes("count") || nameLower.includes("views")) return 42;
      if (nameLower.includes("age")) return 28;
      if (nameLower.includes("status")) return 1;
      return 100;
    case "decimal":
      if (nameLower.includes("price") || nameLower.includes("amount")) return 99.95;
      return 3.14;
    case "bool":
      return true;
    case "timestamp":
      return new Date().toISOString();
    case "enum":
      return field.enumValues && field.enumValues.length > 0
        ? field.enumValues[0]
        : "ACTIVE";
    case "json":
      return { metadata: { source: "castbase", active: true } };
    default:
      return "sample_value";
  }
}

/**
 * Generates full mock entity object.
 */
export function generateMockEntity(entity: Entity): Record<string, unknown> {
  const mock: Record<string, unknown> = {};
  for (const field of entity.fields) {
    mock[field.name] = generateMockFieldValue(field);
  }
  return mock;
}

/**
 * Generates mock response for an operation.
 */
export function generateMockResponse(
  entity: Entity,
  op: EndpointOp
): { status: number; body: unknown } {
  const sample = generateMockEntity(entity);

  switch (op) {
    case "list":
      return {
        status: 200,
        body: {
          data: [sample, { ...sample, id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" }],
          total: 2,
          limit: 20,
          offset: 0,
        },
      };
    case "get":
      return {
        status: 200,
        body: sample,
      };
    case "create":
      return {
        status: 201,
        body: sample,
      };
    case "update":
      return {
        status: 200,
        body: { ...sample, updatedAt: new Date().toISOString() },
      };
    case "delete":
      return {
        status: 200,
        body: { success: true, id: sample.id || "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
      };
    default:
      return { status: 200, body: sample };
  }
}
