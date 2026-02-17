import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";
import { startOfDay, startOfWeek, subDays, format } from "date-fns";
import type { DashboardData, DailyChartData } from "@/types";

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

    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const weekStart = startOfWeek(now);
    const fourteenDaysAgo = subDays(now, 14);
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalAgents,
      onlineAgents,
      todayRuns,
      yesterdayRuns,
      chartRuns,
      recentRuns,
      recentFailures,
      failingPages,
      activeRuns,
      allAgents,
    ] = await Promise.all([
      // 1. Total agents
      prisma.agent.count(),

      // 2. Online agents (heartbeat within 3 minutes)
      prisma.agent.count({
        where: { last_heartbeat: { gte: threeMinutesAgo } },
      }),

      // 3. Today's runs
      prisma.testRun.findMany({
        where: { started_at: { gte: todayStart } },
        select: {
          status: true,
          total_tests: true,
          passed: true,
          failed: true,
        },
      }),

      // 4. Yesterday's runs count
      prisma.testRun.count({
        where: {
          started_at: { gte: yesterdayStart, lt: todayStart },
        },
      }),

      // 5. Chart data (last 14 days)
      prisma.testRun.findMany({
        where: {
          started_at: { gte: fourteenDaysAgo },
          status: { notIn: ["RUNNING", "QUEUED"] },
        },
        select: {
          status: true,
          passed: true,
          failed: true,
          total_tests: true,
          started_at: true,
        },
      }),

      // 6. Recent runs
      prisma.testRun.findMany({
        take: 10,
        orderBy: { started_at: "desc" },
        select: {
          id: true,
          commit_hash: true,
          commit_message: true,
          status: true,
          branch: true,
          total_tests: true,
          passed: true,
          failed: true,
          started_at: true,
          agent: { select: { name: true } },
        },
      }),

      // 7. Recent failures
      prisma.testCase.findMany({
        where: { status: "FAIL" },
        take: 10,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          bug_description: true,
          priority: true,
          created_at: true,
          test_run: {
            select: {
              id: true,
              commit_hash: true,
              agent: { select: { name: true } },
            },
          },
        },
      }),

      // 8. Top failing pages this week
      prisma.testCase.groupBy({
        by: ["url_path"],
        where: {
          status: "FAIL",
          created_at: { gte: weekStart },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      // 9. Active runs
      prisma.testRun.findMany({
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
      }),

      // 10. All agents for status grid
      prisma.agent.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          last_heartbeat: true,
          test_runs: {
            where: { status: "RUNNING" },
            take: 1,
            select: { commit_hash: true },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Calculate today's stats
    const todayPassed = todayRuns.filter((r: (typeof todayRuns)[number]) => r.status === "PASSED").length;
    const todayFailed = todayRuns.filter((r: (typeof todayRuns)[number]) => r.status === "FAILED").length;
    const todayTotalTests = todayRuns.reduce((sum, r: (typeof todayRuns)[number]) => sum + r.total_tests, 0);
    const todayPassedTests = todayRuns.reduce((sum, r: (typeof todayRuns)[number]) => sum + r.passed, 0);
    const todayPassRate = todayTotalTests > 0 ? (todayPassedTests / todayTotalTests) * 100 : 0;

    // Count today's open bugs (failed test cases)
    const todayFailedRuns = todayRuns.filter((r: (typeof todayRuns)[number]) => r.status === "FAILED");
    const todayOpenBugs = todayFailedRuns.reduce((sum, r: (typeof todayRuns)[number]) => sum + r.failed, 0);

    // Get high priority bug count from recent failures
    const todayHighPriorityBugs = recentFailures.filter(
      (f: (typeof recentFailures)[number]) => f.priority === "HIGH" || f.priority === "CRITICAL"
    ).length;

    // Group chart data by day
    const dailyMap = new Map<string, { passed: number; failed: number; total: number }>();

    // Initialize all 14 days
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(now, i), "yyyy-MM-dd");
      dailyMap.set(date, { passed: 0, failed: 0, total: 0 });
    }

    // Fill in actual data
    chartRuns.forEach((run: (typeof chartRuns)[number]) => {
      const date = format(new Date(run.started_at), "yyyy-MM-dd");
      const existing = dailyMap.get(date);
      if (existing) {
        existing.total += 1;
        if (run.status === "PASSED") existing.passed += 1;
        if (run.status === "FAILED" || run.status === "TIMED_OUT") existing.failed += 1;
      }
    });

    const dailyChart: DailyChartData[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: format(new Date(date), "MMM dd"),
      passRate: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
      totalRuns: data.total,
      passed: data.passed,
      failed: data.failed,
    }));

    // Format response data
    const data: DashboardData = {
      stats: {
        totalAgents,
        onlineAgents,
        todayRuns: todayRuns.length,
        todayPassed,
        todayFailed,
        todayPassRate: Math.round(todayPassRate * 10) / 10,
        todayTotalTests,
        todayOpenBugs,
        todayHighPriorityBugs,
        yesterdayRuns,
      },
      dailyChart,
      activeRuns: activeRuns.map((run: (typeof activeRuns)[number]) => {
        const completed = run.test_cases.filter(
          (tc: (typeof activeRuns)[number]["test_cases"][number]) =>
            tc.status !== "PENDING" && tc.status !== "RUNNING"
        ).length;
        const passed = run.test_cases.filter(
          (tc: (typeof activeRuns)[number]["test_cases"][number]) => tc.status === "PASS"
        ).length;
        const failed = run.test_cases.filter(
          (tc: (typeof activeRuns)[number]["test_cases"][number]) => tc.status === "FAIL"
        ).length;
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
      }),
      recentRuns: recentRuns.map((run: (typeof recentRuns)[number]) => ({
        id: run.id,
        commit_hash: run.commit_hash,
        commit_message: run.commit_message,
        status: run.status,
        agent_name: run.agent.name,
        branch: run.branch,
        total_tests: run.total_tests,
        passed: run.passed,
        failed: run.failed,
        started_at: run.started_at.toISOString(),
      })),
      recentFailures: recentFailures.map((f: (typeof recentFailures)[number]) => ({
        id: f.id,
        title: f.title,
        bug_description: f.bug_description,
        priority: f.priority,
        test_run_id: f.test_run.id,
        commit_hash: f.test_run.commit_hash,
        agent_name: f.test_run.agent.name,
        created_at: f.created_at.toISOString(),
      })),
      topFailingPages: failingPages.map((p: (typeof failingPages)[number]) => ({
        url_path: p.url_path,
        failure_count: p._count.id,
      })),
      agents: allAgents.map((a: (typeof allAgents)[number]) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        last_heartbeat: a.last_heartbeat?.toISOString() || null,
        current_task: a.test_runs[0]?.commit_hash || null,
      })),
    };

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
