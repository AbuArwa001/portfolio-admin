"use client";

import * as React from "react";
import Link from "next/link";
import {
  Network,
  Cloud,
  Building2,
  Layers,
  BookMarked,
  ArrowRight,
  CheckCircle2,
  Play,
  ShieldCheck,
  Server,
  Zap,
  Target,
  Sparkles,
  BarChart3,
  Terminal,
  RefreshCw,
  Calendar,
  Flame,
  Clock,
  Check,
  AlertTriangle,
  Brain,
  TrendingUp,
  X,
  Calculator,
  Download,
  Upload,
  FileJson,
  Database,
} from "lucide-react";
import {
  getStudyCertifications,
  getStudyTopics,
  getStudyLabs,
  getStudyProgress,
  setStudyGoal,
  exportStudyQuestions,
  importStudyQuestions,
  exportStudyFlashcards,
} from "@/lib/study-api";
import type { StudyCertification, StudyTopic, StudyLab, StudyProgress } from "@/types/study";

export default function StudyOverviewPage() {
  const [certifications, setCertifications] = React.useState<StudyCertification[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [labs, setLabs] = React.useState<StudyLab[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCertTrack, setActiveCertTrack] = React.useState<"CCNA" | "AWS">("CCNA");
  const [ccnaProgress, setCcnaProgress] = React.useState<StudyProgress | null>(null);
  const [awsProgress, setAwsProgress] = React.useState<StudyProgress | null>(null);

  // Goal modal / picker state
  const [isGoalModalOpen, setIsGoalModalOpen] = React.useState(false);
  const [targetDateInput, setTargetDateInput] = React.useState("");
  const [dailyMinutesInput, setDailyMinutesInput] = React.useState(60);
  const [isSavingGoal, setIsSavingGoal] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [certsData, topicsData, labsData] = await Promise.all([
        getStudyCertifications().catch(() => []),
        getStudyTopics().catch(() => []),
        getStudyLabs().catch(() => []),
      ]);
      setCertifications(certsData);
      setTopics(topicsData);
      setLabs(labsData);

      const ccnaObj = certsData.find((c) => c.code.includes("CCNA"));
      const awsObj = certsData.find((c) => c.code.includes("AWS"));

      if (ccnaObj) {
        getStudyProgress(ccnaObj.id).then(setCcnaProgress).catch(console.error);
      }
      if (awsObj) {
        getStudyProgress(awsObj.id).then(setAwsProgress).catch(console.error);
      }
    } catch (err: any) {
      console.error("Error loading study overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const ccnaCert = certifications.find((c) => c.code.includes("CCNA"));
  const awsCert = certifications.find((c) => c.code.includes("AWS"));

  const activeProgress = activeCertTrack === "CCNA" ? ccnaProgress : awsProgress;
  const activeCert = activeCertTrack === "CCNA" ? ccnaCert : awsCert;

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCert || !targetDateInput) return;

    try {
      setIsSavingGoal(true);
      await setStudyGoal({
        certification_id: activeCert.id,
        target_exam_date: targetDateInput,
        daily_goal_minutes: dailyMinutesInput,
      });
      setIsGoalModalOpen(false);
      // Reload progress to reflect new targets
      const updated = await getStudyProgress(activeCert.id);
      if (activeCertTrack === "CCNA") setCcnaProgress(updated);
      else setAwsProgress(updated);
    } catch (err: any) {
      alert(err.message || "Failed to save study goal.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Generate 90-day heatmap squares
  const generateHeatmapGrid = () => {
    const today = new Date();
    const days: Array<{ dateStr: string; minutes: number; count: number }> = [];
    const logMap: Record<string, { minutes: number; count: number }> = {};

    activeProgress?.heatmap?.forEach((h) => {
      logMap[h.date] = { minutes: h.minutes, count: h.count };
    });

    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const str = d.toISOString().split("T")[0];
      const logged = logMap[str] || { minutes: 0, count: 0 };
      days.push({ dateStr: str, minutes: logged.minutes, count: logged.count });
    }
    return days;
  };

  const heatmapDays = generateHeatmapGrid();
  const currentStreak = activeProgress?.streak_days || 0;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? "..." : topics.length || "67"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Blueprint Topics</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? "..." : labs.length || "16"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Production Labs (CLI & IaC)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currentStreak} Days
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consecutive Streak</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">Claude AI</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interview Simulator</div>
          </div>
        </div>
      </div>

      {/* READINESS & PLANNER SECTION */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Phase 6 Analytics
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Exam Readiness & Study Planner
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-factor readiness model (Labs 30%, Accuracy 30%, Topic Coverage 20%, Mock Exams 20%)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Track Switcher */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setActiveCertTrack("CCNA")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCertTrack === "CCNA"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-white"
                }`}
              >
                Cisco CCNA (200-301)
              </button>
              <button
                onClick={() => setActiveCertTrack("AWS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCertTrack === "AWS"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-white"
                }`}
              >
                AWS SAA-C03
              </button>
            </div>

            <button
              onClick={() => {
                setTargetDateInput(activeProgress?.goal?.target_exam_date || "");
                setDailyMinutesInput(activeProgress?.goal?.daily_goal_minutes || 60);
                setIsGoalModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{activeProgress?.goal ? "Edit Target Date" : "Set Target Exam Date"}</span>
            </button>
          </div>
        </div>

        {/* Readiness Overview Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness Meter Gauge */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                Overall Exam Readiness
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {activeProgress?.readiness_score || 0}%
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    (activeProgress?.readiness_score || 0) >= 80
                      ? "bg-emerald-500/10 text-emerald-500"
                      : (activeProgress?.readiness_score || 0) >= 60
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {(activeProgress?.readiness_score || 0) >= 80
                    ? "Exam Ready"
                    : (activeProgress?.readiness_score || 0) >= 60
                    ? "Moderate Readiness"
                    : "In Training"}
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 pb-1">
                  <span>Hands-On Labs ({activeProgress?.completed_labs || 0}/{activeProgress?.total_labs || 0})</span>
                  <span>{activeProgress?.lab_completion_pct || 0}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeProgress?.lab_completion_pct || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 pb-1">
                  <span>Question Accuracy ({activeProgress?.total_questions_attempted || 0} attempted)</span>
                  <span>{activeProgress?.accuracy_pct || 0}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeProgress?.accuracy_pct || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 pb-1">
                  <span>Mock Exam Average ({activeProgress?.mock_exams_taken || 0} taken)</span>
                  <span>{activeProgress?.mock_exam_average || 0}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeProgress?.mock_exam_average || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Target Date Pill */}
            {activeProgress?.goal ? (
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Target: {activeProgress.goal.target_exam_date}</span>
                  <span>{activeProgress.goal.days_remaining}d Left</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Target pace: ~{activeProgress.goal.recommended_daily_questions} Qs/day • ~{activeProgress.goal.recommended_weekly_labs} Labs/week
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                + Set Target Exam Date
              </button>
            )}
          </div>

          {/* Domain Breakdown (Visual bars per blueprint domain) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
              <span>Domain Knowledge Breakdown</span>
              <span>Weak Areas Tagged</span>
            </div>

            <div className="space-y-2.5">
              {activeProgress?.domain_breakdown && activeProgress.domain_breakdown.length > 0 ? (
                activeProgress.domain_breakdown.map((domain) => {
                  const isWeak = domain.readiness_score < 60;
                  const isStrong = domain.readiness_score >= 80;

                  return (
                    <div
                      key={domain.domain_number}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-400 text-[11px]">
                            D{domain.domain_number}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {domain.domain_name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({domain.weight_pct}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              isStrong
                                ? "bg-emerald-500/10 text-emerald-500"
                                : isWeak
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {domain.readiness_score}% Readiness
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isStrong ? "bg-emerald-500" : isWeak ? "bg-rose-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.max(5, domain.readiness_score)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>{domain.completed_labs} of {domain.total_labs} Labs Completed</span>
                        <span>{domain.questions_answered} Qs Answered ({domain.accuracy_pct}% Acc)</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs font-mono text-slate-400">
                  Take a practice quiz or hands-on lab to populate domain telemetry.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 90-Day Calendar Activity Heatmap */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>90-Day Study Activity Heatmap</span>
            </span>
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30" />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>More</span>
            </div>
          </div>

          {/* Activity Heatmap Grid */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
            <div className="flex gap-1.5 min-w-[680px]">
              {heatmapDays.map((day) => {
                let colorClass = "bg-slate-200 dark:bg-slate-800/80";
                if (day.minutes >= 60) colorClass = "bg-emerald-500";
                else if (day.minutes >= 30) colorClass = "bg-emerald-500/70";
                else if (day.minutes > 0 || day.count > 0) colorClass = "bg-emerald-500/40";

                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: ${day.minutes} min studied (${day.count} sessions)`}
                    className={`w-3.5 h-3.5 rounded-sm shrink-0 transition-transform hover:scale-125 cursor-pointer ${colorClass}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Track Hub Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Cisco CCNA 200-301 */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all shadow-sm hover:shadow-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Cisco Blueprint 200-301
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Cisco Certified Network Associate
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                120 Min • 100 Qs
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              40 Seeded Blueprint Topics, 8 Interactive Packet Tracer CLI Labs with Cisco IOS Config Checker, and Timed Mock Exams.
            </p>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{topics.filter((t) => t.certification_code?.includes("CCNA")).length || 40} Topics</span>
              <span>8 CLI Labs with Checker</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
            <Link
              href="/dashboard/study/exam?cert=CCNA-200-301"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-blue-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Practice Exam</span>
            </Link>
            <Link
              href="/dashboard/study/ccna"
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span>Blueprint & Labs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Module B: AWS SAA-C03 */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    AWS Exam SAA-C03
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Solutions Architect Associate
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                130 Min • 65 Qs
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              27 SAA-C03 Topics, 8 Architecture Labs with CloudFormation & Terraform HCL code, 2-Hour Cost Estimators, and Teardown Checklists.
            </p>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{topics.filter((t) => t.certification_code?.includes("AWS")).length || 27} Topics</span>
              <span>8 Architecture Labs with IaC</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
            <Link
              href="/dashboard/study/exam?cert=AWS-SAA-C03"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-amber-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Practice Exam</span>
            </Link>
            <Link
              href="/dashboard/study/aws"
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span>Blueprint & Labs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Auxiliary Tools Grid (Flashcards & Interview Prep) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flashcards Deck */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SuperMemo-2 Spaced Repetition Flashcards
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Active recall deck with 3D card flips and SM-2 quality ratings (Again / Hard / Good / Easy) to lock in high-yield subnetting and cloud concepts.
            </p>
          </div>
          <Link
            href="/dashboard/study/flashcards"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            <span>Review Flashcards Deck</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Organization Interview Simulator */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Organization Interview Prep & Simulator
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Target organization briefs, STAR behavioral answer matrices matched to candidate portfolio projects, and interactive multi-turn AI mock interviews.
            </p>
          </div>
          <Link
            href="/dashboard/study/interviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500"
          >
            <span>Launch Mock Interview Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Target Date Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Set Exam Target Date ({activeCertTrack})
                </h3>
              </div>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Exam Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Study Goal (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={dailyMinutesInput}
                  onChange={(e) => setDailyMinutesInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGoal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm"
                >
                  {isSavingGoal ? "Saving..." : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
