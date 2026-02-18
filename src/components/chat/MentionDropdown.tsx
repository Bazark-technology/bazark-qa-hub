"use client";

import { useEffect, useRef } from "react";
import type { ChatAgent } from "@/types";

interface MentionDropdownProps {
  agents: ChatAgent[];
  search: string;
  onSelect: (handle: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

// Status dot colors
const STATUS_COLORS: Record<string, string> = {
  ONLINE: "bg-green-500",
  RUNNING: "bg-yellow-500",
  OFFLINE: "bg-gray-400",
  ERROR: "bg-red-500",
  PAUSED: "bg-gray-400",
};

export function MentionDropdown({
  agents,
  search,
  onSelect,
  onClose,
  position,
}: MentionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter agents based on search
  const filteredAgents = agents.filter((agent) =>
    agent.handle.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (filteredAgents.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px] max-h-[200px] overflow-y-auto"
      style={{
        bottom: `calc(100% - ${position.top}px + 8px)`,
        left: position.left,
      }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
        Mention Agent
      </div>
      {filteredAgents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onSelect(agent.handle)}
          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
        >
          {/* Status dot */}
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[agent.status] || STATUS_COLORS.OFFLINE}`}
          />

          {/* Agent info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-600">{agent.handle}</span>
              <span className="text-xs text-gray-500">{agent.name}</span>
            </div>
            {agent.status === "RUNNING" && agent.current_task && (
              <div className="text-xs text-gray-400 truncate">
                {agent.current_task}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
