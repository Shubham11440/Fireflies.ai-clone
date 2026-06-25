"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-7 h-7 rounded-lg bg-fireflies-yellow flex items-center justify-center">
            <span className="text-fireflies-navy text-sm font-black">F</span>
          </div>
          <span className="hidden sm:inline-block">fireflies</span>
        </Link>

        {/* Primary Nav */}
        <nav className="flex items-center gap-1 ml-4">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              pathname === "/"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Meetings
          </Link>
          <span className="px-3 py-1.5 text-sm rounded-md text-muted-foreground/50 cursor-not-allowed">
            Integrations
          </span>
          <span className="px-3 py-1.5 text-sm rounded-md text-muted-foreground/50 cursor-not-allowed">
            Team
          </span>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
            <Bell className="h-4 w-4" />
          </button>
          <Link
            href="/settings"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-fireflies-yellow text-fireflies-navy font-bold text-xs"
          >
            DU
          </Link>
        </div>
      </div>
    </header>
  );
}
