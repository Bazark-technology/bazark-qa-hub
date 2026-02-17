"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  SkipForward,
  MoreVertical,
  Eye,
  Copy,
  RefreshCw,
  XOctagon,
  GitBranch,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui";
import type { TestRunWithCases, TestStatus } from "@/types";

interface TestRunCardProps {
  testRun: TestRunWithCases;
  onRerun?: () => void;
  onCancel?: () => void;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "RUNNING":
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case "PASSED":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "FAILED":
    case "TIMED_OUT":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "CANCELLED":
      return <MinusCircle className="w-5 h-5 text-gray-400" />;
    case "QUEUED":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
}

function getTestCaseIcon(status: TestStatus) {
  switch (status) {
    case "PASS":
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
    case "FAIL":
      return <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
    case "RUNNING":
      return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />;
    case "SKIPPED":
    case "BLOCKED":
      return <SkipForward className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />;
    case "PENDING":
    default:
      return <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
  }
}

function getPriorityDotColor(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-500";
    case "HIGH":
      return "bg-red-400";
    case "MEDIUM":
      return "bg-yellow-400";
    case "LOW":
    default:
      return "bg-gray-300";
  }
}

function getCardBorderColor(status: string): string {
  switch (status) {
    case "RUNNING":
      return "border-l-blue-500";
    case "PASSED":
      return "border-l-green-500";
    case "FAILED":
    case "TIMED_OUT":
      return "border-l-red-500";
    case "CANCELLED":
      return "border-l-gray-400";
    case "QUEUED":
      return "border-l-yellow-500";
    default:
      return "border-l-gray-300";
  }
}

function getCardBgTint(status: string): string {
  if (status === "RUNNING") return "bg-blue-50/50";
  return "bg-white";
}

function getInitials(name: string): string {
  const parts = name.split(/[@\s]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function TestRunCard({ testRun, onRerun, onCancel }: TestRunCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyHash = async () => {
    await navigator.clipboard.writeText(testRun.commit_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  const handleCardClick = () => {
    router.push("/test-runs/" + testRun.id);
  };

  const passCount = testRun.test_cases.filter((tc) => tc.status === "PASS").length;
  const failCount = testRun.test_cases.filter((tc) => tc.status === "FAIL").length;
  const skipCount = testRun.test_cases.filter((tc) => tc.status === "SKIPPED" || tc.status === "BLOCKED").length;
  const pendingCount = testRun.test_cases.filter((tc) => tc.status === "PENDING" || tc.status === "RUNNING").length;
  const total = testRun.test_cases.length || 1;

  const passPercent = (passCount / total) * 100;
  const failPercent = (failCount / total) * 100;
  const skipPercent = (skipCount / total) * 100;
  const pendingPercent = (pendingCount / total) * 100;

  const previewCases = testRun.test_cases.slice(0, 4);
  const remainingCount = testRun.test_cases.length - 4;
  const runningTest = testRun.test_cases.find((tc) => tc.status === "RUNNING");

  return (
    <div
      className={"rounded-xl shadow-sm border border-gray-100 border-l-4 " + getCardBorderColor(testRun.status) + " " + getCardBgTint(testRun.status) + " p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(testRun.status)}
          <code className="text-sm font-mono text-gray-700">
            {testRun.commit_hash.slice(0, 7)}
          </code>
          <Badge variant="outline" className="text-xs">
            <GitBranch className="w-3 h-3 mr-1" />
            {testRun.branch}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(testRun.started_at), { addSuffix: true })}
          </span>
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                {onRerun && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRerun();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-run Tests
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyHash();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Commit Hash"}
                </button>
                {testRun.status === "RUNNING" && onCancel && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XOctagon className="w-4 h-4" />
                      Cancel Run
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
        {testRun.commit_message}
      </h3>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
          {getInitials(testRun.commit_author)}
        </div>
        <span className="text-xs text-gray-500 truncate flex-1">
          {testRun.commit_author}
        </span>
        <Badge variant="outline" className="text-xs">
          {testRun.agent.name}
        </Badge>
      </div>

      {testRun.status === "RUNNING" && runningTest && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="truncate">Running: {runningTest.title}</span>
          </div>
        </div>
      )}

      <div className="space-y-1 mb-3">
        {previewCases.map((tc) => (
          <div key={tc.id} className="flex items-center gap-2">
            {getTestCaseIcon(tc.status)}
            <span className="text-xs text-gray-700 truncate flex-1 max-w-[200px]">
              {tc.title}
            </span>
            <span className={"inline-block w-1.5 h-1.5 rounded-full " + getPriorityDotColor(tc.priority)} />
          </div>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-400 pl-5">
            +{remainingCount} more test{remainingCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-2">
        {passPercent > 0 && <div className="h-full bg-green-500" style={{ width: passPercent + "%" }} />}
        {failPercent > 0 && <div className="h-full bg-red-500" style={{ width: failPercent + "%" }} />}
        {skipPercent > 0 && <div className="h-full bg-yellow-400" style={{ width: skipPercent + "%" }} />}
        {pendingPercent > 0 && <div className="h-full bg-gray-300" style={{ width: pendingPercent + "%" }} />}
      </div>

      <div className="text-xs text-gray-500">
        {passCount > 0 && <span className="text-green-600">{passCount} passed</span>}
        {passCount > 0 && (failCount > 0 || skipCount > 0 || pendingCount > 0) && ", "}
        {failCount > 0 && <span className="text-red-600">{failCount} failed</span>}
        {failCount > 0 && (skipCount > 0 || pendingCount > 0) && ", "}
        {skipCount > 0 && <span className="text-yellow-600">{skipCount} skipped</span>}
        {skipCount > 0 && pendingCount > 0 && ", "}
        {pendingCount > 0 && <span className="text-gray-500">{pendingCount} pending</span>}
      </div>
    </div>
  );
}
