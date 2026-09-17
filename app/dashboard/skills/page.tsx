"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Code2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Layers,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface SkillCategory {
  id: number;
  name: string;
}

interface Skill {
  id?: number;
  name: string;
  level: number;
  category: number;
  category_name?: string;
}

export default function SkillsManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API_BASE = getApiUrl();
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(85);
  const [newSkillCategoryId, setNewSkillCategoryId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [savingSkillId, setSavingSkillId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, skillRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/auth/profile/skill-categories/`),
        fetch(`${API_BASE}/api/v1/auth/profile/skills/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (catRes.status === "fulfilled" && catRes.value.ok) {
        const catData = await catRes.value.json();
        if (Array.isArray(catData)) {
          setCategories(catData);
          if (catData.length > 0 && !newSkillCategoryId) {
            setNewSkillCategoryId(catData[0].id);
          }
        }
      }

      if (skillRes.status === "fulfilled" && skillRes.value.ok) {
        const skillData = await skillRes.value.json();
        if (Array.isArray(skillData)) {
          setSkills(skillData);
        }
      }
    } catch {
      showToast("error", "Failed to fetch skills data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (!token) return showToast("error", "Authentication required.");

    const catId = newSkillCategoryId || (categories[0]?.id ?? 1);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/profile/skills/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: newSkillName.trim(),
          level: newSkillLevel,
          category: catId,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const createdSkill: Skill = await res.json();
      setSkills([createdSkill, ...skills]);
      setNewSkillName("");
      setNewSkillLevel(85);
      showToast("success", `Skill "${createdSkill.name}" added and saved!`);
    } catch {
      showToast("error", "Failed to save new skill.");
    }
  };

  const handleUpdateLevel = async (skill: Skill, newLevel: number) => {
    if (!skill.id) return;
    setSkills((prev) =>
      prev.map((s) => (s.id === skill.id ? { ...s, level: newLevel } : s))
    );

    if (!token) return;
    setSavingSkillId(skill.id);
    try {
      await fetch(`${API_BASE}/api/v1/auth/profile/skills/${skill.id}/`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ level: newLevel }),
      });
    } catch {
      showToast("error", "Failed to update skill proficiency.");
    } finally {
      setSavingSkillId(null);
    }
  };

  const handleDelete = async (skill: Skill) => {
    if (!skill.id) return;
    if (!confirm(`Delete skill "${skill.name}"?`)) return;
    if (!token) return showToast("error", "Authentication required.");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/profile/skills/${skill.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok && res.status !== 204) throw new Error();
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      showToast("success", "Skill deleted.");
    } catch {
      showToast("error", "Failed to delete skill.");
    }
  };

  const getCategoryName = (catId: number) => {
    return categories.find((c) => c.id === catId)?.name || "General";
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategoryFilter === "All") return true;
    return getCategoryName(s.category) === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground font-heading flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" /> Skills & Technical Stack
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your core proficiencies, frameworks, and tools ({skills.length} skills across {categories.length} categories)
          </p>
        </div>
        <a
          href={`${portfolioUrl}/skills`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe className="h-3.5 w-3.5" /> Public View <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
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

      {/* Quick Add Bar */}
      <form onSubmit={handleAddSkill} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Add New Technical Skill
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Skill Name / Technology
            </label>
            <input
              type="text"
              required
              value={newSkillName}
              placeholder="e.g. Next.js 15, PostgreSQL, Kubernetes"
              onChange={(e) => setNewSkillName(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="sm:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </label>
            <select
              value={newSkillCategoryId}
              onChange={(e) => setNewSkillCategoryId(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex justify-between">
              <span>Proficiency: {newSkillLevel}%</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md cursor-pointer flex-shrink-0"
              >
                <Plus className="inline-block h-3.5 w-3.5 mr-1" /> Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter("All")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategoryFilter === "All"
              ? "bg-primary text-primary-foreground"
              : "border border-border/60 bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          All Categories ({skills.length})
        </button>
        {categories.map((cat) => {
          const count = skills.filter((s) => s.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat.name
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading skills...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col justify-between gap-3 hover:border-primary/40 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{skill.name}</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {getCategoryName(skill.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary">{skill.level}%</span>
                  <button
                    onClick={() => handleDelete(skill)}
                    className="p-1 rounded text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                    title="Delete skill"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Slider & Progress bar */}
              <div className="space-y-2">
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Adjust:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={skill.level}
                    onChange={(e) => handleUpdateLevel(skill, Number(e.target.value))}
                    className="w-3/4 accent-primary h-1 bg-transparent cursor-pointer"
                  />
                  {savingSkillId === skill.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
