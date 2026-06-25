"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  meetingTitle: string;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmDialog({
  meetingTitle,
  isLoading,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-card rounded-lg shadow-lg border border-border w-full max-w-md mx-4">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Delete Meeting
            </h2>
          </div>

          <p className="text-sm text-muted-foreground ml-10">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              &ldquo;{meetingTitle}&rdquo;
            </span>
            ? This will permanently remove the meeting, its transcript, summary, and all associated data. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 h-9 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 h-9 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Deleting..." : "Delete Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
