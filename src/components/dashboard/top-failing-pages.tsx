"use client";

import { ThumbsUp, AlertTriangle } from "lucide-react";
import type { FailingPage } from "@/types";

interface TopFailingPagesProps {
  pages: FailingPage[];
}

export default function TopFailingPages({ pages }: TopFailingPagesProps) {
  if (pages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Failing Pages</h3>
          <p className="text-sm text-gray-500">This week</p>
        </div>
        <div className="text-center py-8">
          <ThumbsUp className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-green-600 font-medium">No failing pages</p>
          <p className="text-sm text-gray-400 mt-1">All pages passed tests this week</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...pages.map((p) => p.failure_count));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Failing Pages</h3>
        <p className="text-sm text-gray-500">This week</p>
      </div>

      <div className="space-y-4">
        {pages.map((page, idx) => {
          const barWidth = (page.failure_count / maxCount) * 100;
          
          return (
            <div key={page.url_path} className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-5">
                    {idx + 1}.
                  </span>
                  <code className="text-sm font-mono text-gray-700">
                    {page.url_path}
                  </code>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {page.failure_count}
                </span>
              </div>
              <div className="ml-7 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                  style={{ width: barWidth + "%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
