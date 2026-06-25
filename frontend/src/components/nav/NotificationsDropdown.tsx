"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Trash2, FileText, Sparkles } from "lucide-react";
import { useNotificationsStore } from "@/stores/notificationsStore";
import type { AppNotification } from "@/types";
import Link from "next/link";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "summary":
      return <FileText className="h-3.5 w-3.5 text-fireflies-yellow" />;
    case "meeting":
      return <Sparkles className="h-3.5 w-3.5 text-blue-500" />;
    case "chapter":
      return <FileText className="h-3.5 w-3.5 text-green-500" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    markAllRead,
    markRead,
    clear,
  } = useNotificationsStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-fireflies-yellow text-fireflies-navy text-[10px] font-bold px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Notifications</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clear}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                  title="Clear all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={() => markRead(n.id)}
                  onDismiss={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border text-center">
              <span className="text-[10px] text-muted-foreground">
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
  onDismiss,
}: {
  notification: AppNotification;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const content = (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors ${
        !notification.read ? "bg-fireflies-yellow/5" : ""
      }`}
      onClick={onRead}
    >
      <div className="mt-0.5 shrink-0">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{notification.title}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-fireflies-yellow shrink-0 mt-1.5" />
      )}
    </div>
  );

  if (notification.meeting_id) {
    return (
      <Link href={`/m/${notification.meeting_id}`} onClick={onDismiss}>
        {content}
      </Link>
    );
  }

  return content;
}
