"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Modal, Input, Button } from "@/components/ui";
import type { GeneratedApiKey } from "@/types";

const generateKeySchema = z.object({
  label: z
    .string()
    .min(2, "Label must be at least 2 characters")
    .max(50, "Label must be at most 50 characters"),
});

type GenerateKeyFormData = z.infer<typeof generateKeySchema>;

interface GenerateKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (label: string) => Promise<GeneratedApiKey | null>;
  onSuccess: () => void;
}

export default function GenerateKeyModal({
  open,
  onOpenChange,
  onGenerate,
  onSuccess,
}: GenerateKeyModalProps) {
  const [generatedKey, setGeneratedKey] = useState<GeneratedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateKeyFormData>({
    resolver: zodResolver(generateKeySchema),
  });

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setGeneratedKey(null);
      setCopied(false);
      reset();
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: GenerateKeyFormData) => {
    const key = await onGenerate(data.label);
    if (key) {
      setGeneratedKey(key);
    }
  };

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    handleClose(false);
    onSuccess();
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={generatedKey ? "API Key Generated" : "Generate API Key"}
      description={
        generatedKey
          ? undefined
          : "Create a new API key for agent authentication."
      }
    >
      {generatedKey ? (
        <div className="space-y-4">
          {/* Success State */}
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <KeyRound className="w-5 h-5" />
            <span className="font-medium">Key created successfully</span>
          </div>

          {/* Key Display */}
          <div className="p-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Your API Key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                {generatedKey.key}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg bg-white border border-green-300 hover:bg-green-100 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Make sure to copy this key now. You won&apos;t be able to see it again.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Key
                </>
              )}
            </Button>
            <Button type="button" onClick={handleDone} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("label")}
            label="Label"
            placeholder="e.g., Production Agent, Staging Agent"
            error={errors.label?.message}
          />

          <p className="text-xs text-gray-500">
            Give your key a descriptive label to identify its purpose later.
          </p>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Generating..." : "Generate Key"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
