import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppNotification } from "@/types";
import { useSessionStore } from "./sessionStore";

interface NotificationsState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "user_id" | "created_at" | "read"> & { meeting_id?: string }) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
}

function getUserId(): string {
  return useSessionStore.getState().user?.id ?? "user-default";
}

function storageKey(): string {
  return `fireflies:notifications:${getUserId()}`;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: Math.random().toString(36).slice(2),
              user_id: getUserId(),
              created_at: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clear: () => set({ notifications: [] }),
    }),
    {
      name: storageKey(),
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// Re-key when user changes
let prevUserId: string | null = null;
if (typeof window !== "undefined") {
  useSessionStore.subscribe((state) => {
    const uid = state.user?.id ?? "user-default";
    if (prevUserId !== null && prevUserId !== uid) {
      useNotificationsStore.persist.setOptions({
        name: `fireflies:notifications:${uid}`,
      });
      useNotificationsStore.persist.rehydrate();
    }
    prevUserId = uid;
  });
}
