"use client";

import Link from "next/link";
import { Plus, Video } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-2xl bg-fireflies-yellow/10 flex items-center justify-center mb-4">
        <Video className="h-8 w-8 text-fireflies-yellow" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No meetings yet
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        Create your first meeting to get started with AI-powered notes and
        transcripts.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-fireflies-yellow text-fireflies-navy font-semibold text-sm hover:bg-fireflies-yellow/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Meeting
      </Link>
    </div>
  );
}
