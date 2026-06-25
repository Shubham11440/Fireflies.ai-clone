import { create } from "zustand";

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  activeLineId: string | null;
  playbackRate: number;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveLineId: (id: string | null) => void;
  setPlaybackRate: (rate: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  activeLineId: null,
  playbackRate: 1,
  seek: (time) => set({ currentTime: time }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setActiveLineId: (activeLineId) => set({ activeLineId }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
}));
