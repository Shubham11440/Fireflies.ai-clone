"use client";

import { Sun, Moon } from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useSessionStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
