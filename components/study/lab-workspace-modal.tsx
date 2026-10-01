"use client";

import * as React from "react";
import {
  X,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Network,
  Shield,
  Layers,
  HelpCircle,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  FileCode,
  CheckCheck,
  Laptop,
  Cloud,
  DollarSign,
  Download,
  Trash2,
  ShieldCheck,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import {
  checkLabConfig,
  resetLabAttempt,
  confirmLabTeardown,
  verifyAwsChecklist,
} from "@/lib/study-api";
import type { StudyLab, LabCheckerResult, StudyLabAttempt } from "@/types/study";

interface LabWorkspaceModalProps {
  lab: StudyLab | null;
  isOpen: boolean;
  onClose: () => void;
  onLabUpdated?: (updatedLab: StudyLab) => void;
}

export function LabWorkspaceModal({
  lab,
  isOpen,
  onClose,
  onLabUpdated,
}: LabWorkspaceModalProps) {
  const [activeTab, setActiveTab] = React.useState<"topology" | "tasks" | "solution" | "checker">("topology");
  const [configInput, setConfigInput] = React.useState("");
  const [isGrading, setIsGrading] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [showSolution, setShowSolution] = React.useState(false);
  const [expandedHints, setExpandedHints] = React.useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = React.useState<Record<number, boolean>>({});

  // AWS specific state
  const [iacView, setIacView] = React.useState<"cloudformation" | "terraform">("cloudformation");
  const [checkedAwsItems, setCheckedAwsItems] = React.useState<Record<string, boolean>>({});
  const [teardownAgreed, setTeardownAgreed] = React.useState(false);
  const [isConfirmingTeardown, setIsConfirmingTeardown] = React.useState(false);
  const [isVerifyingAws, setIsVerifyingAws] = React.useState(false);
  
  // Timer state
  const [secondsElapsed, setSecondsElapsed] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(true);

  // Checker results & attempt state
  const [checkerResults, setCheckerResults] = React.useState<LabCheckerResult | null>(null);
  const [currentAttempt, setCurrentAttempt] = React.useState<StudyLabAttempt | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isAws = Boolean(
    lab?.certification_code?.includes("AWS") ||
    lab?.setup_template_type === "cloudformation" ||
    (lab?.aws_verification_checks && lab.aws_verification_checks.length > 0)
  );

  // Initialize or reset when a new lab is opened
  React.useEffect(() => {
    if (lab) {
      const attempt = lab.user_attempt || null;
      setCurrentAttempt(attempt);
      const initialConfig = attempt?.submitted_config || lab.setup_template || "";
      setConfigInput(initialConfig);
      setSecondsElapsed(attempt?.time_spent_seconds || 0);
      setIsTimerRunning(true);
      setShowSolution(false);
      setExpandedHints({});
      setCompletedSteps({});
      setTeardownAgreed(attempt?.teardown_confirmed || false);
      setErrorMessage(null);

      // Pre-check verified AWS items from previous attempt if any
      const initialChecked: Record<string, boolean> = {};
      if (attempt?.checker_results?.passed_rules) {
        attempt.checker_results.passed_rules.forEach((rule) => {
          initialChecked[rule] = true;
        });
      }
      setCheckedAwsItems(initialChecked);

      if (attempt?.checker_results) {
        setCheckerResults(attempt.checker_results as LabCheckerResult);
      } else {
        setCheckerResults(null);
      }
    }
  }, [lab]);

  // Timer interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isTimerRunning]);

  if (!isOpen || !lab) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleHint = (index: number) => {
    setExpandedHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleToggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const handleToggleAwsCheck = (checkKey: string) => {
    setCheckedAwsItems((prev) => ({ ...prev, [checkKey]: !prev[checkKey] }));
  };

  const handleGrade = async () => {
    if (!lab) return;
    try {
      setIsGrading(true);
      setErrorMessage(null);

      const res = await checkLabConfig(lab.id, {
        submitted_config: configInput,
        time_spent_seconds: secondsElapsed,
      });

      setCheckerResults(res.checker_results);
      setCurrentAttempt(res.attempt);

      if (onLabUpdated) {
        onLabUpdated({
          ...lab,
          user_attempt: res.attempt,
        });
      }

      setActiveTab("checker");
    } catch (err: any) {
      console.error("Grading failed:", err);
      setErrorMessage(err.message || "Failed to evaluate configuration. Check server connection.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleVerifyAws = async () => {
    if (!lab) return;
    try {
      setIsVerifyingAws(true);
      setErrorMessage(null);

      const activeChecked = Object.keys(checkedAwsItems).filter((k) => checkedAwsItems[k]);
      const res = await verifyAwsChecklist(lab.id, {
        checked_items: activeChecked,
        time_spent_seconds: secondsElapsed,
      });

      setCheckerResults(res.checker_results);
      setCurrentAttempt(res.attempt);

      if (onLabUpdated) {
        onLabUpdated({
          ...lab,
          user_attempt: res.attempt,
        });
      }
    } catch (err: any) {
      console.error("AWS verification failed:", err);
      setErrorMessage(err.message || "Failed to evaluate AWS verification checks.");
    } finally {
      setIsVerifyingAws(false);
    }
  };

  const handleConfirmTeardown = async () => {
    if (!lab) return;
    if (!teardownAgreed) {
      alert("Please check the confirmation box indicating all AWS resources have been destroyed to prevent unexpected billing.");
      return;
    }

    try {
      setIsConfirmingTeardown(true);
      setErrorMessage(null);

      const res = await confirmLabTeardown(lab.id, {
        notes: "All resources confirmed terminated and verified in AWS Management Console.",
        time_spent_seconds: secondsElapsed,
      });

      setCurrentAttempt(res.attempt);

      if (onLabUpdated) {
        onLabUpdated({
          ...lab,
          user_attempt: res.attempt,
        });
      }
    } catch (err: any) {
      console.error("Teardown confirmation failed:", err);
      setErrorMessage(err.message || "Failed to confirm teardown.");
    } finally {
      setIsConfirmingTeardown(false);
    }
  };

  const handleResetAttempt = async () => {
    if (!lab) return;
    if (!confirm("Are you sure you want to reset your attempt for this lab? Your previous score and notes will be cleared.")) {
      return;
    }

    try {
      setIsResetting(true);
      setErrorMessage(null);
      await resetLabAttempt(lab.id);
      
      setCurrentAttempt(null);
      setCheckerResults(null);
      setConfigInput(lab.setup_template || "");
      setCheckedAwsItems({});
      setTeardownAgreed(false);
      setSecondsElapsed(0);
      setCompletedSteps({});

      if (onLabUpdated) {
        onLabUpdated({
          ...lab,
          user_attempt: null,
        });
      }
    } catch (err: any) {
      console.error("Reset failed:", err);
      setErrorMessage(err.message || "Failed to reset lab attempt.");
    } finally {
      setIsResetting(false);
    }
  };

  const isCompleted = currentAttempt?.status === "completed" || (isAws ? currentAttempt?.teardown_confirmed : checkerResults?.passed);
  const score = checkerResults?.score ?? (currentAttempt?.checker_results?.score || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-6xl h-[92vh] max-h-[920px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isAws
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              }`}
            >
              {isAws ? <Cloud className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    isAws
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  }`}
                >
                  {lab.certification_code || (isAws ? "AWS-SAA-C03" : "CCNA")}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {lab.topic_name || "Topic Lab"}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    lab.difficulty === "beginner"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : lab.difficulty === "intermediate"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {lab.difficulty}
                </span>

                {/* AWS Cost Estimator Pill */}
                {isAws && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      lab.free_tier_eligible
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                    title={
                      lab.free_tier_eligible
                        ? "100% Free Tier Eligible for accounts under 12 months"
                        : "Contains resources with minimal non-free-tier charges (e.g. NAT Gateway or ALB)"
                    }
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>~${Number(lab.estimated_cost_usd || 0).toFixed(2)} (2h run)</span>
                  </span>
                )}

                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{lab.estimated_time_minutes} min
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {lab.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {/* Status / Score Tag */}
            {checkerResults || currentAttempt ? (
              <div
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span className="text-xs font-mono font-bold">
                  {isCompleted ? "COMPLETED" : "IN PROGRESS"} ({score}%)
                </span>
              </div>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono">
                NOT STARTED
              </span>
            )}

            {/* Timer Display */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {formatTimer(secondsElapsed)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                title={isTimerRunning ? "Pause Timer" : "Resume Timer"}
              >
                {isTimerRunning ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 text-emerald-500" />
                )}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("topology")}
              className={`px-3 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "topology"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Network className="w-4 h-4" />
              <span>1. Topology & Addressing</span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "tasks"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>2. Step Tasks & Hints</span>
              {lab.step_by_step_tasks && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                  {lab.step_by_step_tasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("solution")}
              className={`px-3 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "solution"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>{isAws ? "3. IaC (CFN & Terraform)" : "3. Starter & Solution"}</span>
            </button>

            <button
              onClick={() => setActiveTab("checker")}
              className={`px-3 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "checker"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isAws ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">4. Verification & Teardown</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">4. Config Checker Console</span>
                </>
              )}

              {checkerResults && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    checkerResults.passed
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {checkerResults.score}%
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            {!isAws ? (
              <button
                onClick={handleGrade}
                disabled={isGrading || !configInput.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20 whitespace-nowrap"
              >
                {isGrading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Grade Config</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("checker")}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-600/20 whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify & Teardown</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-950/30 space-y-6">
          {/* TAB 1: TOPOLOGY & ADDRESSING */}
          {activeTab === "topology" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* SVG Architecture Diagram */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 p-4 shadow-sm overflow-hidden flex flex-col items-center justify-center">
                    <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800 mb-3">
                      <span className="flex items-center gap-1.5">
                        {isAws ? (
                          <Cloud className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Network className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>{isAws ? "AWS ARCHITECTURE TOPOLOGY" : "NETWORK TOPOLOGY"}</span>
                      </span>
                      <span className="text-[10px] uppercase text-slate-500">
                        {lab.topology_type === "svg" ? "Inline Vector Graphics" : "Topology Graphic"}
                      </span>
                    </div>

                    {lab.topology_type === "svg" && lab.topology_data ? (
                      <div
                        className="w-full max-w-xl mx-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[320px]"
                        dangerouslySetInnerHTML={{ __html: lab.topology_data }}
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-mono">
                        [Architecture diagram unavailable]
                      </div>
                    )}
                  </div>

                  {/* Addressing / CIDR Table */}
                  {lab.addressing_table && lab.addressing_table.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span>{isAws ? "Subnet & Endpoint Allocation" : "Lab IP Addressing Table"}</span>
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {lab.addressing_table.length} Elements
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-mono text-[11px] uppercase">
                            <tr>
                              <th className="px-4 py-2.5">Device / Subnet</th>
                              <th className="px-4 py-2.5">AZ / Interface</th>
                              <th className="px-4 py-2.5">CIDR / IP</th>
                              <th className="px-4 py-2.5">Mask / Protocol</th>
                              <th className="px-4 py-2.5">Type / Tier</th>
                              <th className="px-4 py-2.5">Gateway / Route</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {lab.addressing_table.map((row, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="px-4 py-2.5 font-bold text-blue-600 dark:text-blue-400">
                                  {row.device}
                                </td>
                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                                  {row.interface}
                                </td>
                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                  {row.ip}
                                </td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                                  {row.subnet}
                                </td>
                                <td className="px-4 py-2.5">
                                  {row.vlan ? (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px]">
                                      {row.vlan}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                                  {row.default_gateway || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar: Objectives & Guidance */}
                <div className="space-y-4">
                  {/* Lab Objectives Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Lab Objectives</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {lab.objectives && lab.objectives.length > 0 ? (
                        lab.objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{obj}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400">Master architecture concepts and deployment.</li>
                      )}
                    </ul>

                    {lab.prerequisites && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Prerequisites:</strong>{" "}
                        {lab.prerequisites}
                      </div>
                    )}
                  </div>

                  {/* Quickstart Card */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isAws
                        ? "border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20"
                        : "border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-bold text-xs uppercase font-mono tracking-wider ${
                        isAws ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isAws ? <Cloud className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      <span>{isAws ? "AWS Console & IaC Quickstart" : "5-Min Packet Tracer Setup"}</span>
                    </div>

                    {isAws ? (
                      <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Two ways to complete this architecture lab:
                        </p>
                        <ol className="space-y-1.5 list-decimal pl-4">
                          <li>
                            <strong>Guided Console (ClickOps):</strong> Follow the step-by-step instructions in Tab 2 to build the architecture via the AWS Management Console.
                          </li>
                          <li>
                            <strong>Infrastructure as Code:</strong> Copy the ready-to-run <strong>CloudFormation</strong> or <strong>Terraform</strong> templates from Tab 3.
                          </li>
                          <li>
                            <strong>Verification & Teardown:</strong> Once deployed, complete the verification checks in Tab 4, then confirm resource destruction to avoid recurring charges.
                          </li>
                        </ol>
                      </div>
                    ) : (
                      <ol className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-decimal pl-4">
                        <li>Launch <strong>Cisco Packet Tracer</strong> (or GNS3/EVE-NG).</li>
                        <li>Drop the devices specified above into the workspace.</li>
                        <li>Cable the ports as indicated on the topology diagram.</li>
                        <li>Open the CLI tab on each device to begin executing steps.</li>
                        <li>When finished, run <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">show run</code> and paste into the <strong>Config Checker</strong>!</li>
                      </ol>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab(isAws ? "tasks" : "checker")}
                        className={`w-full py-2 rounded-xl text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                          isAws ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                        }`}
                      >
                        {isAws ? <CheckCheck className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                        <span>{isAws ? "Begin Step Tasks (Console & IaC)" : "Open Config Checker Console"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP TASKS & HINTS */}
          {activeTab === "tasks" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAws ? "Guided AWS Console ClickOps Tasks" : "Step-by-Step Configuration Tasks"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Follow the numbered tasks in order. Check off tasks as you configure them.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {Object.values(completedSteps).filter(Boolean).length} /{" "}
                  {lab.step_by_step_tasks?.length || 0} Done
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {lab.step_by_step_tasks && lab.step_by_step_tasks.length > 0 ? (
                  lab.step_by_step_tasks.map((task, idx) => {
                    const isChecked = !!completedSteps[task.step_num || idx + 1];
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isChecked
                            ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/30"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleStep(task.step_num || idx + 1)}
                            className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                              isChecked
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 text-transparent"
                            }`}
                            title="Mark step completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold font-mono ${
                                  isAws
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                STEP {task.step_num || idx + 1}: {task.title}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {task.instructions}
                            </p>

                            {task.verify_prompt && (
                              <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className={isAws ? "text-amber-500 font-bold" : "text-blue-500 font-bold"}>
                                  VERIFY:
                                </span>
                                <span>{task.verify_prompt}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-mono">
                    No steps available for this lab.
                  </div>
                )}
              </div>

              {/* Collapsible Hints Section */}
              {lab.hints && lab.hints.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                      Exam Tips & Architecture Gotchas
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {lab.hints.map((hint, i) => {
                      const isRevealed = !!expandedHints[i];
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                        >
                          <button
                            onClick={() => handleToggleHint(i)}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-mono flex items-center justify-center font-bold">
                                {i + 1}
                              </span>
                              <span>Guidance #{i + 1}</span>
                            </span>
                            {isRevealed ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {isRevealed && (
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                              {hint}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STARTER & SOLUTION (IaC FOR AWS, CLI FOR CCNA) */}
          {activeTab === "solution" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {isAws ? (
                /* AWS Infrastructure as Code (CloudFormation & Terraform) */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Infrastructure as Code (IaC) Templates
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Deploy the complete architecture with 1-click CloudFormation or Terraform.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setIacView("cloudformation")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          iacView === "cloudformation"
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        CloudFormation (YAML)
                      </button>
                      <button
                        onClick={() => setIacView("terraform")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          iacView === "terraform"
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Terraform (HCL)
                      </button>
                    </div>
                  </div>

                  {iacView === "cloudformation" ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                            template.yaml (AWS CloudFormation)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(lab.setup_template || "", "cfn")}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === "cfn" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy YAML</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => downloadFile(lab.setup_template || "", `${lab.slug}-cfn.yaml`)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .yaml</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-950 font-mono text-xs text-amber-300/90 overflow-x-auto max-h-[460px]">
                        <pre className="whitespace-pre">{lab.setup_template}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                            main.tf (HashiCorp Terraform)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(lab.solution || "", "tf")}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === "tf" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy HCL</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => downloadFile(lab.solution || "", `${lab.slug}-main.tf`)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .tf</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-950 font-mono text-xs text-indigo-300/90 overflow-x-auto max-h-[460px]">
                        <pre className="whitespace-pre">{lab.solution}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Cisco CCNA CLI Starter & Solution */
                <>
                  {lab.setup_template && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-blue-500" />
                            <span>Initial Device Starter Configuration</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Copy and paste into your device before beginning if starting from scratch.
                          </p>
                        </div>

                        <button
                          onClick={() => copyToClipboard(lab.setup_template || "", "starter")}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedKey === "starter" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Starter</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-60">
                        <pre className="whitespace-pre">{lab.setup_template}</pre>
                      </div>
                    </div>
                  )}

                  {/* Verified Solution (Protected) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                            Official Target Solution Configuration
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Compare your running-config against the reference solution.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {showSolution && (
                          <>
                            <button
                              onClick={() => {
                                setConfigInput(lab.solution || "");
                                setActiveTab("checker");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Copy into Config Checker console to test grading engine"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Prefill Checker</span>
                            </button>

                            <button
                              onClick={() => copyToClipboard(lab.solution || "", "solution")}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              {copiedKey === "solution" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>Copy</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setShowSolution(!showSolution)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            showSolution
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                          }`}
                        >
                          {showSolution ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide Solution</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Reveal Solution</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {showSolution ? (
                      <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-96">
                        <pre className="whitespace-pre">{lab.solution}</pre>
                      </div>
                    ) : (
                      <div className="p-8 text-center space-y-2 bg-slate-900/40">
                        <Shield className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400 font-semibold">
                          Solution is hidden to encourage hands-on practice.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Try executing the commands yourself first, check your config in the next tab, then reveal if stuck.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: CONFIG CHECKER (CCNA) OR VERIFICATION & TEARDOWN (AWS) */}
          {activeTab === "checker" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {isAws ? (
                /* AWS VERIFICATION & MANDATORY TEARDOWN CONSOLE */
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-amber-500/10 border-amber-500/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <ShieldCheck className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                isCompleted
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {isCompleted ? "Lab Completed & Teardown Confirmed" : "Architecture Verification"}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              Checks: <strong className="text-white">{score}%</strong> (
                              {Object.values(checkedAwsItems).filter(Boolean).length}/
                              {lab.aws_verification_checks?.length || 0} Verified)
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200">
                            {isCompleted
                              ? "Excellent! All architecture tests verified and AWS resources confirmed deleted."
                              : "Execute the verification tests below to confirm the deployed architecture functions properly, then complete mandatory teardown."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleResetAttempt}
                          disabled={isResetting}
                          className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section A: Architecture Verification Tests */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                            Architecture Verification Checklist
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Perform each operational test in your AWS account and mark as verified.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleVerifyAws}
                        disabled={isVerifyingAws}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-600/20"
                      >
                        {isVerifyingAws ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Submit Verification Checks</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {lab.aws_verification_checks && lab.aws_verification_checks.length > 0 ? (
                        lab.aws_verification_checks.map((chk, idx) => {
                          const isChecked = !!checkedAwsItems[chk.check_type];
                          return (
                            <div
                              key={idx}
                              onClick={() => handleToggleAwsCheck(chk.check_type)}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
                                  : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-slate-400">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      {chk.service}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {chk.check_type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                                    {chk.verify_prompt}
                                  </p>
                                  {chk.expected && (
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                                      Expected: {String(chk.expected)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500 font-mono p-4 text-center">
                          No automated verification checks defined for this lab.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B: Mandatory Teardown & Cost Protection */}
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Mandatory Teardown & Cost Protection</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300">
                            Required to Complete
                          </span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          AWS charges by the minute for active resources (such as NAT Gateways, ALBs, or RDS instances). Clean up all resources in the order specified below.
                        </p>
                      </div>
                    </div>

                    {/* Ordered Teardown Instructions */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/20 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                      {lab.teardown_instructions || "1. Delete all deployed resources in the AWS Management Console.\n2. Verify zero active instances, load balancers, or unallocated Elastic IPs in Cost Explorer."}
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-rose-500/20">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 dark:text-slate-200 font-semibold select-none">
                        <input
                          type="checkbox"
                          checked={teardownAgreed}
                          onChange={(e) => setTeardownAgreed(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-900"
                        />
                        <span>I confirm all AWS resources created in this lab have been deleted/destroyed.</span>
                      </label>

                      <button
                        onClick={handleConfirmTeardown}
                        disabled={!teardownAgreed || isConfirmingTeardown}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20 whitespace-nowrap"
                      >
                        {isConfirmingTeardown ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Teardown & Mark Complete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CCNA CONFIG CHECKER CONSOLE */
                <div className="space-y-6">
                  {/* Grading Results Banner (if evaluated) */}
                  {checkerResults && (
                    <div
                      className={`p-5 rounded-2xl border transition-all ${
                        checkerResults.passed
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-amber-500/10 border-amber-500/30"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl ${
                              checkerResults.passed
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {checkerResults.passed ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <AlertTriangle className="w-6 h-6" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  checkerResults.passed
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {checkerResults.passed ? "Lab Passed (>= 80%)" : "Incomplete Configuration"}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                Score: <strong className="text-white">{checkerResults.score}%</strong> (
                                {checkerResults.passed_count}/{checkerResults.total_rules} Objectives Met)
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200">
                              {checkerResults.summary}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full sm:w-48 space-y-1 shrink-0">
                          <div className="flex justify-between text-[11px] font-mono text-slate-400">
                            <span>Pass Mark: 80%</span>
                            <span className="font-bold text-white">{checkerResults.score}%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                checkerResults.passed ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, checkerResults.score))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Missing Directives Checklist with Remediation */}
                      {checkerResults.missing_rules && checkerResults.missing_rules.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                          <div className="text-xs font-bold uppercase font-mono text-amber-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Missing Directives to Fix ({checkerResults.missing_rules.length}):</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {checkerResults.missing_rules.map((rule, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="font-bold text-slate-200">{rule.description}</span>
                                  {rule.section && rule.section !== "global" && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-400">
                                      {rule.section}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-amber-300/90 font-mono">
                                  Tip: {rule.help_tip}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Passed Objectives Checklist */}
                      {checkerResults.passed_rules && checkerResults.passed_rules.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-1.5">
                          <div className="text-xs font-bold uppercase font-mono text-emerald-400 flex items-center gap-1.5">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Verified & Passed Requirements ({checkerResults.passed_rules.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {checkerResults.passed_rules.map((ruleDesc, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{ruleDesc}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Monospace Cisco IOS CLI Input Terminal */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-mono font-bold text-slate-300">
                          Switch# show running-config (or paste configuration commands)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfigInput("")}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] font-mono transition-colors"
                          title="Clear console"
                        >
                          Clear
                        </button>

                        {lab.setup_template && (
                          <button
                            onClick={() => setConfigInput(lab.setup_template || "")}
                            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] font-mono transition-colors"
                            title="Load starter template"
                          >
                            Paste Starter
                          </button>
                        )}

                        {lab.solution && (
                          <button
                            onClick={() => setConfigInput(lab.solution || "")}
                            className="px-2.5 py-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 text-[11px] font-mono transition-colors"
                            title="Load target solution for quick grading verification"
                          >
                            Load Solution (Test)
                          </button>
                        )}

                        <button
                          onClick={handleResetAttempt}
                          disabled={isResetting}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-[11px] font-mono transition-colors flex items-center gap-1"
                          title="Reset your lab attempt"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Attempt</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative p-4 font-mono text-xs">
                      <textarea
                        value={configInput}
                        onChange={(e) => setConfigInput(e.target.value)}
                        placeholder={`! Paste your Cisco IOS running-config or configuration commands here:
Switch# configure terminal
Switch(config)# vlan 10
Switch(config-vlan)# name Engineering
...`}
                        rows={16}
                        className="w-full bg-transparent text-emerald-400 focus:outline-none resize-y placeholder-slate-600 font-mono text-xs leading-relaxed"
                        spellCheck={false}
                      />
                    </div>

                    <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Cisco IOS Parser Ready • Abbreviation Normalizer Active</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGrade}
                          disabled={isGrading || !configInput.trim()}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30"
                        >
                          {isGrading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Grading Syntax...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verify & Grade Configuration</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Line Diagnostics */}
                  {checkerResults?.line_diagnostics && checkerResults.line_diagnostics.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-blue-500" />
                          <span>Line-by-Line Diagnostic Feedback</span>
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {checkerResults.line_diagnostics.length} lines evaluated
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950 font-mono text-xs max-h-72 overflow-y-auto space-y-0.5">
                        {checkerResults.line_diagnostics.map((diag, i) => (
                          <div
                            key={i}
                            className={`px-2 py-0.5 rounded flex items-center gap-2 ${
                              diag.status === "correct"
                                ? "bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500"
                                : "text-slate-400"
                            }`}
                          >
                            <span className="text-[10px] text-slate-600 w-6 text-right select-none">
                              {i + 1}
                            </span>
                            <span className="whitespace-pre truncate">{diag.line}</span>
                            {diag.status === "correct" && (
                              <Check className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
