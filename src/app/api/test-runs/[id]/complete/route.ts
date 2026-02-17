import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAnyApiKey } from "@/lib/api-auth";

const completeSchema = z.object({
  status: z.enum(["PASSED", "FAILED", "CANCELLED", "TIMED_OUT"]),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  skipped: z.number().int().min(0).default(0),
  summary: z.string().optional(),
  ai_analysis: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate API key
    const authResult = await validateAnyApiKey(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Invalid or missing API key." },
        { status: 401 }
      );
    }

    // Check test run exists
    const testRun = await prisma.testRun.findUnique({
      where: { id },
      include: { agent: true },
    });

    if (!testRun) {
      return NextResponse.json(
        { success: false, error: "Test run not found" },
        { status: 404 }
      );
    }

    // If using agent API key, verify it matches the test run's agent
    if (
      authResult.type === "agent" &&
      authResult.agent?.id !== testRun.agent_id
    ) {
      return NextResponse.json(
        { success: false, error: "API key does not match agent" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = completeSchema.safeParse(body);
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

    const { status, passed, failed, skipped, summary, ai_analysis } =
      validationResult.data;

    const now = new Date();
    const duration_ms = testRun.started_at
      ? now.getTime() - testRun.started_at.getTime()
      : null;

    // Update test run
    const updatedTestRun = await prisma.$transaction(async (tx) => {
      const updated = await tx.testRun.update({
        where: { id },
        data: {
          status,
          passed,
          failed,
          skipped,
          summary,
          ai_analysis,
          duration_ms,
          finished_at: now,
        },
        select: {
          id: true,
          run_number: true,
          status: true,
          passed: true,
          failed: true,
          skipped: true,
          duration_ms: true,
          finished_at: true,
        },
      });

      // Update agent status back to ONLINE
      await tx.agent.update({
        where: { id: testRun.agent_id },
        data: {
          status: "ONLINE",
          last_heartbeat: now,
        },
      });

      return updated;
    });

    return NextResponse.json(
      {
        success: true,
        test_run: updatedTestRun,
        message: "Test run completed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing test run:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
