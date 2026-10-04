"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Terminal,
  Network,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Lightbulb,
  BookOpen,
  FileCode,
  Shield,
  Play,
  Pause,
  RotateCcw,
  CheckCheck,
  AlertCircle,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Trophy,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  X,
} from "lucide-react";
import { getStudyLab, checkLabConfig, resetLabAttempt } from "@/lib/study-api";
import { CiscoCliTerminal } from "@/components/study/cisco-cli-terminal";
import { NetworkTopologyCanvas } from "@/components/study/network-topology-canvas";
import type { StudyLab, LabCheckerResult } from "@/types/study";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type ActivePanel = "topology" | "tasks" | "solution" | "checker";
type LayoutMode = "split" | "terminal-full" | "topology-full";

// ──────────────────────────────────────────────────────────────
// Score Ring
// ──────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#3fb950" : score >= 50 ? "#d29922" : "#f85149";

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#21262d" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="text-sm font-bold font-mono" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────
export default function LabWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const labId = Number(params?.id);

  const [lab, setLab] = React.useState<StudyLab | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activePanel, setActivePanel] = React.useState<ActivePanel>("topology");
  const [layout, setLayout] = React.useState<LayoutMode>("split");
  const [submittedConfig, setSubmittedConfig] = React.useState("");
  const [checkerResults, setCheckerResults] = React.useState<LabCheckerResult | null>(null);
  const [isGrading, setIsGrading] = React.useState(false);
  const [gradeError, setGradeError] = React.useState<string | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);
  const [showSolution, setShowSolution] = React.useState(false);
  const [copiedSolution, setCopiedSolution] = React.useState(false);
  const [expandedHints, setExpandedHints] = React.useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = React.useState<Record<number, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(true);
  const [successBanner, setSuccessBanner] = React.useState(false);

  // ── Load lab data ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!labId) return;
    setLoading(true);
    getStudyLab(labId)
      .then((data) => {
        setLab(data);
        if (data.user_attempt?.time_spent_seconds) {
          setElapsedSeconds(data.user_attempt.time_spent_seconds);
        }
        if (data.user_attempt?.checker_results) {
          setCheckerResults(data.user_attempt.checker_results as LabCheckerResult);
        }
        if (data.setup_template) {
          setSubmittedConfig(data.setup_template);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [labId]);

  // ── Timer ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // ── Grade config ──────────────────────────────────────────────
  async function handleGrade() {
    if (!lab) return;
    setIsGrading(true);
    setGradeError(null);
    try {
      const res = await checkLabConfig(lab.id, {
        submitted_config: submittedConfig,
        time_spent_seconds: elapsedSeconds,
      });
      setCheckerResults(res.checker_results);
      setLab((prev) => prev ? { ...prev, user_attempt: res.attempt } : prev);
      setActivePanel("checker");
      if (res.checker_results?.passed) {
        setSuccessBanner(true);
        setTimerRunning(false);
        setTimeout(() => setSuccessBanner(false), 6000);
      }
    } catch (e: any) {
      setGradeError(e.message || "Failed to evaluate configuration.");
    } finally {
      setIsGrading(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────
  async function handleReset() {
    if (!lab) return;
    if (!confirm("Reset your progress for this lab? This cannot be undone.")) return;
    setIsResetting(true);
    try {
      await resetLabAttempt(lab.id);
      setCheckerResults(null);
      setSubmittedConfig(lab.setup_template || "");
      setCompletedSteps({});
      setElapsedSeconds(0);
      setTimerRunning(true);
      setShowSolution(false);
      setLab((prev) => prev ? { ...prev, user_attempt: null } : prev);
    } catch (e) {
      // ignore
    } finally {
      setIsResetting(false);
    }
  }

  function copySolution() {
    if (lab?.solution) {
      navigator.clipboard.writeText(lab.solution);
      setCopiedSolution(true);
      setTimeout(() => setCopiedSolution(false), 2000);
    }
  }

  // ── Step completion ───────────────────────────────────────────
  const doneStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = lab?.step_by_step_tasks?.length || 0;
  const progressPct = totalSteps > 0 ? Math.round((doneStepsCount / totalSteps) * 100) : 0;
  const score = checkerResults?.score ?? lab?.user_attempt?.checker_results?.score ?? 0;
  const isPassed = checkerResults?.passed ?? false;

  // ── Difficulty color ──────────────────────────────────────────
  const diffColor =
    lab?.difficulty === "beginner"
      ? "text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10"
      : lab?.difficulty === "intermediate"
      ? "text-[#d29922] border-[#d29922]/30 bg-[#d29922]/10"
      : "text-[#f85149] border-[#f85149]/30 bg-[#f85149]/10";

  if (loading) {
    return (
      <div className="h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#58a6ff]/30 border-t-[#58a6ff] rounded-full animate-spin mx-auto" />
          <p className="text-[#8b949e] font-mono text-sm">Loading lab workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#f85149] mx-auto" />
          <p className="text-[#f85149] font-mono">{error || "Lab not found"}</p>
          <Link
            href="/dashboard/study/ccna"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21262d] text-[#e6edf3] hover:bg-[#30363d] transition-colors font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CCNA
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden font-mono">
      {/* ── Success banner ── */}
      {successBanner && (
        <div className="absolute inset-x-0 top-0 z-50 animate-in slide-in-from-top duration-500">
          <div className="mx-auto max-w-2xl mt-4 bg-[#1c2d1c] border border-[#3fb950]/50 rounded-xl px-6 py-4 flex items-center gap-4 shadow-2xl shadow-[#3fb950]/10">
            <div className="p-2 rounded-full bg-[#3fb950]/20">
              <Trophy className="w-6 h-6 text-[#3fb950]" />
            </div>
            <div>
              <div className="text-[#3fb950] font-bold text-sm">Lab Complete! 🎉</div>
              <div className="text-[#8b949e] text-xs">You scored {score}% — Excellent work!</div>
            </div>
            <button onClick={() => setSuccessBanner(false)} className="ml-auto text-[#8b949e] hover:text-[#e6edf3]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Top Nav Bar ── */}
      <div className="flex-none border-b border-[#30363d] bg-[#161b22] px-4 py-2.5 flex items-center gap-3">
        {/* Back button */}
        <Link
          href="/dashboard/study/ccna"
          className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e6edf3] transition-colors text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Labs</span>
        </Link>

        <span className="text-[#30363d]">/</span>

        {/* Lab title & badges */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide bg-[#1f2f3f] text-[#58a6ff] border-[#58a6ff]/30">
            {lab.certification_code || "CCNA"}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${diffColor}`}>
            {lab.difficulty}
          </span>
          <h1 className="text-sm font-bold text-[#e6edf3] truncate">{lab.title}</h1>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
          <Clock className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="text-xs font-bold text-[#e6edf3] tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            title={timerRunning ? "Pause" : "Resume"}
          >
            {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-[#3fb950]" />}
          </button>
        </div>

        {/* Progress */}
        {totalSteps > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <div className="text-[10px] text-[#8b949e]">{doneStepsCount}/{totalSteps} steps</div>
            <div className="w-24 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#58a6ff] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Score if available */}
        {checkerResults && (
          <div className="hidden md:flex items-center gap-2">
            <ScoreRing score={score} />
          </div>
        )}

        {/* Layout toggles */}
        <div className="flex items-center gap-1 border border-[#30363d] rounded-lg p-1">
          {(["split", "terminal-full", "topology-full"] as LayoutMode[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              title={l.replace("-", " ")}
              className={`p-1 rounded text-[10px] transition-colors ${
                layout === l
                  ? "bg-[#58a6ff] text-[#0d1117]"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
              }`}
            >
              {l === "split" && <Layers className="w-3.5 h-3.5" />}
              {l === "terminal-full" && <Terminal className="w-3.5 h-3.5" />}
              {l === "topology-full" && <Network className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        {/* Grade Button */}
        <button
          onClick={handleGrade}
          disabled={isGrading || !submittedConfig.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-bold transition-colors"
        >
          {isGrading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Grading...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Grade Lab</span>
            </>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset attempt"
          className="p-2 rounded-lg text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Grade error ── */}
      {gradeError && (
        <div className="flex-none bg-[#1a0f0f] border-b border-[#f85149]/30 px-4 py-2 flex items-center gap-2 text-xs text-[#f85149]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{gradeError}</span>
          <button onClick={() => setGradeError(null)} className="ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main Split Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL: Sidebar ── */}
        <div
          className={`flex flex-col border-r border-[#30363d] bg-[#161b22] transition-all duration-300 ${
            layout === "terminal-full" ? "hidden" : layout === "topology-full" ? "hidden" : "w-80 min-w-[280px] max-w-sm"
          }`}
        >
          {/* Panel tabs */}
          <div className="flex border-b border-[#30363d] overflow-x-auto scrollbar-none">
            {(
              [
                { id: "topology", icon: Network, label: "Topology" },
                { id: "tasks", icon: CheckCheck, label: `Tasks ${totalSteps > 0 ? `(${doneStepsCount}/${totalSteps})` : ""}` },
                { id: "solution", icon: FileCode, label: "Solution" },
                { id: "checker", icon: Shield, label: "Results" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-3 text-[10px] font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activePanel === id
                    ? "border-[#58a6ff] text-[#58a6ff]"
                    : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {/* TOPOLOGY PANEL */}
            {activePanel === "topology" && (
              <div className="p-3 space-y-3">
                {/* Topology canvas */}
                <NetworkTopologyCanvas
                  svgData={lab.topology_type === "svg" ? lab.topology_data : undefined}
                  className="h-56 w-full"
                  title={`${lab.topic_name || "NETWORK"} TOPOLOGY`}
                />

                {/* Objectives */}
                {lab.objectives && lab.objectives.length > 0 && (
                  <div className="rounded-lg border border-[#30363d] overflow-hidden">
                    <div className="px-3 py-2 bg-[#0d1117] border-b border-[#30363d] text-[10px] text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#58a6ff]" />
                      Learning Objectives
                    </div>
                    <ul className="p-3 space-y-2">
                      {lab.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-[#e6edf3]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] mt-1.5 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Addressing table */}
                {lab.addressing_table && lab.addressing_table.length > 0 && (
                  <div className="rounded-lg border border-[#30363d] overflow-hidden">
                    <div className="px-3 py-2 bg-[#0d1117] border-b border-[#30363d] text-[10px] text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#3fb950]" />
                      Addressing Table
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead className="bg-[#0d1117] text-[#8b949e] uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left">Device</th>
                            <th className="px-3 py-2 text-left">Interface</th>
                            <th className="px-3 py-2 text-left">IP</th>
                            <th className="px-3 py-2 text-left">Mask</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lab.addressing_table.map((row: any, i: number) => (
                            <tr key={i} className="border-t border-[#21262d] hover:bg-[#21262d]/50">
                              <td className="px-3 py-1.5 text-[#58a6ff] font-semibold">{row.device}</td>
                              <td className="px-3 py-1.5 text-[#8b949e]">{row.interface}</td>
                              <td className="px-3 py-1.5 text-[#3fb950]">{row.ip}</td>
                              <td className="px-3 py-1.5 text-[#e6edf3]">{row.subnet}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Est time */}
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] px-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Est: ~{lab.estimated_time_minutes} min
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    {lab.step_by_step_tasks?.length || 0} tasks
                  </div>
                </div>
              </div>
            )}

            {/* TASKS PANEL */}
            {activePanel === "tasks" && (
              <div className="p-3 space-y-3">
                {/* Progress bar */}
                {totalSteps > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                      <span>Progress</span>
                      <span className="text-[#58a6ff] font-bold">{progressPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#58a6ff] to-[#3fb950] transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Task list */}
                {!lab.step_by_step_tasks || lab.step_by_step_tasks.length === 0 ? (
                  <div className="text-center py-8 text-[#8b949e] text-xs">
                    No tasks defined for this lab.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lab.step_by_step_tasks.map((task: any, i: number) => {
                      const isDone = completedSteps[task.step_num || i];
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-3 transition-all ${
                            isDone
                              ? "border-[#3fb950]/30 bg-[#3fb950]/5"
                              : "border-[#30363d] bg-[#0d1117]"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() =>
                                setCompletedSteps((prev) => ({
                                  ...prev,
                                  [task.step_num || i]: !prev[task.step_num || i],
                                }))
                              }
                              className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isDone
                                  ? "border-[#3fb950] bg-[#3fb950] text-[#0d1117]"
                                  : "border-[#30363d] hover:border-[#58a6ff]"
                              }`}
                            >
                              {isDone && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#58a6ff] font-mono">
                                  Task {task.step_num || i + 1}
                                </span>
                                {isDone && (
                                  <span className="text-[9px] text-[#3fb950] font-bold uppercase">✓ Done</span>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 leading-relaxed ${isDone ? "line-through text-[#8b949e]" : "text-[#e6edf3]"}`}>
                                {task.title}
                              </p>
                              {task.instructions && (
                                <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">
                                  {task.instructions}
                                </p>
                              )}
                              {task.verify_prompt && (
                                <div className="mt-1.5 px-2 py-1 rounded bg-[#1f2f3f] border border-[#58a6ff]/20 text-[9px] text-[#58a6ff]">
                                  ✦ Verify: {task.verify_prompt}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Hints */}
                {lab.hints && lab.hints.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#30363d]">
                    <div className="text-[10px] text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-[#d29922]" />
                      Hints ({lab.hints.length})
                    </div>
                    {lab.hints.map((hint: string, i: number) => (
                      <div key={i} className="rounded-lg border border-[#d29922]/20 overflow-hidden">
                        <button
                          onClick={() =>
                            setExpandedHints((prev) => ({ ...prev, [i]: !prev[i] }))
                          }
                          className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-[#d29922] hover:bg-[#d29922]/5 transition-colors"
                        >
                          <span>Hint {i + 1}</span>
                          {expandedHints[i] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        {expandedHints[i] && (
                          <div className="px-3 pb-3 text-[11px] text-[#e6edf3] leading-relaxed border-t border-[#d29922]/10">
                            {hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SOLUTION PANEL */}
            {activePanel === "solution" && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#d2a8ff]" />
                    Solution Config
                  </div>
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="flex items-center gap-1.5 text-[10px] text-[#d29922] hover:text-[#e6edf3] transition-colors border border-[#d29922]/30 rounded px-2 py-1"
                  >
                    {showSolution ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSolution ? "Hide" : "Reveal"}
                  </button>
                </div>

                {!showSolution ? (
                  <div className="rounded-lg border border-[#d29922]/20 p-6 text-center space-y-3">
                    <div className="p-3 rounded-full bg-[#d29922]/10 w-fit mx-auto">
                      <Eye className="w-6 h-6 text-[#d29922]" />
                    </div>
                    <div className="text-xs text-[#8b949e]">
                      Solution hidden. Try to complete the lab first!
                    </div>
                    <div className="text-[10px] text-[#d29922]">
                      Revealing the solution will not affect your score.
                    </div>
                  </div>
                ) : lab.solution ? (
                  <div className="rounded-lg border border-[#30363d] overflow-hidden">
                    <div className="px-3 py-2 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e]">running-config</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={copySolution}
                          className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
                        >
                          {copiedSolution ? (
                            <Check className="w-3 h-3 text-[#3fb950]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([lab.solution!], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "solution.txt";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="text-[#8b949e] hover:text-[#e6edf3]"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 text-[11px] text-[#3fb950] overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {lab.solution}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#8b949e] text-xs">
                    No solution provided for this lab.
                  </div>
                )}
              </div>
            )}

            {/* CHECKER / RESULTS PANEL */}
            {activePanel === "checker" && (
              <div className="p-3 space-y-3">
                {!checkerResults ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="p-4 rounded-full bg-[#21262d] w-fit mx-auto">
                      <Shield className="w-8 h-8 text-[#8b949e]" />
                    </div>
                    <div className="text-xs text-[#8b949e]">
                      Enter your configuration in the terminal, then click{" "}
                      <span className="text-[#3fb950] font-bold">Grade Lab</span> to check your work.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Score display */}
                    <div
                      className={`rounded-xl p-4 border flex items-center gap-4 ${
                        isPassed
                          ? "bg-[#1c2d1c] border-[#3fb950]/30"
                          : "bg-[#1a1a0f] border-[#d29922]/30"
                      }`}
                    >
                      <ScoreRing score={score} />
                      <div>
                        <div
                          className={`text-sm font-bold ${
                            isPassed ? "text-[#3fb950]" : "text-[#d29922]"
                          }`}
                        >
                          {isPassed ? "🎉 Lab Passed!" : "⚠ Keep Trying"}
                        </div>
                        <div className="text-[11px] text-[#8b949e]">
                          {checkerResults.passed_rules?.length || 0} of{" "}
                          {(checkerResults.passed_rules?.length || 0) +
                            (checkerResults.missing_rules?.length || 0)}{" "}
                          rules satisfied
                        </div>
                        <div className="text-[10px] text-[#8b949e] mt-0.5">
                          Time: {formatTime(elapsedSeconds)}
                        </div>
                      </div>
                      {isPassed && (
                        <div className="ml-auto">
                          <Star className="w-8 h-8 text-[#d29922] fill-[#d29922]" />
                        </div>
                      )}
                    </div>

                    {/* Passed rules */}
                    {checkerResults.passed_rules && checkerResults.passed_rules.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-[#3fb950] uppercase font-bold tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Passed ({checkerResults.passed_rules.length})
                        </div>
                        {checkerResults.passed_rules.map((rule: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-[11px] text-[#3fb950] bg-[#3fb950]/5 rounded px-2.5 py-1.5 border border-[#3fb950]/10"
                          >
                            <Check className="w-3 h-3 shrink-0" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Missing rules */}
                    {checkerResults.missing_rules && checkerResults.missing_rules.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-[#f85149] uppercase font-bold tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Missing ({checkerResults.missing_rules.length})
                        </div>
                        {checkerResults.missing_rules.map((rule: any, i: number) => (
                          <div
                            key={i}
                            className="rounded px-2.5 py-1.5 border border-[#f85149]/10 bg-[#f85149]/5"
                          >
                            <div className="flex items-center gap-2 text-[11px] text-[#f85149]">
                              <X className="w-3 h-3 shrink-0" />
                              <span>{typeof rule === "string" ? rule : rule.description}</span>
                            </div>
                            {typeof rule !== "string" && rule.help_tip && (
                              <div className="mt-1 pl-5 text-[9px] text-[#8b949e]">
                                💡 {rule.help_tip}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Grade again */}
                    <button
                      onClick={handleGrade}
                      disabled={isGrading}
                      className="w-full py-2 rounded-lg border border-[#238636] text-[#3fb950] text-xs font-bold hover:bg-[#238636]/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Re-Grade Config
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Terminal ── */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            layout === "topology-full" ? "hidden" : ""
          }`}
        >
          <CiscoCliTerminal
            deviceName={lab.addressing_table?.[0]?.device || "Switch"}
            vendor="cisco"
            initialConfig={lab.setup_template || ""}
            onConfigChange={setSubmittedConfig}
            labObjectives={lab.objectives || []}
            className="flex-1"
          />
        </div>

        {/* ── TOPOLOGY FULL VIEW (when layout === topology-full) ── */}
        {layout === "topology-full" && (
          <div className="flex-1 p-4">
            <NetworkTopologyCanvas
              svgData={lab.topology_type === "svg" ? lab.topology_data : undefined}
              className="h-full w-full"
              title={`${lab.title} — TOPOLOGY`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
