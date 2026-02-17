"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  FlaskConical,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useTestRuns, type DateRangeFilter } from "@/hooks/use-test-runs";
import TestRunCard from "./test-run-card";
import TestRunCardSkeleton from "./test-run-card-skeleton";
import type { TestRunWithCases } from "@/types";

interface TestRunsViewProps {
  initialRuns: TestRunWithCases[];
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
    <div className={"border-t-4 " + color + " pt-3 pb-2 sticky top-0 bg-[#f8fafc] z-10"}>
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
      <p className="text-sm text-gray-500">No {status.toLowerCase()} runs</p>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 min-w-[140px] shadow-sm transition-colors"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 bg-white border border-gray-300 rounded-lg shadow-xl py-1 z-20 min-w-[180px]">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={"w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 " + (value === option.value ? "bg-blue-50 text-blue-700 font-medium" : "")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DateRangeToggle({
  value,
  onChange,
}: {
  value: DateRangeFilter;
  onChange: (value: DateRangeFilter) => void;
}) {
  const options: { value: DateRangeFilter; label: string }[] = [
    { value: "TODAY", label: "Today" },
    { value: "WEEK", label: "This Week" },
    { value: "MONTH", label: "This Month" },
    { value: "ALL", label: "All Time" },
  ];

  return (
    <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg p-1 shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={"px-3 py-2 text-sm rounded-md transition-all " + (value === option.value ? "bg-white text-blue-700 font-semibold shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function TestRunsView({ initialRuns }: TestRunsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    runs,
    grouped,
    isRefreshing,
    lastRefresh,
    view,
    setView,
    filters,
    updateFilter,
    refresh,
    uniqueAgents,
    uniqueBranches,
  } = useTestRuns(initialRuns);

  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilter("search", searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilter]);

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.agent !== "ALL") params.set("agent", filters.agent);
    if (filters.branch !== "ALL") params.set("branch", filters.branch);
    if (filters.dateRange !== "ALL") params.set("date", filters.dateRange);
    if (filters.search) params.set("q", filters.search);
    if (view !== "board") params.set("view", view);

    const newUrl = params.toString() ? "?" + params.toString() : "/test-runs";
    router.replace(newUrl, { scroll: false });
  }, [filters, view, router]);

  // Initialize from URL on mount
  useEffect(() => {
    const agent = searchParams.get("agent");
    const branch = searchParams.get("branch");
    const date = searchParams.get("date") as DateRangeFilter | null;
    const q = searchParams.get("q");
    const viewParam = searchParams.get("view");

    if (agent) updateFilter("agent", agent);
    if (branch) updateFilter("branch", branch);
    if (date) updateFilter("dateRange", date);
    if (q) {
      updateFilter("search", q);
      setSearchInput(q);
    }
    if (viewParam === "list") setView("list");
  }, []);

  const agentOptions = [
    { value: "ALL", label: "All Agents" },
    ...uniqueAgents.map((a) => ({ value: a.id, label: a.name })),
  ];

  const branchOptions = [
    { value: "ALL", label: "All Branches" },
    ...uniqueBranches.map((b) => ({ value: b, label: b })),
  ];

  // Empty state
  if (runs.length === 0 && filters.agent === "ALL" && filters.branch === "ALL" && !filters.search) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No test runs yet</h2>
          <p className="text-gray-500 max-w-md mb-4">
            Test runs will appear here when your QA agents start testing commits.
          </p>
          <a href="/docs" className="text-blue-600 hover:underline text-sm">
            View agent setup docs
          </a>
        </div>
      </div>
    );
  }

  // No results for filter
  if (runs.length === 0) {
    return (
      <div className="space-y-6">
        <FilterBar
          view={view}
          setView={setView}
          filters={filters}
          updateFilter={updateFilter}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          agentOptions={agentOptions}
          branchOptions={branchOptions}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
          refresh={refresh}
          totalCount={initialRuns.length}
        />
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No test runs match your filters</h2>
            <Button
              variant="outline"
              onClick={() => {
                updateFilter("agent", "ALL");
                updateFilter("branch", "ALL");
                updateFilter("dateRange", "ALL");
                updateFilter("search", "");
                setSearchInput("");
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar
        view={view}
        setView={setView}
        filters={filters}
        updateFilter={updateFilter}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        agentOptions={agentOptions}
        branchOptions={branchOptions}
        isRefreshing={isRefreshing}
        lastRefresh={lastRefresh}
        refresh={refresh}
        totalCount={runs.length}
      />

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Running Column */}
          <div className="space-y-4 min-h-[400px]">
            <ColumnHeader title="Running" count={grouped.running.length} color="border-blue-500" />
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {isRefreshing && grouped.running.length === 0 ? (
                <TestRunCardSkeleton />
              ) : grouped.running.length > 0 ? (
                grouped.running.map((run: TestRunWithCases) => <TestRunCard key={run.id} testRun={run} />)
              ) : (
                <EmptyColumn status="running" />
              )}
            </div>
          </div>

          {/* Queued Column */}
          <div className="space-y-4 min-h-[400px]">
            <ColumnHeader title="Queued" count={grouped.queued.length} color="border-yellow-500" />
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {isRefreshing && grouped.queued.length === 0 ? (
                <TestRunCardSkeleton />
              ) : grouped.queued.length > 0 ? (
                grouped.queued.map((run: TestRunWithCases) => <TestRunCard key={run.id} testRun={run} />)
              ) : (
                <EmptyColumn status="queued" />
              )}
            </div>
          </div>

          {/* Passed Column */}
          <div className="space-y-4 min-h-[400px]">
            <ColumnHeader title="Passed" count={grouped.passed.length} color="border-green-500" />
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {isRefreshing && grouped.passed.length === 0 ? (
                <>
                  <TestRunCardSkeleton />
                  <TestRunCardSkeleton />
                </>
              ) : grouped.passed.length > 0 ? (
                grouped.passed.map((run: TestRunWithCases) => <TestRunCard key={run.id} testRun={run} />)
              ) : (
                <EmptyColumn status="passed" />
              )}
            </div>
          </div>

          {/* Failed Column */}
          <div className="space-y-4 min-h-[400px]">
            <ColumnHeader title="Failed" count={grouped.failed.length} color="border-red-500" />
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {isRefreshing && grouped.failed.length === 0 ? (
                <TestRunCardSkeleton />
              ) : grouped.failed.length > 0 ? (
                grouped.failed.map((run: TestRunWithCases) => <TestRunCard key={run.id} testRun={run} />)
              ) : (
                <EmptyColumn status="failed" />
              )}
            </div>
          </div>
        </div>
      ) : (
        <TestRunsListView runs={runs} />
      )}
    </div>
  );
}

function FilterBar({
  view,
  setView,
  filters,
  updateFilter,
  searchInput,
  setSearchInput,
  agentOptions,
  branchOptions,
  isRefreshing,
  lastRefresh,
  refresh,
  totalCount,
}: {
  view: "board" | "list";
  setView: (v: "board" | "list") => void;
  filters: { agent: string; branch: string; dateRange: DateRangeFilter; search: string };
  updateFilter: (key: "agent" | "branch" | "dateRange" | "search", value: string) => void;
  searchInput: string;
  setSearchInput: (s: string) => void;
  agentOptions: { value: string; label: string }[];
  branchOptions: { value: string; label: string }[];
  isRefreshing: boolean;
  lastRefresh: Date;
  refresh: () => void;
  totalCount: number;
}) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">Test Runs</h2>
          <Badge>{totalCount}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setView("board")}
              className={"p-2 rounded-md transition-all " + (view === "board" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900")}
              title="Kanban Board"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={"p-2 rounded-md transition-all " + (view === "list" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900")}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <FilterDropdown
            label="All Agents"
            value={filters.agent}
            options={agentOptions}
            onChange={(v) => updateFilter("agent", v)}
          />

          <FilterDropdown
            label="All Branches"
            value={filters.branch}
            options={branchOptions}
            onChange={(v) => updateFilter("branch", v)}
          />

          <DateRangeToggle
            value={filters.dateRange}
            onChange={(v) => updateFilter("dateRange", v)}
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search commits..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 w-52 shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
            className="border-gray-300 shadow-sm"
          >
            <RefreshCw className={"w-4 h-4 mr-2 " + (isRefreshing ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last updated */}
      <div className="flex justify-end text-sm text-gray-500">
        Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
      </div>
    </>
  );
}

function TestRunsListView({ runs }: { runs: TestRunWithCases[] }) {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>("started_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedRuns = [...runs].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "commit":
        aVal = a.commit_hash;
        bVal = b.commit_hash;
        break;
      case "branch":
        aVal = a.branch;
        bVal = b.branch;
        break;
      case "tests":
        aVal = a.total_tests;
        bVal = b.total_tests;
        break;
      case "pass_rate":
        aVal = a.total_tests > 0 ? a.passed / a.total_tests : 0;
        bVal = b.total_tests > 0 ? b.passed / b.total_tests : 0;
        break;
      case "duration":
        aVal = a.duration_ms || 0;
        bVal = b.duration_ms || 0;
        break;
      case "started_at":
      default:
        aVal = new Date(a.started_at).getTime();
        bVal = new Date(b.started_at).getTime();
        break;
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-700"
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <Table className="bg-white rounded-xl shadow-sm border border-gray-100">
      <TableHeader>
        <TableRow>
          <TableHead><SortHeader field="status">Status</SortHeader></TableHead>
          <TableHead><SortHeader field="commit">Commit</SortHeader></TableHead>
          <TableHead>Agent</TableHead>
          <TableHead><SortHeader field="branch">Branch</SortHeader></TableHead>
          <TableHead><SortHeader field="tests">Tests</SortHeader></TableHead>
          <TableHead><SortHeader field="pass_rate">Pass Rate</SortHeader></TableHead>
          <TableHead><SortHeader field="duration">Duration</SortHeader></TableHead>
          <TableHead><SortHeader field="started_at">Started</SortHeader></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRuns.map((run: TestRunWithCases, idx: number) => {
          const passRate = run.total_tests > 0 ? Math.round((run.passed / run.total_tests) * 100) : 0;
          return (
            <TableRow
              key={run.id}
              onClick={() => router.push("/test-runs/" + run.id)}
              className={idx % 2 === 1 ? "bg-gray-50/50" : ""}
            >
              <TableCell>
                <Badge
                  variant={
                    run.status === "PASSED"
                      ? "success"
                      : run.status === "FAILED" || run.status === "TIMED_OUT"
                        ? "destructive"
                        : run.status === "RUNNING"
                          ? "default"
                          : "warning"
                  }
                >
                  {run.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <code className="text-sm font-mono">{run.commit_hash.slice(0, 7)}</code>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{run.commit_message}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{run.agent.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{run.branch}</Badge>
              </TableCell>
              <TableCell className="text-sm">{run.total_tests}</TableCell>
              <TableCell>
                <span className={passRate >= 80 ? "text-green-600" : passRate >= 50 ? "text-yellow-600" : "text-red-600"}>
                  {passRate}%
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + "s" : "-"}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
