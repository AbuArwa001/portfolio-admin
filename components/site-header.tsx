"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ExternalLink, Globe, Sparkles, LogOut, User, Bell } from "lucide-react";
import Link from "next/link";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard Overview", subtitle: "System status & summary metrics" },
  "/dashboard/projects": { title: "Projects Management", subtitle: "Manage showcase projects and case studies" },
  "/dashboard/certifications": { title: "Certifications & Credentials", subtitle: "Manage certifications and licenses" },
  "/dashboard/references": { title: "References & Testimonials", subtitle: "Manage referee quotes and contact details" },
  "/dashboard/skills": { title: "Skills & Technologies", subtitle: "Manage technical skills and proficiency levels" },
  "/dashboard/profile": { title: "Profile & Bio", subtitle: "Update personal information and contact details" },
  "/dashboard/cv": { title: "CV & Résumé Editor", subtitle: "Edit timeline, achievements, and JSON records" },
};

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const current = TITLES[pathname] || { title: "Admin Portal", subtitle: "Manage portfolio records" };
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  return (
    <header className="h-16 border-b border-border/60 bg-card/40 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight font-heading">
          {current.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          DRF API Connected
        </div>

        <a
          href={portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden md:inline">View Live Site</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>

        <div className="w-px h-6 bg-border/60 mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {session?.user?.name ? session.user.name.charAt(0) : "K"}
          </div>
          <span className="text-xs font-medium text-foreground hidden sm:block">
            {session?.user?.name || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}
