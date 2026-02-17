import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAnyApiKey, getClientIp } from "@/lib/api-auth";
import { AgentStatus } from "@prisma/client";

const heartbeatSchema = z.object({
  agent_id: z.string().min(1, "Agent ID is required"),
  status: z.enum(["ONLINE", "OFFLINE", "RUNNING", "ERROR", "PAUSED"]).optional().nullable(),
  current_task: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key (either agent's own key or master key)
    const authResult = await validateAnyApiKey(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Invalid or missing API key." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = heartbeatSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { agent_id, status, current_task } = validationResult.data;

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agent_id },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // If using agent API key, verify it matches the agent
    if (authResult.type === "agent" && authResult.agent?.id !== agent_id) {
      return NextResponse.json(
        { success: false, error: "API key does not match agent" },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(request);
    const now = new Date();

    // Update agent
    await prisma.agent.update({
      where: { id: agent_id },
      data: {
        last_heartbeat: now,
        status: status as AgentStatus || agent.status,
        ip_address: clientIp || agent.ip_address,
      },
    });

    // Log heartbeat if there's a current task
    if (current_task) {
      await prisma.agentLog.create({
        data: {
          agent_id,
          level: "INFO",
          message: `Heartbeat: ${current_task}`,
          metadata: { current_task, ip_address: clientIp },
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        received_at: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing heartbeat:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
