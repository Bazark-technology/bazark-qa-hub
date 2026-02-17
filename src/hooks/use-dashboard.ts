"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  DashboardData,
  DashboardResponse,
  ActiveRunsResponse,
} from "@/types";

interface UseDashboardReturn {
  data: DashboardData;
  isRefreshing: boolean;
  lastRefresh: Date;
  refresh: () => Promise<void>;
  error: string | null;
}

export function useDashboard(initialData: DashboardData): UseDashboardReturn {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      const json: DashboardResponse = await res.json();
      if (json.success) {
        setData(json.data);
        setLastRefresh(new Date());
      } else {
        setError("Failed to refresh dashboard");
      }
    } catch {
      setError("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshActive = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/active");
      const json: ActiveRunsResponse = await res.json();
      if (json.success) {
        setData((prev) => ({ ...prev, activeRuns: json.active_runs }));
      }
    } catch {
      // Silent fail for active runs refresh
    }
  }, []);

  // Main refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(refreshAll, 60000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Active runs refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshActive, 10000);
    return () => clearInterval(interval);
  }, [refreshActive]);

  return {
    data,
    isRefreshing,
    lastRefresh,
    refresh: refreshAll,
    error,
  };
}
