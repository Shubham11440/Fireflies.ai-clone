"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ChatPanel } from "@/components/bonus/ChatPanel";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex flex-col h-full">
      {/* Mini header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Link
          href={`/m/${id}`}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-semibold text-foreground">Ask AI about this meeting</span>
      </div>

      {/* Chat panel fills the rest */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel meetingId={id} />
      </div>
    </div>
  );
}
