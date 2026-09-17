"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Award,
  Quote,
  Code2,
  User,
  FileText,
  BookOpen,
  ExternalLink,
  LogOut,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Database,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { getApiUrl } from "@/lib/config";

const MANAGEMENT_ITEMS = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: FolderKanban,
    badge: "CRUD",
  },
  {
    title: "Certifications",
    url: "/dashboard/certifications",
    icon: Award,
    badge: "Badges",
  },
  {
    title: "References",
    url: "/dashboard/references",
    icon: Quote,
    badge: null,
  },
  {
    title: "Skills & Tech",
    url: "/dashboard/skills",
    icon: Code2,
    badge: null,
  },
  {
    title: "Blog Posts",
    url: "/dashboard/blog",
    icon: BookOpen,
    badge: "Drafts",
  },
  {
    title: "Profile & Bio",
    url: "/dashboard/profile",
    icon: User,
    badge: null,
  },
  {
    title: "CV / Résumé",
    url: "/dashboard/cv",
    icon: FileText,
    badge: "JSON",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://khalfanathman.dev";
  const apiUrl = getApiUrl();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/[0.08] bg-[#080d1a]/95 backdrop-blur-2xl flex flex-col h-screen sticky top-0 z-40 selection:bg-primary/30">
      {/* Header / Brand */}
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-primary flex items-center justify-center text-white font-black text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform">
            KA
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white font-heading flex items-center gap-1.5">
              Portfolio <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">Admin</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v2.0 Control Center
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Portfolio Management
          </div>

          <div className="space-y-1">
            {MANAGEMENT_ITEMS.map((item) => {
              const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url));
              const Icon = item.icon;
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    active
                      ? "bg-gradient-to-r from-blue-600/20 via-primary/10 to-transparent text-white font-semibold border-l-2 border-primary shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 transition-colors ${
                        active ? "text-primary" : "text-slate-400 group-hover:text-white"
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="h-3.5 w-3.5 text-primary opacity-80" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Live Deployment & Docs
          </div>

          <div className="space-y-1">
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>Public Portfolio</span>
              </div>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <a
              href={`${apiUrl}/api/v1/docs/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span>Swagger Docs</span>
              </div>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer / User status & controls */}
      <div className="p-3 border-t border-white/[0.08] flex flex-col gap-2 bg-[#060a14]/60">
        {/* User Card */}
        <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {session?.user?.name ? session.user.name.charAt(0) : "K"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#080d1a]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate font-heading">
                {session?.user?.name || "Khalfan Athman"}
              </span>
              <span className="text-[10px] text-slate-400 truncate font-mono">
                Superadmin
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
