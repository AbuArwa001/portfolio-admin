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
} from "lucide-react";
import { useTheme } from "next-themes";
import { getApiUrl } from "@/lib/config";

const NAV_ITEMS = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Metrics & system status",
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: FolderKanban,
    description: "Manage portfolio projects",
  },
  {
    title: "Certifications",
    url: "/dashboard/certifications",
    icon: Award,
    description: "Credentials & licenses",
  },
  {
    title: "References",
    url: "/dashboard/references",
    icon: Quote,
    description: "Referees & testimonials",
  },
  {
    title: "Skills & Tech",
    url: "/dashboard/skills",
    icon: Code2,
    description: "Technical proficiency",
  },
  {
    title: "Blog Posts",
    url: "/dashboard/blog",
    icon: BookOpen,
    description: "Articles & technical writing",
  },
  {
    title: "Profile & Bio",
    url: "/dashboard/profile",
    icon: User,
    description: "Bio, avatar, contacts",
  },
  {
    title: "CV / Résumé",
    url: "/dashboard/cv",
    icon: FileText,
    description: "Timeline & JSON editor",
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

  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";
  const apiUrl = getApiUrl();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/60 bg-card/60 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Header / Brand */}
      <div className="p-5 border-b border-border/60 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-black text-sm shadow-[0_0_20px_-4px] shadow-primary/60 group-hover:scale-105 transition-transform">
            KA
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-foreground font-heading flex items-center gap-1.5">
              Portfolio <span className="text-primary">Admin</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">v1.0 Control Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Management
        </div>

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url));
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px] shadow-primary/60 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary-foreground" : "text-primary/70 group-hover:text-primary transition-colors"}`} />
                <span className="truncate">{item.title}</span>
              </div>
              {active && <ChevronRight className="h-4 w-4 opacity-80" />}
            </Link>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          External Links
        </div>

        <a
          href={portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>Live Portfolio</span>
          </div>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>

        <a
          href={`${apiUrl}/api/v1/docs/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span>DRF Swagger Docs</span>
          </div>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </div>

      {/* Footer / User status & controls */}
      <div className="p-3 border-t border-border/60 flex flex-col gap-2 bg-card/40">
        {/* User preview */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                {session?.user?.name ? session.user.name.charAt(0) : "A"}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">
                {session?.user?.name || "Admin User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate font-mono">
                {session?.user?.email || "admin@khalfan.dev"}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            title="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" /> Light
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-400" /> Dark
              </>
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
