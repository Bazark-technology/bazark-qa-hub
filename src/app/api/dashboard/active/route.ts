import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const activeRuns = await prisma.testRun.findMany({
      where: { status: "RUNNING" },
      select: {
        id: true,
        commit_hash: true,
        commit_message: true,
        total_tests: true,
        started_at: true,
        agent: { select: { name: true } },
        test_cases: { select: { status: true } },
      },
    });

    const formattedRuns = activeRuns.map((run) => {
      const completed = run.test_cases.filter(
        (tc) => tc.status !== "PENDING" && tc.status !== "RUNNING"
      ).length;
      const passed = run.test_cases.filter((tc) => tc.status === "PASS").length;
      const failed = run.test_cases.filter((tc) => tc.status === "FAIL").length;
      
      return {
        id: run.id,
        commit_hash: run.commit_hash,
        commit_message: run.commit_message,
        agent_name: run.agent.name,
        total_tests: run.total_tests,
        completed,
        passed,
        failed,
        started_at: run.started_at.toISOString(),
      };
    });

    return NextResponse.json(
      { success: true, active_runs: formattedRuns },
      { status: 200 }
    );
  } catch (error) {
    console.error("Active runs API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
