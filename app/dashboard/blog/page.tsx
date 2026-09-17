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
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  content: string;
  created_at?: string;
}

const emptyPost = (): BlogPost => ({
  title: "",
  slug: "",
  content: "",
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
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      const res = await fetch(API);
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

  const handleCreateNew = () => {
    setActivePost(emptyPost());
    setIsEditing(true);
    setEditorTab("write");
  };

  const handleEdit = (post: BlogPost) => {
    setActivePost({ ...post });
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

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({
          title: activePost.title,
          slug: activePost.slug,
          content: activePost.content,
        }),
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
      showToast("success", isNew ? "Article published successfully!" : "Article updated successfully!");
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

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              Technical Journal
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • {posts.length} Published Articles
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Technical Blog &amp; Insights
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Publish engineering writeups, network architecture guides, and cloud infrastructure tutorials.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`${portfolioUrl}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>Public View</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Article</span>
          </button>
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
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal / Panel */}
      <AnimatePresence>
        {isEditing && activePost && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-3xl border border-blue-500/30 dark:border-blue-500/20 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-primary" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {activePost.id ? "Edit Article" : "Compose New Article"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActivePost(null);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
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
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Tab selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-2">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    editorTab === "write"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Edit3 className="inline-block h-3.5 w-3.5 mr-1.5" /> Markdown Content
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
                  <Eye className="inline-block h-3.5 w-3.5 mr-1.5" /> Live Preview
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
                    placeholder="Write article content using Markdown format...&#10;&#10;## Key Architecture Tenets&#10;1. Stateless JWT Auth...&#10;2. Connection Pooling..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Markdown supported: ## Headings, - Lists, `code`, ```codeblocks```, **bold**, *italics*.
                  </span>
                </div>
              ) : (
                <div className="min-h-[300px] max-h-[500px] overflow-y-auto px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14]/50 text-slate-900 dark:text-white text-sm prose dark:prose-invert max-w-none">
                  <h1 className="text-2xl font-bold mb-3">{activePost.title || "Untitled Article"}</h1>
                  <div className="text-xs text-slate-500 font-mono mb-4 pb-2 border-b border-slate-200 dark:border-white/[0.08]">
                    Slug: /{activePost.slug || "slug"}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800 dark:text-slate-200">
                    {activePost.content || "No content written yet."}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {activePost.id ? "Update Article" : "Publish Article"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles by title or slug..."
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0c1222]/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-xs"
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
            {searchQuery ? "Try a different search query." : "Publish your first technical article using the button above."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => {
            const words = post.content ? post.content.trim().split(/\s+/).length : 0;
            const readMins = Math.max(1, Math.ceil(words / 200));

            return (
              <motion.div
                key={post.id}
                layout
                className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl p-6 hover:border-blue-500/40 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate font-heading">
                      {post.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.05]">
                      /{post.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {post.content.slice(0, 200)}...
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : "Draft"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {readMins} min read
                    </span>
                    <span>{words} words</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <a
                    href={`${portfolioUrl}/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                    title="View public article"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Edit article"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
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
