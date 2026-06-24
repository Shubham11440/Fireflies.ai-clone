"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Video,
  Puzzle,
  Users,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Meetings", icon: Video },
  { href: "#", label: "Integrations", icon: Puzzle, disabled: true },
  { href: "#", label: "Team", icon: Users, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-bg-fireflies-navy-lighter bg-fireflies-navy text-white transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Create button */}
      <div className="p-3">
        <Link
          href="/create"
          className={`flex items-center justify-center gap-2 rounded-lg bg-fireflies-yellow text-fireflies-navy font-semibold transition-colors hover:bg-fireflies-yellow/90 ${
            collapsed ? "h-10 w-10" : "h-10 px-4"
          }`}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="text-sm">New Meeting</span>}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.disabled ? "#" : item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              item.disabled
                ? "text-white/30 cursor-not-allowed"
                : pathname === item.href
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {item.disabled && !collapsed && (
              <span className="ml-auto text-[10px] text-white/30 bg-white/5 rounded px-1.5 py-0.5">
                Soon
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-white/10">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors ${
            pathname === "/settings" ? "bg-white/10 text-white" : ""
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 border-t border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
