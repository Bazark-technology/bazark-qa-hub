"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Image as ImageIcon,
  PlayCircle,
  Ban,
} from "lucide-react";
import { Badge, VideoPlayer } from "@/components/ui";
import type { TestCaseFull, TestStatus } from "@/types";

interface TestCaseCardProps {
  testCase: TestCaseFull;
  onScreenshotClick?: (screenshots: { url: string; label: string | null }[], index: number) => void;
}

function getStatusIcon(status: TestStatus) {
  switch (status) {
    case "PASS":
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case "FAIL":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "RUNNING":
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case "SKIPPED":
      return <SkipForward className="w-5 h-5 text-yellow-500" />;
    case "BLOCKED":
      return <Ban className="w-5 h-5 text-yellow-500" />;
    case "PENDING":
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
}

function getBorderColor(status: TestStatus): string {
  switch (status) {
    case "PASS":
      return "border-l-green-500";
    case "FAIL":
      return "border-l-red-500";
    case "SKIPPED":
    case "BLOCKED":
      return "border-l-yellow-500";
    case "PENDING":
    case "RUNNING":
    default:
      return "border-l-gray-300";
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return <Badge variant="destructive">Critical</Badge>;
    case "HIGH":
      return <Badge className="bg-red-100 text-red-700">High</Badge>;
    case "MEDIUM":
      return <Badge variant="warning">Medium</Badge>;
    case "LOW":
    default:
      return <Badge variant="outline">Low</Badge>;
  }
}

export default function TestCaseCard({ testCase, onScreenshotClick }: TestCaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = Array.isArray(testCase.steps) ? testCase.steps : [];
  const screenshots = testCase.screenshots || [];
  const recordings = testCase.recordings || [];

  return (
    <div
      className={"bg-white rounded-lg border border-gray-100 border-l-4 " + getBorderColor(testCase.status) + " overflow-hidden transition-all duration-200"}
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        {getStatusIcon(testCase.status)}
        
        <span className="flex-1 font-medium text-gray-900 truncate">
          {testCase.title}
        </span>

        {getPriorityBadge(testCase.priority)}

        {testCase.duration_ms && (
          <span className="text-sm text-gray-500">
            {(testCase.duration_ms / 1000).toFixed(1)}s
          </span>
        )}

        <Badge variant="outline" className="text-xs">
          {testCase.url_path}
        </Badge>

        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Description */}
          {testCase.description && (
            <div className="pt-4">
              <p className="text-sm text-gray-600">{testCase.description}</p>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Steps</h4>
              <div className="border-l-2 border-gray-200 pl-4 space-y-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-400 mt-0.5 w-5">
                      {idx + 1}.
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Expected</h4>
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
              <p className="text-sm text-gray-700">{testCase.expected}</p>
            </div>
          </div>

          {/* Actual */}
          {testCase.actual && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Actual</h4>
              <div className={"p-3 rounded-r-lg border-l-4 " + (testCase.status === "PASS" ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500")}>
                <p className="text-sm text-gray-700">{testCase.actual}</p>
              </div>
            </div>
          )}

          {/* Bug Description */}
          {testCase.bug_description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Bug Description
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{testCase.bug_description}</p>
              </div>
            </div>
          )}

          {/* AI Notes */}
          {testCase.ai_notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">AI Notes</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 font-mono">{testCase.ai_notes}</p>
              </div>
            </div>
          )}

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Screenshots ({screenshots.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {screenshots.map((screenshot, idx) => {
                  const displayLabel = screenshots.length === 2
                    ? (idx === 0 ? "Before" : "After")
                    : screenshot.label;

                  return (
                    <button
                      key={screenshot.id}
                      onClick={() => onScreenshotClick?.(
                        screenshots.map((s, i) => ({
                          url: s.url,
                          label: screenshots.length === 2
                            ? (i === 0 ? "Before" : "After")
                            : s.label
                        })),
                        idx
                      )}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                    >
                      <img
                        src={screenshot.url}
                        alt={displayLabel || "Screenshot " + (idx + 1)}
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      {screenshot.is_failure && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                          Failure
                        </div>
                      )}
                      {displayLabel && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                          {displayLabel}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Test Recording */}
          {recordings.length > 0 && recordings[0]?.url && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Test Recording
              </h4>
              <div className="mt-2 w-full">
                <VideoPlayer
                  src={recordings[0].url}
                  poster={screenshots.length > 0 ? screenshots[0].url : undefined}
                />
              </div>
            </div>
          )}

          {/* Duration & Retries */}
          <div className="flex items-center gap-4 pt-2 text-sm text-gray-500">
            {testCase.duration_ms && (
              <span>Duration: {(testCase.duration_ms / 1000).toFixed(2)}s</span>
            )}
            {testCase.retries > 0 && (
              <span>Retries: {testCase.retries}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
