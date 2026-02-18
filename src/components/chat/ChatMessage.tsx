"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Copy,
  Check,
  Play,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import type { ChatMessage as ChatMessageType, SenderType } from "@/types";
import { VideoPlayer } from "@/components/ui/video-player";

interface ChatMessageProps {
  message: ChatMessageType;
  onScreenshotClick?: (screenshots: string[], index: number) => void;
}

// Avatar colors by sender type
const AVATAR_COLORS: Record<SenderType, { bg: string; text: string }> = {
  USER: { bg: "bg-green-500", text: "text-white" },
  QA_AGENT: { bg: "bg-blue-500", text: "text-white" },
  DEV_AGENT: { bg: "bg-purple-500", text: "text-white" },
  MOBILE_QA_AGENT: { bg: "bg-orange-500", text: "text-white" },
  SYSTEM: { bg: "bg-gray-500", text: "text-white" },
};

// Avatar labels by sender type
const AVATAR_LABELS: Record<SenderType, string> = {
  USER: "", // Will use initials
  QA_AGENT: "QA",
  DEV_AGENT: "DA",
  MOBILE_QA_AGENT: "MQ",
  SYSTEM: "SYS",
};

// Border colors by message type
const MESSAGE_BORDERS: Record<string, string> = {
  BUG_REPORT: "border-l-4 border-l-red-500",
  PR_CREATED: "border-l-4 border-l-green-500",
  TEST_RESULT: "border-l-4", // Dynamic based on content
  STATUS_UPDATE: "border-l-4 border-l-gray-400",
  CODE_SNIPPET: "",
  TEXT: "",
};

// Severity badge colors
const SEVERITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Highlight @mentions in content
function renderContentWithMentions(content: string): React.ReactNode {
  const parts = content.split(/(@(?:QAAgent|DevAgent|MobileQA))/gi);

  return parts.map((part, i) => {
    if (part.match(/^@(?:QAAgent|DevAgent|MobileQA)$/i)) {
      return (
        <span
          key={i}
          className="bg-blue-100 text-blue-700 rounded px-1 font-semibold"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

// Render code blocks
function renderContent(content: string): React.ReactNode {
  // Check for code blocks
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex}>
          {renderContentWithMentions(content.slice(lastIndex, match.index))}
        </span>
      );
    }

    // Add code block
    parts.push(
      <pre
        key={match.index}
        className="bg-gray-900 text-gray-100 rounded p-3 mt-2 mb-2 overflow-x-auto text-sm font-mono"
      >
        <code>{match[2]}</code>
      </pre>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={lastIndex}>
        {renderContentWithMentions(content.slice(lastIndex))}
      </span>
    );
  }

  return parts.length > 0 ? parts : renderContentWithMentions(content);
}

export function ChatMessage({ message, onScreenshotClick }: ChatMessageProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const avatarColor = AVATAR_COLORS[message.sender_type] || AVATAR_COLORS.SYSTEM;
  const avatarLabel =
    AVATAR_LABELS[message.sender_type] || getInitials(message.sender_name);

  // Determine border color for test results
  let borderClass = MESSAGE_BORDERS[message.message_type] || "";
  if (message.message_type === "TEST_RESULT") {
    const hasPass =
      message.content.includes("PASS") || message.content.includes("✅");
    const hasFail =
      message.content.includes("FAIL") || message.content.includes("🔴");
    borderClass = hasFail
      ? "border-l-4 border-l-red-500"
      : hasPass
        ? "border-l-4 border-l-green-500"
        : "border-l-4 border-l-gray-400";
  }

  const metadata = message.metadata as Record<string, unknown> | null;
  const severity = metadata?.severity as string | undefined;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={`flex gap-3 py-3 px-4 hover:bg-gray-50 ${borderClass}`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
      >
        <span className="text-sm font-medium">
          {message.sender_type === "USER"
            ? getInitials(message.sender_name)
            : avatarLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">
            {message.sender_name}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.created_at)}
          </span>
          {severity && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLORS[severity] || "bg-gray-100 text-gray-700"}`}
            >
              {severity}
            </span>
          )}
        </div>

        {/* Message content */}
        <div
          className={`text-gray-700 whitespace-pre-wrap break-words ${message.message_type === "STATUS_UPDATE" ? "italic text-gray-500" : ""}`}
        >
          {message.message_type === "CODE_SNIPPET" ? (
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-sm font-mono">
                <code>{message.content}</code>
              </pre>
              <button
                onClick={() => handleCopyCode(message.content)}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            renderContent(message.content)
          )}
        </div>

        {/* PR URL */}
        {message.pr_url && (
          <a
            href={message.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            View PR
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Test Run Link */}
        {message.test_run_id && (
          <Link
            href={`/test-runs/${message.test_run_id}`}
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            View Test Run
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}

        {/* Commit Hash */}
        {message.commit_hash && (
          <span className="inline-block mt-2 ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
            {message.commit_hash.slice(0, 7)}
          </span>
        )}

        {/* Screenshots */}
        {message.screenshots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.screenshots.slice(0, 4).map((url, index) => (
              <button
                key={index}
                onClick={() => onScreenshotClick?.(message.screenshots, index)}
                className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 3 && message.screenshots.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium">
                    +{message.screenshots.length - 4}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Video */}
        {message.video_url && (
          <div className="mt-3">
            {showVideo ? (
              <div className="max-w-lg">
                <VideoPlayer src={message.video_url} />
              </div>
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Play className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Play recording</span>
              </button>
            )}
          </div>
        )}

        {/* Bug Report Metadata */}
        {message.message_type === "BUG_REPORT" && metadata && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">Bug Report</span>
            </div>
            {metadata.bug_description && (
              <p className="text-sm text-gray-700">
                {metadata.bug_description as string}
              </p>
            )}
            {metadata.affected_page && (
              <p className="text-xs text-gray-500 mt-1">
                Page: {metadata.affected_page as string}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
