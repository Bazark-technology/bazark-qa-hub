import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, validateAnyApiKey } from "@/lib/api-auth";

const STALE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

// Map agent names to chat handles
function getAgentHandle(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("qa") && !lowerName.includes("mobile")) {
    return "@QAAgent";
  }
  if (lowerName.includes("dev")) {
    return "@DevAgent";
  }
  if (lowerName.includes("mobile")) {
    return "@MobileQA";
  }
  // Default: use name with @ prefix
  return `@${name.replace(/\s+/g, "")}`;
}

// Map agent name to sender type
function getAgentType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("qa") && !lowerName.includes("mobile")) {
    return "QA_AGENT";
  }
  if (lowerName.includes("dev")) {
    return "DEV_AGENT";
  }
  if (lowerName.includes("mobile")) {
    return "MOBILE_QA_AGENT";
  }
  return "QA_AGENT"; // Default
}

export async function GET(request: NextRequest) {
  try {
    // Validate session or API key
    const user = await getSessionUser();
    const apiKeyAuth = !user ? await validateAnyApiKey(request) : null;

    if (!user && !apiKeyAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in or provide valid API key." },
        { status: 401 }
      );
    }

    const now = new Date();

    // Fetch all agents
    const agents = await prisma.agent.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        last_heartbeat: true,
        agent_logs: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            metadata: true,
          },
        },
      },
    });

    // Process agents for chat display
    const chatAgents = agents.map((agent) => {
      // Check if agent is stale
      const isStale = agent.last_heartbeat
        ? now.getTime() - new Date(agent.last_heartbeat).getTime() > STALE_THRESHOLD_MS
        : true;

      // Determine effective status
      let effectiveStatus = agent.status;
      if (isStale && agent.status !== "RUNNING") {
        effectiveStatus = "OFFLINE";
      }

      // Get current task from latest log metadata
      const latestLog = agent.agent_logs[0];
      const currentTask =
        effectiveStatus === "RUNNING" && latestLog?.metadata
          ? (latestLog.metadata as Record<string, unknown>).current_task as string | null
          : null;

      return {
        id: agent.id,
        name: agent.name,
        handle: getAgentHandle(agent.name),
        agent_type: getAgentType(agent.name),
        status: effectiveStatus,
        current_task: currentTask,
        last_seen: agent.last_heartbeat?.toISOString() || null,
      };
    });

    return NextResponse.json(
      { success: true, agents: chatAgents },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching chat agents:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
