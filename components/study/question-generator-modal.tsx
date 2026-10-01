"use client";

import * as React from "react";
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { generateQuestions } from "@/lib/study-api";
import type { StudyTopic, StudyQuestion } from "@/types/study";

interface QuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: StudyTopic[];
  defaultTopicId?: number;
  onQuestionsGenerated?: (newQuestions: StudyQuestion[]) => void;
}

export function QuestionGeneratorModal({
  isOpen,
  onClose,
  topics,
  defaultTopicId,
  onQuestionsGenerated,
}: QuestionGeneratorModalProps) {
  const [topicId, setTopicId] = React.useState<number | "">("");
  const [count, setCount] = React.useState<number>(10);
  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = React.useState(false);
  const [resultMessage, setResultMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (defaultTopicId) {
      setTopicId(defaultTopicId);
    } else if (topics.length > 0 && !topicId) {
      setTopicId(topics[0].id);
    }
  }, [defaultTopicId, topics]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setResultMessage(null);

      const res = await generateQuestions(Number(topicId), count, difficulty);
      setResultMessage(res.message);
      if (onQuestionsGenerated) {
        onQuestionsGenerated(res.questions);
      }
    } catch (err: any) {
      console.error("Question generation failed:", err);
      setErrorMessage(err.message || "Failed to generate questions. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTopic = topics.find((t) => t.id === Number(topicId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Claude AI Question Generator
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Server-side generation with blueprint-aligned distractors and trigger words
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          {/* Topic Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Blueprint Topic *
            </label>
            <select
              required
              value={topicId}
              onChange={(e) => setTopicId(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.blueprint_ref || t.domain_number}] {t.name}
                </option>
              ))}
            </select>
            {selectedTopic && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 px-1">
                {selectedTopic.description}
              </div>
            )}
          </div>

          {/* Count and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Question Count
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions (Default)</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Exam Standard)</option>
                <option value="hard">Hard (Complex Scenarios)</option>
              </select>
            </div>
          </div>

          {/* Loading or Status Alerts */}
          {loading && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
              <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                Claude is analyzing blueprint objectives, generating realistic scenarios & command outputs, and checking for duplicates...
              </div>
            </div>
          )}

          {resultMessage && !loading && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {errorMessage && !loading && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {resultMessage ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
