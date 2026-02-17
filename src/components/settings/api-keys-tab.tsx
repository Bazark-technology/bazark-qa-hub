"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { KeyRound, Copy, Trash2, Check, AlertCircle } from "lucide-react";
import {
  Badge,
  Button,
  Toast,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useApiKeys } from "@/hooks/use-api-keys";
import ApiKeysSkeleton from "./api-keys-skeleton";
import GenerateKeyModal from "./generate-key-modal";
import RevokeKeyDialog from "./revoke-key-dialog";
import type { ApiKeyResponse } from "@/types";

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function ApiKeysTab() {
  const { keys, isLoading, error, generateKey, revokeKey } = useApiKeys();
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKeyResponse | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleCopyKey = async (key: ApiKeyResponse) => {
    await navigator.clipboard.writeText(key.masked_key);
    setCopiedKeyId(key.id);
    setToast({ message: "Copied to clipboard", type: "success" });
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevokeClick = (key: ApiKeyResponse) => {
    setSelectedKey(key);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedKey) return false;
    return await revokeKey(selectedKey.id);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (isLoading) {
    return <ApiKeysSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Failed to load API keys
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          <p className="text-gray-500 mt-1">
            Manage API keys for agent authentication. Keys are used by OpenClaw agents to
            register, send heartbeats, and report test results.
          </p>
        </div>
        <Button onClick={() => setGenerateModalOpen(true)}>
          <KeyRound className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {/* Empty State */}
      {keys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No API keys yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Generate your first API key to start connecting QA agents to the dashboard.
          </p>
          <Button onClick={() => setGenerateModalOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            Generate Key
          </Button>
        </div>
      ) : (
        /* Keys Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-50">
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key: ApiKeyResponse) => (
                <TableRow key={key.id} className={!key.is_active ? "opacity-60" : ""}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{key.label}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono text-gray-600">
                      {key.masked_key}
                    </code>
                  </TableCell>
                  <TableCell>
                    {key.is_active ? (
                      <Badge variant="success">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />
                        Revoked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{key.created_by.name}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-gray-600"
                      title={new Date(key.created_at).toLocaleString()}
                    >
                      {formatDate(key.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500">
                      {key.last_used ? formatDate(key.last_used) : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {key.is_active ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyKey(key)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copy masked key"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRevokeClick(key)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Revoked</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Generate Key Modal */}
      <GenerateKeyModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onGenerate={generateKey}
        onSuccess={() => setToast({ message: "API key generated successfully", type: "success" })}
      />

      {/* Revoke Key Dialog */}
      {selectedKey && (
        <RevokeKeyDialog
          open={revokeDialogOpen}
          onOpenChange={setRevokeDialogOpen}
          keyLabel={selectedKey.label}
          onConfirm={handleRevokeConfirm}
          onSuccess={() => {
            setToast({ message: "API key revoked successfully", type: "success" });
            setSelectedKey(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
