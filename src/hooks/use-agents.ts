"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentWithStats, AgentsListResponse } from "@/types";

type FilterType = "ALL" | "ONLINE" | "OFFLINE" | "RUNNING";

interface GroupedAgents {
  online: AgentWithStats[];
  running: AgentWithStats[];
  offline: AgentWithStats[];
}

interface UseAgentsReturn {
  agents: AgentWithStats[];
  grouped: GroupedAgents;
  isRefreshing: boolean;
  lastRefresh: Date;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  refresh: () => Promise<void>;
  removeAgent: (id: string) => Promise<boolean>;
  error: string | null;
}

export function useAgents(initialAgents: AgentWithStats[]): UseAgentsReturn {
  const [agents, setAgents] = useState<AgentWithStats[]>(initialAgents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      const data: AgentsListResponse = await res.json();
      if (data.success) {
        setAgents(data.agents);
        setLastRefresh(new Date());
      } else {
        setError("Failed to refresh agents");
      }
    } catch {
      setError("Failed to refresh agents. Retrying...");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const removeAgent = async (id: string): Promise<boolean> => {
    // Optimistic update
    const previousAgents = agents;
    setAgents((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        // Revert on failure
        setAgents(previousAgents);
        return false;
      }
      return true;
    } catch {
      // Revert on error
      setAgents(previousAgents);
      return false;
    }
  };

  const filteredAgents = agents.filter((a) => {
    if (filter === "ALL") return true;
    // Map OFFLINE and ERROR/PAUSED to OFFLINE for filtering
    if (filter === "OFFLINE") {
      return a.status === "OFFLINE" || a.status === "ERROR" || a.status === "PAUSED";
    }
    return a.status === filter;
  });

  const grouped: GroupedAgents = {
    online: filteredAgents.filter((a) => a.status === "ONLINE"),
    running: filteredAgents.filter((a) => a.status === "RUNNING"),
    offline: filteredAgents.filter(
      (a) => a.status === "OFFLINE" || a.status === "ERROR" || a.status === "PAUSED"
    ),
  };

  return {
    agents: filteredAgents,
    grouped,
    isRefreshing,
    lastRefresh,
    filter,
    setFilter,
    refresh,
    removeAgent,
    error,
  };
}
