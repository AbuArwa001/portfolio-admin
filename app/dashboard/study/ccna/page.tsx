"use client";

import * as React from "react";
import Link from "next/link";
import {
  Network,
  Search,
  BookOpen,
  Terminal,
  Play,
  Layers,
  ChevronDown,
  ChevronUp,
  Shield,
  Compass,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { getStudyTopics, getStudyLabs } from "@/lib/study-api";
import type { StudyTopic, StudyLab } from "@/types/study";

const CCNA_DOMAINS = [
  { num: 1, name: "Network Fundamentals", weight: "20%" },
  { num: 2, name: "Network Access", weight: "20%" },
  { num: 3, name: "IP Connectivity", weight: "25%" },
  { num: 4, name: "IP Services", weight: "10%" },
  { num: 5, name: "Security Fundamentals", weight: "15%" },
  { num: 6, name: "Automation & Programmability", weight: "10%" },
];

export default function CcnaStudyPage() {
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [labs, setLabs] = React.useState<StudyLab[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeDomain, setActiveDomain] = React.useState<number | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [topicsData, labsData] = await Promise.all([
          getStudyTopics({ cert: "CCNA-200-301" }).catch(() => []),
          getStudyLabs({ cert: "CCNA-200-301" }).catch(() => []),
        ]);
        setTopics(topicsData);
        setLabs(labsData);
      } catch (err) {
        console.error("Failed to load CCNA data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredTopics = topics.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.blueprint_ref.toLowerCase().includes(query);
    const matchesDomain = activeDomain === null || t.domain_number === activeDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Exam 200-301
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Official Blueprint Structure</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Cisco Certified Network Associate (CCNA)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            6 Official Blueprint Domains, 40 Seeded Topics, CLI Topology Labs, and Scenario-based Question Banks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Practice quiz engine is ready to connect in Phase 2!")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-blue-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Practice Exam Mode</span>
          </button>
        </div>
      </div>

      {/* Domain Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          onClick={() => setActiveDomain(null)}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeDomain === null
              ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] font-mono opacity-80 uppercase tracking-wider">All Domains</div>
          <div className="text-xs font-bold truncate">All Topics (40)</div>
        </button>

        {CCNA_DOMAINS.map((domain) => {
          const count = topics.filter((t) => t.domain_number === domain.num).length;
          const isSelected = activeDomain === domain.num;
          return (
            <button
              key={domain.num}
              onClick={() => setActiveDomain(isSelected ? null : domain.num)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono opacity-80 font-bold">
                <span>D{domain.num}</span>
                <span>{domain.weight}</span>
              </div>
              <div className="text-xs font-bold truncate mt-0.5">{domain.name}</div>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by topic, keyword (e.g. OSPF, VLAN, Subnetting, ACL, DHCP)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Featured Lab Showcase Banner (if labs available) */}
      {labs.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-400 tracking-wider">
                  Featured Hands-On Lab
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                  Beginner • 35 Min
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {labs[0].title}
              </h3>
              <p className="text-xs text-slate-300">
                Interactive SVG Topology, Addressing Table, CLI Tasks, and Config Checker grading against expected syntax.
              </p>
            </div>
          </div>

          <button
            onClick={() => alert(`Phase 4 Lab Workspace: ${labs[0].title}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm"
          >
            <span>Launch Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Topics List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold px-1">
          <span>{filteredTopics.length} TOPICS MATCHED</span>
          <span>PHASE 1 SEEDED</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading CCNA blueprint topics...
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No topics matched your search filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 transition-all shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Topic {topic.blueprint_ref}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Domain {topic.domain_number} ({topic.domain_name})
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {topic.name}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    {topic.lab_count || 0} Labs • {topic.question_count || 0} Questions
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`Phase 2: Question generator & practice mode for ${topic.name}`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      Practice
                    </button>
                    <button
                      onClick={() => alert(`Phase 4: Lab view for ${topic.name}`)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Lab
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
