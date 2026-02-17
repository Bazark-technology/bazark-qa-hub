"use client";

import Link from "next/link";
import { Bot, FlaskConical, Target, Bug, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatCardsProps {
  stats: DashboardStats;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  title,
  value,
  subtitle,
  trend,
  href,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: { type: "up" | "down" | "same"; text: string };
  href?: string;
}) {
  const content = (
    <div className={"bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow border-l-4 " + borderColor}>
      <div className="flex items-start justify-between">
        <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + iconBg}>
          <Icon className={"w-6 h-6 " + iconColor} />
        </div>
        {trend && (
          <div className={"flex items-center gap-1 text-xs " + (trend.type === "up" ? "text-green-600" : trend.type === "down" ? "text-red-600" : "text-gray-500")}>
            {trend.type === "up" && <TrendingUp className="w-3 h-3" />}
            {trend.type === "down" && <TrendingDown className="w-3 h-3" />}
            {trend.type === "same" && <Minus className="w-3 h-3" />}
            <span>{trend.text}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function StatCards({ stats }: StatCardsProps) {
  // Calculate trend for today vs yesterday
  const runsTrend = (() => {
    if (stats.yesterdayRuns === 0 && stats.todayRuns === 0) {
      return { type: "same" as const, text: "No runs yet" };
    }
    if (stats.yesterdayRuns === 0) {
      return { type: "up" as const, text: "First runs today" };
    }
    const diff = ((stats.todayRuns - stats.yesterdayRuns) / stats.yesterdayRuns) * 100;
    if (diff > 0) {
      return { type: "up" as const, text: Math.round(diff) + "% more than yesterday" };
    } else if (diff < 0) {
      return { type: "down" as const, text: Math.abs(Math.round(diff)) + "% less than yesterday" };
    }
    return { type: "same" as const, text: "Same as yesterday" };
  })();

  // Pass rate color coding
  const passRateColor = stats.todayPassRate >= 90 ? "text-green-600" : stats.todayPassRate >= 75 ? "text-yellow-600" : "text-red-600";
  const passRateBg = stats.todayPassRate >= 90 ? "bg-green-50" : stats.todayPassRate >= 75 ? "bg-yellow-50" : "bg-red-50";
  const passRateIconColor = stats.todayPassRate >= 90 ? "text-green-600" : stats.todayPassRate >= 75 ? "text-yellow-600" : "text-red-600";
  const passRateBorder = stats.todayPassRate >= 90 ? "border-l-green-500" : stats.todayPassRate >= 75 ? "border-l-yellow-500" : "border-l-red-500";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={Bot}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        borderColor="border-l-blue-500"
        title="Total Agents"
        value={formatNumber(stats.totalAgents)}
        subtitle={stats.onlineAgents + " online"}
      />

      <StatCard
        icon={FlaskConical}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        borderColor="border-l-purple-500"
        title="Test Runs Today"
        value={formatNumber(stats.todayRuns)}
        subtitle={stats.todayPassed + " passed, " + stats.todayFailed + " failed"}
        trend={runsTrend}
      />

      <StatCard
        icon={Target}
        iconBg={passRateBg}
        iconColor={passRateIconColor}
        borderColor={passRateBorder}
        title="Pass Rate Today"
        value={stats.todayPassRate.toFixed(1) + "%"}
        subtitle={"across " + formatNumber(stats.todayTotalTests) + " tests"}
      />

      <StatCard
        icon={Bug}
        iconBg={stats.todayOpenBugs > 0 ? "bg-red-50" : "bg-gray-50"}
        iconColor={stats.todayOpenBugs > 0 ? "text-red-600" : "text-gray-400"}
        borderColor={stats.todayOpenBugs > 0 ? "border-l-red-500" : "border-l-gray-300"}
        title="Open Bugs"
        value={formatNumber(stats.todayOpenBugs)}
        subtitle={stats.todayHighPriorityBugs > 0 ? stats.todayHighPriorityBugs + " high priority" : "No high priority"}
        href="/test-runs?status=FAILED"
      />
    </div>
  );
}
