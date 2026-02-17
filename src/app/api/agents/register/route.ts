import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  validateMasterApiKey,
  generateApiKey,
  getClientIp,
} from "@/lib/api-auth";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dev_url: z.string().url("Invalid dev URL"),
  repo_url: z.string().url("Invalid repo URL"),
  branch: z.string().default("main"),
  hostname: z.string().optional(),
  version: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate master API key
    const apiKey = await validateMasterApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Invalid or missing API key." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
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

    const { name, dev_url, repo_url, branch, hostname, version } =
      validationResult.data;

    // Check if agent already exists
    const existingAgent = await prisma.agent.findFirst({
      where: { name },
    });

    const clientIp = getClientIp(request);

    if (existingAgent) {
      // Update existing agent
      const updatedAgent = await prisma.agent.update({
        where: { id: existingAgent.id },
        data: {
          dev_url,
          repo_url,
          branch,
          hostname,
          version,
          ip_address: clientIp,
          status: "ONLINE",
          last_heartbeat: new Date(),
        },
        select: {
          id: true,
          name: true,
          api_key: true,
          status: true,
          dev_url: true,
          repo_url: true,
          branch: true,
          hostname: true,
          version: true,
          created_at: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          agent: updatedAgent,
          message: "Agent updated successfully",
        },
        { status: 200 }
      );
    }

    // Create new agent with generated API key
    const agentApiKey = generateApiKey();

    const newAgent = await prisma.agent.create({
      data: {
        name,
        api_key: agentApiKey,
        dev_url,
        repo_url,
        branch,
        hostname,
        version,
        ip_address: clientIp,
        status: "ONLINE",
        last_heartbeat: new Date(),
        created_by_id: apiKey.created_by_id,
      },
      select: {
        id: true,
        name: true,
        api_key: true,
        status: true,
        dev_url: true,
        repo_url: true,
        branch: true,
        hostname: true,
        version: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        agent: newAgent,
        message: "Agent registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering agent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
