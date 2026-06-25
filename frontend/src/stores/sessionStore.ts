import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface SessionState {
  user: User | null;
  theme: "light" | "dark";
  toasts: Toast[];
  hydrateTheme: () => void;
  toggleTheme: () => void;
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useSessionStore = create<SessionState>((set) => ({
  user: {
    id: "user-default",
    name: "Default User",
    email: "user@fireflies.local",
  },
  theme: "light",
  toasts: [],
  hydrateTheme: () => {
    const theme = getInitialTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
      }
      return { theme: newTheme };
    }),
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
