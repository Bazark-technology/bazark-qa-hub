"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DailyChartData } from "@/types";

interface PassRateChartProps {
  data: DailyChartData[];
}

type TimeRange = "7d" | "14d";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyChartData }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        <p className="flex justify-between gap-4">
          <span className="text-gray-500">Pass Rate:</span>
          <span className={"font-medium " + (data.passRate >= 80 ? "text-green-600" : "text-red-600")}>
            {data.passRate}%
          </span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-gray-500">Total Runs:</span>
          <span className="font-medium text-gray-900">{data.totalRuns}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-gray-500">Passed:</span>
          <span className="font-medium text-green-600">{data.passed}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-gray-500">Failed:</span>
          <span className="font-medium text-red-600">{data.failed}</span>
        </p>
      </div>
    </div>
  );
}

export default function PassRateChart({ data }: PassRateChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");

  const filteredData = timeRange === "7d" ? data.slice(-7) : data;

  const hasData = data.some((d) => d.totalRuns > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pass Rate Trend</h3>
            <p className="text-sm text-gray-500">Last 14 days</p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No test data yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Runs will appear here once agents start testing
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pass Rate Trend</h3>
          <p className="text-sm text-gray-500">
            {timeRange === "7d" ? "Last 7 days" : "Last 14 days"}
          </p>
        </div>
        <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setTimeRange("7d")}
            className={"px-3 py-1.5 text-sm rounded-md transition-all " + (timeRange === "7d" ? "bg-white font-medium shadow-sm" : "text-gray-600 hover:text-gray-900")}
          >
            7d
          </button>
          <button
            onClick={() => setTimeRange("14d")}
            className={"px-3 py-1.5 text-sm rounded-md transition-all " + (timeRange === "14d" ? "bg-white font-medium shadow-sm" : "text-gray-600 hover:text-gray-900")}
          >
            14d
          </button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(value) => value + "%"}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={80}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: "Target 80%", position: "right", fill: "#9ca3af", fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="passRate"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#passRateGradient)"
              dot={false}
              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
