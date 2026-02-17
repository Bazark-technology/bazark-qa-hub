import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";

const STALE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

export async function GET() {
  try {
    // Validate session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all agents with test runs
    const agents = await prisma.agent.findMany({
      orderBy: { last_heartbeat: "desc" },
      include: {
        test_runs: {
          orderBy: { started_at: "desc" },
          take: 5,
          select: {
            id: true,
            commit_hash: true,
            commit_message: true,
            status: true,
            total_tests: true,
            passed: true,
            failed: true,
            started_at: true,
            duration_ms: true,
          },
        },
        _count: {
          select: { test_runs: true },
        },
      },
    });

    // Compute stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        // Get aggregated stats
        const statsAgg = await prisma.testRun.aggregate({
          where: { agent_id: agent.id },
          _count: true,
          _avg: { duration_ms: true },
        });

        // Get pass count
        const passedCount = await prisma.testRun.count({
          where: { agent_id: agent.id, status: "PASSED" },
        });

        // Get today's runs count
        const todayRuns = await prisma.testRun.count({
          where: {
            agent_id: agent.id,
            started_at: { gte: todayStart },
          },
        });

        // Calculate pass rate
        const totalRuns = statsAgg._count || 0;
        const passRate = totalRuns > 0 ? (passedCount / totalRuns) * 100 : 0;

        // Check if agent is stale
        const isStale = agent.last_heartbeat
          ? now.getTime() - new Date(agent.last_heartbeat).getTime() > STALE_THRESHOLD_MS
          : true;

        // Determine effective status
        let effectiveStatus = agent.status;
        if (isStale && agent.status !== "RUNNING") {
          effectiveStatus = "OFFLINE";
        }

        // Get last run date
        const lastRun = agent.test_runs[0]?.started_at || null;

        return {
          id: agent.id,
          name: agent.name,
          status: effectiveStatus,
          dev_url: agent.dev_url,
          repo_url: agent.repo_url,
          branch: agent.branch,
          hostname: agent.hostname,
          version: agent.version,
          ip_address: agent.ip_address,
          last_heartbeat: agent.last_heartbeat?.toISOString() || null,
          created_at: agent.created_at.toISOString(),
          stats: {
            total_runs: totalRuns,
            pass_rate: Math.round(passRate * 10) / 10,
            today_runs: todayRuns,
            last_run: lastRun?.toISOString() || null,
            avg_duration_ms: Math.round(statsAgg._avg.duration_ms || 0),
            is_stale: isStale,
          },
          recent_runs: agent.test_runs.map((run) => ({
            id: run.id,
            commit_hash: run.commit_hash,
            commit_message: run.commit_message,
            status: run.status,
            total_tests: run.total_tests,
            passed: run.passed,
            failed: run.failed,
            started_at: run.started_at.toISOString(),
          })),
        };
      })
    );

    return NextResponse.json(
      { success: true, agents: agentsWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
