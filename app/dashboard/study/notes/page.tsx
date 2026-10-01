"use client";

import * as React from "react";
import {
  BookMarked,
  Plus,
  Search,
  AlertOctagon,
  FileText,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { getStudyNotes, createStudyNote, deleteStudyNote, getStudyTopics } from "@/lib/study-api";
import type { StudyNote, StudyTopic } from "@/types/study";

export default function StudyNotesPage() {
  const [notes, setNotes] = React.useState<StudyNote[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"all" | "mistakes">("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [topicId, setTopicId] = React.useState<number | "">("");
  const [isMistakeJournal, setIsMistakeJournal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [notesData, topicsData] = await Promise.all([
        getStudyNotes({ mistakes: tab === "mistakes" }).catch(() => []),
        getStudyTopics().catch(() => []),
      ]);
      setNotes(notesData);
      setTopics(topicsData);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !topicId) return;

    try {
      setSubmitting(true);
      const created = await createStudyNote({
        title: title.trim(),
        content: content.trim(),
        topic: Number(topicId),
        is_mistake_journal: isMistakeJournal,
      });
      setNotes((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      setTopicId("");
      setIsMistakeJournal(false);
    } catch (err) {
      console.error("Failed to create note:", err);
      alert("Failed to create note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note entry?")) return;
    try {
      await deleteStudyNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Personal Journal
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Knowledge Retention Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Mistakes Journal & Study Notes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Keep concise notes and record exam questions or CLI commands that tripped you up so you master edge cases before test day.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-rose-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === "all"
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          All Notes & Journal Entries
        </button>
        <button
          onClick={() => setTab("mistakes")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === "mistakes"
              ? "bg-rose-600 text-white"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Mistakes Journal Only</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-3">
            <BookMarked className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <div className="font-medium text-slate-600 dark:text-slate-300">No notes or mistake entries yet</div>
            <p className="max-w-md mx-auto text-slate-400 text-[11px]">
              Whenever you encounter a tricky topic or tricky syntax, log it here for active review.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Entry</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 transition-all shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        note.is_mistake_journal
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {note.is_mistake_journal ? "Mistakes Journal" : "Study Note"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {note.topic_name || "General"}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {note.title}
                  </h3>

                  <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                    {note.content}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}
                  </span>

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                New Note / Mistakes Journal Entry
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OSPF Dead Interval Mismatch or S3 Bucket Policy Principal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes & Analysis *
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What was the misconception? Why does the correct configuration or answer work?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isMistakeCheck"
                  checked={isMistakeJournal}
                  onChange={(e) => setIsMistakeJournal(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="isMistakeCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark as entry in personal <strong>Mistakes Journal</strong>
                </label>
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
