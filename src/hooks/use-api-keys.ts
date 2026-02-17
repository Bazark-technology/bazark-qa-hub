"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ApiKeyResponse,
  GeneratedApiKey,
  ApiKeysListResponse,
  GenerateApiKeyResponse,
} from "@/types";

interface UseApiKeysReturn {
  keys: ApiKeyResponse[];
  isLoading: boolean;
  error: string | null;
  generateKey: (label: string) => Promise<GeneratedApiKey | null>;
  revokeKey: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useApiKeys(): UseApiKeysReturn {
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/settings/api-keys");
      const data: ApiKeysListResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to fetch API keys");
      }

      setKeys(data.api_keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const generateKey = async (label: string): Promise<GeneratedApiKey | null> => {
    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });

      const data: GenerateApiKeyResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || "Failed to generate API key");
      }

      // Refetch to get the updated list with masked key
      await fetchKeys();

      return data.api_key;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API key");
      return null;
    }
  };

  const revokeKey = async (id: string): Promise<boolean> => {
    // Optimistic update
    setKeys((prev) =>
      prev.map((key) => (key.id === id ? { ...key, is_active: false } : key))
    );

    try {
      const response = await fetch(`/api/settings/api-keys/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update
        await fetchKeys();
        throw new Error(data.error || "Failed to revoke API key");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
      return false;
    }
  };

  return {
    keys,
    isLoading,
    error,
    generateKey,
    revokeKey,
    refetch: fetchKeys,
  };
}
