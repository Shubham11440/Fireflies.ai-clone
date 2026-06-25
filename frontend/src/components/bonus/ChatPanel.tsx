"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useChat } from "@/api/queries/useChat";
import type { ChatMessage } from "@/api/chatApi";

interface ChatPanelProps {
  meetingId: string;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <div className={`flex gap-2.5 ${isAssistant ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isAssistant
            ? "bg-fireflies-yellow text-fireflies-navy"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isAssistant
            ? "bg-card border border-border text-foreground rounded-tl-none"
            : "bg-fireflies-yellow/10 border border-fireflies-yellow/20 text-foreground rounded-tr-none"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-fireflies-yellow text-fireflies-navy shrink-0">
        <Bot className="h-4 w-4" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-none px-3.5 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What were the key decisions?",
  "Summarize the action items",
  "Who participated in this meeting?",
  "What are the next steps?",
];

export function ChatPanel({ meetingId }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoadingThread,
    isLoadingMessages,
    isSending,
    sendMessage,
  } = useChat(meetingId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    if (!q || isSending) return;
    setDraft("");
    await sendMessage(q);
    inputRef.current?.focus();
  };

  const handleSuggestion = (q: string) => {
    setDraft(q);
    inputRef.current?.focus();
  };

  if (isLoadingThread || isLoadingMessages) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-full bg-fireflies-yellow flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-fireflies-navy" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Ask AI</p>
          <p className="text-[10px] text-muted-foreground">Ask anything about this meeting</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-fireflies-yellow/10 border border-fireflies-yellow/20 flex items-center justify-center mx-auto mb-3">
              <Bot className="h-6 w-6 text-fireflies-yellow" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Ask about this meeting</p>
            <p className="text-xs text-muted-foreground mb-5">
              I can answer questions about the transcript, summary, decisions, and action items.
            </p>
            {/* Suggested questions */}
            <div className="flex flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-border hover:border-fireflies-yellow/40 hover:bg-fireflies-yellow/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isSending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question about this meeting…"
          disabled={isSending}
          className="flex-1 text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-fireflies-yellow/30 transition-shadow disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="w-8 h-8 rounded-lg bg-fireflies-yellow text-fireflies-navy flex items-center justify-center disabled:opacity-40 hover:opacity-80 transition-opacity shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
