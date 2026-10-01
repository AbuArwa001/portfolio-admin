"use client";

import * as React from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Flame,
  Volume2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { logStudySession, getStudyTopics, getStudyCertifications } from "@/lib/study-api";
import type { StudyTopic, StudyCertification } from "@/types/study";

interface PomodoroTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionLogged?: () => void;
}

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

const TIMER_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function PomodoroTimerModal({
  isOpen,
  onClose,
  onSessionLogged,
}: PomodoroTimerModalProps) {
  const [mode, setMode] = React.useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = React.useState(TIMER_DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = React.useState(false);
  const [certifications, setCertifications] = React.useState<StudyCertification[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [selectedCertId, setSelectedCertId] = React.useState<number | "">("");
  const [selectedTopicId, setSelectedTopicId] = React.useState<number | "">("");
  const [isLogging, setIsLogging] = React.useState(false);
  const [loggedMessage, setLoggedMessage] = React.useState<string | null>(null);

  // Load certifications and topics
  React.useEffect(() => {
    if (isOpen) {
      Promise.all([
        getStudyCertifications().catch(() => []),
        getStudyTopics().catch(() => []),
      ]).then(([certs, top]) => {
        setCertifications(certs);
        setTopics(top);
        if (certs.length > 0 && !selectedCertId) {
          setSelectedCertId(certs[0].id);
        }
      });
    }
  }, [isOpen, selectedCertId]);

  // Timer interval countdown
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      handleFinishSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    setIsRunning(false);
    setLoggedMessage(null);
  };

  const handleFinishSession = async () => {
    if (mode === "pomodoro") {
      try {
        setIsLogging(true);
        const durationMins = Math.round(TIMER_DURATIONS.pomodoro / 60);
        await logStudySession({
          certification: selectedCertId ? Number(selectedCertId) : null,
          topic: selectedTopicId ? Number(selectedTopicId) : null,
          session_type: "pomodoro",
          duration_minutes: durationMins,
          notes: "Completed 25m Pomodoro study session.",
        });
        setLoggedMessage("Focus session logged! Streak & activity updated.");
        onSessionLogged?.();
      } catch (err: any) {
        console.error("Failed to log pomodoro session:", err);
      } finally {
        setIsLogging(false);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  const progressPct = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100;

  if (!isOpen) return null;

  const filteredTopics = selectedCertId
    ? topics.filter((t) => t.certification === selectedCertId)
    : topics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pomodoro Focus Study Timer
              </h3>
              <p className="text-[11px] text-slate-400">
                Tied to topics · Auto-logs to streak & activity heatmap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            onClick={() => switchMode("pomodoro")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === "pomodoro"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === "shortBreak"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === "longBreak"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Timer Display Circle */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-300 ${
                  mode === "pomodoro"
                    ? "stroke-rose-500"
                    : mode === "shortBreak"
                    ? "stroke-emerald-500"
                    : "stroke-blue-500"
                }`}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPct) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Time Text */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                {mode === "pomodoro" ? "Deep Work" : "Rest Period"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 transition-all ${
                mode === "pomodoro"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                  : mode === "shortBreak"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{timeLeft < TIMER_DURATIONS[mode] ? "Resume" : "Start Focus"}</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(TIMER_DURATIONS[mode]);
              }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {mode === "pomodoro" && (
              <button
                onClick={handleFinishSession}
                disabled={isLogging}
                className="px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Log this study session manually"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isLogging ? "Logging..." : "Log Now"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {loggedMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{loggedMessage}</span>
          </div>
        )}

        {/* Association: Track & Topic selection */}
        {mode === "pomodoro" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tie Session To Topic</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <select
                value={selectedCertId}
                onChange={(e) => {
                  setSelectedCertId(e.target.value ? Number(e.target.value) : "");
                  setSelectedTopicId("");
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              >
                <option value="">Select Certification...</option>
                {certifications.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.vendor} {c.exam_code}
                  </option>
                ))}
              </select>

              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs truncate"
              >
                <option value="">Select Topic...</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
