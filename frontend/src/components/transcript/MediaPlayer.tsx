"use client";

import { useRef, useEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import type { MediaSource } from "@/types";

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface MediaPlayerProps {
  source: MediaSource | null;
  durationSec: number;
  onAddMedia?: () => void;
}

export function MediaPlayer({ source, durationSec, onAddMedia }: MediaPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
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

  useEffect(() => {
    if (durationSec > 0) {
      setDuration(durationSec);
    }
  }, [durationSec, setDuration]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || isDragging.current) return;
    if (Math.abs(player.getCurrentTime() - currentTime) > 0.5) {
      player.seekTo(currentTime, "seconds");
    }
  }, [currentTime]);

  const handleProgress = useCallback(
    (state: { playedSeconds: number }) => {
      if (!isDragging.current) {
        setCurrentTime(state.playedSeconds);
      }
    },
    [setCurrentTime]
  );

  const handleDuration = useCallback(
    (dur: number) => {
      if (durationSec <= 0) {
        setDuration(dur);
      }
    },
    [durationSec, setDuration]
  );

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      const player = playerRef.current;
      if (player) {
        player.seekTo(time, "seconds");
      }
      seek(time);
    },
    [seek]
  );

  const skip = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime();
      const dur = player.getDuration() || durationSec || 0;
      const newTime = Math.max(0, Math.min(dur, current + delta));
      handleSeek(newTime);
    },
    [handleSeek, durationSec]
  );

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2];
    const currentIdx = speeds.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  }, [playbackRate, setPlaybackRate]);

  const handleSeekBarInteraction = useCallback(
    (clientX: number) => {
      const bar = seekRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const duration = playerRef.current?.getDuration() || durationSec || 0;
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

  if (!source) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground mb-3">No media attached</p>
        {onAddMedia && (
          <button
            onClick={onAddMedia}
            className="text-sm font-medium text-fireflies-yellow hover:underline"
          >
            Add media
          </button>
        )}
      </div>
    );
  }

  const duration = playerRef.current?.getDuration() || durationSec || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showVideo = source.kind === "file" || source.kind === "youtube";

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Single ReactPlayer — visible for video, hidden for audio */}
      <div className={showVideo ? "relative w-full aspect-video bg-black rounded-md overflow-hidden mb-3" : "sr-only"}>
        <ReactPlayer
          ref={playerRef}
          url={source.url}
          width="100%"
          height="100%"
          playing={isPlaying}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleEnded}
        />
      </div>

      {/* Seek bar */}
      <div
        ref={seekRef}
        className="relative h-2 bg-muted rounded-full cursor-pointer group mb-3"
        onMouseDown={onSeekMouseDown}
        onMouseMove={onSeekMouseMove}
      >
        <div
          className="absolute inset-y-0 left-0 bg-fireflies-yellow rounded-full transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-fireflies-yellow rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => skip(-15)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Skip back 15s"
          >
            <SkipBack className="h-4 w-4" />
          </button>

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

          <button
            onClick={() => skip(15)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Skip forward 15s"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="text-xs font-mono text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Playback speed"
          >
            {playbackRate}x
          </button>

          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
