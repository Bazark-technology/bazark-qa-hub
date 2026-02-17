"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal, Button } from "@/components/ui";

interface RevokeKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyLabel: string;
  onConfirm: () => Promise<boolean>;
  onSuccess: () => void;
}

export default function RevokeKeyDialog({
  open,
  onOpenChange,
  keyLabel,
  onConfirm,
  onSuccess,
}: RevokeKeyDialogProps) {
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
        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Revoke API Key
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to revoke the key &quot;<strong>{keyLabel}</strong>&quot;?
          Any agents using this key will immediately lose access. This action cannot
          be undone.
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
                Revoking...
              </>
            ) : (
              "Revoke Key"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
