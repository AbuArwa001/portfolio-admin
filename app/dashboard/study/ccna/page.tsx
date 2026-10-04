"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Network,
  Search,
  BookOpen,
  Terminal,
  Play,
  Layers,
  Shield,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Maximize2,
  Zap,
} from "lucide-react";
import { getStudyTopics, getStudyLabs } from "@/lib/study-api";
import { QuestionGeneratorModal } from "@/components/study/question-generator-modal";
import { LabWorkspaceModal } from "@/components/study/lab-workspace-modal";
import { CurriculumStages } from "@/components/study/curriculum-stages";
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
  const router = useRouter();
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [labs, setLabs] = React.useState<StudyLab[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeDomain, setActiveDomain] = React.useState<number | null>(null);
  const [viewMode, setViewMode] = React.useState<"stages" | "topics" | "labs">("stages");

  // Generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = React.useState(false);
  const [generatorTopicId, setGeneratorTopicId] = React.useState<number | undefined>(undefined);

  // Lab modal state
  const [selectedLab, setSelectedLab] = React.useState<StudyLab | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
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
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenLab = (lab: StudyLab) => {
    setSelectedLab(lab);
    setIsLabModalOpen(true);
  };

  const handleOpenTopicLab = (topic: StudyTopic) => {
    const matchingLab = labs.find((l) => l.topic === topic.id);
    if (matchingLab) {
      handleOpenLab(matchingLab);
    } else {
      // Find closest lab in this domain, or fallback to first lab
      const domainLab =
        labs.find((l) => {
          const t = topics.find((top) => top.id === l.topic);
          return t?.domain_number === topic.domain_number;
        }) || labs[0];

      if (domainLab) {
        handleOpenLab(domainLab);
      }
    }
  };

  const handleLabUpdated = (updatedLab: StudyLab) => {
    setLabs((prev) => prev.map((l) => (l.id === updatedLab.id ? updatedLab : l)));
    if (selectedLab?.id === updatedLab.id) {
      setSelectedLab(updatedLab);
    }
  };

  const filteredTopics = topics.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.blueprint_ref.toLowerCase().includes(query);
    const matchesDomain = activeDomain === null || t.domain_number === activeDomain;
    return matchesSearch && matchesDomain;
  });

  const filteredLabs = labs.filter((l) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      l.title.toLowerCase().includes(query) ||
      (l.topic_name || "").toLowerCase().includes(query);
    
    if (activeDomain === null) return matchesSearch;
    const parentTopic = topics.find((t) => t.id === l.topic);
    const matchesDomain = parentTopic?.domain_number === activeDomain;
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
            6 Official Blueprint Domains, 40 Seeded Topics, Interactive CLI Topology Labs with Config Checker, and Timed Mock Exams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setGeneratorTopicId(undefined);
              setIsGeneratorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Qs (Claude)</span>
          </button>

          <Link
            href="/dashboard/study/exam?cert=CCNA-200-301&mode=timed_mock"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-blue-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Timed Mock Exam</span>
          </Link>
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
          placeholder="Search by topic, keyword (e.g. OSPF, VLAN, Subnetting, ACL, DHCP, EtherChannel)..."
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
            onClick={() => handleOpenLab(labs[0])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm shadow-blue-600/20"
          >
            <span>Launch Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* View Mode Toggle Bar (Topics vs Hands-On Labs) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("stages")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === "stages"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Learning Path</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px]">
              7 Stages
            </span>
          </button>

          <button
            onClick={() => setViewMode("topics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === "topics"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Blueprint Topics ({filteredTopics.length})</span>
          </button>

          <button
            onClick={() => setViewMode("labs")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === "labs"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Hands-On Labs ({filteredLabs.length})</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
              CLI
            </span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
          {viewMode === "stages" ? "7-Stage CCNA Path" : viewMode === "topics" ? "40 Blueprint Topics" : `${labs.length} CLI Labs`}
        </div>
      </div>

      {/* VIEW 0: CURRICULUM STAGES (default, SwitchLab-style) */}
      {viewMode === "stages" && (
        <CurriculumStages
          topics={topics}
          labs={labs}
          onOpenLab={handleOpenLab}
          onGenerateQuestions={(topicId) => {
            setGeneratorTopicId(topicId);
            setIsGeneratorOpen(true);
          }}
        />
      )}

      {/* VIEW 1: TOPICS LIST */}
      {viewMode === "topics" && (
        <div className="space-y-3">
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
              {filteredTopics.map((topic) => {
                const topicLab = labs.find((l) => l.topic === topic.id);
                const hasCompletedLab = topicLab?.user_attempt?.status === "completed";

                return (
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
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          {topic.lab_count || (topicLab ? 1 : 0)} Labs • {topic.question_count || 0} Qs
                        </span>
                        {hasCompletedLab && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono font-bold">
                            LAB DONE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setGeneratorTopicId(topic.id);
                            setIsGeneratorOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors inline-flex items-center gap-1"
                          title="Generate N new questions with Claude"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>+ Qs</span>
                        </button>

                        <Link
                          href={`/dashboard/study/exam?cert=CCNA-200-301&topic=${topic.id}&mode=practice`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                        >
                          Practice
                        </Link>

                        <button
                          onClick={() => topicLab
                            ? router.push(`/dashboard/study/labs/${topicLab.id}`)
                            : handleOpenTopicLab(topic)
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                            topicLab
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          title={topicLab ? `Launch lab: ${topicLab.title}` : "Open related domain lab"}
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Lab</span>
                          {topicLab && <Maximize2 className="w-2.5 h-2.5 opacity-60" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: HANDS-ON LABS GRID */}
      {viewMode === "labs" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading CCNA labs...
            </div>
          ) : filteredLabs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No hands-on labs found for this search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLabs.map((lab) => {
                const attempt = lab.user_attempt;
                const isCompleted = attempt?.status === "completed";
                const isInProgress = attempt?.status === "in_progress";
                const score = attempt?.checker_results?.score;

                return (
                  <div
                    key={lab.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                              lab.difficulty === "beginner"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : lab.difficulty === "intermediate"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {lab.difficulty}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{lab.estimated_time_minutes} min
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            COMPLETED {score !== undefined && `(${score}%)`}
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            IN PROGRESS {score !== undefined && `(${score}%)`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Not Started
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {lab.title}
                      </h3>

                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Topic: {lab.topic_name}
                      </div>

                      {/* Objectives summary */}
                      {lab.objectives && lab.objectives.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          {lab.objectives.slice(0, 2).map((obj, i) => (
                            <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                              <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <span className="truncate">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-slate-400">
                        {lab.addressing_table?.length || 0} Devices •{" "}
                        {lab.step_by_step_tasks?.length || 0} Steps
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenLab(lab)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                          title="Quick preview modal"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <Link
                          href={`/dashboard/study/labs/${lab.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-blue-600/20"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Full Workspace</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Generator Modal */}
      <QuestionGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        topics={topics}
        defaultTopicId={generatorTopicId}
        onQuestionsGenerated={() => loadData()}
      />

      {/* Lab Workspace Modal */}
      <LabWorkspaceModal
        isOpen={isLabModalOpen}
        lab={selectedLab}
        onClose={() => setIsLabModalOpen(false)}
        onLabUpdated={handleLabUpdated}
      />
    </div>
  );
}
