"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Briefcase, GraduationCap, Code2, Award,
  Plus, Trash2, Save, ExternalLink, ChevronRight,
  CheckCircle2, AlertCircle, FileText, Loader2, Download,
  Layers, FolderGit2, Quote, Shield, RefreshCw, Sparkles,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { useCrudLoading } from "@/components/crud-loading-context";
import { SkeletonEditorDossier } from "@/components/ui/premium-skeleton";
import { downloadResume } from "@/lib/download";

type Tab =
  | "profile"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "certifications"
  | "references";

interface ResumeData {
  profile: {
    name: string;
    role: string;
    avatar: string;
    bio?: string;
    location?: string;
    phone?: string;
  };
  contact: {
    email: string;
    linkedin: string;
    github: string;
    website?: string;
  };
  experience: Array<{
    title: string;
    company: string;
    period: string;
    location: string;
    achievements: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    period: string;
  }>;
  skills: string[];
  skills_categorized?: Record<string, string[]>;
  projects?: Array<{
    name: string;
    role: string;
    period: string;
    url: string;
    tech: string;
    description: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    type?: string;
  }>;
  badges?: Array<{
    name: string;
    issuer: string;
    year: string;
    image?: string;
    credential_url?: string;
    description?: string;
  }>;
  references?: Array<{
    id?: number;
    name: string;
    title: string;
    company: string;
    relationship: string;
    quote: string;
    email: string;
    phone: string;
    linkedin: string;
  }>;
}

const defaultEmptyResume: ResumeData = {
  profile: {
    name: "Khalfan Athman",
    role: "Network Engineer & Full-Stack Developer",
    avatar: "/profile.jpg",
    bio: "",
    location: "Nairobi, Kenya",
    phone: "+254 719 401 851",
  },
  contact: {
    email: "khalfan@khalfanathman.dev",
    linkedin: "https://linkedin.com/in/khalfaniathman",
    github: "https://github.com/AbuArwa001",
    website: "https://khalfanathman.dev",
  },
  experience: [],
  education: [],
  skills: [],
  skills_categorized: {},
  projects: [],
  certifications: [],
  badges: [],
  references: [],
};

export default function CVEditorPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const { withLoading } = useCrudLoading();

  const [activeTab, setActiveTab] = useState<Tab>("experience");
  const [data, setData] = useState<ResumeData>(defaultEmptyResume);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const API_URL = getApiUrl();
  const RESUME_ENDPOINT = `${API_URL}/api/v1/resume/primary/`;

  const getPortfolioUrl = () => {
    let url = process.env.NEXT_PUBLIC_PORTFOLIO_URL;
    if (!url || !url.trim()) {
      return process.env.NODE_ENV === "production"
        ? "https://www.khalfanathman.dev"
        : "http://localhost:3000";
    }
    return url.replace(/\/+$/, "");
  };

  const portfolioUrl = getPortfolioUrl();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Load resume data directly from the PostgreSQL backend database
  const loadResumeFromDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch(RESUME_ENDPOINT, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Failed to load from database (Status ${res.status})`);
      }
      const remoteData = await res.json();
      setData({
        profile: remoteData.profile || defaultEmptyResume.profile,
        contact: remoteData.contact || defaultEmptyResume.contact,
        experience: Array.isArray(remoteData.experience) ? remoteData.experience : [],
        education: Array.isArray(remoteData.education) ? remoteData.education : [],
        skills: Array.isArray(remoteData.skills) ? remoteData.skills : [],
        skills_categorized: remoteData.skills_categorized || {},
        projects: Array.isArray(remoteData.projects) ? remoteData.projects : [],
        certifications: Array.isArray(remoteData.certifications) ? remoteData.certifications : [],
        badges: Array.isArray(remoteData.badges) ? remoteData.badges : [],
        references: Array.isArray(remoteData.references) ? remoteData.references : [],
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.warn("Could not load from DB, attempting fallback:", err);
      // Fallback to local resume.json if network is unreachable
      try {
        const localRes = await fetch("/api/resume");
        if (localRes.ok) {
          const localData = await localRes.json();
          setData(localData);
        }
      } catch (e) {
        showToast("error", "Unable to load resume records from database.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumeFromDatabase();
  }, [token]);

  // Persist directly to Neon PostgreSQL database
  const handleSave = async () => {
    if (!token) {
      showToast("error", "Authentication required to update database.");
      return;
    }

    setSaving(true);
    await withLoading(
      async () => {
        try {
          const res = await fetch(RESUME_ENDPOINT, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              profile: data.profile,
              contact: data.contact,
              experience: data.experience,
              education: data.education,
              skills: data.skills,
              skills_categorized: data.skills_categorized,
              projects: data.projects,
              certifications: data.certifications,
              badges: data.badges,
              references: data.references,
            }),
          });

          if (res.status === 401) {
            showToast("error", "Session expired. Please sign out and sign in again.");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
            }
            return;
          }

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`Database save error (${res.status}): ${errText}`);
          }

          const saved = await res.json();
          setData((prev) => ({ ...prev, ...saved }));
          setHasUnsavedChanges(false);
          showToast("success", "CV & Résumé successfully saved to PostgreSQL database!");
        } catch (error: any) {
          console.error("Database save failed:", error);
          showToast("error", error?.message || "Failed to save to database.");
        } finally {
          setSaving(false);
        }
      },
      "Saving Curriculum Vitae Dossier",
      "Persisting all career chronology and attributes to Neon PostgreSQL"
    );
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khalfan_athman_cv_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateData = (updater: (prev: ResumeData) => ResumeData) => {
    setData((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  if (loading) {
    return <SkeletonEditorDossier />;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              PostgreSQL Database Sync
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • ATS &amp; Dossier Master Record
            </span>
            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                Unsaved Edits
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            CV &amp; Résumé Editor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Curate work experiences, flagship projects, degree records, and competencies saved directly to PostgreSQL.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportJSON}
            title="Export JSON backup of database record"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>

          <button
            onClick={() => downloadResume()}
            title="Download compiled Résumé PDF"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-red-400" />
            PDF
          </button>

          <a
            href={`${portfolioUrl}/cv`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Live CV
          </a>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save to Database
          </button>
        </div>
      </div>

      {/* ── Toast Notification ── */}
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

      {/* ── Tabs Navigation ── */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 overflow-x-auto">
        {[
          { id: "profile", label: "Profile & Bio", icon: User },
          { id: "experience", label: `Experience (${data.experience.length})`, icon: Briefcase },
          { id: "projects", label: `Projects (${(data.projects || []).length})`, icon: FolderGit2 },
          { id: "education", label: `Education (${data.education.length})`, icon: GraduationCap },
          { id: "skills", label: `Skills (${data.skills.length})`, icon: Code2 },
          { id: "certifications", label: `Certs (${data.certifications.length})`, icon: Award },
          { id: "references", label: `References (${(data.references || []).length})`, icon: Quote },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Main Editor Container ── */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        {/* 1. Profile & Bio Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={data.profile.name}
                  onChange={(e) => updateData((p) => ({ ...p, profile: { ...p.profile, name: e.target.value } }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Headline / Role Title</label>
                <input
                  type="text"
                  value={data.profile.role}
                  onChange={(e) => updateData((p) => ({ ...p, profile: { ...p.profile, role: e.target.value } }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Location</label>
                <input
                  type="text"
                  value={data.profile.location || ""}
                  onChange={(e) => updateData((p) => ({ ...p, profile: { ...p.profile, location: e.target.value } }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Phone</label>
                <input
                  type="text"
                  value={data.profile.phone || ""}
                  onChange={(e) => updateData((p) => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Executive Profile &amp; Engineering Philosophy (Bio)
              </label>
              <textarea
                rows={5}
                value={data.profile.bio || ""}
                onChange={(e) => updateData((p) => ({ ...p, profile: { ...p.profile, bio: e.target.value } }))}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-y font-sans"
              />
            </div>

            {/* Contact links */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-4">
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">Contact &amp; Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <input
                    type="email"
                    value={data.contact.email}
                    onChange={(e) => updateData((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">LinkedIn URL</label>
                  <input
                    type="url"
                    value={data.contact.linkedin}
                    onChange={(e) => updateData((p) => ({ ...p, contact: { ...p.contact, linkedin: e.target.value } }))}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">GitHub URL</label>
                  <input
                    type="url"
                    value={data.contact.github}
                    onChange={(e) => updateData((p) => ({ ...p, contact: { ...p.contact, github: e.target.value } }))}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Portfolio Website</label>
                  <input
                    type="url"
                    value={data.contact.website || ""}
                    onChange={(e) => updateData((p) => ({ ...p, contact: { ...p.contact, website: e.target.value } }))}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Work Experience Tab */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            {data.experience.map((job, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    Position #{i + 1}
                  </span>
                  <button
                    onClick={() =>
                      updateData((p) => {
                        const exp = [...p.experience];
                        exp.splice(i, 1);
                        return { ...p, experience: exp };
                      })
                    }
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Job Title</label>
                    <input
                      type="text"
                      value={job.title}
                      onChange={(e) =>
                        updateData((p) => {
                          const exp = [...p.experience];
                          exp[i] = { ...exp[i], title: e.target.value };
                          return { ...p, experience: exp };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Company</label>
                    <input
                      type="text"
                      value={job.company}
                      onChange={(e) =>
                        updateData((p) => {
                          const exp = [...p.experience];
                          exp[i] = { ...exp[i], company: e.target.value };
                          return { ...p, experience: exp };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Period</label>
                    <input
                      type="text"
                      value={job.period}
                      onChange={(e) =>
                        updateData((p) => {
                          const exp = [...p.experience];
                          exp[i] = { ...exp[i], period: e.target.value };
                          return { ...p, experience: exp };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Location</label>
                    <input
                      type="text"
                      value={job.location}
                      onChange={(e) =>
                        updateData((p) => {
                          const exp = [...p.experience];
                          exp[i] = { ...exp[i], location: e.target.value };
                          return { ...p, experience: exp };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Achievements &amp; Responsibilities (one bullet per line)
                  </label>
                  <textarea
                    rows={5}
                    value={job.achievements.join("\n")}
                    onChange={(e) =>
                      updateData((p) => {
                        const exp = [...p.experience];
                        exp[i] = { ...exp[i], achievements: e.target.value.split("\n") };
                        return { ...p, experience: exp };
                      })
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 resize-y font-sans leading-relaxed"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                updateData((p) => ({
                  ...p,
                  experience: [
                    ...p.experience,
                    { title: "", company: "", period: "", location: "", achievements: [""] },
                  ],
                }))
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Experience Entry
            </button>
          </div>
        )}

        {/* 3. Flagship Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Curate flagship production deployments featured directly on your official CV dossier.
            </p>
            {(data.projects || []).map((proj, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    Project #{i + 1}
                  </span>
                  <button
                    onClick={() =>
                      updateData((p) => {
                        const projs = [...(p.projects || [])];
                        projs.splice(i, 1);
                        return { ...p, projects: projs };
                      })
                    }
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Project Name</label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) =>
                        updateData((p) => {
                          const projs = [...(p.projects || [])];
                          projs[i] = { ...projs[i], name: e.target.value };
                          return { ...p, projects: projs };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Role Title</label>
                    <input
                      type="text"
                      value={proj.role}
                      onChange={(e) =>
                        updateData((p) => {
                          const projs = [...(p.projects || [])];
                          projs[i] = { ...projs[i], role: e.target.value };
                          return { ...p, projects: projs };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Live URL</label>
                    <input
                      type="url"
                      value={proj.url}
                      onChange={(e) =>
                        updateData((p) => {
                          const projs = [...(p.projects || [])];
                          projs[i] = { ...projs[i], url: e.target.value };
                          return { ...p, projects: projs };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Tech Stack</label>
                    <input
                      type="text"
                      value={proj.tech}
                      onChange={(e) =>
                        updateData((p) => {
                          const projs = [...(p.projects || [])];
                          projs[i] = { ...projs[i], tech: e.target.value };
                          return { ...p, projects: projs };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea
                    rows={3}
                    value={proj.description}
                    onChange={(e) =>
                      updateData((p) => {
                        const projs = [...(p.projects || [])];
                        projs[i] = { ...projs[i], description: e.target.value };
                        return { ...p, projects: projs };
                      })
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 resize-y font-sans"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                updateData((p) => ({
                  ...p,
                  projects: [
                    ...(p.projects || []),
                    { name: "", role: "", period: "", url: "", tech: "", description: "" },
                  ],
                }))
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Project Entry
            </button>
          </div>
        )}

        {/* 4. Education Tab */}
        {activeTab === "education" && (
          <div className="space-y-6">
            {data.education.map((edu, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    Education #{i + 1}
                  </span>
                  <button
                    onClick={() =>
                      updateData((p) => {
                        const ed = [...p.education];
                        ed.splice(i, 1);
                        return { ...p, education: ed };
                      })
                    }
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">School / Institution</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) =>
                        updateData((p) => {
                          const ed = [...p.education];
                          ed[i] = { ...ed[i], school: e.target.value };
                          return { ...p, education: ed };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Degree / Award</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        updateData((p) => {
                          const ed = [...p.education];
                          ed[i] = { ...ed[i], degree: e.target.value };
                          return { ...p, education: ed };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Year / Period</label>
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) =>
                        updateData((p) => {
                          const ed = [...p.education];
                          ed[i] = { ...ed[i], period: e.target.value };
                          return { ...p, education: ed };
                        })
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                updateData((p) => ({
                  ...p,
                  education: [...p.education, { school: "", degree: "", period: "" }],
                }))
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Education Entry
            </button>
          </div>
        )}

        {/* 5. Core Skills & Categories Tab */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter each ATS skill on its own line. These are parsed directly into the search-optimized skills index.
                </p>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {data.skills.length} skills listed
                </span>
              </div>
              <textarea
                rows={7}
                value={data.skills.join("\n")}
                onChange={(e) =>
                  updateData((p) => ({
                    ...p,
                    skills: e.target.value.split("\n").filter(Boolean),
                  }))
                }
                className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-blue-500 resize-y w-full leading-relaxed"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {data.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Categorized Skills Matrices */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                Categorized Systems Matrices (JSON Key-Value)
              </h4>
              <div className="space-y-3">
                {Object.entries(data.skills_categorized || {}).map(([cat, skillsList], idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{cat}</span>
                    <input
                      type="text"
                      value={skillsList.join(", ")}
                      onChange={(e) => {
                        const newSkills = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        updateData((p) => ({
                          ...p,
                          skills_categorized: {
                            ...(p.skills_categorized || {}),
                            [cat]: newSkills,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Certifications & Badges Tab */}
        {activeTab === "certifications" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">
                Official Certifications ({data.certifications.length})
              </h4>
              <div className="space-y-3">
                {data.certifications.map((c, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      <input
                        type="text"
                        placeholder="Certification Title"
                        value={c.name}
                        onChange={(e) =>
                          updateData((p) => {
                            const certs = [...p.certifications];
                            certs[i] = { ...certs[i], name: e.target.value };
                            return { ...p, certifications: certs };
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Issuer (e.g. AWS, Cisco)"
                        value={c.issuer}
                        onChange={(e) =>
                          updateData((p) => {
                            const certs = [...p.certifications];
                            certs[i] = { ...certs[i], issuer: e.target.value };
                            return { ...p, certifications: certs };
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Year"
                        value={c.year}
                        onChange={(e) =>
                          updateData((p) => {
                            const certs = [...p.certifications];
                            certs[i] = { ...certs[i], year: e.target.value };
                            return { ...p, certifications: certs };
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() =>
                        updateData((p) => {
                          const certs = [...p.certifications];
                          certs.splice(i, 1);
                          return { ...p, certifications: certs };
                        })
                      }
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  updateData((p) => ({
                    ...p,
                    certifications: [
                      ...p.certifications,
                      { name: "", issuer: "", year: new Date().getFullYear().toString() },
                    ],
                  }))
                }
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Certification Entry
              </button>
            </div>
          </div>
        )}

        {/* 7. Endorsements & References Tab */}
        {activeTab === "references" && (
          <div className="space-y-6">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Curate executive quotes and testimonials embedded in your printable CV dossier.
            </p>
            {(data.references || []).map((ref, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    Reference #{i + 1}: {ref.name || "New Referee"}
                  </span>
                  <button
                    onClick={() =>
                      updateData((p) => {
                        const r = [...(p.references || [])];
                        r.splice(i, 1);
                        return { ...p, references: r };
                      })
                    }
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Referee Name"
                    value={ref.name}
                    onChange={(e) =>
                      updateData((p) => {
                        const r = [...(p.references || [])];
                        r[i] = { ...r[i], name: e.target.value };
                        return { ...p, references: r };
                      })
                    }
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Title / Role"
                    value={ref.title}
                    onChange={(e) =>
                      updateData((p) => {
                        const r = [...(p.references || [])];
                        r[i] = { ...r[i], title: e.target.value };
                        return { ...p, references: r };
                      })
                    }
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Company / Organization"
                    value={ref.company}
                    onChange={(e) =>
                      updateData((p) => {
                        const r = [...(p.references || [])];
                        r[i] = { ...r[i], company: e.target.value };
                        return { ...p, references: r };
                      })
                    }
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Testimonial Quote"
                  value={ref.quote}
                  onChange={(e) =>
                    updateData((p) => {
                      const r = [...(p.references || [])];
                      r[i] = { ...r[i], quote: e.target.value };
                      return { ...p, references: r };
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>
            ))}

            <button
              onClick={() =>
                updateData((p) => ({
                  ...p,
                  references: [
                    ...(p.references || []),
                    { name: "", title: "", company: "", relationship: "", quote: "", email: "", phone: "", linkedin: "" },
                  ],
                }))
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Referee Testimonial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
