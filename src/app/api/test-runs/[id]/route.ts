import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const testRun = await prisma.testRun.findUnique({
      where: { id },
      select: {
        id: true,
        run_number: true,
        status: true,
        commit_hash: true,
        commit_message: true,
        commit_author: true,
        branch: true,
        trigger: true,
        environment: true,
        dev_url: true,
        total_tests: true,
        passed: true,
        failed: true,
        skipped: true,
        duration_ms: true,
        summary: true,
        ai_analysis: true,
        started_at: true,
        finished_at: true,
        agent: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        test_cases: {
          select: {
            id: true,
            order: true,
            title: true,
            description: true,
            url_path: true,
            full_url: true,
            steps: true,
            expected: true,
            actual: true,
            status: true,
            priority: true,
            category: true,
            bug_description: true,
            ai_notes: true,
            duration_ms: true,
            retries: true,
            started_at: true,
            finished_at: true,
            screenshots: {
              select: {
                id: true,
                url: true,
                label: true,
                step_number: true,
                is_failure: true,
              },
              orderBy: { step_number: "asc" },
            },
            recordings: {
              select: {
                id: true,
                url: true,
                duration_ms: true,
                format: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { success: false, error: "Test run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        test_run: testRun,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching test run:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
