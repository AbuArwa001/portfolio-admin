"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cloud,
  Search,
  BookOpen,
  Terminal,
  Play,
  Layers,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  CheckCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Plus,
  Clock,
  Trash2,
} from "lucide-react";
import { getStudyTopics, getStudyLabs } from "@/lib/study-api";
import { QuestionGeneratorModal } from "@/components/study/question-generator-modal";
import { LabWorkspaceModal } from "@/components/study/lab-workspace-modal";
import type { StudyTopic, StudyLab } from "@/types/study";

const AWS_DOMAINS = [
  { num: 1, name: "Design Secure Architectures", weight: "30%" },
  { num: 2, name: "Design Resilient Architectures", weight: "26%" },
  { num: 3, name: "Design High-Performing Architectures", weight: "24%" },
  { num: 4, name: "Design Cost-Optimized Architectures", weight: "20%" },
];

export default function AwsStudyPage() {
  const router = useRouter();
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [labs, setLabs] = React.useState<StudyLab[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeDomain, setActiveDomain] = React.useState<number | null>(null);
  const [viewMode, setViewMode] = React.useState<"topics" | "labs">("topics");

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
        getStudyTopics({ cert: "AWS-SAA-C03" }).catch(() => []),
        getStudyLabs({ cert: "AWS-SAA-C03" }).catch(() => []),
      ]);
      setTopics(topicsData);
      setLabs(labsData);
    } catch (err) {
      console.error("Failed to load AWS SAA-C03 data:", err);
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
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Exam SAA-C03
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">4 Official Exam Domains</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            AWS Certified Solutions Architect – Associate
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Scenario-driven exam prep, Terraform & CloudFormation templates, 2-Hour cost estimators, and mandatory teardown checklists.
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
            href="/dashboard/study/exam?cert=AWS-SAA-C03&mode=timed_mock"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-amber-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Timed Mock Exam</span>
          </Link>
        </div>
      </div>

      {/* Domain Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AWS_DOMAINS.map((domain) => {
          const count = topics.filter((t) => t.domain_number === domain.num).length;
          const isSelected = activeDomain === domain.num;
          return (
            <button
              key={domain.num}
              onClick={() => setActiveDomain(isSelected ? null : domain.num)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-sm shadow-amber-600/20"
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
          placeholder="Search AWS services & concepts (e.g. IAM, VPC, S3, RDS, DynamoDB, CloudFront, Lambda, KMS)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Featured AWS Lab */}
      {labs.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">
                  Featured AWS Architecture Lab
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                  Intermediate • 45 Min
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  ~${Number(labs[0].estimated_cost_usd || 0).toFixed(2)} / 2h
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {labs[0].title}
              </h3>
              <p className="text-xs text-slate-300">
                Multi-AZ Subnets, ALB, Auto Scaling, CloudFormation & Terraform code, and mandatory teardown verification.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenLab(labs[0])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm shadow-amber-600/20"
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
            onClick={() => setViewMode("topics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === "topics"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
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
                ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Architecture Labs ({filteredLabs.length})</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
              Phase 5 Ready
            </span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
          {viewMode === "topics" ? "27 SAA-C03 Blueprint Topics" : `${labs.length} Real-World AWS Architecture Labs`}
        </div>
      </div>

      {/* VIEW 1: TOPICS LIST */}
      {viewMode === "topics" && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading AWS SAA-C03 blueprint topics...
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No topics matched your search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTopics.map((topic) => {
                const topicLab = labs.find((l) => l.topic === topic.id);
                const hasCompletedLab = topicLab?.user_attempt?.status === "completed" || topicLab?.user_attempt?.teardown_confirmed;

                return (
                  <div
                    key={topic.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-all shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
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
                          {topic.lab_count || (topicLab ? 1 : 0)} Labs • {topic.question_count || 0} Questions
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
                          href={`/dashboard/study/exam?cert=AWS-SAA-C03&topic=${topic.id}&mode=practice`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                        >
                          Practice
                        </Link>

                        <button
                          onClick={() => handleOpenTopicLab(topic)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                            topicLab
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          title={topicLab ? `Launch lab: ${topicLab.title}` : "Open related domain lab"}
                        >
                          <Cloud className="w-3 h-3" />
                          <span>Lab</span>
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

      {/* VIEW 2: HANDS-ON ARCHITECTURE LABS GRID */}
      {viewMode === "labs" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading AWS architecture labs...
            </div>
          ) : filteredLabs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No architecture labs found for this search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLabs.map((lab) => {
                const attempt = lab.user_attempt;
                const isCompleted = attempt?.status === "completed" || attempt?.teardown_confirmed;
                const isInProgress = attempt?.status === "in_progress" && !attempt?.teardown_confirmed;
                const score = attempt?.checker_results?.score;

                return (
                  <div
                    key={lab.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
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

                          {/* Cost Pill */}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-0.5 ${
                              lab.free_tier_eligible
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            }`}
                          >
                            <DollarSign className="w-2.5 h-2.5" />
                            <span>${Number(lab.estimated_cost_usd || 0).toFixed(2)} (2h)</span>
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            COMPLETED & TORN DOWN
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
                              <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span className="truncate">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span>CFN + Terraform</span>
                        <span>•</span>
                        <span>{lab.aws_verification_checks?.length || 0} Checks</span>
                      </div>

                      <button
                        onClick={() => handleOpenLab(lab)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-amber-600/20"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Open Workspace</span>
                      </button>
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

      {/* Lab Workspace Modal (Supporting both CCNA & AWS) */}
      <LabWorkspaceModal
        isOpen={isLabModalOpen}
        lab={selectedLab}
        onClose={() => setIsLabModalOpen(false)}
        onLabUpdated={handleLabUpdated}
      />
    </div>
  );
}
