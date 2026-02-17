"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  LayoutGrid,
  List,
  Filter,
  Plus,
  Bot,
  Info,
} from "lucide-react";
import { Badge, Button, Toast } from "@/components/ui";
import { useAgents } from "@/hooks/use-agents";
import AgentCard from "./agent-card";
import AgentCardSkeleton from "./agent-card-skeleton";
import AgentDetailModal from "./agent-detail-modal";
import RemoveAgentDialog from "./remove-agent-dialog";
import type { AgentWithStats } from "@/types";

interface AgentsViewProps {
  initialAgents: AgentWithStats[];
}

type ViewMode = "grid" | "list";
type FilterType = "ALL" | "ONLINE" | "OFFLINE" | "RUNNING";

interface ToastState {
  message: string;
  type: "success" | "error";
}

function ColumnHeader({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`border-t-4 ${color} pt-3 pb-2`}>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge variant="default">{count}</Badge>
      </div>
    </div>
  );
}

function EmptyColumn({ status }: { status: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
      <p className="text-sm text-gray-500">No {status.toLowerCase()} agents</p>
    </div>
  );
}

export default function AgentsView({ initialAgents }: AgentsViewProps) {
  const {
    agents,
    grouped,
    isRefreshing,
    lastRefresh,
    filter,
    setFilter,
    refresh,
    removeAgent,
  } = useAgents(initialAgents);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStats | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<AgentWithStats | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleViewDetails = (agent: AgentWithStats) => {
    setSelectedAgent(agent);
    setDetailModalOpen(true);
  };

  const handleRemoveClick = (agent: AgentWithStats) => {
    setAgentToRemove(agent);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!agentToRemove) return false;
    return await removeAgent(agentToRemove.id);
  };

  const handleRemoveSuccess = () => {
    setToast({ message: `Agent '${agentToRemove?.name}' removed successfully`, type: "success" });
    setAgentToRemove(null);
    setDetailModalOpen(false);
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "ONLINE", label: "Online" },
    { value: "RUNNING", label: "Running" },
    { value: "OFFLINE", label: "Offline" },
  ];

  // Empty state
  if (agents.length === 0 && filter === "ALL") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No agents registered yet
          </h2>
          <p className="text-gray-500 max-w-md mb-4">
            Deploy OpenClaw on your VPS and it will register automatically via the API.
          </p>
          <a href="/docs" className="text-blue-600 hover:underline text-sm">
            View setup docs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">Agents</h2>
          <Badge>{agents.length}</Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-gray-100" : ""}`}
            >
              <LayoutGrid className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-gray-100" : ""}`}
            >
              <List className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              {filterOptions.find((f) => f.value === filter)?.label}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-32">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      filter === option.value ? "bg-gray-50 font-medium" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Agent Button (disabled) */}
          <div className="relative group">
            <Button disabled className="opacity-50 cursor-not-allowed">
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Agents register automatically via API. Deploy OpenClaw and it will connect.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Indicator */}
      <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 hover:text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing
            ? "Refreshing..."
            : `Updated ${formatDistanceToNow(lastRefresh, { addSuffix: true })}`}
        </button>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Online Column */}
          <div className="space-y-4">
            <ColumnHeader title="Online" count={grouped.online.length} color="border-green-500" />
            {isRefreshing && grouped.online.length === 0 ? (
              <>
                <AgentCardSkeleton />
                <AgentCardSkeleton />
              </>
            ) : grouped.online.length > 0 ? (
              grouped.online.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onViewDetails={() => handleViewDetails(agent)}
                  onRemove={() => handleRemoveClick(agent)}
                />
              ))
            ) : (
              <EmptyColumn status="online" />
            )}
          </div>

          {/* Running Column */}
          <div className="space-y-4">
            <ColumnHeader title="Running" count={grouped.running.length} color="border-blue-500" />
            {isRefreshing && grouped.running.length === 0 ? (
              <AgentCardSkeleton />
            ) : grouped.running.length > 0 ? (
              grouped.running.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onViewDetails={() => handleViewDetails(agent)}
                  onRemove={() => handleRemoveClick(agent)}
                />
              ))
            ) : (
              <EmptyColumn status="running" />
            )}
          </div>

          {/* Offline Column */}
          <div className="space-y-4">
            <ColumnHeader title="Offline" count={grouped.offline.length} color="border-gray-300" />
            {isRefreshing && grouped.offline.length === 0 ? (
              <AgentCardSkeleton />
            ) : grouped.offline.length > 0 ? (
              grouped.offline.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onViewDetails={() => handleViewDetails(agent)}
                  onRemove={() => handleRemoveClick(agent)}
                />
              ))
            ) : (
              <EmptyColumn status="offline" />
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onViewDetails={() => handleViewDetails(agent)}
              onRemove={() => handleRemoveClick(agent)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AgentDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        agent={selectedAgent}
        onRemove={() => {
          if (selectedAgent) {
            handleRemoveClick(selectedAgent);
          }
        }}
      />

      {/* Remove Dialog */}
      {agentToRemove && (
        <RemoveAgentDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          agentName={agentToRemove.name}
          onConfirm={handleRemoveConfirm}
          onSuccess={handleRemoveSuccess}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
