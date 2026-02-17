import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAnyApiKey, getSessionUser } from "@/lib/api-auth";

const testCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url_path: z.string().min(1, "URL path is required"),
  steps: z.array(z.string()),
  expected: z.string().min(1, "Expected result is required"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  description: z.string().optional(),
  category: z.string().optional(),
});

const createTestRunSchema = z.object({
  agent_id: z.string().min(1, "Agent ID is required"),
  commit_hash: z.string().min(1, "Commit hash is required"),
  commit_message: z.string().min(1, "Commit message is required"),
  commit_author: z.string().min(1, "Commit author is required"),
  branch: z.string().default("main"),
  test_cases: z.array(testCaseSchema).min(1, "At least one test case required"),
  trigger: z.enum(["MANUAL", "WEBHOOK", "CRON", "API"]).default("API"),
  environment: z.string().default("development"),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateAnyApiKey(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Invalid or missing API key." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createTestRunSchema.safeParse(body);
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
      agent_id,
      commit_hash,
      commit_message,
      commit_author,
      branch,
      test_cases,
      trigger,
      environment,
    } = validationResult.data;

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

    // If using agent API key, verify it matches
    if (authResult.type === "agent" && authResult.agent?.id !== agent_id) {
      return NextResponse.json(
        { success: false, error: "API key does not match agent" },
        { status: 403 }
      );
    }

    // Create test run with test cases in a transaction
    const testRun = await prisma.$transaction(async (tx) => {
      // Create or find commit record
      let commit = await tx.commit.findUnique({
        where: { hash: commit_hash },
      });

      if (!commit) {
        commit = await tx.commit.create({
          data: {
            hash: commit_hash,
            short_hash: commit_hash.slice(0, 7),
            message: commit_message,
            author_name: commit_author.split("@")[0] || commit_author,
            author_email: commit_author,
            branch,
            committed_at: new Date(),
          },
        });
      }

      // Create test run
      const run = await tx.testRun.create({
        data: {
          agent_id,
          commit_id: commit.id,
          commit_hash,
          commit_message,
          commit_author,
          branch,
          dev_url: agent.dev_url,
          trigger,
          environment,
          status: "RUNNING",
          total_tests: test_cases.length,
          started_at: new Date(),
        },
      });

      // Create test cases
      const createdTestCases = await Promise.all(
        test_cases.map((tc, index) =>
          tx.testCase.create({
            data: {
              test_run_id: run.id,
              order: index,
              title: tc.title,
              description: tc.description,
              url_path: tc.url_path,
              full_url: `${agent.dev_url}${tc.url_path}`,
              steps: tc.steps,
              expected: tc.expected,
              priority: tc.priority,
              category: tc.category,
              status: "PENDING",
            },
            select: {
              id: true,
              order: true,
              title: true,
              url_path: true,
              priority: true,
            },
          })
        )
      );

      // Update agent status to RUNNING
      await tx.agent.update({
        where: { id: agent_id },
        data: {
          status: "RUNNING",
          last_heartbeat: new Date(),
        },
      });

      return {
        ...run,
        test_cases: createdTestCases,
      };
    });

    return NextResponse.json(
      {
        success: true,
        test_run: testRun,
        message: "Test run created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating test run:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get("agent_id");
    const status = searchParams.get("status");
    const branch = searchParams.get("branch");
    const search = searchParams.get("search");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (agent_id) {
      where.agent_id = agent_id;
    }

    if (status) {
      where.status = status;
    }

    if (branch) {
      where.branch = branch;
    }

    // Search by commit_hash or commit_message (case insensitive)
    if (search) {
      where.OR = [
        { commit_hash: { contains: search, mode: "insensitive" } },
        { commit_message: { contains: search, mode: "insensitive" } },
      ];
    }

    if (start_date || end_date) {
      where.started_at = {};
      if (start_date) {
        where.started_at.gte = new Date(start_date);
      }
      if (end_date) {
        where.started_at.lte = new Date(end_date);
      }
    }

    // Get total count
    const total = await prisma.testRun.count({ where });

    // Get test runs with test cases
    const testRuns = await prisma.testRun.findMany({
      where,
      orderBy: { started_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
            title: true,
            status: true,
            priority: true,
            duration_ms: true,
            bug_description: true,
            _count: {
              select: {
                recordings: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        test_runs: testRuns,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching test runs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
