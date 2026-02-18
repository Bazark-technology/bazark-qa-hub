"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";
import { MentionDropdown } from "./MentionDropdown";
import type { ChatAgent } from "@/types";

interface ChatInputProps {
  channelName: string;
  agents: ChatAgent[];
  onSend: (content: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatInput({
  channelName,
  agents,
  onSend,
  isSending,
  disabled,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Max 5 rows (~120px)
    }
  }, [content]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);

      // Check for @ mention
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Only show dropdown if there's no space after @
        if (!textAfterAt.includes(" ") && textAfterAt.length <= 20) {
          setMentionSearch(textAfterAt);
          setShowMentions(true);

          // Calculate position (simplified)
          if (textareaRef.current) {
            const rect = textareaRef.current.getBoundingClientRect();
            setMentionPosition({
              top: rect.height,
              left: 16,
            });
          }
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    },
    []
  );

  const handleMentionSelect = useCallback(
    (handle: string) => {
      if (!textareaRef.current) return;

      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = content.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      const textAfterCursor = content.slice(cursorPos);

      const newContent =
        content.slice(0, lastAtIndex) + handle + " " + textAfterCursor;
      setContent(newContent);
      setShowMentions(false);

      // Focus back and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = lastAtIndex + handle.length + 1;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [content]
  );

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to send (without shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (content.trim() && !isSending && !disabled) {
          await onSend(content.trim());
          setContent("");
        }
      }

      // Tab to complete mention
      if (e.key === "Tab" && showMentions) {
        e.preventDefault();
        const filteredAgents = agents.filter((a) =>
          a.handle.toLowerCase().includes(mentionSearch.toLowerCase())
        );
        if (filteredAgents.length > 0) {
          handleMentionSelect(filteredAgents[0].handle);
        }
      }

      // Escape to close mentions
      if (e.key === "Escape" && showMentions) {
        setShowMentions(false);
      }
    },
    [
      content,
      isSending,
      disabled,
      onSend,
      showMentions,
      agents,
      mentionSearch,
      handleMentionSelect,
    ]
  );

  const handleSend = async () => {
    if (content.trim() && !isSending && !disabled) {
      await onSend(content.trim());
      setContent("");
    }
  };

  const canSend = content.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="relative border-t border-gray-200 bg-white p-4">
      {/* Mention dropdown */}
      {showMentions && (
        <MentionDropdown
          agents={agents}
          search={mentionSearch}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentions(false)}
          position={mentionPosition}
        />
      )}

      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName} — type @ to mention an agent`}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Enter</kbd> to
        send,{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Shift+Enter</kbd> for
        new line
      </div>
    </div>
  );
}
