// Agent Types
export interface AgentStats {
  total_runs: number;
  pass_rate: number;
  today_runs: number;
  last_run: string | null;
  avg_duration_ms: number;
  is_stale: boolean;
}

export interface RecentRun {
  id: string;
  commit_hash: string;
  commit_message: string;
  status: "RUNNING" | "PASSED" | "FAILED" | "CANCELLED" | "QUEUED" | "TIMED_OUT";
  total_tests: number;
  passed: number;
  failed: number;
  started_at: string;
}

export interface AgentWithStats {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | "RUNNING" | "ERROR" | "PAUSED";
  dev_url: string;
  repo_url: string;
  branch: string;
  hostname: string | null;
  version: string | null;
  ip_address: string | null;
  last_heartbeat: string | null;
  created_at: string;
  stats: AgentStats;
  recent_runs: RecentRun[];
}

export interface AgentsListResponse {
  success: boolean;
  agents: AgentWithStats[];
}

// API Key Types
export interface ApiKeyResponse {
  id: string;
  masked_key: string;
  label: string;
  is_active: boolean;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  last_used: string | null;
  created_at: string;
}

export interface GeneratedApiKey {
  id: string;
  key: string;
  label: string;
  created_at: string;
}

export interface ApiKeysListResponse {
  success: boolean;
  api_keys: ApiKeyResponse[];
}

export interface GenerateApiKeyResponse {
  success: boolean;
  api_key: GeneratedApiKey;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

// Test Run Types
export type RunStatus = "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
export type TestStatus = "PENDING" | "RUNNING" | "PASS" | "FAIL" | "SKIPPED" | "BLOCKED";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RunTrigger = "MANUAL" | "WEBHOOK" | "CRON" | "API";

export interface TestCaseSummary {
  id: string;
  title: string;
  status: TestStatus;
  priority: Priority;
  duration_ms: number | null;
  bug_description: string | null;
  _count?: {
    recordings: number;
  };
}

export interface TestCaseFull extends TestCaseSummary {
  order: number;
  description: string | null;
  url_path: string;
  full_url: string | null;
  steps: string[];
  expected: string;
  actual: string | null;
  category: string | null;
  ai_notes: string | null;
  retries: number;
  started_at: string | null;
  finished_at: string | null;
  screenshots: Screenshot[];
  recordings: Recording[];
}

export interface Screenshot {
  id: string;
  url: string;
  label: string | null;
  step_number: number | null;
  is_failure: boolean;
}

export interface Recording {
  id: string;
  url: string;
  duration_ms: number | null;
  format: string;
}

export interface TestRunAgent {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | "RUNNING" | "ERROR" | "PAUSED";
}

export interface TestRunWithCases {
  id: string;
  run_number: number;
  commit_hash: string;
  commit_message: string;
  commit_author: string;
  branch: string;
  status: RunStatus;
  trigger: RunTrigger;
  environment: string;
  dev_url: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number | null;
  summary: string | null;
  ai_analysis: string | null;
  started_at: string;
  finished_at: string | null;
  agent: TestRunAgent;
  test_cases: TestCaseSummary[];
}

export interface TestRunFull extends Omit<TestRunWithCases, "test_cases"> {
  test_cases: TestCaseFull[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TestRunsListResponse {
  success: boolean;
  test_runs: TestRunWithCases[];
  pagination: Pagination;
}

export interface TestRunDetailResponse {
  success: boolean;
  test_run: TestRunFull;
}

// Dashboard Types
export interface DashboardStats {
  totalAgents: number;
  onlineAgents: number;
  todayRuns: number;
  todayPassed: number;
  todayFailed: number;
  todayPassRate: number;
  todayTotalTests: number;
  todayOpenBugs: number;
  todayHighPriorityBugs: number;
  yesterdayRuns: number;
}

export interface DailyChartData {
  date: string;
  passRate: number;
  totalRuns: number;
  passed: number;
  failed: number;
}

export interface ActiveRun {
  id: string;
  commit_hash: string;
  commit_message: string;
  agent_name: string;
  total_tests: number;
  completed: number;
  passed: number;
  failed: number;
  started_at: string;
}

export interface DashboardRecentRun {
  id: string;
  commit_hash: string;
  commit_message: string;
  status: RunStatus;
  agent_name: string;
  branch: string;
  total_tests: number;
  passed: number;
  failed: number;
  started_at: string;
}

export interface DashboardFailure {
  id: string;
  title: string;
  bug_description: string | null;
  priority: Priority;
  test_run_id: string;
  commit_hash: string;
  agent_name: string;
  created_at: string;
}

export interface FailingPage {
  url_path: string;
  failure_count: number;
}

export interface DashboardAgent {
  id: string;
  name: string;
  status: "ONLINE" | "OFFLINE" | "RUNNING" | "ERROR" | "PAUSED";
  last_heartbeat: string | null;
  current_task: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  dailyChart: DailyChartData[];
  activeRuns: ActiveRun[];
  recentRuns: DashboardRecentRun[];
  recentFailures: DashboardFailure[];
  topFailingPages: FailingPage[];
  agents: DashboardAgent[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface ActiveRunsResponse {
  success: boolean;
  active_runs: ActiveRun[];
}

// ========== Agent Chat Types ==========

export type ChannelType = "GENERAL" | "QA_REPORTS" | "DEV_TASKS" | "DIRECT";
export type SenderType = "USER" | "QA_AGENT" | "DEV_AGENT" | "MOBILE_QA_AGENT" | "SYSTEM";
export type MessageType =
  | "TEXT"
  | "BUG_REPORT"
  | "PR_CREATED"
  | "TEST_RESULT"
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "STATUS_UPDATE"
  | "CODE_SNIPPET";

export interface ChatMessagePreview {
  content: string;
  sender_name: string;
  created_at: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  slug: string;
  type: ChannelType;
  description: string | null;
  unread_count: number;
  last_message: ChatMessagePreview | null;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  sender_name: string;
  content: string;
  message_type: MessageType;
  mentions: string[];
  screenshots: string[];
  video_url: string | null;
  pr_url: string | null;
  test_run_id: string | null;
  commit_hash: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatAgent {
  id: string;
  name: string;
  handle: string;
  agent_type: SenderType;
  status: "ONLINE" | "OFFLINE" | "RUNNING" | "ERROR" | "PAUSED";
  current_task: string | null;
  last_seen: string | null;
}

export interface ChatChannelsResponse {
  success: boolean;
  channels: ChatChannel[];
}

export interface ChatMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  has_more: boolean;
  cursor?: string;
}

export interface ChatAgentsResponse {
  success: boolean;
  agents: ChatAgent[];
}

export interface SendMessageRequest {
  channel_id?: string;
  content: string;
  sender_type?: SenderType;
  sender_id?: string;
  sender_name?: string;
  message_type?: MessageType;
  mentions?: string[];
  screenshots?: string[];
  video_url?: string;
  pr_url?: string;
  test_run_id?: string;
  commit_hash?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
  mentioned_agents_notified: string[];
}
