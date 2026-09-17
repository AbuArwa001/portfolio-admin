"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ExternalLink, Globe, Sparkles, Server, ChevronRight } from "lucide-react";
import Link from "next/link";

const TITLES: Record<string, { title: string; subtitle: string; category: string }> = {
  "/dashboard": { title: "Operations Overview", subtitle: "System telemetry & operational health", category: "Mission Control" },
  "/dashboard/letters": { title: "Cover Letter Architect", subtitle: "AI-tailored executive application letters with PDF export", category: "Career" },
  "/dashboard/applications": { title: "Applied Roles Telemetry", subtitle: "Track job submissions, pipeline stages & export", category: "Pipeline" },
  "/dashboard/projects": { title: "Projects Management", subtitle: "Showcase case studies & live production deployments", category: "Portfolio" },
  "/dashboard/certifications": { title: "Certifications & Credentials", subtitle: "AWS, Oracle & Cisco verified digital credentials", category: "Credentials" },
  "/dashboard/references": { title: "Executive References", subtitle: "Client quotes, directors & professional testimonials", category: "Reputation" },
  "/dashboard/skills": { title: "Technical Skills Matrix", subtitle: "Proficiency levels across backend, network & DevOps", category: "Competencies" },
  "/dashboard/profile": { title: "Profile & Identity", subtitle: "Update bio, social links, location & avatar", category: "Identity" },
  "/dashboard/cv": { title: "CV & Résumé Editor", subtitle: "Curate career timeline & structured JSON records", category: "Career" },
  "/dashboard/blog": { title: "Technical Blog Publishing", subtitle: "Compose, publish and manage architectural insights", category: "Publications" },
};

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const current = TITLES[pathname] || {
    title: "Admin Portal",
    subtitle: "Manage portfolio records",
    category: "Management",
  };
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://khalfanathman.dev";

  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-2xl px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 selection:bg-primary/30 print:hidden">
      {/* Left: Breadcrumbs & Dynamic Page Identity */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <span>Console</span>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-blue-600 dark:text-primary font-semibold">{current.category}</span>
        </div>
        <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight font-heading flex items-center gap-2">
          {current.title}
        </h1>
      </div>

      {/* Right: Live Connection Indicator & Quick Action Pills */}
      <div className="flex items-center gap-3">
        {/* DRF Health Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DRF API: Connected</span>
        </div>

        {/* Live Site Link */}
        <a
          href={portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/60 dark:bg-white/[0.03] hover:bg-slate-200/60 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm group"
        >
          <Globe className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Public Portfolio</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>

        <div className="w-px h-5 bg-slate-200 dark:bg-white/[0.08] mx-0.5 hidden sm:block" />

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {session?.user?.name ? session.user.name.charAt(0) : "K"}
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-white hidden sm:block font-heading">
            {session?.user?.name || "Khalfan"}
          </span>
        </div>
      </div>
    </header>
  );
}
