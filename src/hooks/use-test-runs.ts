"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import type { TestRunWithCases, TestRunsListResponse, RunStatus } from "@/types";

export type DateRangeFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";
export type ViewMode = "board" | "list";

export interface TestRunFilters {
  agent: string;
  branch: string;
  dateRange: DateRangeFilter;
  search: string;
}

interface GroupedTestRuns {
  running: TestRunWithCases[];
  queued: TestRunWithCases[];
  passed: TestRunWithCases[];
  failed: TestRunWithCases[];
}

interface UseTestRunsReturn {
  runs: TestRunWithCases[];
  grouped: GroupedTestRuns;
  isRefreshing: boolean;
  lastRefresh: Date;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  filters: TestRunFilters;
  setFilters: (filters: TestRunFilters) => void;
  updateFilter: <K extends keyof TestRunFilters>(key: K, value: TestRunFilters[K]) => void;
  refresh: () => Promise<void>;
  error: string | null;
  uniqueAgents: { id: string; name: string }[];
  uniqueBranches: string[];
}

export function useTestRuns(initialRuns: TestRunWithCases[]): UseTestRunsReturn {
  const [runs, setRuns] = useState<TestRunWithCases[]>(initialRuns);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [view, setView] = useState<ViewMode>("board");
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TestRunFilters>({
    agent: "ALL",
    branch: "ALL",
    dateRange: "ALL",
    search: "",
  });

  const updateFilter = useCallback(<K extends keyof TestRunFilters>(key: K, value: TestRunFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.agent !== "ALL") params.set("agent_id", filters.agent);
      if (filters.branch !== "ALL") params.set("branch", filters.branch);
      if (filters.search) params.set("search", filters.search);
      params.set("limit", "50");

      const res = await fetch(`/api/test-runs?${params}`);
      const data: TestRunsListResponse = await res.json();
      if (data.success) {
        setRuns(data.test_runs);
        setLastRefresh(new Date());
      } else {
        setError("Failed to refresh test runs");
      }
    } catch {
      setError("Failed to refresh test runs. Retrying...");
    } finally {
      setIsRefreshing(false);
    }
  }, [filters.agent, filters.branch, filters.search]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Refresh when filters change (except dateRange which is client-side)
  useEffect(() => {
    refresh();
  }, [filters.agent, filters.branch, filters.search, refresh]);

  // Client-side date filtering
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      if (filters.dateRange === "ALL") return true;
      const startedAt = new Date(run.started_at);
      if (filters.dateRange === "TODAY") return isToday(startedAt);
      if (filters.dateRange === "WEEK") return isThisWeek(startedAt);
      if (filters.dateRange === "MONTH") return isThisMonth(startedAt);
      return true;
    });
  }, [runs, filters.dateRange]);

  // Group runs by status for Kanban board
  const grouped = useMemo<GroupedTestRuns>(() => {
    const getStatusGroup = (status: RunStatus): keyof GroupedTestRuns => {
      switch (status) {
        case "RUNNING":
          return "running";
        case "QUEUED":
          return "queued";
        case "PASSED":
          return "passed";
        case "FAILED":
        case "CANCELLED":
        case "TIMED_OUT":
          return "failed";
        default:
          return "queued";
      }
    };

    return filteredRuns.reduce<GroupedTestRuns>(
      (acc, run) => {
        const group = getStatusGroup(run.status);
        acc[group].push(run);
        return acc;
      },
      { running: [], queued: [], passed: [], failed: [] }
    );
  }, [filteredRuns]);

  // Extract unique agents and branches for filter dropdowns
  const uniqueAgents = useMemo(() => {
    const agentMap = new Map<string, { id: string; name: string }>();
    runs.forEach((run) => {
      if (!agentMap.has(run.agent.id)) {
        agentMap.set(run.agent.id, { id: run.agent.id, name: run.agent.name });
      }
    });
    return Array.from(agentMap.values());
  }, [runs]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    runs.forEach((run) => branches.add(run.branch));
    return Array.from(branches).sort();
  }, [runs]);

  return {
    runs: filteredRuns,
    grouped,
    isRefreshing,
    lastRefresh,
    view,
    setView,
    filters,
    setFilters,
    updateFilter,
    refresh,
    error,
    uniqueAgents,
    uniqueBranches,
  };
}
