"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface TocItem {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

const tocItems: TocItem[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    children: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Authentication" },
      { id: "base-url", label: "Base URL" },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    children: [
      { id: "register-agent", label: "Register Agent" },
      { id: "heartbeat", label: "Heartbeat" },
      { id: "list-agents", label: "List Agents" },
      { id: "get-agent", label: "Get Agent" },
      { id: "update-agent", label: "Update Agent" },
      { id: "delete-agent", label: "Delete Agent" },
    ],
  },
  {
    id: "test-runs",
    label: "Test Runs",
    children: [
      { id: "create-test-run", label: "Create Test Run" },
      { id: "list-test-runs", label: "List Test Runs" },
      { id: "get-test-run", label: "Get Test Run" },
      { id: "complete-test-run", label: "Complete Test Run" },
    ],
  },
  {
    id: "test-cases",
    label: "Test Cases",
    children: [{ id: "update-test-case", label: "Update Test Case" }],
  },
  {
    id: "agent-chat",
    label: "Agent Chat",
    children: [
      { id: "send-chat-message", label: "Send Message" },
      { id: "get-chat-messages", label: "Get Messages" },
      { id: "get-chat-agents", label: "Get Agents" },
    ],
  },
  {
    id: "api-keys",
    label: "API Keys",
    children: [
      { id: "generate-key", label: "Generate Key" },
      { id: "list-keys", label: "List Keys" },
      { id: "revoke-key", label: "Revoke Key" },
    ],
  },
  {
    id: "webhook",
    label: "Webhook",
    children: [{ id: "github-webhook", label: "GitHub Webhook" }],
  },
  {
    id: "integration",
    label: "Integration",
    children: [
      { id: "openclaw-setup", label: "OpenClaw Setup" },
      { id: "full-workflow", label: "Full Workflow" },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    children: [
      { id: "error-codes", label: "Error Codes" },
      { id: "rate-limits", label: "Rate Limits" },
    ],
  },
];

export default function TableOfContents() {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -80% 0%" }
    );

    const allIds = tocItems.flatMap((item) => [
      item.id,
      ...(item.children?.map((c) => c.id) || []),
    ]);

    allIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderTocItems = () => (
    <nav className="space-y-4">
      {tocItems.map((section) => (
        <div key={section.id}>
          <button
            onClick={() => handleClick(section.id)}
            className={`block text-sm font-semibold mb-2 transition-colors ${
              activeId === section.id
                ? "text-blue-600"
                : "text-gray-900 hover:text-blue-600"
            }`}
          >
            {section.label}
          </button>
          {section.children && (
            <ul className="space-y-1 ml-3 border-l border-gray-200">
              {section.children.map((child) => (
                <li key={child.id}>
                  <button
                    onClick={() => handleClick(child.id)}
                    className={`block pl-3 py-1 text-sm transition-colors ${
                      activeId === child.id
                        ? "text-blue-600 border-l-2 border-blue-600 -ml-px"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {child.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Table of Contents</h2>
          </div>
          {renderTocItems()}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 overflow-auto max-h-[calc(100vh-8rem)] pr-4">
          {renderTocItems()}
        </div>
      </aside>
    </>
  );
}
