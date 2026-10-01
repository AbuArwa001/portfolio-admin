"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  Clock,
  Plus,
  X,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Brain,
  ArrowRight,
} from "lucide-react";
import {
  getStudyFlashcards,
  reviewFlashcard,
  createStudyFlashcard,
  getStudyTopics,
} from "@/lib/study-api";
import type { StudyFlashcard, StudyTopic } from "@/types/study";

export default function FlashcardsStudyPage() {
  const [cards, setCards] = React.useState<StudyFlashcard[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<"due" | "all">("due");
  const [certFilter, setCertFilter] = React.useState<string>("all");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // New card form state
  const [newFront, setNewFront] = React.useState("");
  const [newBack, setNewBack] = React.useState("");
  const [newTopicId, setNewTopicId] = React.useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const params: { cert?: string; due?: boolean } = {};
      if (filterMode === "due") params.due = true;
      if (certFilter !== "all") params.cert = certFilter;

      const [cardsData, topicsData] = await Promise.all([
        getStudyFlashcards(params).catch(() => []),
        getStudyTopics().catch(() => []),
      ]);

      setCards(cardsData);
      setTopics(topicsData);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setLoading(false);
    }
  }, [filterMode, certFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in inputs
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && !isReviewing) {
        if (e.key === "1") handleRate(1);
        else if (e.key === "2") handleRate(3);
        else if (e.key === "3") handleRate(4);
        else if (e.key === "4") handleRate(5);
      } else if (!isFlipped) {
        if (e.code === "ArrowRight") handleNext();
        else if (e.code === "ArrowLeft") handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentIndex, cards, isReviewing]);

  const currentCard = cards[currentIndex] || null;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleRate = async (quality: number) => {
    if (!currentCard || isReviewing) return;
    try {
      setIsReviewing(true);
      const updated = await reviewFlashcard(currentCard.id, quality);

      // If in "due" mode, remove the card from the review queue
      if (filterMode === "due") {
        const remaining = cards.filter((c) => c.id !== currentCard.id);
        setCards(remaining);
        if (currentIndex >= remaining.length) {
          setCurrentIndex(Math.max(0, remaining.length - 1));
        }
      } else {
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        handleNext();
      }
      setIsFlipped(false);
    } catch (err: any) {
      console.error("Failed to submit rating:", err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicId || !newFront.trim() || !newBack.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await createStudyFlashcard({
        topic: Number(newTopicId),
        front: newFront.trim(),
        back: newBack.trim(),
      });
      setIsCreateOpen(false);
      setNewFront("");
      setNewBack("");
      setMessage("Flashcard successfully created!");
      setTimeout(() => setMessage(null), 3000);
      loadData();
    } catch (err: any) {
      console.error("Failed to create flashcard:", err);
      alert(err.message || "Failed to create card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              SM-2 Algorithm
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Leitner Spaced Repetition</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-500" />
            <span>Active Recall Flashcards</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Optimized review intervals based on difficulty ratings. Flip cards, test memory recall, and retain high-yield exam concepts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Flashcard</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Deck Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode("due")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterMode === "due"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Due Cards</span>
            {filterMode === "due" && cards.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-400/30 text-[10px] font-mono">
                {cards.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterMode === "all"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Free Browse All</span>
          </button>
        </div>

        {/* Cert Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Track:</span>
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Tracks</option>
            <option value="CCNA-200-301">Cisco CCNA (200-301)</option>
            <option value="AWS-SAA-C03">AWS SAA-C03</option>
          </select>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      {loading ? (
        <div className="h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-mono text-slate-400">
          Loading flashcard deck...
        </div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {filterMode === "due" ? "All Caught Up For Today!" : "No Flashcards Found"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {filterMode === "due"
              ? "You have completed all scheduled active recall reviews for this deck. Switch to 'Free Browse All' or create new custom cards."
              : "No flashcards match your current filter. Create a new flashcard to begin practicing."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {filterMode === "due" && (
              <button
                onClick={() => setFilterMode("all")}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                Browse All Flashcards
              </button>
            )}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              + Create Flashcard
            </button>
          </div>
        </div>
      ) : currentCard ? (
        <div className="space-y-4">
          {/* Card Meta Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono px-1">
            <span className="flex items-center gap-1.5">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span>•</span>
              <span className="text-indigo-400 font-bold">
                {currentCard.topic_name || "Topic"}
              </span>
            </span>

            <div className="flex items-center gap-3 text-[11px]">
              <span>Interval: <strong>{currentCard.interval_days}d</strong></span>
              <span>Ease: <strong>{Number(currentCard.ease_factor).toFixed(2)}</strong></span>
              <span>Rep: <strong>#{currentCard.repetition_level}</strong></span>
            </div>
          </div>

          {/* 3D Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer select-none min-h-[300px] sm:min-h-[340px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-10 shadow-xl flex flex-col justify-between transition-all hover:border-indigo-500/40 relative overflow-hidden group"
          >
            {/* Top Card Badge */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                  isFlipped
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                }`}
              >
                {isFlipped ? "Answer & Blueprint Solution" : "Question Prompt"}
              </span>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                <span>Space to Flip</span>
              </span>
            </div>

            {/* Card Content */}
            <div className="my-auto py-6">
              {isFlipped ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed font-mono whitespace-pre-line">
                    {currentCard.back}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {currentCard.front}
                  </h3>
                </div>
              )}
            </div>

            {/* Bottom Flip Instruction */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{isFlipped ? "Rate your recall quality below (1 - 4):" : "Click anywhere or press Space to see answer"}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-500">
                {isFlipped ? "Ready to Grade" : "Click to Reveal"}
              </span>
            </div>
          </div>

          {/* SM-2 Response Grading Bar (Visible when flipped) */}
          {isFlipped ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-150">
              <button
                onClick={() => handleRate(1)}
                disabled={isReviewing}
                className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-left transition-all flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>1 • Again</span>
                  <span className="text-[10px] opacity-75">1d</span>
                </div>
                <div className="text-[11px] text-rose-400/80">Blackout / Forgot completely</div>
              </button>

              <button
                onClick={() => handleRate(3)}
                disabled={isReviewing}
                className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-left transition-all flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>2 • Hard</span>
                  <span className="text-[10px] opacity-75">+1d</span>
                </div>
                <div className="text-[11px] text-amber-400/80">Recalled with struggle</div>
              </button>

              <button
                onClick={() => handleRate(4)}
                disabled={isReviewing}
                className="p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 text-left transition-all flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>3 • Good</span>
                  <span className="text-[10px] opacity-75">~3-6d</span>
                </div>
                <div className="text-[11px] text-blue-400/80">Normal effort recall</div>
              </button>

              <button
                onClick={() => handleRate(5)}
                disabled={isReviewing}
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 text-left transition-all flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>4 • Easy</span>
                  <span className="text-[10px] opacity-75">&gt;7d</span>
                </div>
                <div className="text-[11px] text-emerald-400/80">Perfect instant recall</div>
              </button>
            </div>
          ) : (
            /* Navigation Bar (When unflipped) */
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setIsFlipped(true)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-600/20"
              >
                Show Answer (Space)
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Create Flashcard Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Create Custom Flashcard
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    High-yield active recall card with SM-2 spaced repetition
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Blueprint Topic *
                </label>
                <select
                  required
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select Blueprint Topic...</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.blueprint_ref}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Front Prompt (Question or Concept) *
                </label>
                <textarea
                  required
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. What is the difference between Security Groups and Network ACLs in terms of state?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Back Solution (Detailed Answer) *
                </label>
                <textarea
                  required
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g. Security Groups are stateful (inbound allowed traffic is automatically allowed outbound). NACLs are stateless (both inbound and outbound rules must be explicitly allowed)."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm"
                >
                  {isSubmitting ? "Creating..." : "Save Flashcard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
