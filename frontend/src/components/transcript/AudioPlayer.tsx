"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  mediaUrl: string | null;
  durationSec: number;
}

export function AudioPlayer({ mediaUrl, durationSec }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const {
    currentTime,
    isPlaying,
    playbackRate,
    seek,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setPlaybackRate,
  } = usePlayerStore();

  // Sync duration from meeting metadata
  useEffect(() => {
    if (durationSec > 0) {
      setDuration(durationSec);
    }
  }, [durationSec, setDuration]);

  // Seek when store currentTime changes (from transcript click)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isDragging.current) return;
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDragging.current) return;
    setCurrentTime(audio.currentTime);
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && durationSec <= 0) {
      setDuration(audio.duration);
    }
  }, [durationSec, setDuration]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = time;
      }
      seek(time);
    },
    [seek]
  );

  const skip = useCallback(
    (delta: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const newTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
      handleSeek(newTime);
    },
    [handleSeek]
  );

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2];
    const currentIdx = speeds.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  }, [playbackRate, setPlaybackRate]);

  // Seek bar click/drag
  const handleSeekBarInteraction = useCallback(
    (clientX: number) => {
      const bar = seekRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const duration = audioRef.current?.duration || durationSec || 0;
      handleSeek(pct * duration);
    },
    [handleSeek, durationSec]
  );

  const onSeekMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      handleSeekBarInteraction(e.clientX);
    },
    [handleSeekBarInteraction]
  );

  const onSeekMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      handleSeekBarInteraction(e.clientX);
    },
    [handleSeekBarInteraction]
  );

  const onSeekMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", onSeekMouseUp);
    return () => document.removeEventListener("mouseup", onSeekMouseUp);
  }, [onSeekMouseUp]);

  const duration = audioRef.current?.duration || durationSec || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={mediaUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Seek bar */}
      <div
        ref={seekRef}
        className="relative h-2 bg-muted rounded-full cursor-pointer group mb-3"
        onMouseDown={onSeekMouseDown}
        onMouseMove={onSeekMouseMove}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-fireflies-yellow rounded-full transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-fireflies-yellow rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Skip back */}
          <button
            onClick={() => skip(-15)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Skip back 15s"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-fireflies-yellow text-fireflies-navy hover:bg-fireflies-yellow/90 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>

          {/* Skip forward */}
          <button
            onClick={() => skip(15)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Skip forward 15s"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Time readout */}
        <div className="text-xs font-mono text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex items-center gap-2">
          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Playback speed"
          >
            {playbackRate}x
          </button>

          {/* Volume placeholder */}
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
