"use client";

import * as React from "react";
import Link from "next/link";
import {
  Network,
  Cloud,
  Building2,
  Layers,
  BookMarked,
  ArrowRight,
  CheckCircle2,
  Play,
  ShieldCheck,
  Server,
  Zap,
  Target,
  Sparkles,
  BarChart3,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { getStudyCertifications, getStudyTopics, getStudyLabs } from "@/lib/study-api";
import type { StudyCertification, StudyTopic, StudyLab } from "@/types/study";

export default function StudyOverviewPage() {
  const [certifications, setCertifications] = React.useState<StudyCertification[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [labs, setLabs] = React.useState<StudyLab[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [certsData, topicsData, labsData] = await Promise.all([
        getStudyCertifications().catch(() => []),
        getStudyTopics().catch(() => []),
        getStudyLabs().catch(() => []),
      ]);
      setCertifications(certsData);
      setTopics(topicsData);
      setLabs(labsData);
    } catch (err: any) {
      console.error("Error loading study overview:", err);
      setError("Failed to load study data from backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const ccnaCert = certifications.find((c) => c.code.includes("CCNA"));
  const awsCert = certifications.find((c) => c.code.includes("AWS"));

  const ccnaTopics = topics.filter((t) => t.certification_code?.includes("CCNA") || t.certification === ccnaCert?.id);
  const awsTopics = topics.filter((t) => t.certification_code?.includes("AWS") || t.certification === awsCert?.id);

  const ccnaLabs = labs.filter((l) => l.certification_code?.includes("CCNA") || l.topic_name?.toLowerCase().includes("vlan"));
  const awsLabs = labs.filter((l) => l.certification_code?.includes("AWS") || l.topic_name?.toLowerCase().includes("vpc"));

  return (
    <div className="space-y-8 pb-12">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? "..." : topics.length || "67"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Blueprint Topics Seeded</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? "..." : labs.length || "2"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hands-On Guided Labs</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">SM-2</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Spaced Repetition Active</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">Claude AI</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interview Briefs Engine</div>
          </div>
        </div>
      </div>

      {/* Main Track Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Cisco CCNA 200-301 */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all shadow-sm hover:shadow-md p-6 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Cisco Blueprint 200-301
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Cisco Certified Network Associate
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                120 Min • 100 Qs
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Covers all 6 exam domains: Network Fundamentals, Network Access, IP Connectivity (OSPF), IP Services (NAT/DHCP), Security Fundamentals (ACLs), and Automation & Programmability.
            </p>

            {/* Domain Badges */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                Official Exam Domains
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: "Network Fundamentals", wt: "20%" },
                  { name: "Network Access", wt: "20%" },
                  { name: "IP Connectivity", wt: "25%" },
                  { name: "IP Services", wt: "10%" },
                  { name: "Security Fundamentals", wt: "15%" },
                  { name: "Automation & Code", wt: "10%" },
                ].map((d) => (
                  <div
                    key={d.name}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200"
                  >
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">{d.wt}</div>
                    <div className="text-xs font-medium truncate">{d.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{ccnaTopics.length || 40} Blueprint Topics</span>
              <span>{ccnaLabs.length || 1} Guided Labs Configured</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <Link
              href="/dashboard/study/ccna"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-blue-600/20"
            >
              <span>Explore CCNA Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module B: AWS SAA-C03 */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md p-6 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    AWS Exam SAA-C03
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Solutions Architect Associate
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                130 Min • 65 Qs
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Organized strictly by the 4 AWS exam domains: Design Secure Architectures, Design Resilient Architectures, Design High-Performing Architectures, and Design Cost-Optimized Architectures.
            </p>

            {/* Domain Badges */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                Official Exam Domains
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Domain 1: Secure Architectures", wt: "30%" },
                  { name: "Domain 2: Resilient Architectures", wt: "26%" },
                  { name: "Domain 3: High-Performing Architectures", wt: "24%" },
                  { name: "Domain 4: Cost-Optimized Architectures", wt: "20%" },
                ].map((d) => (
                  <div
                    key={d.name}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200"
                  >
                    <div className="text-[10px] text-amber-500 font-mono font-bold">{d.wt}</div>
                    <div className="text-xs font-medium truncate">{d.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{awsTopics.length || 27} Blueprint Topics</span>
              <span>{awsLabs.length || 1} Guided Labs Configured</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <Link
              href="/dashboard/study/aws"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-amber-600/20"
            >
              <span>Explore AWS SAA-C03 Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Module C & Auxiliary Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module C: Organization Interview Prep */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Target Organization Interview Prep
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Track target companies, paste job descriptions, and generate customized briefs with company summaries, STAR answers, and 30/60/90 day study links.
            </p>
          </div>
          <Link
            href="/dashboard/study/interviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500"
          >
            <span>Open Interview Prep</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Spaced Repetition Flashcards */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SuperMemo-2 Flashcards
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Intelligent spaced repetition algorithm automatically schedules cards from missed quiz questions or custom review notes.
            </p>
          </div>
          <Link
            href="/dashboard/study/flashcards"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
          >
            <span>Practice Due Cards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mistakes Journal & Notes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <BookMarked className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mistakes Journal & Notes
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Document gotchas, syntax errors, and conceptual misunderstandings so you never repeat a missed question or configuration mistake.
            </p>
          </div>
          <Link
            href="/dashboard/study/notes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500"
          >
            <span>Review Journal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
