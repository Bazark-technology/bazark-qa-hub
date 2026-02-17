import { redirect } from "next/navigation";
import { Lock, BookOpen, FileText, FileJson, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import SettingsTabs from "./settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const { tab } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 max-w-md">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const activeTab = tab || "api-keys";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account and application settings
        </p>
      </div>

      {/* Tabs */}
      <SettingsTabs activeTab={activeTab} />

      {/* Developer Resources - Always visible */}
      {activeTab === "api-keys" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Developer Resources
            </h3>
          </div>
          <p className="text-gray-500 mb-4 text-sm">
            API documentation and resources for integrating QA agents.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600">API Docs</p>
                <p className="text-xs text-gray-500">Interactive docs</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            </a>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all group"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 group-hover:text-purple-600">Markdown</p>
                <p className="text-xs text-gray-500">For AI agents</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
            </a>
            <a
              href="/api/docs/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-200 transition-all group"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <FileJson className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 group-hover:text-green-600">OpenAPI</p>
                <p className="text-xs text-gray-500">Postman/Swagger</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
