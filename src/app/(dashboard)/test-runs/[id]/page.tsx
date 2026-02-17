import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TestRunDetail from "@/components/test-runs/test-run-detail";
import { Skeleton } from "@/components/ui";
import type { TestRunFull } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTestRun(id: string): Promise<TestRunFull | null> {
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

  if (!testRun) return null;

  return {
    ...testRun,
    started_at: testRun.started_at.toISOString(),
    finished_at: testRun.finished_at?.toISOString() || null,
    agent: {
      id: testRun.agent.id,
      name: testRun.agent.name,
      status: testRun.agent.status,
    },
    test_cases: testRun.test_cases.map((tc: (typeof testRun)["test_cases"][number]) => ({
      id: tc.id,
      order: tc.order,
      title: tc.title,
      description: tc.description,
      url_path: tc.url_path,
      full_url: tc.full_url,
      steps: Array.isArray(tc.steps) ? tc.steps as string[] : [],
      expected: tc.expected,
      actual: tc.actual,
      status: tc.status,
      priority: tc.priority,
      category: tc.category,
      bug_description: tc.bug_description,
      ai_notes: tc.ai_notes,
      duration_ms: tc.duration_ms,
      retries: tc.retries,
      started_at: tc.started_at?.toISOString() || null,
      finished_at: tc.finished_at?.toISOString() || null,
      screenshots: tc.screenshots.map((s: (typeof testRun)["test_cases"][number]["screenshots"][number]) => ({
        id: s.id,
        url: s.url,
        label: s.label,
        step_number: s.step_number,
        is_failure: s.is_failure,
      })),
      recordings: tc.recordings.map((r: (typeof testRun)["test_cases"][number]["recordings"][number]) => ({
        id: r.id,
        url: r.url,
        duration_ms: r.duration_ms,
        format: r.format,
      })),
    })),
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-32 h-5" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-20 h-8 rounded-full" />
            <Skeleton className="w-64 h-6" />
          </div>
          <Skeleton className="w-full h-6" />
          <div className="flex gap-4">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Skeleton className="w-20 h-4 mb-2" />
            <Skeleton className="w-12 h-8" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Skeleton className="w-32 h-6 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function TestRunContent({ id }: { id: string }) {
  const testRun = await getTestRun(id);

  if (!testRun) {
    notFound();
  }

  return <TestRunDetail testRun={testRun} />;
}

export default async function TestRunDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TestRunContent id={id} />
    </Suspense>
  );
}
