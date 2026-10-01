"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Network,
  Cloud,
  Building2,
  Layers,
  BookMarked,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  Play,
  Calculator,
  Timer,
} from "lucide-react";
import PomodoroTimerModal from "@/components/study/pomodoro-timer-modal";

const NAV_TABS = [
  { label: "Overview & Heatmap", href: "/dashboard/study", icon: GraduationCap, exact: true },
  { label: "Cisco CCNA (200-301)", href: "/dashboard/study/ccna", icon: Network },
  { label: "AWS Solutions Architect (SAA-C03)", href: "/dashboard/study/aws", icon: Cloud },
  { label: "Subnetting Practice", href: "/dashboard/study/subnetting", icon: Calculator },
  { label: "Quiz & Mock Exams", href: "/dashboard/study/exam", icon: Play },
  { label: "Flashcards (SM-2)", href: "/dashboard/study/flashcards", icon: Layers },
  { label: "Interview Prep", href: "/dashboard/study/interviews", icon: Building2 },
  { label: "Mistakes & Notes", href: "/dashboard/study/notes", icon: BookMarked },
];

export default function StudyPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isPomodoroOpen, setIsPomodoroOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header Hub Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 shadow-xl p-5 md:p-6 text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Private Study Platform
              </span>
              <span className="text-xs text-slate-400 font-mono">v1.0 (Phase 6 Active)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Certification & Interview Mastery Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Targeted blueprint preparation for Cisco CCNA 200-301, AWS SAA-C03, and company-specific technical interview briefs powered by Claude AI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Focus Timer Launch Button */}
            <button
              onClick={() => setIsPomodoroOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 transition-colors shadow-inner text-left cursor-pointer group"
              title="Launch Pomodoro Focus Timer"
            >
              <Timer className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-[10px] text-rose-400 uppercase font-mono tracking-wider font-semibold">Focus Timer</div>
                <div className="text-xs sm:text-sm font-bold text-rose-200">25m / 5m</div>
              </div>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Streak</div>
                <div className="text-xs sm:text-sm font-bold text-amber-300">Active Daily</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Paced Goals</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-300">On Track</div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="relative z-10 mt-6 pt-4 border-t border-indigo-500/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {NAV_TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-w-0">{children}</div>

      {/* Pomodoro Timer Modal */}
      <PomodoroTimerModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        onSessionLogged={() => {
          // If on study overview page, triggers could re-fetch
        }}
      />
    </div>
  );
}
