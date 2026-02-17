import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAnyApiKey } from "@/lib/api-auth";

const updateTestCaseSchema = z.object({
  status: z.enum(["PENDING", "RUNNING", "PASS", "FAIL", "SKIPPED", "BLOCKED"]).optional(),
  actual: z.string().optional(),
  bug_description: z.string().optional(),
  bug_severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]).optional(),
  duration_ms: z.number().int().min(0).optional(),
  ai_notes: z.string().optional(),
  screenshots: z.array(z.string().url()).optional(),
  video_url: z.string().url().optional(),
});

export async function PATCH(
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

    // Check test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        test_run: {
          include: { agent: true },
        },
      },
    });

    if (!testCase) {
      return NextResponse.json(
        { success: false, error: "Test case not found" },
        { status: 404 }
      );
    }

    // If using agent API key, verify it matches the test run's agent
    if (
      authResult.type === "agent" &&
      authResult.agent?.id !== testCase.test_run.agent_id
    ) {
      return NextResponse.json(
        { success: false, error: "API key does not match agent" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateTestCaseSchema.safeParse(body);
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

    const {
      status,
      actual,
      bug_description,
      bug_severity,
      duration_ms,
      ai_notes,
      screenshots,
      video_url,
    } = validationResult.data;

    const now = new Date();

    // Update test case in transaction
    const updatedTestCase = await prisma.$transaction(async (tx) => {
      // Determine timestamps
      const updateData: Record<string, unknown> = {};

      if (status !== undefined) {
        updateData.status = status;
        if (status === "RUNNING" && !testCase.started_at) {
          updateData.started_at = now;
        }
        if (
          ["PASS", "FAIL", "SKIPPED", "BLOCKED"].includes(status) &&
          !testCase.finished_at
        ) {
          updateData.finished_at = now;
        }
      }

      if (actual !== undefined) updateData.actual = actual;
      if (bug_description !== undefined)
        updateData.bug_description = bug_description;
      if (bug_severity !== undefined) updateData.bug_severity = bug_severity;
      if (duration_ms !== undefined) updateData.duration_ms = duration_ms;
      if (ai_notes !== undefined) updateData.ai_notes = ai_notes;

      const updated = await tx.testCase.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          order: true,
          title: true,
          status: true,
          actual: true,
          bug_description: true,
          bug_severity: true,
          duration_ms: true,
          started_at: true,
          finished_at: true,
        },
      });

      // Create screenshots if provided
      if (screenshots && screenshots.length > 0) {
        await Promise.all(
          screenshots.map((url, index) =>
            tx.screenshot.create({
              data: {
                test_case_id: id,
                url,
                file_path: url,
                label: `Screenshot ${index + 1}`,
                step_number: index,
                is_failure: status === "FAIL",
              },
            })
          )
        );
      }

      // Create video recording if provided
      if (video_url) {
        await tx.recording.create({
          data: {
            test_case_id: id,
            url: video_url,
            file_path: video_url,
            duration_ms: duration_ms || null,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(
      {
        success: true,
        test_case: updatedTestCase,
        message: "Test case updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating test case:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
