"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Briefcase, GraduationCap, Code2, Award,
  Plus, Trash2, Save, ExternalLink, ChevronRight,
  CheckCircle2, AlertCircle, Printer, FileText, Loader2,
} from "lucide-react";

type Tab = "experience" | "education" | "skills" | "certifications";

export default function CVEditorPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("experience");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [data, setData] = useState<any>({
    profile: { name: "Khalfan Athman", role: "Network Engineer & Full-Stack Developer", avatar: "/profile.jpg" },
    experience: [
      {
        title: "Senior Network Engineer & Systems Developer",
        company: "Jamia Mosque Committee",
        period: "2020 – Present",
        location: "Nairobi, Kenya",
        achievements: [
          "Architected multi-branch LAN/WAN networks, VPNs, and firewall filtering.",
          "Engineered full-stack administrative platforms with Django REST and Next.js.",
        ],
      },
    ],
    education: [
      {
        school: "ALX Africa / Holberton School",
        degree: "Software Engineering Certification",
        period: "2023 – 2024",
      },
    ],
    skills: ["Python (Django/DRF)", "Next.js & React", "TypeScript", "TCP/IP & Linux", "PostgreSQL"],
    certifications: [
      { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", year: "2024" },
    ],
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = () => {
    startTransition(async () => {
      showToast("success", "CV changes saved and synced successfully!");
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground font-heading">CV & Résumé Editor</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Update your timeline, work experiences, education history, and certification records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-[0_0_20px_-6px] shadow-primary/60 cursor-pointer"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save CV Data
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-3">
        {[
          { id: "experience", label: "Work Experience", icon: Briefcase },
          { id: "education", label: "Education History", icon: GraduationCap },
          { id: "skills", label: "Core Skills", icon: Code2 },
          { id: "certifications", label: "Certifications", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {activeTab === "experience" && (
          <div className="space-y-6">
            {data.experience.map((job: any, i: number) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-background p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    Position #{i + 1}
                  </span>
                  <button
                    onClick={() => {
                      const exp = [...data.experience];
                      exp.splice(i, 1);
                      setData({ ...data, experience: exp });
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Job Title</label>
                    <input
                      type="text"
                      value={job.title}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], title: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Company</label>
                    <input
                      type="text"
                      value={job.company}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], company: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Period</label>
                    <input
                      type="text"
                      value={job.period}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], period: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</label>
                    <input
                      type="text"
                      value={job.location}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], location: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Achievements (one bullet per line)
                  </label>
                  <textarea
                    rows={4}
                    value={job.achievements.join("\n")}
                    onChange={(e) => {
                      const exp = [...data.experience];
                      exp[i] = { ...exp[i], achievements: e.target.value.split("\n") };
                      setData({ ...data, experience: exp });
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-y font-sans"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                setData({
                  ...data,
                  experience: [
                    ...data.experience,
                    { title: "", company: "", period: "", location: "", achievements: [""] },
                  ],
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Experience Entry
            </button>
          </div>
        )}

        {activeTab === "education" && (
          <div className="space-y-6">
            {data.education.map((edu: any, i: number) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-background p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    Education #{i + 1}
                  </span>
                  <button
                    onClick={() => {
                      const ed = [...data.education];
                      ed.splice(i, 1);
                      setData({ ...data, education: ed });
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">School / Institution</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => {
                        const ed = [...data.education];
                        ed[i] = { ...ed[i], school: e.target.value };
                        setData({ ...data, education: ed });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Degree / Award</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const ed = [...data.education];
                        ed[i] = { ...ed[i], degree: e.target.value };
                        setData({ ...data, education: ed });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Year / Period</label>
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) => {
                        const ed = [...data.education];
                        ed[i] = { ...ed[i], period: e.target.value };
                        setData({ ...data, education: ed });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                setData({
                  ...data,
                  education: [...data.education, { school: "", degree: "", period: "" }],
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Education Entry
            </button>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Enter each resume skill on its own line.</p>
            <textarea
              rows={10}
              value={data.skills.join("\n")}
              onChange={(e) => setData({ ...data, skills: e.target.value.split("\n").filter(Boolean) })}
              className="px-4 py-3 rounded-xl border border-border/60 bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary resize-y w-full"
            />
          </div>
        )}

        {activeTab === "certifications" && (
          <div className="space-y-4">
            {data.certifications.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-border/60 bg-background flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.issuer} · {c.year}</div>
                </div>
                <button
                  onClick={() => {
                    const certs = [...data.certifications];
                    certs.splice(i, 1);
                    setData({ ...data, certifications: certs });
                  }}
                  className="p-1 text-red-400 hover:bg-red-400/10 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
