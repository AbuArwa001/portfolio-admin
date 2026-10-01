"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Play,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Terminal,
  ExternalLink,
  Star,
  Layers,
  BookMarked,
  ArrowRight,
  Filter,
  BarChart3,
  Loader2,
  Check,
} from "lucide-react";
import {
  startExamSession,
  submitExamAnswer,
  finishExamSession,
  getExamReview,
  getStudyCertifications,
  getStudyTopics,
  toggleFavoriteQuestion,
  reportQuestion,
  createStudyNote,
  createStudyFlashcard,
} from "@/lib/study-api";
import type {
  StudyCertification,
  StudyTopic,
  StudyQuestion,
  StudyExamSession,
} from "@/types/study";

export default function ExamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode & Setup state
  const [certifications, setCertifications] = React.useState<StudyCertification[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [selectedCert, setSelectedCert] = React.useState<string>("CCNA-200-301");
  const [selectedMode, setSelectedMode] = React.useState<"practice" | "timed_mock" | "retry_wrong" | "weak_drill">("practice");
  const [selectedTopicId, setSelectedTopicId] = React.useState<number | "">("");
  const [questionCount, setQuestionCount] = React.useState<number>(10);
  const [loadingSetup, setLoadingSetup] = React.useState(true);

  // Active Session state
  const [activeSession, setActiveSession] = React.useState<{
    session_id: number;
    certification_code: string;
    certification_name: string;
    mode: string;
    topic_name?: string | null;
    total_questions: number;
    duration_minutes: number;
    questions: StudyQuestion[];
    started_at: string;
  } | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [userAnswersMap, setUserAnswersMap] = React.useState<Record<number, string[]>>({});
  const [flaggedMap, setFlaggedMap] = React.useState<Record<number, boolean>>({});
  const [practiceFeedbackMap, setPracticeFeedbackMap] = React.useState<Record<number, any>>({});
  const [submittingAnswer, setSubmittingAnswer] = React.useState(false);
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(0);
  const [timerActive, setTimerActive] = React.useState(false);
  const [showNavigator, setShowNavigator] = React.useState(false);
  const [isFinishing, setIsFinishing] = React.useState(false);

  // Review Screen state
  const [reviewData, setReviewData] = React.useState<any | null>(null);
  const [reviewFilter, setReviewFilter] = React.useState<"all" | "wrong" | "flagged">("all");

  // Load Setup Data
  React.useEffect(() => {
    async function init() {
      try {
        setLoadingSetup(true);
        const [certsData, topicsData] = await Promise.all([
          getStudyCertifications().catch(() => []),
          getStudyTopics().catch(() => []),
        ]);
        setCertifications(certsData);
        setTopics(topicsData);

        // Pre-select cert or topic from query parameters if present
        const certParam = searchParams.get("cert");
        const topicParam = searchParams.get("topic");
        const modeParam = searchParams.get("mode") as any;

        if (certParam) setSelectedCert(certParam);
        if (topicParam) setSelectedTopicId(Number(topicParam));
        if (modeParam && ["practice", "timed_mock", "retry_wrong", "weak_drill"].includes(modeParam)) {
          setSelectedMode(modeParam);
        }
      } catch (err) {
        console.error("Failed to load exam setup data:", err);
      } finally {
        setLoadingSetup(false);
      }
    }
    init();
  }, [searchParams]);

  // Countdown Timer
  React.useEffect(() => {
    if (!timerActive || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, secondsRemaining]);

  // Keyboard Shortcuts: A-D (or 1-4), F to Flag, Enter/ArrowRight to Next, ArrowLeft to Prev
  React.useEffect(() => {
    if (!activeSession || reviewData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["input", "textarea"].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      const q = activeSession.questions[currentIndex];
      if (!q) return;

      const key = e.key.toUpperCase();

      // Options shortcuts
      if (["A", "B", "C", "D", "E"].includes(key)) {
        e.preventDefault();
        toggleOption(key);
      } else if (["1", "2", "3", "4", "5"].includes(key)) {
        e.preventDefault();
        const mapNumToId = ["A", "B", "C", "D", "E"][parseInt(key, 10) - 1];
        if (mapNumToId) toggleOption(mapNumToId);
      } else if (key === "F") {
        e.preventDefault();
        toggleFlag(q.id);
      } else if (e.key === "ArrowRight" && currentIndex < activeSession.questions.length - 1) {
        e.preventDefault();
        setCurrentIndex((i) => i + 1);
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex((i) => i - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSession, currentIndex, reviewData, userAnswersMap]);

  // Start Session
  const handleStartExam = async () => {
    try {
      setLoadingSetup(true);
      const res = await startExamSession({
        certification_code: selectedCert,
        mode: selectedMode,
        topic_id: selectedTopicId ? Number(selectedTopicId) : null,
        question_count: questionCount,
      });

      setActiveSession(res);
      setCurrentIndex(0);
      setUserAnswersMap({});
      setFlaggedMap({});
      setPracticeFeedbackMap({});
      setReviewData(null);

      // Initialize countdown timer
      const totalSec = res.duration_minutes * 60;
      setSecondsRemaining(totalSec);
      setTimerActive(true);
    } catch (err: any) {
      console.error("Failed to start session:", err);
      alert(err.message || "Failed to initialize exam session.");
    } finally {
      setLoadingSetup(false);
    }
  };

  // Toggle option selection
  const toggleOption = (optionId: string) => {
    if (!activeSession) return;
    const q = activeSession.questions[currentIndex];
    if (!q) return;

    const currentSelection = userAnswersMap[q.id] || [];
    let updated: string[];

    if (q.question_type === "multi_select") {
      if (currentSelection.includes(optionId)) {
        updated = currentSelection.filter((id) => id !== optionId);
      } else {
        updated = [...currentSelection, optionId];
      }
    } else {
      updated = [optionId];
    }

    setUserAnswersMap((prev) => ({ ...prev, [q.id]: updated }));
  };

  // Toggle flag for review
  const toggleFlag = (qId: number) => {
    setFlaggedMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Submit Answer in practice mode for instant feedback
  const handleCheckPracticeAnswer = async () => {
    if (!activeSession) return;
    const q = activeSession.questions[currentIndex];
    if (!q) return;

    const selected = userAnswersMap[q.id] || [];
    if (selected.length === 0) {
      alert("Please select an answer before checking.");
      return;
    }

    try {
      setSubmittingAnswer(true);
      const feedback = await submitExamAnswer(activeSession.session_id, {
        question_id: q.id,
        user_answers: selected,
        flagged_for_review: !!flaggedMap[q.id],
      });
      setPracticeFeedbackMap((prev) => ({ ...prev, [q.id]: feedback }));
    } catch (err: any) {
      console.error("Failed to check answer:", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Finish exam and load review
  const handleFinishExam = async () => {
    if (!activeSession) return;
    const answeredCount = Object.keys(userAnswersMap).length;
    const totalCount = activeSession.questions.length;

    if (answeredCount < totalCount) {
      const confirmFinish = confirm(
        `You have unanswered questions (${answeredCount}/${totalCount} answered). Are you sure you want to finish the exam?`
      );
      if (!confirmFinish) return;
    }

    try {
      setIsFinishing(true);
      setTimerActive(false);

      // Submit any unsubmitted answers
      for (const q of activeSession.questions) {
        const answers = userAnswersMap[q.id];
        if (answers && !practiceFeedbackMap[q.id]) {
          await submitExamAnswer(activeSession.session_id, {
            question_id: q.id,
            user_answers: answers,
            flagged_for_review: !!flaggedMap[q.id],
          }).catch(() => {});
        }
      }

      await finishExamSession(activeSession.session_id);
      const review = await getExamReview(activeSession.session_id);
      setReviewData(review);
    } catch (err: any) {
      console.error("Error finalizing exam:", err);
      alert("Failed to submit exam session.");
    } finally {
      setIsFinishing(false);
    }
  };

  // Favorite toggle
  const handleToggleFavorite = async (qId: number) => {
    try {
      const res = await toggleFavoriteQuestion(qId);
      if (activeSession) {
        const updated = activeSession.questions.map((q) =>
          q.id === qId ? { ...q, is_favorite: res.is_favorite } : q
        );
        setActiveSession({ ...activeSession, questions: updated });
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  // Add question note to Mistakes Journal
  const handleAddToMistakesJournal = async (q: StudyQuestion, explanation: string) => {
    try {
      await createStudyNote({
        title: `Missed: ${q.text.slice(0, 60)}...`,
        content: `**Question:**\n${q.text}\n\n**Correct Answer:** ${q.correct_answers.join(", ")}\n\n**Analysis:**\n${explanation}\n\n**Key Concept:** ${q.trigger_words || "N/A"}`,
        topic: q.topic,
        is_mistake_journal: true,
        related_question: q.id,
      });
      alert("Added to personal Mistakes Journal!");
    } catch (err) {
      console.error("Journal add failed:", err);
    }
  };

  // Format timer seconds into mm:ss or hh:mm:ss
  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const filteredTopicsForCert = topics.filter(
    (t) => t.certification_code?.includes(selectedCert) || t.certification === (selectedCert === "CCNA-200-301" ? 1 : 2)
  );

  /* ─────────────────────────────────────────────────────────────
     VIEW 1: END-OF-TEST COMPREHENSIVE REVIEW SCREEN
  ───────────────────────────────────────────────────────────── */
  if (reviewData) {
    const questionsToDisplay =
      reviewFilter === "wrong"
        ? reviewData.wrong_questions
        : reviewFilter === "flagged"
        ? reviewData.all_questions.filter((q: any) => q.flagged_for_review)
        : reviewData.all_questions;

    return (
      <div className="space-y-6 pb-16 max-w-5xl mx-auto">
        {/* Score & Verdict Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  reviewData.passed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {reviewData.passed ? "PASSED • CERT READY" : "FAILED • NEEDS REVIEW"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {reviewData.session?.certification_code}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Exam Score: {reviewData.score_pct}%
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {reviewData.passed
                  ? "Congratulations! You achieved the passing benchmark for this test."
                  : "Below the official passing threshold. Review each missed question below to spot question traps."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 min-w-[90px]">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {reviewData.correct_count}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Correct</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 min-w-[90px]">
                <div className="text-2xl font-bold font-mono text-rose-400">
                  {reviewData.wrong_count}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Missed</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 min-w-[90px]">
                <div className="text-2xl font-bold font-mono text-indigo-400">
                  {reviewData.total_questions}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Qs</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setReviewData(null);
                setActiveSession(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Quiz Hub</span>
            </button>

            {reviewData.wrong_count > 0 && (
              <button
                onClick={() => {
                  setSelectedMode("retry_wrong");
                  setReviewData(null);
                  handleStartExam();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30"
              >
                <span>Drill Missed Questions ({reviewData.wrong_count})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Per-Domain Accuracy Breakdown */}
        {reviewData.domain_breakdown && Object.keys(reviewData.domain_breakdown).length > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Domain Breakdown & Accuracy</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Weighted by Domain</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(reviewData.domain_breakdown).map(([domainName, stat]: [string, any]) => (
                <div
                  key={domainName}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {domainName}
                    </span>
                    <span className={`font-mono font-bold ${stat.pct >= 75 ? "text-emerald-500" : "text-rose-500"}`}>
                      {stat.pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stat.pct >= 75 ? "bg-emerald-500" : stat.pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>{stat.correct} of {stat.total} correct</span>
                    <span>{stat.pct >= 75 ? "Proficient" : "Needs Review"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                reviewFilter === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Questions ({reviewData.total_questions})
            </button>
            <button
              onClick={() => setReviewFilter("wrong")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                reviewFilter === "wrong"
                  ? "bg-rose-600 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Missed Questions ({reviewData.wrong_count})</span>
            </button>
            <button
              onClick={() => setReviewFilter("flagged")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                reviewFilter === "flagged"
                  ? "bg-amber-600 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Flagged for Review</span>
            </button>
          </div>
        </div>

        {/* Question Review Cards */}
        <div className="space-y-4">
          {questionsToDisplay.map((q: any, idx: number) => {
            const isCorrect = q.is_correct;
            return (
              <div
                key={q.question_id || idx}
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm space-y-4 ${
                  isCorrect
                    ? "border-emerald-500/30"
                    : "border-rose-500/40 bg-rose-50/10 dark:bg-rose-950/10"
                }`}
              >
                {/* Header status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      }`}>
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{isCorrect ? "Correct" : "Incorrect"}</span>
                      </span>

                      <span className="text-xs text-slate-400 font-mono">
                        Domain {q.domain_number}: {q.topic_name}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">
                      {q.question_text}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddToMistakesJournal(q, q.explanation)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Save to Mistakes Journal"
                    >
                      <BookMarked className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scenario Context */}
                {q.scenario_context && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {q.scenario_context}
                  </div>
                )}

                {/* Command Output Terminal */}
                {q.code_output && (
                  <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-400">CLI Output</span>
                    </div>
                    <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed">
                      {q.code_output}
                    </pre>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options?.map((opt: any) => {
                    const isUserChoice = q.user_answers?.includes(opt.id);
                    const isCorrectAnswer = q.correct_answers?.includes(opt.id);

                    let optStyle = "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300";
                    if (isCorrectAnswer) {
                      optStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium";
                    } else if (isUserChoice && !isCorrectAnswer) {
                      optStyle = "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200 font-medium";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${optStyle}`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                          isCorrectAnswer
                            ? "bg-emerald-500 text-white"
                            : isUserChoice
                            ? "bg-rose-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>
                          {opt.id}
                        </span>
                        <div className="flex-1 leading-relaxed">
                          {opt.text}
                          {isUserChoice && (
                            <span className="ml-2 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              Your Answer
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="ml-2 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                              Correct Choice
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* In-depth Analysis & Explanations */}
                <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[10px] tracking-wider block pb-1">
                      Why the correct answer is right:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>

                  {q.distractor_notes && Object.keys(q.distractor_notes).length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[10px] tracking-wider block pb-1">
                        Distractor Traps (Why other options are wrong):
                      </span>
                      <div className="space-y-1.5 pt-1">
                        {Object.entries(q.distractor_notes).map(([optId, note]: [string, any]) => (
                          <div key={optId} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                            <span className="font-mono font-bold text-slate-500 shrink-0">Option {optId}:</span>
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.trigger_words && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <span className="font-mono font-bold text-indigo-500 shrink-0">Trigger Words to Spot:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{q.trigger_words}</span>
                    </div>
                  )}

                  {q.reference_doc_url && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Official Exam Reference:</span>
                      <a
                        href={q.reference_doc_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Open Cisco / AWS Documentation</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     VIEW 2: ACTIVE EXAM & QUIZ ENGINE SCREEN
  ───────────────────────────────────────────────────────────── */
  if (activeSession) {
    const q = activeSession.questions[currentIndex];
    const isPractice = activeSession.mode === "practice";
    const feedback = practiceFeedbackMap[q.id];
    const currentSelected = userAnswersMap[q.id] || [];
    const isFlagged = !!flaggedMap[q.id];

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-20">
        {/* Top Sticky Status Bar */}
        <div className="sticky top-2 z-30 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Q {currentIndex + 1} / {activeSession.questions.length}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
              {activeSession.topic_name || activeSession.certification_name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              secondsRemaining < 600
                ? "bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Flag for Review */}
            <button
              onClick={() => toggleFlag(q.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isFlagged
                  ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500"
              }`}
              title="Flag for Review (Shortcut: F)"
            >
              <Flag className="w-4 h-4" />
            </button>

            {/* Navigator Drawer Button */}
            <button
              onClick={() => setShowNavigator(!showNavigator)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Navigator
            </button>

            {/* Finish Button */}
            <button
              onClick={handleFinishExam}
              disabled={isFinishing}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {isFinishing ? "Submitting..." : "End Exam"}
            </button>
          </div>
        </div>

        {/* Question Navigator Drawer */}
        {showNavigator && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span>QUESTION NAVIGATOR</span>
              <button onClick={() => setShowNavigator(false)} className="text-slate-500 hover:text-white">Close</button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {activeSession.questions.map((quest, idx) => {
                const isAnswered = !!userAnswersMap[quest.id]?.length;
                const isCurrent = idx === currentIndex;
                const flagged = !!flaggedMap[quest.id];

                let btnStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                if (isCurrent) {
                  btnStyle = "bg-indigo-600 text-white border-indigo-600 font-bold ring-2 ring-indigo-400/40";
                } else if (flagged) {
                  btnStyle = "bg-amber-500/20 text-amber-500 border-amber-500/40 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                }

                return (
                  <button
                    key={quest.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowNavigator(false);
                    }}
                    className={`w-9 h-9 rounded-xl border text-xs font-mono flex items-center justify-center transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Question Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {q.question_type.replace("_", " ")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 capitalize">
                  {q.difficulty}
                </span>
                <button
                  onClick={() => handleToggleFavorite(q.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    q.is_favorite ? "text-amber-400" : "text-slate-400 hover:text-amber-400"
                  }`}
                  title="Favorite Question"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {q.text}
            </h3>
          </div>

          {/* Scenario Context Narrative Box */}
          {q.scenario_context && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {q.scenario_context}
            </div>
          )}

          {/* Monospace Command Output Window */}
          {q.code_output && (
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
              <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-semibold">Router / Switch Output</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">IOS / AWS CLI</span>
              </div>
              <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed select-text">
                {q.code_output}
              </pre>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {q.options?.map((opt) => {
              const isSelected = currentSelected.includes(opt.id);

              let optionStyle =
                "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white";
              if (isSelected) {
                optionStyle =
                  "border-indigo-600 dark:border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-100 font-semibold ring-1 ring-indigo-500/30";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3.5 transition-all ${optionStyle}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    {opt.id}
                  </span>
                  <span className="flex-1 leading-relaxed pt-0.5">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Instant Practice Mode Check & Feedback */}
          {isPractice && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              {!feedback ? (
                <button
                  onClick={handleCheckPracticeAnswer}
                  disabled={submittingAnswer || currentSelected.length === 0}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingAnswer ? "Evaluating..." : "Check Answer (Instant Feedback)"}
                </button>
              ) : (
                <div className={`p-5 rounded-2xl border text-xs space-y-3 animate-in fade-in duration-200 ${
                  feedback.is_correct
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-sm flex items-center gap-2">
                      {feedback.is_correct ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Correct!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-500" />
                          <span className="text-rose-600 dark:text-rose-400">
                            Incorrect. Correct choice is: {feedback.correct_answers?.join(", ")}
                          </span>
                        </>
                      )}
                    </span>
                    <button
                      onClick={() => handleAddToMistakesJournal(q, feedback.explanation)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>Save to Mistakes Journal</span>
                    </button>
                  </div>

                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                    {feedback.explanation}
                  </p>

                  {feedback.distractor_notes && Object.keys(feedback.distractor_notes).length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-[10px] uppercase font-mono tracking-wider">Distractor Notes:</span>
                      {Object.entries(feedback.distractor_notes).map(([optId, note]: [string, any]) => (
                        <div key={optId} className="text-slate-600 dark:text-slate-400">
                          <strong>Option {optId}:</strong> {note}
                        </div>
                      ))}
                    </div>
                  )}

                  {feedback.trigger_words && (
                    <div className="pt-1 text-[11px]">
                      <strong className="text-indigo-500">Trigger Words:</strong> {feedback.trigger_words}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] font-mono text-slate-400">
              Shortcuts: Keys A-D / 1-4 • F Flag • Arrow Keys
            </span>

            {currentIndex < activeSession.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishExam}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                <span>Finish & Review</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     VIEW 3: QUIZ & EXAM LAUNCHER (SETUP) SCREEN
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Phase 2
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Exam & Practice Engine</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Certification Quiz & Mock Exam Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Prepare with topic-by-topic instant feedback practice, timed official mock exams, or drill weak and missed questions.
        </p>
      </div>

      {/* Setup Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Certification Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
            1. Select Certification Track
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedCert("CCNA-200-301");
                setSelectedTopicId("");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedCert === "CCNA-200-301"
                  ? "bg-blue-500/10 border-blue-600 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="font-bold text-sm">Cisco CCNA (200-301)</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                6 Blueprint Domains • 120 Min Mock (100 Qs)
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCert("AWS-SAA-C03");
                setSelectedTopicId("");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedCert === "AWS-SAA-C03"
                  ? "bg-amber-500/10 border-amber-600 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="font-bold text-sm">AWS Solutions Architect (SAA-C03)</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4 Exam Domains • 130 Min Mock (65 Qs)
              </div>
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
            2. Choose Study Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "practice",
                title: "Topic Practice (Instant Feedback)",
                desc: "Immediate right/wrong check, detailed explanations, and distractor notes after every question.",
              },
              {
                id: "timed_mock",
                title: "Timed Mock Exam",
                desc: "Domain-weighted questions mimicking the real exam, complete with 120/130m timer and navigator panel.",
              },
              {
                id: "retry_wrong",
                title: "Retry Wrong Answers",
                desc: "Drills only questions you previously answered incorrectly until you master them.",
              },
              {
                id: "weak_drill",
                title: "Weak-Area Drilling",
                desc: "Pulls questions from topics where your historical accuracy percentage is lowest.",
              },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id as any)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedMode === m.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">{m.title}</div>
                <div className={`text-[11px] mt-1 leading-relaxed ${
                  selectedMode === m.id ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"
                }`}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Topic Selector (if in practice mode) */}
        {selectedMode === "practice" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
              3. Blueprint Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Topics (Mixed Random Practice)</option>
              {filteredTopicsForCert.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.blueprint_ref || t.domain_number}] {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Question Count */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
            {selectedMode === "practice" ? "4. Number of Questions" : "3. Number of Questions"}
          </label>
          <div className="flex items-center gap-2">
            {[5, 10, 25, 50, selectedCert === "CCNA-200-301" ? 100 : 65].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setQuestionCount(cnt)}
                className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                  questionCount === cnt
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {cnt} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={handleStartExam}
            disabled={loadingSetup}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {loadingSetup ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Session...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start {selectedMode === "timed_mock" ? "Timed Mock Exam" : "Practice Session"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
