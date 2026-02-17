import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminSession } from "@/lib/api-auth";

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  dev_url: z.string().url().optional(),
  repo_url: z.string().url().optional(),
  branch: z.string().optional(),
  cron_schedule: z.string().nullable().optional(),
  hostname: z.string().optional(),
  version: z.string().optional(),
  status: z.enum(["ONLINE", "OFFLINE", "RUNNING", "ERROR", "PAUSED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        dev_url: true,
        repo_url: true,
        branch: true,
        cron_schedule: true,
        hostname: true,
        version: true,
        ip_address: true,
        os_info: true,
        config: true,
        last_heartbeat: true,
        created_at: true,
        updated_at: true,
        created_by: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            test_runs: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get recent test runs
    const recentRuns = await prisma.testRun.findMany({
      where: { agent_id: id },
      orderBy: { started_at: "desc" },
      take: 10,
      select: {
        id: true,
        run_number: true,
        status: true,
        commit_hash: true,
        commit_message: true,
        branch: true,
        passed: true,
        failed: true,
        skipped: true,
        started_at: true,
        finished_at: true,
      },
    });

    // Get pass rate stats
    const stats = await prisma.testRun.aggregate({
      where: { agent_id: id },
      _sum: {
        passed: true,
        failed: true,
        skipped: true,
      },
      _count: true,
    });

    const totalTests =
      (stats._sum.passed || 0) + (stats._sum.failed || 0);
    const passRate =
      totalTests > 0
        ? Math.round(((stats._sum.passed || 0) / totalTests) * 1000) / 10
        : 0;

    return NextResponse.json(
      {
        success: true,
        agent: {
          ...agent,
          stats: {
            total_runs: stats._count,
            total_passed: stats._sum.passed || 0,
            total_failed: stats._sum.failed || 0,
            total_skipped: stats._sum.skipped || 0,
            pass_rate: passRate,
          },
          recent_runs: recentRuns,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate session and admin role
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Check agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateAgentSchema.safeParse(body);
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

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: validationResult.data,
      select: {
        id: true,
        name: true,
        status: true,
        dev_url: true,
        repo_url: true,
        branch: true,
        cron_schedule: true,
        hostname: true,
        version: true,
        updated_at: true,
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
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate session and admin role
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Check agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // Delete agent (cascade will delete related records)
    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Agent deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
