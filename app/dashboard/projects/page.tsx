"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Loader2, CheckCircle2, AlertCircle,
  FolderKanban, ExternalLink, ImageIcon, X, Upload, Globe,
  Edit2, Check, Sparkles, Layers, Tag,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { useCrudLoading } from "@/components/crud-loading-context";
import { SkeletonCard } from "@/components/ui/premium-skeleton";

interface Project {
  id?: number;
  name: string;
  description: string;
  link: string;
  status: string;
  completion: string;
  technologies: string;
  type: string;
  image?: string | null;
  image_url?: string | null;
}

const STATUS_OPTIONS = ["Active", "Completed", "In Progress", "Archived", "On Hold"];
const TYPE_OPTIONS = ["Web App", "Mobile App", "API / Backend", "CLI Tool", "Open Source", "Research", "Other"];

const empty = (): Project => ({
  name: "",
  description: "",
  link: "",
  status: "Active",
  completion: "100%",
  technologies: "",
  type: "Web App",
  image: null,
});

function Field({
  label, value, onChange, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Technology & Company Slug Dictionary for SimpleIcons Logo Resolution
const TECH_LOGO_MAP: Record<string, string> = {
  // Web Frameworks & UI
  "next.js": "nextdotjs",
  "nextjs": "nextdotjs",
  "next": "nextdotjs",
  "react": "react",
  "react.js": "react",
  "react native": "react",
  "vue": "vuedotjs",
  "vue.js": "vuedotjs",
  "vuejs": "vuedotjs",
  "angular": "angular",
  "svelte": "svelte",
  "sveltekit": "svelte",
  "nuxt": "nuxtdotjs",
  "nuxtjs": "nuxtdotjs",
  "astro": "astro",
  "gatsby": "gatsby",
  "remix": "remix",
  "vite": "vite",
  "webpack": "webpack",
  "tailwind": "tailwindcss",
  "tailwind css": "tailwindcss",
  "tailwindcss": "tailwindcss",
  "bootstrap": "bootstrap",
  "sass": "sass",
  "scss": "sass",
  "css": "css3",
  "css3": "css3",
  "html": "html5",
  "html5": "html5",
  "shadcn": "shadcnui",
  "shadcn/ui": "shadcnui",
  "framer": "framer",
  "framer motion": "framer",

  // Languages & Runtimes
  "typescript": "typescript",
  "ts": "typescript",
  "javascript": "javascript",
  "js": "javascript",
  "python": "python",
  "node": "nodedotjs",
  "node.js": "nodedotjs",
  "nodejs": "nodedotjs",
  "bun": "bun",
  "deno": "deno",
  "go": "go",
  "golang": "go",
  "rust": "rust",
  "c++": "cplusplus",
  "cpp": "cplusplus",
  "c#": "csharp",
  "csharp": "csharp",
  "c": "c",
  "java": "openjdk",
  "kotlin": "kotlin",
  "swift": "swift",
  "dart": "dart",
  "flutter": "flutter",
  "php": "php",
  "ruby": "ruby",
  "rails": "rubyonrails",
  "ruby on rails": "rubyonrails",
  "scala": "scala",
  "elixir": "elixir",
  "bash": "gnubash",
  "shell": "gnubash",

  // Backend & APIs
  "django": "django",
  "django rest framework": "django",
  "drf": "django",
  "fastapi": "fastapi",
  "flask": "flask",
  "express": "express",
  "express.js": "express",
  "expressjs": "express",
  "nestjs": "nestjs",
  "spring": "springboot",
  "spring boot": "springboot",
  "laravel": "laravel",
  "graphql": "graphql",
  "apollo": "apollographql",
  "trpc": "trpc",
  "grpc": "grpc",
  "socket.io": "socketdotio",
  "rest api": "postman",

  // Databases & ORMs
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "mysql": "mysql",
  "sqlite": "sqlite",
  "mongodb": "mongodb",
  "mongo": "mongodb",
  "redis": "redis",
  "supabase": "supabase",
  "firebase": "firebase",
  "prisma": "prisma",
  "drizzle": "drizzle",
  "mariadb": "mariadb",
  "neo4j": "neo4j",
  "cassandra": "apachecassandra",
  "elasticsearch": "elasticsearch",
  "dynamodb": "amazondynamodb",

  // Cloud & DevOps
  "docker": "docker",
  "kubernetes": "kubernetes",
  "k8s": "kubernetes",
  "aws": "amazonwebservices",
  "amazon web services": "amazonwebservices",
  "gcp": "googlecloud",
  "google cloud": "googlecloud",
  "azure": "microsoftazure",
  "microsoft azure": "microsoftazure",
  "vercel": "vercel",
  "netlify": "netlify",
  "heroku": "heroku",
  "render": "render",
  "digitalocean": "digitalocean",
  "cloudflare": "cloudflare",
  "nginx": "nginx",
  "apache": "apache",
  "terraform": "terraform",
  "ansible": "ansible",
  "linux": "linux",
  "ubuntu": "ubuntu",
  "debian": "debian",
  "github": "github",
  "git": "git",
  "gitlab": "gitlab",
  "github actions": "githubactions",
  "jenkins": "jenkins",

  // AI & Analytics
  "openai": "openai",
  "anthropic": "anthropic",
  "gemini": "googlegemini",
  "google gemini": "googlegemini",
  "pytorch": "pytorch",
  "tensorflow": "tensorflow",
  "huggingface": "huggingface",
  "hugging face": "huggingface",
  "pandas": "pandas",
  "numpy": "numpy",
  "scikit-learn": "scikitlearn",
  "opencv": "opencv",

  // Tools & Design
  "figma": "figma",
  "postman": "postman",
  "jira": "jira",
  "stripe": "stripe",
  "celery": "celery",
  "rabbitmq": "rabbitmq",
  "kafka": "apachekafka",
};

// Pure black monochrome icons that should invert on dark theme
const DARK_INVERT_SLUGS = new Set([
  "nextdotjs", "github", "vercel", "express", "socketdotio", "prisma", "shadcnui", "apple", "x"
]);

function getTechSlug(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  // Strip version suffixes like "Next.js 15" -> "next.js", "Python 3.12" -> "python"
  const withoutVersion = trimmed.replace(/\s*v?\d+(\.\d+)*\s*$/i, "").trim();

  if (TECH_LOGO_MAP[withoutVersion]) return TECH_LOGO_MAP[withoutVersion];
  if (TECH_LOGO_MAP[trimmed]) return TECH_LOGO_MAP[trimmed];

  // Try direct alphanumeric slug
  const cleanSlug = withoutVersion.replace(/[^a-z0-9]/g, "");
  return cleanSlug;
}

function TechLogo({ tech }: { tech: string }) {
  const slug = getTechSlug(tech);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [tech, slug]);

  const isInvert = DARK_INVERT_SLUGS.has(slug);

  if (!slug || hasError) {
    const initial = tech.trim().charAt(0).toUpperCase() || "#";
    return (
      <span className="w-3.5 h-3.5 rounded-[4px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[9px] flex items-center justify-center font-mono flex-shrink-0">
        {initial}
      </span>
    );
  }

  return (
    <img
      key={slug}
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={tech}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`w-3.5 h-3.5 object-contain flex-shrink-0 transition-transform ${
        isInvert ? "dark:brightness-0 dark:invert" : ""
      }`}
    />
  );
}

const POPULAR_SUGGESTIONS = [
  "Next.js", "TypeScript", "React", "Python", "Django",
  "PostgreSQL", "Tailwind CSS", "Docker", "Redis", "GraphQL",
  "AWS", "FastAPI", "Node.js", "MongoDB", "Supabase", "Git"
];

interface TechStackPillsEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

function TechStackPillsEditor({ value, onChange }: TechStackPillsEditorProps) {
  const techList = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTech, setNewTech] = useState("");
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const handleRemove = (index: number) => {
    const next = techList.filter((_, i) => i !== index);
    onChange(next.join(", "));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(techList[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (trimmed) {
      const next = [...techList];
      next[index] = trimmed;
      onChange(next.join(", "));
    } else {
      handleRemove(index);
    }
    setEditingIndex(null);
  };

  const handleAdd = () => {
    const trimmed = newTech.trim();
    if (trimmed) {
      const additions = trimmed
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const next = [...techList, ...additions];
      onChange(next.join(", "));
    }
    setNewTech("");
    setIsAdding(false);
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (!techList.some((t) => t.toLowerCase() === suggestion.toLowerCase())) {
      const next = [...techList, suggestion];
      onChange(next.join(", "));
    }
  };

  const availableSuggestions = POPULAR_SUGGESTIONS.filter(
    (s) => !techList.some((t) => t.toLowerCase() === s.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-blue-500" />
          Interactive Tech Stack & Brand Logos
        </span>
        <span className="text-[10px] text-slate-400">
          Click pill to edit • logos auto-resolve from company/tech
        </span>
      </div>

      {/* Pills Container */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-slate-100/70 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-white/[0.08] min-h-[42px]">
        {techList.map((tech, ti) => {
          const isEditing = editingIndex === ti;

          if (isEditing) {
            return (
              <div
                key={ti}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500 text-blue-700 dark:text-blue-300 text-xs shadow-sm"
              >
                <TechLogo tech={editingValue || tech} />
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveEdit(ti);
                    } else if (e.key === "Escape") {
                      setEditingIndex(null);
                    }
                  }}
                  className="bg-transparent border-none text-xs font-mono font-medium focus:outline-none w-28 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(ti)}
                  className="p-0.5 rounded hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 cursor-pointer"
                  title="Save"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-500 cursor-pointer"
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={ti}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 text-slate-800 dark:text-slate-200 text-[11px] font-mono font-medium transition-all shadow-sm"
            >
              <TechLogo tech={tech} />
              <span
                onClick={() => handleStartEdit(ti)}
                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
                title="Click to rename"
              >
                {tech}
              </span>
              <button
                type="button"
                onClick={() => handleStartEdit(ti)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-500 transition-opacity cursor-pointer"
                title="Edit name"
              >
                <Edit2 className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(ti)}
                className="opacity-60 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 text-slate-400 transition-all cursor-pointer"
                title="Remove tech"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Add Tech Input / Button */}
        {isAdding ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs">
            {newTech.trim() && <TechLogo tech={newTech} />}
            <input
              ref={addInputRef}
              type="text"
              value={newTech}
              placeholder="e.g. Docker, Redis, AWS..."
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTech("");
                }
              }}
              className="bg-transparent border-none text-xs font-mono font-medium focus:outline-none w-36 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTech.trim()}
              className="p-0.5 rounded hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 disabled:opacity-30 cursor-pointer"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTech("");
              }}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-400 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-semibold transition-all cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Tech</span>
          </button>
        )}
      </div>

      {/* Quick Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Suggestions:
          </span>
          {availableSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleAddSuggestion(sug)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200/50 dark:bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/30 border border-slate-300/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-all cursor-pointer"
            >
              <TechLogo tech={sug} />
              <span>+{sug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${getApiUrl()}/api/v1/projects/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [imageFiles, setImageFiles] = useState<Record<number, File | null>>({});
  const [clearedImages, setClearedImages] = useState<Set<number>>(new Set());
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => showToast("error", "Failed to load projects from DRF backend."))
      .finally(() => setLoading(false));
  }, [API]);

  const { withLoading } = useCrudLoading();

  const handleSave = async (proj: Project, idx: number) => {
    if (!token) return showToast("error", "Authentication session required.");
    setSaving(proj.id ?? "new");
    await withLoading(
      async () => {
        try {
          const method = proj.id ? "PATCH" : "POST";
          const url = proj.id ? `${API}${proj.id}/` : API;

          const imageFile = imageFiles[idx];
          const shouldClear = clearedImages.has(idx);

          const fd = new FormData();
          fd.append("name", proj.name);
          fd.append("description", proj.description);
          fd.append("link", proj.link);
          fd.append("status", proj.status);
          fd.append("completion", proj.completion);
          fd.append("technologies", proj.technologies);
          fd.append("type", proj.type);

          if (imageFile) {
            fd.append("image", imageFile);
          } else if (shouldClear) {
            fd.append("image", "");
          }

          const res = await fetch(url, {
            method,
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });

          if (res.status === 401) {
            showToast("error", "Your session has expired. You are being logged out.");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
            }
            return;
          }

          if (!res.ok) throw new Error(await res.text());
          const saved: Project = await res.json();
          setProjects((prev) => {
            const next = [...prev];
            next[idx] = saved;
            return next;
          });
          setImageFiles((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
          });
          setClearedImages((prev) => {
            const next = new Set(prev);
            next.delete(idx);
            return next;
          });
          showToast("success", proj.id ? "Project updated successfully!" : "New project created!");
        } catch (e: any) {
          showToast("error", e.message || "Failed to save project.");
        } finally {
          setSaving(null);
        }
      },
      proj.id ? "Updating Production Project" : "Creating New Project",
      "Persisting project attributes to PostgreSQL database"
    );
  };

  const handleDelete = async (proj: Project, idx: number) => {
    if (!proj.id) {
      setProjects((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!token) return showToast("error", "Authentication required.");
    setDeleting(proj.id);
    await withLoading(
      async () => {
        try {
          const res = await fetch(`${API}${proj.id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            showToast("error", "Your session has expired. You are being logged out.");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
            }
            return;
          }
          if (!res.ok) throw new Error();
          setProjects((prev) => prev.filter((_, i) => i !== idx));
          showToast("success", "Project deleted.");
        } catch {
          showToast("error", "Failed to delete project.");
        } finally {
          setDeleting(null);
        }
      },
      "Deleting Project Record",
      "Purging entry from database cluster"
    );
  };

  const updateField = (idx: number, field: keyof Project, value: string) => {
    setProjects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleImageChange = (idx: number, file: File | null) => {
    setImageFiles((prev) => ({ ...prev, [idx]: file }));
    if (file) {
      setClearedImages((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
  };

  const handleClearImage = (idx: number) => {
    handleImageChange(idx, null);
    setClearedImages((prev) => new Set(prev).add(idx));
    setProjects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], image_url: null };
      return next;
    });
    if (fileInputRefs.current[idx]) fileInputRefs.current[idx]!.value = "";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading Projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              Showcase Registry
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • {projects.length} Total Projects
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Portfolio Projects
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Manage live production deployments, architectural case studies, and stack tags.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`${portfolioUrl}/projects`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>Public View</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <button
            onClick={() => setProjects((prev) => [empty(), ...prev])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
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

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400 gap-3 rounded-3xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-white/50 dark:bg-[#0c1222]/50">
          <FolderKanban className="h-10 w-10 text-blue-500/40" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No projects found.</p>
          <button
            onClick={() => setProjects([empty()])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 text-xs font-medium hover:bg-blue-600/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Create your first project
          </button>
        </div>
      ) : null}

      {/* Project Cards */}
      <div className="space-y-6">
        {projects.map((proj, idx) => {
          const stagedImage = imageFiles[idx];
          const previewUrl = stagedImage
            ? URL.createObjectURL(stagedImage)
            : proj.image_url || null;

          return (
            <motion.div
              key={proj.id ?? `new-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl p-6 sm:p-7 flex flex-col gap-5 shadow-sm transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                    Project #{idx + 1}
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    {proj.name || "Untitled Project"}
                  </span>
                  {!proj.id && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      Unsaved
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(proj, idx)}
                  disabled={deleting === proj.id}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  title="Delete Project"
                >
                  {deleting === proj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Image Uploader */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Snapshot Image
                </label>
                <div className="flex items-start gap-4">
                  <div className="relative w-28 h-18 rounded-xl border border-border/60 bg-muted/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {previewUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleClearImage(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      ref={(el) => { fileInputRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`project-image-${idx}`}
                      onChange={(e) => handleImageChange(idx, e.target.files?.[0] ?? null)}
                    />
                    <label
                      htmlFor={`project-image-${idx}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border/60 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary cursor-pointer transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {stagedImage ? stagedImage.name : "Select Image..."}
                    </label>
                    <p className="text-[11px] text-muted-foreground/60">PNG, JPG, WebP (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Project Title"
                  value={proj.name}
                  placeholder="e.g. SUPKEM Portal"
                  onChange={(v) => updateField(idx, "name", v)}
                />
                <Field
                  label="Live / Demo URL"
                  value={proj.link}
                  type="url"
                  placeholder="https://..."
                  onChange={(v) => updateField(idx, "link", v)}
                />
                <SelectField
                  label="Status"
                  value={proj.status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => updateField(idx, "status", v)}
                />
                <SelectField
                  label="Category / Type"
                  value={proj.type}
                  options={TYPE_OPTIONS}
                  onChange={(v) => updateField(idx, "type", v)}
                />
                <Field
                  label="Completion"
                  value={proj.completion}
                  placeholder="e.g. 100% or In Production"
                  onChange={(v) => updateField(idx, "completion", v)}
                />
                <Field
                  label="Tech Stack (comma-separated)"
                  value={proj.technologies}
                  placeholder="Django, Next.js, PostgreSQL, Tailwind"
                  onChange={(v) => updateField(idx, "technologies", v)}
                />
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Description & Case Study Highlights
                  </label>
                  <textarea
                    rows={3}
                    value={proj.description}
                    onChange={(e) => updateField(idx, "description", e.target.value)}
                    placeholder="Describe the architectural challenge, solution, and business impact..."
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y"
                  />
                </div>
              </div>

              {/* Interactive Editable Tech Pills with Auto Company/Tech Logos */}
              <TechStackPillsEditor
                value={proj.technologies}
                onChange={(v) => updateField(idx, "technologies", v)}
              />

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSave(proj, idx)}
                  disabled={saving === (proj.id ?? "new")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving === (proj.id ?? "new") ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-3.5 w-3.5" /> {proj.id ? "Update Project" : "Save Project"}</>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
