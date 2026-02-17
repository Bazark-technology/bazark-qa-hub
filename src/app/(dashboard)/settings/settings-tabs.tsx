"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Key, Settings, Bell } from "lucide-react";
import { ApiKeysTab } from "@/components/settings";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
];

interface SettingsTabsProps {
  activeTab: string;
}

export default function SettingsTabs({ activeTab }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/settings?${params.toString()}`);
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "api-keys" && <ApiKeysTab />}

        {activeTab === "general" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              General Settings
            </h3>
            <p className="text-gray-500">Coming soon</p>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Notification Settings
            </h3>
            <p className="text-gray-500">Coming soon</p>
          </div>
        )}
      </div>
    </>
  );
}
