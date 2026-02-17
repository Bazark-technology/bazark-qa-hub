"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  SkipForward,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Share2,
  GitBranch,
  Cpu,
  Bot,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import TestCaseCard from "./test-case-card";
import ScreenshotLightbox from "./screenshot-lightbox";
import type { TestRunFull, TestStatus } from "@/types";

interface TestRunDetailProps {
  testRun: TestRunFull;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PASSED":
      return <Badge variant="success" className="text-sm px-3 py-1">Passed</Badge>;
    case "FAILED":
    case "TIMED_OUT":
      return <Badge variant="destructive" className="text-sm px-3 py-1">{status === "TIMED_OUT" ? "Timed Out" : "Failed"}</Badge>;
    case "RUNNING":
      return <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">Running</Badge>;
    case "CANCELLED":
      return <Badge variant="outline" className="text-sm px-3 py-1">Cancelled</Badge>;
    case "QUEUED":
      return <Badge variant="warning" className="text-sm px-3 py-1">Queued</Badge>;
    default:
      return <Badge variant="outline" className="text-sm px-3 py-1">{status}</Badge>;
  }
}

type FilterStatus = "ALL" | TestStatus;
type SortField = "order" | "status" | "priority" | "duration";

export default function TestRunDetail({ testRun }: TestRunDetailProps) {
  const [copied, setCopied] = useState(false);
  const [aiAnalysisExpanded, setAiAnalysisExpanded] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortField>("order");
  const [lightbox, setLightbox] = useState<{
    screenshots: { url: string; label: string | null }[];
    index: number;
  } | null>(null);

  const handleCopyHash = async () => {
    await navigator.clipboard.writeText(testRun.commit_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshotClick = (screenshots: { url: string; label: string | null }[], index: number) => {
    setLightbox({ screenshots, index });
  };

  // Filter and sort test cases
  const filteredTestCases = useMemo(() => {
    let cases = [...testRun.test_cases];

    // Filter
    if (statusFilter !== "ALL") {
      cases = cases.filter((tc) => tc.status === statusFilter);
    }

    // Sort
    cases.sort((a, b) => {
      switch (sortBy) {
        case "status":
          const statusOrder: Record<TestStatus, number> = {
            FAIL: 0,
            RUNNING: 1,
            PENDING: 2,
            PASS: 3,
            SKIPPED: 4,
            BLOCKED: 5,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        case "priority":
          const priorityOrder: Record<string, number> = {
            CRITICAL: 0,
            HIGH: 1,
            MEDIUM: 2,
            LOW: 3,
          };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "duration":
          return (b.duration_ms || 0) - (a.duration_ms || 0);
        case "order":
        default:
          return a.order - b.order;
      }
    });

    return cases;
  }, [testRun.test_cases, statusFilter, sortBy]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: testRun.test_cases.length };
    testRun.test_cases.forEach((tc) => {
      counts[tc.status] = (counts[tc.status] || 0) + 1;
    });
    return counts;
  }, [testRun.test_cases]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/test-runs"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Test Runs
        </Link>
        <span className="text-gray-300">/</span>
        <code className="text-gray-700 font-mono">{testRun.commit_hash.slice(0, 7)}</code>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {getStatusBadge(testRun.status)}
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono text-gray-700">
                  {testRun.commit_hash}
                </code>
                <button
                  onClick={handleCopyHash}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy commit hash"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <h1 className="text-xl font-semibold text-gray-900">
              {testRun.commit_message}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {testRun.branch}
              </span>
              <span className="flex items-center gap-1">
                <Bot className="w-4 h-4" />
                {testRun.agent.name}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-4 h-4" />
                {testRun.environment}
              </span>
              <span>
                Started {formatDistanceToNow(new Date(testRun.started_at), { addSuffix: true })}
              </span>
              {testRun.duration_ms && (
                <span>
                  Duration: {(testRun.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Author: {testRun.commit_author}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-run All
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-run Failed
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <FlaskConical className="w-4 h-4" />
            <span className="text-sm">Total Tests</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{testRun.total_tests}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Passed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{testRun.passed}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Failed</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{testRun.failed}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <SkipForward className="w-4 h-4" />
            <span className="text-sm">Skipped</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{testRun.skipped}</div>
        </div>
      </div>

      {/* AI Analysis */}
      {testRun.ai_analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setAiAnalysisExpanded(!aiAnalysisExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
            {aiAnalysisExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {aiAnalysisExpanded && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap">
                {testRun.ai_analysis}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Cases */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Test Cases
            <span className="ml-2 text-sm font-normal text-gray-500">
              Showing {filteredTestCases.length} of {testRun.test_cases.length}
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg p-1 shadow-sm">
              {(["ALL", "PASS", "FAIL", "PENDING", "SKIPPED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={"px-3 py-2 text-sm rounded-md transition-all " + (statusFilter === status ? "bg-white text-blue-700 font-semibold shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")}
                >
                  {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  {filterCounts[status] !== undefined && (
                    <span className={"ml-1 " + (statusFilter === status ? "text-blue-500" : "text-gray-500")}>({filterCounts[status]})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="order">Sort by Order</option>
              <option value="status">Sort by Status</option>
              <option value="priority">Sort by Priority</option>
              <option value="duration">Sort by Duration</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTestCases.map((tc) => (
            <TestCaseCard
              key={tc.id}
              testCase={tc}
              onScreenshotClick={handleScreenshotClick}
            />
          ))}

          {filteredTestCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No test cases match the selected filter
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ScreenshotLightbox
          screenshots={lightbox.screenshots}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
