import { NextResponse } from "next/server";

const markdown = `# Bazark QA API Documentation

**Version:** 1.0
**Base URL:** \`https://qa.bazark.sa/api\`

API documentation for integrating QA agents with the Bazark QA Dashboard. Use these endpoints to register agents, submit test runs, and report results.

---

## Authentication

### API Key Authentication
Used by QA agents. Pass the API key as a Bearer token in the Authorization header.

\`\`\`http
Authorization: Bearer bqa_your_api_key_here
\`\`\`

- **Master keys**: Used to register new agents
- **Agent keys**: Used for heartbeats and test reporting (returned when agent registers)

### Session Authentication
Used by dashboard users. Cookie-based authentication via NextAuth after logging in at \`/login\`.

---

## Agents

### POST /api/agents/register

Register a new agent or update an existing one.

**Auth:** API Key (master key)

**Request:**
\`\`\`json
{
  "name": "bazark-qa-agent-01",
  "dev_url": "https://dev.bazark.sa/",
  "repo_url": "https://github.com/org/bazark-app",
  "branch": "main",
  "hostname": "vm-bazark-qa-agent-01",
  "version": "2026.2.15"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "agent": {
    "id": "clx...",
    "name": "bazark-qa-agent-01",
    "api_key": "bqa_...",
    "status": "ONLINE",
    "dev_url": "https://dev.bazark.sa/",
    "created_at": "2026-02-17T00:00:00.000Z"
  }
}
\`\`\`

**cURL:**
\`\`\`bash
curl -X POST https://qa.bazark.sa/api/agents/register \\
  -H "Authorization: Bearer bqa_your_master_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "bazark-qa-agent-01",
    "dev_url": "https://dev.bazark.sa/",
    "repo_url": "https://github.com/org/bazark-app",
    "branch": "main",
    "hostname": "vm-bazark-qa-agent-01",
    "version": "2026.2.15"
  }'
\`\`\`

---

### POST /api/agents/heartbeat

Send periodic heartbeat to keep agent status online. Send every 60 seconds. Agent marked offline after 3 minutes without heartbeat.

**Auth:** API Key (agent key)

**Request:**
\`\`\`json
{
  "agent_id": "clx...",
  "status": "ONLINE",
  "current_task": "Testing commit abc123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "received_at": "2026-02-17T07:30:00.000Z"
}
\`\`\`

---

### GET /api/agents

List all registered agents with stats.

**Auth:** Session

**Query Parameters:**
- \`status\`: Filter by ONLINE, OFFLINE, RUNNING, ERROR, PAUSED

**Response (200):**
\`\`\`json
{
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
}
\`\`\`

---

### GET /api/agents/:id

Get single agent details.

**Auth:** Session

---

### PATCH /api/agents/:id

Update agent configuration.

**Auth:** Session (ADMIN only)

---

### DELETE /api/agents/:id

Remove an agent.

**Auth:** Session (ADMIN only)

---

## Test Runs

### POST /api/test-runs

Start a new QA test run with a checklist of test cases.

**Auth:** API Key (agent key)

**Request:**
\`\`\`json
{
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
    }
  ]
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "test_run": {
    "id": "clx_run_...",
    "status": "RUNNING",
    "commit_hash": "abc1234",
    "total_tests": 1,
    "test_cases": [
      {
        "id": "clx_tc_001",
        "title": "Password reset page loads",
        "status": "PENDING"
      }
    ]
  }
}
\`\`\`

---

### GET /api/test-runs

List all test runs with filtering and pagination.

**Auth:** Session

**Query Parameters:**
- \`agent_id\`: Filter by agent ID
- \`status\`: Filter by QUEUED, RUNNING, PASSED, FAILED, CANCELLED
- \`branch\`: Filter by git branch
- \`start_date\`: Filter runs after this date (ISO 8601)
- \`end_date\`: Filter runs before this date (ISO 8601)
- \`page\`: Page number (default: 1)
- \`limit\`: Results per page (default: 20)

---

### GET /api/test-runs/:id

Get full test run details with all test cases and results.

**Auth:** Session

---

### POST /api/test-runs/:id/complete

Mark a test run as complete.

**Auth:** API Key (agent key)

**Request:**
\`\`\`json
{
  "status": "FAILED",
  "passed": 2,
  "failed": 1,
  "skipped": 0
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "test_run": {
    "id": "clx_run_...",
    "status": "FAILED",
    "passed": 2,
    "failed": 1,
    "skipped": 0,
    "finished_at": "2026-02-17T07:45:00.000Z"
  }
}
\`\`\`

---

## Test Cases

### PATCH /api/test-cases/:id

Update a single test case result. Call this as the agent completes each test.

**Auth:** API Key (agent key)

**Request (for failed test):**
\`\`\`json
{
  "status": "FAIL",
  "actual": "No validation error displayed when submitting empty form",
  "bug_description": "Missing client-side validation on reset password form.",
  "duration_ms": 3200,
  "screenshots": [
    "/qa-reports/2026-02-17/tc-002-step1.png",
    "/qa-reports/2026-02-17/tc-002-step2-fail.png"
  ],
  "video_url": "/qa-reports/2026-02-17/tc-002-recording.webm"
}
\`\`\`

**Request (for passing test):**
\`\`\`json
{
  "status": "PASS",
  "actual": "Page loads correctly with email input and submit button visible",
  "duration_ms": 1500,
  "screenshots": ["/qa-reports/2026-02-17/tc-001-pass.png"]
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "test_case": {
    "id": "clx_tc_002",
    "title": "Password reset form validation",
    "status": "FAIL",
    "duration_ms": 3200,
    "updated_at": "2026-02-17T07:42:00.000Z"
  }
}
\`\`\`

**Status values:** PENDING, RUNNING, PASS, FAIL, SKIPPED, BLOCKED

---

## API Keys (Admin)

### POST /api/settings/api-keys

Generate a new master API key for agent registration.

**Auth:** Session (ADMIN only)

**Request:**
\`\`\`json
{
  "label": "Production Agent Key"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "api_key": {
    "id": "clx...",
    "key": "bqa_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "label": "Production Agent Key",
    "created_at": "2026-02-17T00:00:00.000Z"
  }
}
\`\`\`

> **Note:** The key value is only returned once at creation. Store it securely.

---

### GET /api/settings/api-keys

List all API keys (masked).

**Auth:** Session (ADMIN only)

---

### DELETE /api/settings/api-keys/:id

Revoke an API key.

**Auth:** Session (ADMIN only)

---

## Integration Workflow

### Complete Agent Workflow

1. Generate a master API key from Settings > API Keys in the dashboard
2. Configure your agent with the API key
3. Agent registers on startup: \`POST /api/agents/register\`
4. Agent sends heartbeats every 60s: \`POST /api/agents/heartbeat\`
5. On git push or cron trigger, agent analyzes commits
6. Agent creates a test run: \`POST /api/test-runs\`
7. Agent tests each item in browser
8. Agent updates each test case: \`PATCH /api/test-cases/:id\`
9. Agent marks run complete: \`POST /api/test-runs/:id/complete\`
10. Dashboard shows results in real-time

### Sample Integration Script

\`\`\`bash
#!/bin/bash

API_BASE="https://qa.bazark.sa/api"
MASTER_KEY="bqa_your_master_key"

# Register agent
REGISTER=$(curl -s -X POST "$API_BASE/agents/register" \\
  -H "Authorization: Bearer $MASTER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-agent","dev_url":"https://dev.myapp.com/","repo_url":"https://github.com/org/app","branch":"main"}')

AGENT_ID=$(echo $REGISTER | jq -r '.agent.id')
AGENT_KEY=$(echo $REGISTER | jq -r '.agent.api_key')

# Start heartbeat loop
while true; do
  curl -s -X POST "$API_BASE/agents/heartbeat" \\
    -H "Authorization: Bearer $AGENT_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"agent_id":"'$AGENT_ID'","status":"ONLINE"}' > /dev/null
  sleep 60
done &

# Create test run
RUN=$(curl -s -X POST "$API_BASE/test-runs" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agent_id":"'$AGENT_ID'","commit_hash":"abc123","commit_message":"test","commit_author":"dev@test.com","branch":"main","test_cases":[{"title":"Test","url_path":"/","steps":["Go to /"],"expected":"Page loads","priority":"HIGH"}]}')

RUN_ID=$(echo $RUN | jq -r '.test_run.id')
TC_ID=$(echo $RUN | jq -r '.test_run.test_cases[0].id')

# Update test result
curl -s -X PATCH "$API_BASE/test-cases/$TC_ID" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"PASS","actual":"Page loaded","duration_ms":1000}'

# Complete run
curl -s -X POST "$API_BASE/test-runs/$RUN_ID/complete" \\
  -H "Authorization: Bearer $AGENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"PASSED","passed":1,"failed":0,"skipped":0}'
\`\`\`

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing or invalid fields |
| 401 | Unauthorized | Missing or invalid API key/session |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| API Key endpoints | 100 requests/minute/key |
| Heartbeat | 1 request/30 seconds/agent |
| Session endpoints | 60 requests/minute/user |

---

*Bazark QA Dashboard API Documentation v1.0*
`;

export async function GET() {
  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
