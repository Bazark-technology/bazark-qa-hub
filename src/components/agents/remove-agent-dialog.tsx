"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal, Button } from "@/components/ui";

interface RemoveAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  onConfirm: () => Promise<boolean>;
  onSuccess: () => void;
}

export default function RemoveAgentDialog({
  open,
  onOpenChange,
  agentName,
  onConfirm,
  onSuccess,
}: RemoveAgentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    const success = await onConfirm();
    setIsLoading(false);

    if (success) {
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Agent</h3>

        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to remove &quot;<strong>{agentName}</strong>&quot;? This will
          not delete historical test runs but the agent will need to re-register to
          send new results.
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Agent"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
