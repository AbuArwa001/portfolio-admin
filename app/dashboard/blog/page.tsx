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
  const API = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1/blog/`;
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
          <h2 className="text-xl font-bold text-foreground font-heading flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Technical Blog Posts
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Publish engineering writeups, network architecture guides, and tutorials ({posts.length} published)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`${portfolioUrl}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-3.5 w-3.5" /> Public View <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-6px] shadow-primary/60 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Article
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
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
                : "bg-red-400/10 border-red-400/30 text-red-400"
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
            className="rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
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
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={activePost.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Scaling Django REST APIs with PostgreSQL"
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={activePost.slug}
                    onChange={(e) => setActivePost({ ...activePost, slug: slugify(e.target.value) })}
                    placeholder="scaling-django-apis"
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Tab selector */}
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    editorTab === "write"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Edit3 className="inline-block h-3.5 w-3.5 mr-1.5" /> Markdown Content
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    editorTab === "preview"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
                    className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-foreground font-mono text-sm leading-relaxed focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Markdown supported: ## Headings, - Lists, `code`, ```codeblocks```, **bold**, *italics*.
                  </span>
                </div>
              ) : (
                <div className="min-h-[300px] max-h-[500px] overflow-y-auto px-6 py-4 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm prose dark:prose-invert max-w-none">
                  <h1 className="text-2xl font-bold mb-3">{activePost.title || "Untitled Article"}</h1>
                  <div className="text-xs text-muted-foreground font-mono mb-4 pb-2 border-b border-border/40">
                    Slug: /{activePost.slug || "slug"}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
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
                  className="px-4 py-2 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
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
          className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 bg-card text-foreground text-xs focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Posts Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading Articles...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-foreground">No articles found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
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
                className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground hover:text-primary transition-colors truncate">
                      {post.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      /{post.slug}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.content.slice(0, 200)}...
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70 pt-1">
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
                    className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    title="View public article"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Edit article"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post.id}
                    className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-50"
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
