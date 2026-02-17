import { notFound } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  ExternalLink,
  GitBranch,
  Server,
  Globe,
  FlaskConical,
  TrendingUp,
  Calendar,
  Timer,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Button } from "@/components/ui";

const STALE_THRESHOLD_MS = 3 * 60 * 1000;

function getStatusBadge(status: string) {
  const variants: Record<string, "success" | "default" | "destructive" | "warning"> = {
    ONLINE: "success",
    RUNNING: "default",
    OFFLINE: "default",
    ERROR: "destructive",
    PAUSED: "warning",
  };
  return variants[status] || "default";
}

function getRunStatusBadge(status: string) {
  const variants: Record<string, "success" | "default" | "destructive" | "warning"> = {
    PASSED: "success",
    RUNNING: "default",
    FAILED: "destructive",
    CANCELLED: "warning",
    QUEUED: "default",
    TIMED_OUT: "destructive",
  };
  return variants[status] || "default";
}

function getPassRateColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-green-500";
  if (rate >= 60) return "text-yellow-500";
  if (rate >= 40) return "text-orange-500";
  return "text-red-500";
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      test_runs: {
        orderBy: { started_at: "desc" },
        take: 10,
        select: {
          id: true,
          run_number: true,
          commit_hash: true,
          commit_message: true,
          status: true,
          total_tests: true,
          passed: true,
          failed: true,
          started_at: true,
          finished_at: true,
          duration_ms: true,
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  // Get aggregated stats
  const statsAgg = await prisma.testRun.aggregate({
    where: { agent_id: id },
    _count: true,
    _avg: { duration_ms: true },
  });

  const passedCount = await prisma.testRun.count({
    where: { agent_id: id, status: "PASSED" },
  });

  const todayRuns = await prisma.testRun.count({
    where: { agent_id: id, started_at: { gte: todayStart } },
  });

  const totalRuns = statsAgg._count || 0;
  const passRate = totalRuns > 0 ? (passedCount / totalRuns) * 100 : 0;

  const isStale = agent.last_heartbeat
    ? now.getTime() - new Date(agent.last_heartbeat).getTime() > STALE_THRESHOLD_MS
    : true;

  let effectiveStatus = agent.status;
  if (isStale && agent.status !== "RUNNING") {
    effectiveStatus = "OFFLINE";
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/agents" className="hover:text-gray-700">
          Agents
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{agent.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
          <Badge variant={getStatusBadge(effectiveStatus)} className="mt-2">
            {effectiveStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/test-runs?agent_id=${id}`}>
            <Button variant="outline">View All Test Runs</Button>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Dev URL</label>
              <a
                href={agent.dev_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                {agent.dev_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Repo URL</label>
              <a
                href={agent.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <GitBranch className="w-4 h-4" />
                {agent.repo_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Branch</label>
                <p className="text-sm text-gray-900">{agent.branch}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Version</label>
                <p className="text-sm text-gray-900">{agent.version || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Hostname</label>
                <p className="text-sm text-gray-900 flex items-center gap-1">
                  <Server className="w-4 h-4 text-gray-400" />
                  {agent.hostname || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">IP Address</label>
                <p className="text-sm text-gray-900">{agent.ip_address || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Registered</label>
                <p className="text-sm text-gray-900">{format(agent.created_at, "PPP")}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Last Heartbeat</label>
                <p className={`text-sm ${isStale ? "text-red-600" : "text-gray-900"}`}>
                  {agent.last_heartbeat
                    ? formatDistanceToNow(agent.last_heartbeat, { addSuffix: true })
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <FlaskConical className="w-6 h-6 mx-auto text-gray-400 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{totalRuns}</div>
              <div className="text-sm text-gray-500">Total Runs</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-gray-400 mb-2" />
              <div className={`text-3xl font-bold ${getPassRateColor(passRate)}`}>
                {totalRuns > 0 ? `${Math.round(passRate * 10) / 10}%` : "N/A"}
              </div>
              <div className="text-sm text-gray-500">Pass Rate</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto text-gray-400 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{todayRuns}</div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Timer className="w-6 h-6 mx-auto text-gray-400 mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {statsAgg._avg.duration_ms
                  ? `${Math.round(statsAgg._avg.duration_ms / 1000)}s`
                  : "N/A"}
              </div>
              <div className="text-sm text-gray-500">Avg Duration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Test Runs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Test Runs</h2>
          <Link
            href={`/test-runs?agent_id=${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {agent.test_runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 font-medium">Run #</th>
                  <th className="pb-3 font-medium">Commit</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tests</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agent.test_runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">#{run.run_number}</td>
                    <td className="py-3">
                      <div className="text-sm">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {run.commit_hash.slice(0, 7)}
                        </code>
                        <span className="ml-2 text-gray-600 truncate max-w-xs inline-block align-middle">
                          {run.commit_message}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={getRunStatusBadge(run.status)}>{run.status}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {run.passed}/{run.total_tests} passed
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {run.duration_ms ? `${Math.round(run.duration_ms / 1000)}s` : "-"}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {formatDistanceToNow(run.started_at, { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No test runs yet</p>
        )}
      </div>
    </div>
  );
}
