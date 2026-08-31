"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Code2, Loader2, CheckCircle2, AlertCircle, ExternalLink, Globe,
} from "lucide-react";

interface Skill {
  id?: number;
  name: string;
  level: number;
  category?: number | string;
}

const DEFAULT_SKILLS = [
  { id: 1, name: "Python / Django REST Framework", level: 95 },
  { id: 2, name: "Next.js 15 & React 19", level: 90 },
  { id: 3, name: "TypeScript & JavaScript", level: 88 },
  { id: 4, name: "Linux System Administration", level: 92 },
  { id: 5, name: "TCP/IP & Network Routing", level: 94 },
  { id: 6, name: "PostgreSQL & Database Design", level: 86 },
  { id: 7, name: "Docker & Containerization", level: 82 },
  { id: 8, name: "AWS Cloud Infrastructure", level: 80 },
];

export default function SkillsManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1/auth/profile/skills/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(80);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) return;
    fetch(API, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSkills(data);
      })
      .catch(() => console.log("Using default skill list"));
  }, [token, API]);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const newEntry: Skill = {
      id: Date.now(),
      name: newSkillName.trim(),
      level: newSkillLevel,
    };
    setSkills([newEntry, ...skills]);
    setNewSkillName("");
    setNewSkillLevel(80);
    showToast("success", "Skill added to dashboard view.");
  };

  const handleDelete = (idx: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
    showToast("success", "Skill removed.");
  };

  const handleLevelChange = (idx: number, level: number) => {
    setSkills((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], level };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground font-heading">Skills & Tech Stack</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage technical proficiency tags and levels ({skills.length} skills)
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
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Add New Skill
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Skill Name / Technology
            </label>
            <input
              type="text"
              value={newSkillName}
              placeholder="e.g. GraphQL, Kubernetes, Rust"
              onChange={(e) => setNewSkillName(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
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
                onClick={handleAddSkill}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-6px] shadow-primary/60 cursor-pointer flex-shrink-0"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, idx) => (
          <div
            key={skill.id ?? idx}
            className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{skill.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary">{skill.level}%</span>
                <button
                  onClick={() => handleDelete(idx)}
                  className="p-1 rounded text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Slider & Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={skill.level}
                onChange={(e) => handleLevelChange(idx, Number(e.target.value))}
                className="w-full accent-primary h-1 bg-transparent cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
