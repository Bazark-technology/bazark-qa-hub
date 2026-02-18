import { ChatMessage } from "@prisma/client";

// Agent handle mapping
const AGENT_HANDLES: Record<
  string,
  { agentId: string; type: "QA_AGENT" | "DEV_AGENT" | "MOBILE_QA_AGENT" }
> = {
  "@QAAgent": { agentId: "qa-agent-01", type: "QA_AGENT" },
  "@DevAgent": { agentId: "dev-agent-01", type: "DEV_AGENT" },
  "@MobileQA": { agentId: "mobile-qa-agent-01", type: "MOBILE_QA_AGENT" },
};

// Regex pattern to match @mentions
const MENTION_PATTERN = /@(QAAgent|DevAgent|MobileQA)\b/gi;

/**
 * Extract @mentions from message content
 */
export function extractMentions(content: string): string[] {
  const mentions: string[] = [];
  let match;

  while ((match = MENTION_PATTERN.exec(content)) !== null) {
    const handle = `@${match[1]}`;
    // Normalize handle to match our mapping
    const normalizedHandle = Object.keys(AGENT_HANDLES).find(
      (h) => h.toLowerCase() === handle.toLowerCase()
    );
    if (normalizedHandle && !mentions.includes(normalizedHandle)) {
      mentions.push(normalizedHandle);
    }
  }

  // Reset regex state
  MENTION_PATTERN.lastIndex = 0;

  return mentions;
}

/**
 * Get agent info by handle
 */
export function getAgentByHandle(handle: string) {
  return AGENT_HANDLES[handle] || null;
}

/**
 * Get all available agent handles for autocomplete
 */
export function getAllAgentHandles(): Array<{
  handle: string;
  agentId: string;
  type: string;
}> {
  return Object.entries(AGENT_HANDLES).map(([handle, info]) => ({
    handle,
    agentId: info.agentId,
    type: info.type,
  }));
}

/**
 * Build a context-aware prompt for the mentioned agent
 */
export function buildAgentPrompt(
  message: ChatMessage,
  recentMessages: ChatMessage[]
): string {
  const contextMessages = recentMessages
    .slice(-10) // Last 10 messages for context
    .map((m) => `[${m.sender_name}]: ${m.content}`)
    .join("\n");

  let prompt = `You were mentioned in the Agent Chat by ${message.sender_name}.\n\n`;
  prompt += `## Recent Chat History:\n${contextMessages}\n\n`;
  prompt += `## Message that mentioned you:\n${message.content}\n\n`;

  // Add context based on message type
  if (message.message_type === "BUG_REPORT") {
    const metadata = message.metadata as Record<string, unknown> | null;
    prompt += `## Bug Report Details:\n`;
    if (metadata?.bug_description) {
      prompt += `- Description: ${metadata.bug_description}\n`;
    }
    if (metadata?.affected_page) {
      prompt += `- Affected Page: ${metadata.affected_page}\n`;
    }
    if (metadata?.severity) {
      prompt += `- Severity: ${metadata.severity}\n`;
    }
    if (message.screenshots.length > 0) {
      prompt += `- Screenshots: ${message.screenshots.join(", ")}\n`;
    }
    if (message.video_url) {
      prompt += `- Video Recording: ${message.video_url}\n`;
    }
    if (message.commit_hash) {
      prompt += `- Related Commit: ${message.commit_hash}\n`;
    }
    prompt += `\nPlease analyze this bug and take appropriate action.\n`;
  }

  if (message.message_type === "PR_CREATED") {
    prompt += `## PR Details:\n`;
    if (message.pr_url) {
      prompt += `- PR URL: ${message.pr_url}\n`;
    }
    if (message.commit_hash) {
      prompt += `- Commit: ${message.commit_hash}\n`;
    }
    prompt += `\nPlease review and re-test after the PR is merged.\n`;
  }

  if (message.message_type === "TEST_RESULT") {
    prompt += `## Test Result Details:\n`;
    if (message.test_run_id) {
      prompt += `- Test Run: http://localhost:3000/test-runs/${message.test_run_id}\n`;
    }
    if (message.commit_hash) {
      prompt += `- Commit: ${message.commit_hash}\n`;
    }
  }

  // Instruct the agent to respond back to chat
  prompt += `\n## Instructions:\n`;
  prompt += `After completing your task, post your response back to the chat API at:\n`;
  prompt += `POST http://localhost:3000/api/chat/messages\n`;
  prompt += `Include relevant details about your actions and findings.\n`;

  return prompt;
}

/**
 * Trigger mentioned agents via OpenClaw API
 */
export async function triggerMentionedAgents(
  message: ChatMessage,
  recentMessages: ChatMessage[]
): Promise<void> {
  const mentions = message.mentions || [];

  for (const handle of mentions) {
    const agentInfo = getAgentByHandle(handle);
    if (!agentInfo) {
      console.log(`Unknown agent handle: ${handle}`);
      continue;
    }

    const prompt = buildAgentPrompt(message, recentMessages);

    try {
      await triggerAgent(agentInfo.agentId, prompt);
      console.log(`Triggered agent ${agentInfo.agentId} via ${handle}`);
    } catch (error) {
      console.error(`Failed to trigger agent ${agentInfo.agentId}:`, error);
    }
  }
}

/**
 * Trigger a single agent via OpenClaw
 */
async function triggerAgent(agentId: string, prompt: string): Promise<void> {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || "";

  // Try OpenClaw Gateway API first
  try {
    const response = await fetch(`${gatewayUrl}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        message: prompt,
        channel: "chat",
      }),
    });

    if (response.ok) {
      console.log(`Agent ${agentId} triggered via OpenClaw Gateway`);
      return;
    }

    console.warn(
      `OpenClaw Gateway returned ${response.status}, falling back to CLI`
    );
  } catch (error) {
    console.warn(`OpenClaw Gateway unavailable, falling back to CLI:`, error);
  }

  // Fallback: Use OpenClaw CLI
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Escape the prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''");

    await execAsync(
      `openclaw send --agent "${agentId}" --message '${escapedPrompt}' --channel telegram`,
      { timeout: 30000 }
    );

    console.log(`Agent ${agentId} triggered via OpenClaw CLI`);
  } catch (error) {
    console.error(`Failed to trigger agent ${agentId} via CLI:`, error);
    throw error;
  }
}
