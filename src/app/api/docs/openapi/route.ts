import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Bazark QA API",
    description:
      "API for integrating QA agents with the Bazark QA Dashboard. Register agents, submit test runs, and report results.",
    version: "1.0.0",
    contact: {
      email: "support@bazark.sa",
    },
  },
  servers: [
    {
      url: "https://qa.bazark.sa/api",
      description: "Production server",
    },
    {
      url: "http://localhost:3000/api",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Agents", description: "Agent management endpoints" },
    { name: "Test Runs", description: "Test run management endpoints" },
    { name: "Test Cases", description: "Test case management endpoints" },
    { name: "API Keys", description: "API key management endpoints (Admin)" },
  ],
  paths: {
    "/agents/register": {
      post: {
        tags: ["Agents"],
        summary: "Register a new agent",
        description:
          "Register a new agent or update an existing one. If an agent with the same name exists, it will be updated.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AgentRegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Agent registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentRegisterResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/agents/heartbeat": {
      post: {
        tags: ["Agents"],
        summary: "Send agent heartbeat",
        description:
          "Send periodic heartbeat to keep agent status online. Send every 60 seconds.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HeartbeatRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Heartbeat received",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HeartbeatResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/agents": {
      get: {
        tags: ["Agents"],
        summary: "List all agents",
        description: "Get a list of all registered agents with their stats.",
        security: [{ SessionAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/AgentStatus" },
          },
        ],
        responses: {
          "200": {
            description: "List of agents",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentsListResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/agents/{id}": {
      get: {
        tags: ["Agents"],
        summary: "Get agent details",
        security: [{ SessionAuth: [] }],
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
            description: "Agent details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentDetailResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Agents"],
        summary: "Update agent",
        description: "Update agent configuration. Admin only.",
        security: [{ SessionAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AgentUpdateRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Agent updated" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Agents"],
        summary: "Delete agent",
        description: "Remove an agent. Admin only.",
        security: [{ SessionAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Agent deleted" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/test-runs": {
      post: {
        tags: ["Test Runs"],
        summary: "Create test run",
        description:
          "Start a new QA test run with a checklist of test cases.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTestRunRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Test run created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTestRunResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      get: {
        tags: ["Test Runs"],
        summary: "List test runs",
        security: [{ SessionAuth: [] }],
        parameters: [
          { name: "agent_id", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/RunStatus" },
          },
          { name: "branch", in: "query", schema: { type: "string" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "List of test runs",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TestRunsListResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/test-runs/{id}": {
      get: {
        tags: ["Test Runs"],
        summary: "Get test run details",
        security: [{ SessionAuth: [] }],
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
            description: "Test run details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TestRunDetailResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/test-runs/{id}/complete": {
      post: {
        tags: ["Test Runs"],
        summary: "Complete test run",
        description: "Mark a test run as complete with final status.",
        security: [{ BearerAuth: [] }],
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
              schema: { $ref: "#/components/schemas/CompleteTestRunRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Test run completed" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/test-cases/{id}": {
      patch: {
        tags: ["Test Cases"],
        summary: "Update test case result",
        description:
          "Update a single test case result as the agent completes each test.",
        security: [{ BearerAuth: [] }],
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
              schema: { $ref: "#/components/schemas/UpdateTestCaseRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Test case updated" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/settings/api-keys": {
      post: {
        tags: ["API Keys"],
        summary: "Generate API key",
        description: "Generate a new master API key. Admin only.",
        security: [{ SessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateApiKeyRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "API key created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateApiKeyResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      get: {
        tags: ["API Keys"],
        summary: "List API keys",
        description: "List all API keys (masked). Admin only.",
        security: [{ SessionAuth: [] }],
        responses: {
          "200": {
            description: "List of API keys",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeysListResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/settings/api-keys/{id}": {
      delete: {
        tags: ["API Keys"],
        summary: "Revoke API key",
        description: "Revoke an API key. Admin only.",
        security: [{ SessionAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "API key revoked" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key authentication for agents",
      },
      SessionAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description: "Session cookie authentication for dashboard users",
      },
    },
    schemas: {
      AgentStatus: {
        type: "string",
        enum: ["ONLINE", "OFFLINE", "RUNNING", "ERROR", "PAUSED"],
      },
      RunStatus: {
        type: "string",
        enum: ["QUEUED", "RUNNING", "PASSED", "FAILED", "CANCELLED", "TIMED_OUT"],
      },
      TestStatus: {
        type: "string",
        enum: ["PENDING", "RUNNING", "PASS", "FAIL", "SKIPPED", "BLOCKED"],
      },
      Priority: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      },
      AgentRegisterRequest: {
        type: "object",
        required: ["name", "dev_url", "repo_url"],
        properties: {
          name: { type: "string" },
          dev_url: { type: "string", format: "uri" },
          repo_url: { type: "string", format: "uri" },
          branch: { type: "string", default: "main" },
          hostname: { type: "string" },
          version: { type: "string" },
        },
      },
      AgentRegisterResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          agent: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              api_key: { type: "string" },
              status: { $ref: "#/components/schemas/AgentStatus" },
              dev_url: { type: "string" },
              created_at: { type: "string", format: "date-time" },
            },
          },
        },
      },
      HeartbeatRequest: {
        type: "object",
        required: ["agent_id"],
        properties: {
          agent_id: { type: "string" },
          status: { $ref: "#/components/schemas/AgentStatus" },
          current_task: { type: "string" },
        },
      },
      HeartbeatResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          received_at: { type: "string", format: "date-time" },
        },
      },
      AgentsListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          agents: {
            type: "array",
            items: { $ref: "#/components/schemas/AgentSummary" },
          },
        },
      },
      AgentSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { $ref: "#/components/schemas/AgentStatus" },
          dev_url: { type: "string" },
          last_heartbeat: { type: "string", format: "date-time" },
          stats: {
            type: "object",
            properties: {
              total_runs: { type: "integer" },
              pass_rate: { type: "number" },
              last_run: { type: "string", format: "date-time" },
            },
          },
        },
      },
      AgentDetailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          agent: { $ref: "#/components/schemas/AgentSummary" },
        },
      },
      AgentUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          dev_url: { type: "string", format: "uri" },
          repo_url: { type: "string", format: "uri" },
          branch: { type: "string" },
          status: { $ref: "#/components/schemas/AgentStatus" },
        },
      },
      TestCaseInput: {
        type: "object",
        required: ["title", "url_path", "steps", "expected"],
        properties: {
          title: { type: "string" },
          url_path: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          expected: { type: "string" },
          priority: { $ref: "#/components/schemas/Priority" },
          description: { type: "string" },
          category: { type: "string" },
        },
      },
      CreateTestRunRequest: {
        type: "object",
        required: [
          "agent_id",
          "commit_hash",
          "commit_message",
          "commit_author",
          "test_cases",
        ],
        properties: {
          agent_id: { type: "string" },
          commit_hash: { type: "string" },
          commit_message: { type: "string" },
          commit_author: { type: "string" },
          branch: { type: "string", default: "main" },
          test_cases: {
            type: "array",
            items: { $ref: "#/components/schemas/TestCaseInput" },
          },
        },
      },
      CreateTestRunResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          test_run: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { $ref: "#/components/schemas/RunStatus" },
              commit_hash: { type: "string" },
              total_tests: { type: "integer" },
              test_cases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    status: { $ref: "#/components/schemas/TestStatus" },
                  },
                },
              },
            },
          },
        },
      },
      TestRunsListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          test_runs: { type: "array", items: { type: "object" } },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              total_pages: { type: "integer" },
            },
          },
        },
      },
      TestRunDetailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          test_run: { type: "object" },
        },
      },
      CompleteTestRunRequest: {
        type: "object",
        required: ["status", "passed", "failed"],
        properties: {
          status: { $ref: "#/components/schemas/RunStatus" },
          passed: { type: "integer" },
          failed: { type: "integer" },
          skipped: { type: "integer", default: 0 },
        },
      },
      UpdateTestCaseRequest: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/TestStatus" },
          actual: { type: "string" },
          bug_description: { type: "string" },
          duration_ms: { type: "integer" },
          screenshots: { type: "array", items: { type: "string" } },
          video_url: { type: "string" },
        },
      },
      CreateApiKeyRequest: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string" },
        },
      },
      CreateApiKeyResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          api_key: {
            type: "object",
            properties: {
              id: { type: "string" },
              key: { type: "string" },
              label: { type: "string" },
              created_at: { type: "string", format: "date-time" },
            },
          },
        },
      },
      ApiKeysListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          api_keys: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                key: { type: "string", description: "Masked key" },
                label: { type: "string" },
                is_active: { type: "boolean" },
                last_used: { type: "string", format: "date-time" },
                created_at: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad Request - Missing or invalid fields",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized - Missing or invalid credentials",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Forbidden - Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Not Found - Resource does not exist",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
