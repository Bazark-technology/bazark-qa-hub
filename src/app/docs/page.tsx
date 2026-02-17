import {
  TableOfContents,
  EndpointSection,
  CodeBlock,
} from "@/components/docs";

export default function DocsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-12">
        <TableOfContents />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <div id="getting-started" className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold text-gray-900">Bazark QA API</h1>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                v1.0
              </span>
            </div>
            <p className="text-lg text-gray-600 mb-4">
              API documentation for integrating QA agents with the Bazark QA Dashboard.
              Use these endpoints to register agents, submit test runs, and report results.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
              <span className="text-sm text-gray-500">Base URL:</span>
              <code className="text-sm font-mono font-semibold text-slate-800">
                https://qa.bazark.sa/api
              </code>
            </div>
          </div>

          {/* Introduction */}
          <section id="introduction" className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 mb-4">
              The Bazark QA API allows automated QA agents to integrate with the dashboard for
              tracking test runs, reporting results, and monitoring agent health. The API follows
              RESTful conventions and returns JSON responses.
            </p>
            <p className="text-gray-600">
              All timestamps are in ISO 8601 format (UTC). All request bodies should be sent as
              JSON with <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">Content-Type: application/json</code>.
            </p>
          </section>

          {/* Authentication */}
          <section id="authentication" className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
            <p className="text-gray-600 mb-6">
              The API supports two authentication methods:
            </p>

            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">API Key Authentication</h3>
                <p className="text-gray-600 mb-4">
                  Used by QA agents. Pass the API key as a Bearer token in the Authorization header.
                  Master keys can register agents; agent keys are used for heartbeats and test reporting.
                </p>
                <CodeBlock
                  code="Authorization: Bearer bqa_your_api_key_here"
                  language="http"
                />
              </div>

              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Authentication</h3>
                <p className="text-gray-600">
                  Used by dashboard users. Cookie-based authentication via NextAuth.
                  Available after logging in to the dashboard at <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">/login</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Base URL */}
          <section id="base-url" className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Base URL</h2>
            <p className="text-gray-600 mb-4">
              All API endpoints are relative to the base URL:
            </p>
            <CodeBlock code="https://qa.bazark.sa/api" language="text" />
            <p className="text-gray-600 mt-4">
              For local development, use <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">http://localhost:3000/api</code>.
            </p>
          </section>

          {/* Agents Section */}
          <div id="agents" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              Agents
            </h2>

            <EndpointSection
              id="register-agent"
              method="POST"
              path="/api/agents/register"
              description="Register a new agent or update an existing one. If an agent with the same name already exists, it will be updated and returned."
              auth="api-key"
              requestBody={`{
  "name": "bazark-qa-agent-01",
  "dev_url": "https://dev.bazark.sa/",
  "repo_url": "https://github.com/org/bazark-app",
  "branch": "main",
  "hostname": "vm-bazark-qa-agent-01",
  "version": "2026.2.15"
}`}
              responseBody={`{
  "success": true,
  "agent": {
    "id": "clx...",
    "name": "bazark-qa-agent-01",
    "api_key": "bqa_...",
    "status": "ONLINE",
    "dev_url": "https://dev.bazark.sa/",
    "created_at": "2026-02-17T00:00:00.000Z"
  }
}`}
              curlExample={`curl -X POST https://qa.bazark.sa/api/agents/register \\
  -H "Authorization: Bearer bqa_your_master_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "bazark-qa-agent-01",
    "dev_url": "https://dev.bazark.sa/",
    "repo_url": "https://github.com/org/bazark-app",
    "branch": "main",
    "hostname": "vm-bazark-qa-agent-01",
    "version": "2026.2.15"
  }'`}
              notes="The api_key returned is unique to this agent. Store it securely for heartbeats and test reporting."
            />

            <EndpointSection
              id="heartbeat"
              method="POST"
              path="/api/agents/heartbeat"
              description="Send periodic heartbeat to keep agent status online. Send every 60 seconds. Agent is marked offline after 3 minutes without a heartbeat."
              auth="api-key"
              requestBody={`{
  "agent_id": "clx...",
  "status": "ONLINE",
  "current_task": "Testing commit abc123"
}`}
              responseBody={`{
  "success": true,
  "received_at": "2026-02-17T07:30:00.000Z"
}`}
              curlExample={`curl -X POST https://qa.bazark.sa/api/agents/heartbeat \\
  -H "Authorization: Bearer bqa_agent_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "clx...",
    "status": "ONLINE",
    "current_task": "Testing commit abc123"
  }'`}
            />

            <EndpointSection
              id="list-agents"
              method="GET"
              path="/api/agents"
              description="List all registered agents with their stats and status."
              auth="session"
              queryParams={[
                { name: "status", description: "Filter by status: ONLINE, OFFLINE, RUNNING, ERROR, PAUSED" },
              ]}
              responseBody={`{
  "success": true,
  "agents": [
    {
      "id": "clx...",
      "name": "bazark-qa-agent-01",
      "status": "ONLINE",
      "dev_url": "https://dev.bazark.sa/",
      "last_heartbeat": "2026-02-17T07:30:00.000Z",
      "stats": {
        "total_runs": 45,
        "pass_rate": 92.5,
        "last_run": "2026-02-17T06:00:00.000Z"
      }
    }
  ]
}`}
            />

            <EndpointSection
              id="get-agent"
              method="GET"
              path="/api/agents/:id"
              description="Get detailed information about a single agent including recent test runs."
              auth="session"
              responseBody={`{
  "success": true,
  "agent": {
    "id": "clx...",
    "name": "bazark-qa-agent-01",
    "status": "ONLINE",
    "dev_url": "https://dev.bazark.sa/",
    "repo_url": "https://github.com/org/bazark-app",
    "branch": "main",
    "hostname": "vm-bazark-qa-agent-01",
    "version": "2026.2.15",
    "last_heartbeat": "2026-02-17T07:30:00.000Z",
    "stats": {
      "total_runs": 45,
      "pass_rate": 92.5
    },
    "recent_runs": [...]
  }
}`}
            />

            <EndpointSection
              id="update-agent"
              method="PATCH"
              path="/api/agents/:id"
              description="Update agent configuration. Only admins can perform this action."
              auth="admin"
              requestBody={`{
  "name": "bazark-qa-agent-01-updated",
  "dev_url": "https://staging.bazark.sa/",
  "branch": "develop"
}`}
              responseBody={`{
  "success": true,
  "agent": {
    "id": "clx...",
    "name": "bazark-qa-agent-01-updated",
    "updated_at": "2026-02-17T08:00:00.000Z"
  }
}`}
            />

            <EndpointSection
              id="delete-agent"
              method="DELETE"
              path="/api/agents/:id"
              description="Remove an agent and all its associated data. Only admins can perform this action. This action cannot be undone."
              auth="admin"
              responseBody={`{
  "success": true,
  "message": "Agent deleted successfully"
}`}
            />
          </div>

          {/* Test Runs Section */}
          <div id="test-runs" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              Test Runs
            </h2>

            <EndpointSection
              id="create-test-run"
              method="POST"
              path="/api/test-runs"
              description="Start a new QA test run with a checklist of test cases. Typically called after analyzing git commits."
              auth="api-key"
              requestBody={`{
  "agent_id": "clx...",
  "commit_hash": "abc1234",
  "commit_message": "feat: add password reset flow",
  "commit_author": "dev@bazark.sa",
  "branch": "main",
  "test_cases": [
    {
      "title": "Password reset page loads",
      "url_path": "/reset-password",
      "steps": [
        "Navigate to /reset-password",
        "Verify page loads without errors",
        "Check that email input field is present"
      ],
      "expected": "Page loads with email input and submit button",
      "priority": "HIGH"
    },
    {
      "title": "Password reset form validation",
      "url_path": "/reset-password",
      "steps": [
        "Navigate to /reset-password",
        "Click submit without entering email",
        "Check for validation error"
      ],
      "expected": "Validation error message displayed for empty email",
      "priority": "HIGH"
    }
  ]
}`}
              responseBody={`{
  "success": true,
  "test_run": {
    "id": "clx_run_...",
    "status": "RUNNING",
    "commit_hash": "abc1234",
    "total_tests": 2,
    "test_cases": [
      {
        "id": "clx_tc_001",
        "title": "Password reset page loads",
        "status": "PENDING"
      },
      {
        "id": "clx_tc_002",
        "title": "Password reset form validation",
        "status": "PENDING"
      }
    ]
  }
}`}
              curlExample={`curl -X POST https://qa.bazark.sa/api/test-runs \\
  -H "Authorization: Bearer bqa_agent_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "clx...",
    "commit_hash": "abc1234",
    "commit_message": "feat: add password reset flow",
    "commit_author": "dev@bazark.sa",
    "branch": "main",
    "test_cases": [...]
  }'`}
            />

            <EndpointSection
              id="list-test-runs"
              method="GET"
              path="/api/test-runs"
              description="List all test runs with filtering and pagination."
              auth="session"
              queryParams={[
                { name: "agent_id", description: "Filter by agent ID" },
                { name: "status", description: "Filter by status: QUEUED, RUNNING, PASSED, FAILED, CANCELLED" },
                { name: "branch", description: "Filter by git branch" },
                { name: "start_date", description: "Filter runs after this date (ISO 8601)" },
                { name: "end_date", description: "Filter runs before this date (ISO 8601)" },
                { name: "page", description: "Page number (default: 1)" },
                { name: "limit", description: "Results per page (default: 20)" },
              ]}
              responseBody={`{
  "success": true,
  "test_runs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}`}
            />

            <EndpointSection
              id="get-test-run"
              method="GET"
              path="/api/test-runs/:id"
              description="Get full test run details including all test cases and their results."
              auth="session"
              responseBody={`{
  "success": true,
  "test_run": {
    "id": "clx_run_...",
    "status": "FAILED",
    "commit_hash": "abc1234",
    "commit_message": "feat: add password reset flow",
    "total_tests": 2,
    "passed": 1,
    "failed": 1,
    "test_cases": [
      {
        "id": "clx_tc_001",
        "title": "Password reset page loads",
        "status": "PASS",
        "duration_ms": 1500
      },
      {
        "id": "clx_tc_002",
        "title": "Password reset form validation",
        "status": "FAIL",
        "actual": "No validation error displayed",
        "bug_description": "Missing client-side validation"
      }
    ]
  }
}`}
            />

            <EndpointSection
              id="complete-test-run"
              method="POST"
              path="/api/test-runs/:id/complete"
              description="Mark a test run as complete with final status and counts."
              auth="api-key"
              requestBody={`{
  "status": "FAILED",
  "passed": 1,
  "failed": 1,
  "skipped": 0
}`}
              responseBody={`{
  "success": true,
  "test_run": {
    "id": "clx_run_...",
    "status": "FAILED",
    "passed": 1,
    "failed": 1,
    "skipped": 0,
    "finished_at": "2026-02-17T07:45:00.000Z"
  }
}`}
              curlExample={`curl -X POST https://qa.bazark.sa/api/test-runs/clx_run_.../complete \\
  -H "Authorization: Bearer bqa_agent_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "FAILED",
    "passed": 1,
    "failed": 1,
    "skipped": 0
  }'`}
            />
          </div>

          {/* Test Cases Section */}
          <div id="test-cases" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              Test Cases
            </h2>

            <EndpointSection
              id="update-test-case"
              method="PATCH"
              path="/api/test-cases/:id"
              description="Update a single test case result. Call this as the agent completes each test."
              auth="api-key"
              requestBody={`{
  "status": "FAIL",
  "actual": "No validation error displayed when submitting empty form",
  "bug_description": "Missing client-side validation on reset password form. Form submits without email and returns 500 error instead of showing validation message.",
  "duration_ms": 3200,
  "screenshots": [
    "/qa-reports/2026-02-17/tc-002-step1.png",
    "/qa-reports/2026-02-17/tc-002-step2-fail.png"
  ],
  "video_url": "/qa-reports/2026-02-17/tc-002-recording.webm"
}`}
              responseBody={`{
  "success": true,
  "test_case": {
    "id": "clx_tc_002",
    "title": "Password reset form validation",
    "status": "FAIL",
    "duration_ms": 3200,
    "updated_at": "2026-02-17T07:42:00.000Z"
  }
}`}
              curlExample={`curl -X PATCH https://qa.bazark.sa/api/test-cases/clx_tc_002 \\
  -H "Authorization: Bearer bqa_agent_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "PASS",
    "actual": "Page loads correctly with email input and submit button",
    "duration_ms": 1500,
    "screenshots": ["/qa-reports/2026-02-17/tc-001-pass.png"]
  }'`}
              notes="Status can be: PENDING, RUNNING, PASS, FAIL, SKIPPED, or BLOCKED."
            />
          </div>

          {/* API Keys Section */}
          <div id="api-keys" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              API Keys
            </h2>

            <EndpointSection
              id="generate-key"
              method="POST"
              path="/api/settings/api-keys"
              description="Generate a new master API key for agent registration. Only admins can create API keys."
              auth="admin"
              requestBody={`{
  "label": "Production Agent Key"
}`}
              responseBody={`{
  "success": true,
  "api_key": {
    "id": "clx...",
    "key": "bqa_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "label": "Production Agent Key",
    "created_at": "2026-02-17T00:00:00.000Z"
  }
}`}
              notes="The key value is only returned once at creation. Store it securely - it cannot be retrieved again."
            />

            <EndpointSection
              id="list-keys"
              method="GET"
              path="/api/settings/api-keys"
              description="List all API keys. Keys are masked for security."
              auth="admin"
              responseBody={`{
  "success": true,
  "api_keys": [
    {
      "id": "clx...",
      "key": "bqa_a1b2****p6",
      "label": "Production Agent Key",
      "is_active": true,
      "last_used": "2026-02-17T07:30:00.000Z",
      "created_at": "2026-02-17T00:00:00.000Z",
      "created_by": {
        "name": "Admin User",
        "email": "admin@bazark.sa"
      }
    }
  ]
}`}
            />

            <EndpointSection
              id="revoke-key"
              method="DELETE"
              path="/api/settings/api-keys/:id"
              description="Revoke an API key. The key will immediately stop working for all agents using it."
              auth="admin"
              responseBody={`{
  "success": true,
  "message": "API key revoked successfully"
}`}
            />
          </div>

          {/* Webhook Section */}
          <div id="webhook" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              Webhook
            </h2>

            <EndpointSection
              id="github-webhook"
              method="POST"
              path="/api/webhook/github"
              description="GitHub webhook endpoint. Triggers a QA run when code is pushed. Configure in GitHub repo settings > Webhooks."
              auth="webhook"
              notes="GitHub sends push event payload automatically. Configure the webhook secret in your GitHub repository settings. The dashboard will create a test run request for the relevant agent based on repo URL."
            />
          </div>

          {/* Integration Section */}
          <div id="integration" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              Integration
            </h2>

            <section id="openclaw-setup" className="py-8 border-b border-gray-200 scroll-mt-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">OpenClaw Setup</h3>
              <p className="text-gray-600 mb-6">
                To integrate an OpenClaw agent with Bazark QA Dashboard, follow these steps:
              </p>

              <ol className="space-y-4 text-gray-600">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  <span>Generate a master API key from Settings &gt; API Keys in the dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  <span>Configure your OpenClaw agent with the API key as an environment variable</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  <span>Agent registers on startup using <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">POST /api/agents/register</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                  <span>Agent sends heartbeats every 60 seconds to stay online</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
                  <span>On git push or cron trigger, agent analyzes commits</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">6</span>
                  <span>Agent creates a test run with checklist via <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">POST /api/test-runs</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">7</span>
                  <span>Agent tests each item in browser</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">8</span>
                  <span>Agent updates each test case result via <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">PATCH /api/test-cases/:id</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">9</span>
                  <span>Agent marks run as complete via <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">POST /api/test-runs/:id/complete</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">10</span>
                  <span>Dashboard shows results in real-time</span>
                </li>
              </ol>
            </section>

            <section id="full-workflow" className="py-8 border-b border-gray-200 scroll-mt-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Full Workflow Example</h3>
              <p className="text-gray-600 mb-4">
                Here&apos;s a complete bash script showing the full integration workflow:
              </p>

              <CodeBlock
                title="qa-agent.sh"
                language="bash"
                code={`#!/bin/bash

# Configuration
API_BASE="https://qa.bazark.sa/api"
MASTER_KEY="bqa_your_master_key"

# Step 1: Register agent
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/agents/register" \\
  -H "Authorization: Bearer $MASTER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-qa-agent",
    "dev_url": "https://dev.myapp.com/",
    "repo_url": "https://github.com/org/myapp",
    "branch": "main",
    "hostname": "'$(hostname)'",
    "version": "1.0.0"
  }')

AGENT_ID=$(echo $REGISTER_RESPONSE | jq -r '.agent.id')
AGENT_KEY=$(echo $REGISTER_RESPONSE | jq -r '.agent.api_key')

echo "Agent registered: $AGENT_ID"

# Step 2: Start heartbeat in background
while true; do
  curl -s -X POST "$API_BASE/agents/heartbeat" \\
    -H "Authorization: Bearer $AGENT_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"agent_id": "'$AGENT_ID'", "status": "ONLINE"}' > /dev/null
  sleep 60
done &
HEARTBEAT_PID=$!

# Step 3: Create test run
TEST_RUN_RESPONSE=$(curl -s -X POST "$API_BASE/test-runs" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "'$AGENT_ID'",
    "commit_hash": "abc1234",
    "commit_message": "feat: add login",
    "commit_author": "dev@company.com",
    "branch": "main",
    "test_cases": [
      {
        "title": "Login page loads",
        "url_path": "/login",
        "steps": ["Navigate to /login", "Check page loads"],
        "expected": "Login form visible",
        "priority": "HIGH"
      }
    ]
  }')

RUN_ID=$(echo $TEST_RUN_RESPONSE | jq -r '.test_run.id')
TC_ID=$(echo $TEST_RUN_RESPONSE | jq -r '.test_run.test_cases[0].id')

# Step 4: Run test and update result
curl -s -X PATCH "$API_BASE/test-cases/$TC_ID" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "PASS",
    "actual": "Login form displayed correctly",
    "duration_ms": 1200
  }'

# Step 5: Complete test run
curl -s -X POST "$API_BASE/test-runs/$RUN_ID/complete" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "PASSED", "passed": 1, "failed": 0, "skipped": 0}'

# Cleanup
kill $HEARTBEAT_PID`}
              />
            </section>
          </div>

          {/* Reference Section */}
          <div id="reference" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-8 border-t border-gray-200">
              Reference
            </h2>

            <section id="error-codes" className="py-8 border-b border-gray-200 scroll-mt-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Error Codes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-900">Code</th>
                      <th className="pb-3 font-semibold text-gray-900">Status</th>
                      <th className="pb-3 font-semibold text-gray-900">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3"><code className="text-green-600">200</code></td>
                      <td className="py-3">OK</td>
                      <td className="py-3 text-gray-600">Request successful</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-green-600">201</code></td>
                      <td className="py-3">Created</td>
                      <td className="py-3 text-gray-600">Resource created successfully</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-red-600">400</code></td>
                      <td className="py-3">Bad Request</td>
                      <td className="py-3 text-gray-600">Missing or invalid fields in request</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-red-600">401</code></td>
                      <td className="py-3">Unauthorized</td>
                      <td className="py-3 text-gray-600">Missing or invalid API key / session</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-red-600">403</code></td>
                      <td className="py-3">Forbidden</td>
                      <td className="py-3 text-gray-600">Insufficient permissions (e.g., non-admin on admin routes)</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-red-600">404</code></td>
                      <td className="py-3">Not Found</td>
                      <td className="py-3 text-gray-600">Resource does not exist</td>
                    </tr>
                    <tr>
                      <td className="py-3"><code className="text-red-600">500</code></td>
                      <td className="py-3">Internal Server Error</td>
                      <td className="py-3 text-gray-600">Server error - contact support if persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="rate-limits" className="py-8 scroll-mt-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rate Limits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-900">Endpoint Type</th>
                      <th className="pb-3 font-semibold text-gray-900">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3">API Key endpoints</td>
                      <td className="py-3 text-gray-600">100 requests per minute per key</td>
                    </tr>
                    <tr>
                      <td className="py-3">Heartbeat</td>
                      <td className="py-3 text-gray-600">1 request per 30 seconds per agent</td>
                    </tr>
                    <tr>
                      <td className="py-3">Session endpoints</td>
                      <td className="py-3 text-gray-600">60 requests per minute per user</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>Bazark QA Dashboard API Documentation v1.0</p>
            <p className="mt-1">
              Need help? Contact <a href="mailto:support@bazark.sa" className="text-blue-600 hover:underline">support@bazark.sa</a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
