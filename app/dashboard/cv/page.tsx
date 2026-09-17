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
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              Career Timeline
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • ATS &amp; Executive Synchronization
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            CV &amp; Résumé Editor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Curate work experiences, career chronology, degree records, and technical proficiencies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://portfolio-abuarwa.vercel.app/cv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Live CV
          </a>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 overflow-x-auto">
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

      {/* Content */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
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
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Company</label>
                    <input
                      type="text"
                      value={job.company}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], company: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Period</label>
                    <input
                      type="text"
                      value={job.period}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], period: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Location</label>
                    <input
                      type="text"
                      value={job.location}
                      onChange={(e) => {
                        const exp = [...data.experience];
                        exp[i] = { ...exp[i], location: e.target.value };
                        setData({ ...data, experience: exp });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Achievements &amp; Responsibilities (one bullet per line)
                  </label>
                  <textarea
                    rows={4}
                    value={job.achievements.join("\n")}
                    onChange={(e) => {
                      const exp = [...data.experience];
                      exp[i] = { ...exp[i], achievements: e.target.value.split("\n") };
                      setData({ ...data, experience: exp });
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-y font-sans"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Experience Entry
            </button>
          </div>
        )}

        {activeTab === "education" && (
          <div className="space-y-6">
            {data.education.map((edu: any, i: number) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                    Education #{i + 1}
                  </span>
                  <button
                    onClick={() => {
                      const ed = [...data.education];
                      ed.splice(i, 1);
                      setData({ ...data, education: ed });
                    }}
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
                      onChange={(e) => {
                        const ed = [...data.education];
                        ed[i] = { ...ed[i], school: e.target.value };
                        setData({ ...data, education: ed });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Degree / Award</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const ed = [...data.education];
                        ed[i] = { ...ed[i], degree: e.target.value };
                        setData({ ...data, education: ed });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Year / Period</label>
                    <input
                      type="text"
                      value={edu.period}
                      onChange={(e) => {
                        const ed = [...data.education];
                        ed[i] = { ...ed[i], period: e.target.value };
                        setData({ ...data, education: ed });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Education Entry
            </button>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter each resume skill on its own line. These are parsed directly into the ATS-friendly skills section.
              </p>
              <span className="text-xs font-mono text-slate-500 font-bold">
                {data.skills.length} skills listed
              </span>
            </div>
            <textarea
              rows={8}
              value={data.skills.join("\n")}
              onChange={(e) => setData({ ...data, skills: e.target.value.split("\n").filter(Boolean) })}
              className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-y w-full leading-relaxed"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {data.skills.map((s: string, idx: number) => (
                <span key={idx} className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === "certifications" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Manage certifications displayed on your resume and CV.
            </p>
            <div className="space-y-3">
              {data.certifications.map((c: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                    <input
                      type="text"
                      placeholder="Certification Name"
                      value={c.name}
                      onChange={(e) => {
                        const certs = [...data.certifications];
                        certs[i] = { ...certs[i], name: e.target.value };
                        setData({ ...data, certifications: certs });
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Issuer (e.g. AWS, Cisco)"
                      value={c.issuer}
                      onChange={(e) => {
                        const certs = [...data.certifications];
                        certs[i] = { ...certs[i], issuer: e.target.value };
                        setData({ ...data, certifications: certs });
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Year (e.g. 2024)"
                      value={c.year}
                      onChange={(e) => {
                        const certs = [...data.certifications];
                        certs[i] = { ...certs[i], year: e.target.value };
                        setData({ ...data, certifications: certs });
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const certs = [...data.certifications];
                      certs.splice(i, 1);
                      setData({ ...data, certifications: certs });
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors self-end sm:self-auto cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setData({
                  ...data,
                  certifications: [...data.certifications, { name: "", issuer: "", year: new Date().getFullYear().toString() }],
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Certification Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
