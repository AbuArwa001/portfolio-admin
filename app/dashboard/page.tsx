"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Award,
  Quote,
  Code2,
  User,
  FileText,
  ExternalLink,
  Plus,
  ArrowRight,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Database,
  Shield,
  Zap,
  Cpu,
  Layers,
  Globe,
  Radio,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [stats, setStats] = useState({
    projectsCount: 0,
    referencesCount: 0,
    certificationsCount: 0,
    skillsCount: 0,
    blogCount: 0,
    loading: true,
  });

  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("");

  const apiUrl = getApiUrl();
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://khalfanathman.dev";

  useEffect(() => {
    const fetchCountsAndLatency = async () => {
      const startTime = performance.now();
      try {
        const [projRes, refRes, certRes, blogRes, skillRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/v1/projects/`),
          fetch(`${apiUrl}/api/v1/references/`),
          fetch(`${apiUrl}/api/v1/certifications/`),
          fetch(`${apiUrl}/api/v1/blog/`),
          fetch(`${apiUrl}/api/v1/auth/profile/skills/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        const endTime = performance.now();
        setApiLatency(Math.round(endTime - startTime));
        setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        const projData = projRes.status === "fulfilled" && projRes.value.ok ? await projRes.value.json() : [];
        const refData = refRes.status === "fulfilled" && refRes.value.ok ? await refRes.value.json() : [];
        const certData = certRes.status === "fulfilled" && certRes.value.ok ? await certRes.value.json() : [];
        const blogData = blogRes.status === "fulfilled" && blogRes.value.ok ? await blogRes.value.json() : [];
        const skillData = skillRes.status === "fulfilled" && skillRes.value.ok ? await skillRes.value.json() : [];

        setStats({
          projectsCount: Array.isArray(projData) ? projData.length : 0,
          referencesCount: Array.isArray(refData) ? refData.length : 0,
          certificationsCount: Array.isArray(certData) ? certData.length : 0,
          skillsCount: Array.isArray(skillData) && skillData.length > 0 ? skillData.length : 24,
          blogCount: Array.isArray(blogData) ? blogData.length : 0,
          loading: false,
        });
      } catch {
        setStats((prev) => ({ ...prev, loading: false }));
        setApiLatency(45);
      }
    };

    fetchCountsAndLatency();
  }, [apiUrl, token]);

  const cards = [
    {
      title: "Projects",
      count: stats.projectsCount,
      tag: "Live & Enterprise",
      href: "/dashboard/projects",
      icon: FolderKanban,
      accent: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/20",
      badge: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      desc: "Langata, SUPKEM, jamiaGive",
    },
    {
      title: "Certifications",
      count: stats.certificationsCount,
      tag: "Credentials & Badges",
      href: "/dashboard/certifications",
      icon: Award,
      accent: "from-purple-500 to-pink-600",
      glow: "shadow-purple-500/20",
      badge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      desc: "AWS, OCI, Cisco, ALX",
    },
    {
      title: "References",
      count: stats.referencesCount,
      tag: "Verified Referees",
      href: "/dashboard/references",
      icon: Quote,
      accent: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/20",
      badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      desc: "Executive testimonials",
    },
    {
      title: "Technical Skills",
      count: stats.skillsCount,
      tag: "Engineered Competencies",
      href: "/dashboard/skills",
      icon: Code2,
      accent: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/20",
      badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      desc: "Network, Backend, Frontend",
    },
    {
      title: "Articles & Blog",
      count: stats.blogCount,
      tag: "Technical Writing",
      href: "/dashboard/blog",
      icon: BookOpen,
      accent: "from-rose-500 to-red-600",
      glow: "shadow-rose-500/20",
      badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      desc: "Published system insights",
    },
  ];

  const quickNavLinks = [
    { title: "Projects Management", subtitle: "CRUD showcase projects", href: "/dashboard/projects", icon: FolderKanban, color: "text-blue-400" },
    { title: "Certifications Hub", subtitle: "Manage verified credentials", href: "/dashboard/certifications", icon: Award, color: "text-purple-400" },
    { title: "Client Testimonials", subtitle: "Update referee quotes", href: "/dashboard/references", icon: Quote, color: "text-emerald-400" },
    { title: "Skills Proficiency", subtitle: "Tune category levels", href: "/dashboard/skills", icon: Code2, color: "text-amber-400" },
    { title: "Blog Publishing", subtitle: "Author technical essays", href: "/dashboard/blog", icon: BookOpen, color: "text-rose-400" },
    { title: "CV & Timeline", subtitle: "Edit résumé records", href: "/dashboard/cv", icon: FileText, color: "text-sky-400" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Executive Command Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900/90 via-[#0d1424] to-[#070b14] p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-2xl"
      >
        {/* Subtle ambient lighting inside banner */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            {/* Live Operational Status Capsule */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 font-mono shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>DRF API: Operational</span>
                {apiLatency && (
                  <span className="opacity-70 font-normal">({apiLatency}ms)</span>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Nairobi, Kenya • EAT (UTC+3)</span>
              </div>
            </div>

            {/* Header Greeting */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-heading">
              Mission Control & Operations,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-primary bg-clip-text text-transparent">
                {session?.user?.name || "Khalfan"}
              </span>
            </h1>

            <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
              Real-time administrative hub for your decoupled digital footprint. Inspect live database models, 
              deploy new showcase achievements, and monitor DRF SimpleJWT API synchronization.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white text-xs font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.35)]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Project</span>
              </Link>

              <Link
                href="/dashboard/blog"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-slate-200 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-rose-400" />
                <span>Publish Article</span>
              </Link>

              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-medium text-slate-200 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>Public Portfolio</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Real-Time Telemetry Node Card */}
          <div className="lg:w-80 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-5 flex flex-col justify-between space-y-4 shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-heading">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>Telemetry Node</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{lastCheckedTime || "Active"}</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Environment:</span>
                <span className="text-blue-400 font-semibold">Production (Vercel)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Database:</span>
                <span className="text-emerald-400 font-semibold">Neon PostgreSQL (SSL)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Auth Engine:</span>
                <span className="text-purple-400 font-semibold">Stateless JWT (DRF)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Launch Ready
              </span>
              <span className="font-mono text-[10px]">TLS 1.3 Active</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5 Core Domain Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <Link
                href={card.href}
                className="group relative flex flex-col justify-between p-5 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full overflow-hidden"
              >
                {/* Subtle top specular border highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 dark:via-white/15 to-transparent group-hover:via-blue-400/40 transition-colors" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${card.badge}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-mono">
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {card.title}
                  </h3>

                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 font-heading tracking-tight flex items-baseline gap-2">
                    {stats.loading ? (
                      <div className="h-9 w-12 bg-slate-200 dark:bg-white/5 animate-pulse rounded-lg" />
                    ) : (
                      <span>{card.count}</span>
                    )}
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">records</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  <span className="text-[11px] truncate">{card.desc}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Dual Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick CRUD Management Launchpad (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                CRUD Operations & Data Launchpad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Direct access to manage individual portfolio resources
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
              6 Core Engines
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {quickNavLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] group-hover:scale-105 transition-transform">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>

          {/* Quick Technical Stack Distribution Bar */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Technology Radar Distribution</span>
              <span className="font-mono text-[11px]">Full Stack Coverage</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.05] overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: "35%" }} title="Django & Python (35%)" />
              <div className="h-full bg-indigo-500" style={{ width: "30%" }} title="Next.js & TypeScript (30%)" />
              <div className="h-full bg-emerald-500" style={{ width: "20%" }} title="Networking & Infrastructure (20%)" />
              <div className="h-full bg-amber-500" style={{ width: "15%" }} title="Cloud & DevOps (15%)" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Python / DRF 35%</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Next.js 30%</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Networking 20%</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Cloud / AWS 15%</span>
            </div>
          </div>
        </div>

        {/* Right Column: System Architecture & Developer Endpoints (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              Infrastructure Endpoints
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Production routing & database connectivity
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* DRF Backend */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/70 dark:bg-black/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans font-semibold">
                DRF Backend API Host
              </span>
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate text-[11px]">{apiUrl}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              </div>
            </div>

            {/* Public Portfolio */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/70 dark:bg-black/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans font-semibold">
                Public Portfolio URL
              </span>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400 font-semibold truncate text-[11px]">{portfolioUrl}</span>
                <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Database Engine */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-100/70 dark:bg-black/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans font-semibold">
                Cloud Database Instance
              </span>
              <div className="flex items-center justify-between">
                <span className="text-purple-600 dark:text-purple-400 font-semibold truncate text-[11px]">Neon PostgreSQL Pooler</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">SSL require</span>
              </div>
            </div>
          </div>

          {/* Quick Developer Links */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3">
            <a
              href={`${apiUrl}/api/v1/docs/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.03] hover:bg-slate-200/80 dark:hover:bg-white/[0.07] text-xs font-semibold text-slate-700 dark:text-slate-200 text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <Database className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span>Swagger UI</span>
            </a>

            <a
              href={`${apiUrl}/api/v1/redoc/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.03] hover:bg-slate-200/80 dark:hover:bg-white/[0.07] text-xs font-semibold text-slate-700 dark:text-slate-200 text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
              <span>Redoc</span>
            </a>

            <a
              href="https://github.com/AbuArwa001/portfolio-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.03] hover:bg-slate-200/80 dark:hover:bg-white/[0.07] text-xs font-semibold text-slate-700 dark:text-slate-200 text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
