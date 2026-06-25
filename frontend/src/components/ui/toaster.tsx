"use client";

import { useSessionStore } from "@/stores/sessionStore";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function Toaster() {
  const { toasts, removeToast } = useSessionStore();

  return (
    <ToastProvider>
      {toasts.map((t) => {
        const Icon = variantIcons[t.type] || Info;
        return (
          <Toast
            key={t.id}
            variant={t.type === "error" ? "destructive" : t.type === "success" ? "success" : "info"}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                {t.message && <ToastDescription>{t.message}</ToastDescription>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
