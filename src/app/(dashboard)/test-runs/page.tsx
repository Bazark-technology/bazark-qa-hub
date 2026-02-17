import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import TestRunsView from "@/components/test-runs/test-runs-view";
import TestRunsSkeleton from "@/components/test-runs/test-runs-skeleton";
import type { TestRunWithCases } from "@/types";

async function getTestRuns(): Promise<TestRunWithCases[]> {
  const testRuns = await prisma.testRun.findMany({
    orderBy: { started_at: "desc" },
    take: 50,
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
        },
        orderBy: { order: "asc" },
      },
    },
  });

  return testRuns.map((run) => ({
    ...run,
    started_at: run.started_at.toISOString(),
    finished_at: run.finished_at?.toISOString() || null,
    agent: {
      id: run.agent.id,
      name: run.agent.name,
      status: run.agent.status,
    },
    test_cases: run.test_cases.map((tc) => ({
      id: tc.id,
      title: tc.title,
      status: tc.status,
      priority: tc.priority,
      duration_ms: tc.duration_ms,
      bug_description: tc.bug_description,
    })),
  }));
}

async function TestRunsContent() {
  const testRuns = await getTestRuns();
  return <TestRunsView initialRuns={testRuns} />;
}

export default function TestRunsPage() {
  return (
    <Suspense fallback={<TestRunsSkeleton />}>
      <TestRunsContent />
    </Suspense>
  );
}
