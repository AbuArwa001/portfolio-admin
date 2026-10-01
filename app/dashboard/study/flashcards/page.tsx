"use client";

import * as React from "react";
import {
  Layers,
  Plus,
  RotateCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  HelpCircle,
} from "lucide-react";
import { getStudyFlashcards, createStudyFlashcard, reviewFlashcard, getStudyTopics } from "@/lib/study-api";
import type { StudyFlashcard, StudyTopic } from "@/types/study";

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = React.useState<StudyFlashcard[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterDue, setFilterDue] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Active Card Flip state
  const [activeCardIndex, setActiveCardIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  // New Flashcard form
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [topicId, setTopicId] = React.useState<number | "">("");
  const [submitting, setSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [cardsData, topicsData] = await Promise.all([
        getStudyFlashcards({ due: filterDue }).catch(() => []),
        getStudyTopics().catch(() => []),
      ]);
      setFlashcards(cardsData);
      setTopics(topicsData);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setLoading(false);
    }
  }, [filterDue]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !topicId) return;

    try {
      setSubmitting(true);
      const created = await createStudyFlashcard({
        front: front.trim(),
        back: back.trim(),
        topic: Number(topicId),
      });
      setFlashcards((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setFront("");
      setBack("");
      setTopicId("");
    } catch (err) {
      console.error("Failed to create flashcard:", err);
      alert("Failed to create flashcard");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (quality: number) => {
    const card = flashcards[activeCardIndex];
    if (!card) return;

    try {
      await reviewFlashcard(card.id, quality);
      setIsFlipped(false);
      if (activeCardIndex < flashcards.length - 1) {
        setActiveCardIndex((prev) => prev + 1);
      } else {
        alert("Completed review for this batch!");
        loadData();
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  const activeCard = flashcards[activeCardIndex];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              SM-2 Algorithm
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Spaced Repetition Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Study Flashcards Deck
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            SuperMemo-2 spaced repetition memory scheduler. Missed quiz questions auto-enter this deck for targeted recall intervals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-emerald-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Flashcard</span>
        </button>
      </div>

      {/* Main Flashcard Practice Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading flashcards...
        </div>
      ) : flashcards.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
          <div className="font-medium text-slate-600 dark:text-slate-300">No flashcards in deck yet</div>
          <p className="max-w-md mx-auto text-slate-400 text-[11px]">
            Cards are automatically generated whenever you miss a quiz question in Phase 2, or you can add manual flashcards now.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Card</span>
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>CARD {activeCardIndex + 1} OF {flashcards.length}</span>
            <span className="text-emerald-500 font-semibold">{activeCard?.topic_name || "General"}</span>
          </div>

          {/* Flashcard container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`min-h-[260px] p-8 rounded-3xl border cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-lg select-none ${
              isFlipped
                ? "bg-slate-900 border-indigo-500/40 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-emerald-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                {isFlipped ? "Answer & Explanation" : "Prompt / Question"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Click anywhere to flip</span>
            </div>

            <div className="my-auto py-6 text-center text-base sm:text-lg font-medium leading-relaxed">
              {isFlipped ? activeCard?.back : activeCard?.front}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Interval: {activeCard?.interval_days || 1}d</span>
              <span>Rep: {activeCard?.repetition_level || 0}</span>
            </div>
          </div>

          {/* Flip rating buttons when card is flipped */}
          {isFlipped && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="text-[11px] font-mono text-center text-slate-400 uppercase tracking-wider">
                Rate Recall Quality (SM-2 Algorithm):
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleReview(1)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold"
                >
                  Forgot (Reset)
                </button>
                <button
                  onClick={() => handleReview(3)}
                  className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleReview(4)}
                  className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold"
                >
                  Good
                </button>
                <button
                  onClick={() => handleReview(5)}
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                >
                  Easy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Create Study Flashcard
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topic *
                </label>
                <select
                  required
                  value={topicId}
                  onChange={(e) => setTopicId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select Blueprint Topic...</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.certification_code || t.domain_name}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Front (Prompt / Question) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g. What is the administrative distance of OSPF?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Back (Answer & Details) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="e.g. 110. (Connected: 0, Static: 1, eBGP: 20, EIGRP internal: 90, OSPF: 110, RIP: 120, iBGP: 200)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Flashcard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
