"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface SummaryStatusBannerProps {
  status: string;
}

export function SummaryStatusBanner({ status }: SummaryStatusBannerProps) {
  if (status === "processing") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-fireflies-yellow/10 border-b border-fireflies-yellow/20">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-fireflies-yellow" />
        <span className="text-xs text-fireflies-navy font-medium">
          Generating summary…
        </span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border-b border-destructive/20">
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        <span className="text-xs text-destructive font-medium">
          Summary generation failed
        </span>
      </div>
    );
  }

  return null;
}
