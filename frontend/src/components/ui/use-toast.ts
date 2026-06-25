"use client";

import { useCallback } from "react";
import { useSessionStore } from "@/stores/sessionStore";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "success" | "error" | "info";
  duration?: number;
}

export function useToast() {
  const { addToast, removeToast, toasts } = useSessionStore();

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = addToast({
        message: options.description || options.title || "",
        type: options.variant || "info",
      });

      const duration = options.duration || 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [addToast, removeToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    toast,
    dismiss,
    toasts,
  };
}
