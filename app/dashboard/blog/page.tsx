"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Edit3,
  Eye,
  Clock,
  Calendar,
  X,
  FileText,
  Rss,
  Image as ImageIcon,
  Sparkles,
  Tag,
  ShieldCheck,
  EyeOff,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  subtitle?: string;
  content: string;
  cover_image?: string;
  source?: "manual" | "medium";
  canonical_url?: string;
  medium_guid?: string;
  tags?: string[];
  read_time_minutes?: number;
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string;
  created_at?: string;
}

const emptyPost = (): BlogPost => ({
  title: "",
  slug: "",
  subtitle: "",
  content: "",
  cover_image: "",
  source: "manual",
  canonical_url: "",
  tags: [],
  read_time_minutes: 5,
  is_published: true,
  is_featured: false,
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export default function BlogManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${getApiUrl()}/api/v1/blog/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://khalfanathman.dev";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingMedium, setSyncingMedium] = useState(false);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | "medium" | "manual">("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast("error", "Failed to load blog posts from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [API]);

  const handleSyncMedium = async () => {
    setSyncingMedium(true);
    try {
      const res = await fetch(`${API}sync_medium/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ username: "khalfanathman" }),
      });

      if (!res.ok) throw new Error("Failed to sync from Medium.");
      const data = await res.json();
      showToast(
        "success",
        `Medium sync complete! (${data.created} created, ${data.updated} updated)`
      );
      fetchPosts();
    } catch (err: any) {
      showToast("error", err.message || "Failed to sync Medium articles.");
    } finally {
      setSyncingMedium(false);
    }
  };

  const handleCreateNew = () => {
    const post = emptyPost();
    setActivePost(post);
    setTagsInput("");
    setIsEditing(true);
    setEditorTab("write");
  };

  const handleEdit = (post: BlogPost) => {
    setActivePost({ ...post });
    setTagsInput(post.tags ? post.tags.join(", ") : "");
    setIsEditing(true);
    setEditorTab("write");
  };

  const handleTitleChange = (val: string) => {
    if (!activePost) return;
    const isNew = !activePost.id;
    setActivePost({
      ...activePost,
      title: val,
      slug: isNew ? slugify(val) : activePost.slug,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost) return;
    if (!token) return showToast("error", "Authentication required to publish.");
    if (!activePost.title.trim()) return showToast("error", "Title cannot be empty.");
    if (!activePost.slug.trim()) return showToast("error", "Slug cannot be empty.");

    setSaving(true);
    try {
      const isNew = !activePost.id;
      const url = isNew ? API : `${API}${activePost.id}/`;
      const method = isNew ? "POST" : "PATCH";

      // Parse tags from input string
      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const words = activePost.content ? activePost.content.trim().split(/\s+/).length : 0;
      const readTime = Math.max(1, Math.round(words / 200));

      const payload = {
        title: activePost.title.trim(),
        slug: activePost.slug.trim(),
        subtitle: activePost.subtitle?.trim() || "",
        content: activePost.content,
        cover_image: activePost.cover_image?.trim() || "",
        source: activePost.source || "manual",
        canonical_url: activePost.canonical_url?.trim() || null,
        tags: parsedTags,
        read_time_minutes: activePost.read_time_minutes || readTime,
        is_published: activePost.is_published ?? true,
        is_featured: activePost.is_featured ?? false,
      };

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const saved: BlogPost = await res.json();
      if (isNew) {
        setPosts([saved, ...posts]);
      } else {
        setPosts(posts.map((p) => (p.id === saved.id ? saved : p)));
      }

      setIsEditing(false);
      setActivePost(null);
      showToast(
        "success",
        isNew ? "Article published successfully!" : "Article updated successfully!"
      );
    } catch (err: any) {
      showToast("error", err.message || "Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!post.id) return;
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    if (!token) return showToast("error", "Authentication required.");

    setDeletingId(post.id);
    try {
      const res = await fetch(`${API}${post.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok && res.status !== 204) throw new Error("Failed to delete.");
      setPosts(posts.filter((p) => p.id !== post.id));
      if (activePost?.id === post.id) {
        setIsEditing(false);
        setActivePost(null);
      }
      showToast("success", "Article deleted.");
    } catch {
      showToast("error", "Failed to delete article.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;
    if (filterSource === "medium") return p.source === "medium";
    if (filterSource === "manual") return p.source !== "medium";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              Technical Journal
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • {posts.length} Total Articles
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Blog &amp; Knowledge Publishing
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Write manual articles with rich formatting and cover images, or 1-click sync your stories from Medium.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Sync from Medium Button */}
          <button
            onClick={handleSyncMedium}
            disabled={syncingMedium}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 min-h-[42px] sm:min-h-0"
            title="Pool published articles from medium.com/@khalfanathman"
          >
            {syncingMedium ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Syncing Medium...</span>
              </>
            ) : (
              <>
                <Rss className="h-4 w-4 shrink-0" />
                <span>Sync from Medium</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Public View */}
            <a
              href={`${portfolioUrl}/blog`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all min-h-[42px] sm:min-h-0"
            >
              <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Public View</span>
              <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
            </a>

            {/* Write New Article */}
            <button
              onClick={handleCreateNew}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer min-h-[42px] sm:min-h-0"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>New Article</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal / Drawer */}
      <AnimatePresence>
        {isEditing && activePost && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-3xl border border-blue-500/30 dark:border-blue-500/20 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl p-5 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">
                    {activePost.id ? `Edit: ${activePost.title}` : "Compose New Article"}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {activePost.source === "medium" ? "Source: Medium (Synced)" : "Source: Portfolio Original"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActivePost(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={activePost.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Scaling Django REST APIs with PostgreSQL"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[42px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={activePost.slug}
                    onChange={(e) => setActivePost({ ...activePost, slug: slugify(e.target.value) })}
                    placeholder="scaling-django-apis"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs font-mono min-h-[42px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Subtitle / Excerpt */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Subtitle / Executive Summary
                </label>
                <input
                  type="text"
                  value={activePost.subtitle || ""}
                  onChange={(e) => setActivePost({ ...activePost, subtitle: e.target.value })}
                  placeholder="A concise one-to-two sentence overview of the article for card previews and SEO..."
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[42px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Cover Image URL with Live Thumbnail Preview */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span>Cover / Header Image URL</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <input
                    type="url"
                    value={activePost.cover_image || ""}
                    onChange={(e) => setActivePost({ ...activePost, cover_image: e.target.value })}
                    placeholder="https://images.unsplash.com/... or https://cdn-images-1.medium.com/..."
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[42px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  {activePost.cover_image && (
                    <div className="relative w-24 h-14 rounded-xl border border-slate-300 dark:border-white/[0.1] overflow-hidden shrink-0 bg-muted/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePost.cover_image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tags & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    <span>Tags (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Django, Next.js, BGP Routing, Linux"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[42px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>Estimated Read Time (minutes)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={activePost.read_time_minutes || 5}
                    onChange={(e) =>
                      setActivePost({
                        ...activePost,
                        read_time_minutes: parseInt(e.target.value) || 1,
                      })
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[42px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Source & Canonical URL (if applicable) */}
              {activePost.source === "medium" && (
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    <span>Medium Canonical URL</span>
                  </label>
                  <input
                    type="url"
                    value={activePost.canonical_url || ""}
                    onChange={(e) => setActivePost({ ...activePost, canonical_url: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#070b14] text-xs font-mono"
                  />
                </div>
              )}

              {/* Tab selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    editorTab === "write"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Edit3 className="inline-block h-3.5 w-3.5 mr-1.5" /> Markdown / HTML Content
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    editorTab === "preview"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Eye className="inline-block h-3.5 w-3.5 mr-1.5" /> Content Preview
                </button>
              </div>

              {/* Content / Preview */}
              {editorTab === "write" ? (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={14}
                    required
                    value={activePost.content}
                    onChange={(e) => setActivePost({ ...activePost, content: e.target.value })}
                    placeholder="Write article content using Markdown format or paste HTML...&#10;&#10;## Key Architecture Tenets&#10;1. Stateless JWT Auth...&#10;2. Connection Pooling..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports Markdown (## Headings, - Lists, `code`, ```codeblocks```) or clean HTML.
                  </span>
                </div>
              ) : (
                <div className="min-h-[300px] max-h-[500px] overflow-y-auto px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14]/50 text-slate-900 dark:text-white text-sm prose dark:prose-invert max-w-none">
                  <h1 className="text-2xl font-bold mb-2">{activePost.title || "Untitled Article"}</h1>
                  {activePost.subtitle && (
                    <p className="text-slate-500 italic mb-4">{activePost.subtitle}</p>
                  )}
                  {activePost.cover_image && (
                    <div className="my-4 rounded-2xl overflow-hidden border border-border/40 aspect-[16/9] max-h-[260px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePost.cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800 dark:text-slate-200">
                    {activePost.content || "No content written yet."}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activePost.is_published ?? true}
                      onChange={(e) =>
                        setActivePost({ ...activePost, is_published: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Publish to Live Site</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activePost.is_featured ?? false}
                      onChange={(e) =>
                        setActivePost({ ...activePost, is_featured: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Featured Article</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setActivePost(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{activePost.id ? "Update Article" : "Publish Article"}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter / Search & Source Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Source Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] w-full sm:w-fit overflow-x-auto scrollbar-none flex-nowrap">
          <button
            onClick={() => setFilterSource("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterSource === "all"
                ? "bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Articles ({posts.length})
          </button>
          <button
            onClick={() => setFilterSource("medium")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filterSource === "medium"
                ? "bg-white dark:bg-white/[0.1] text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Medium Synced ({posts.filter((p) => p.source === "medium").length})
          </button>
          <button
            onClick={() => setFilterSource("manual")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filterSource === "manual"
                ? "bg-white dark:bg-white/[0.1] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Manual Posts ({posts.filter((p) => p.source !== "medium").length})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles by title, slug, or tag..."
          className="w-full sm:w-72 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0c1222]/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-xs"
        />
      </div>

      {/* Posts Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Loading Articles...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/60 dark:bg-[#0c1222]/60 p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">No articles found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search query."
              : "Click 'Sync from Medium' to pool your stories, or 'New Article' to compose manually."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => {
            const words = post.content ? post.content.trim().split(/\s+/).length : 0;
            const readMins = post.read_time_minutes || Math.max(1, Math.ceil(words / 200));

            return (
              <motion.div
                key={post.id}
                layout
                className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl p-4 sm:p-6 hover:border-blue-500/40 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Article Info with optional Thumbnail */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {post.cover_image ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] shrink-0 bg-muted/40 hidden sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 hidden sm:flex">
                      <BookOpen className="h-7 w-7 opacity-60" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate font-heading">
                        {post.title}
                      </h3>

                      {/* Source badge */}
                      {post.source === "medium" ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          Medium
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                          Manual
                        </span>
                      )}

                      {/* Publish Status */}
                      {post.is_published === false && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          Draft
                        </span>
                      )}

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-500 border border-slate-200 dark:border-white/[0.05]">
                        /{post.slug}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.subtitle || post.content.replace(/<[^>]+>/g, " ").slice(0, 160) + "…"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : post.created_at
                          ? new Date(post.created_at).toLocaleDateString()
                          : "Draft"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {readMins} min read
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <span className="text-slate-400">
                          Tags: {post.tags.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* View on Public Portfolio */}
                  <a
                    href={`${portfolioUrl}/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                    title="View single article on public portfolio"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  {/* Edit Article */}
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Edit article"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {/* Delete Article */}
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post.id}
                    className="p-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete article"
                  >
                    {deletingId === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
