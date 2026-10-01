"use client";

import * as React from "react";
import Link from "next/link";
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
  ArrowRight,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Plus,
} from "lucide-react";
import { getStudyTopics, getStudyLabs } from "@/lib/study-api";
import { QuestionGeneratorModal } from "@/components/study/question-generator-modal";
import type { StudyTopic, StudyLab } from "@/types/study";

const AWS_DOMAINS = [
  { num: 1, name: "Design Secure Architectures", weight: "30%" },
  { num: 2, name: "Design Resilient Architectures", weight: "26%" },
  { num: 3, name: "Design High-Performing Architectures", weight: "24%" },
  { num: 4, name: "Design Cost-Optimized Architectures", weight: "20%" },
];

export default function AwsStudyPage() {
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [labs, setLabs] = React.useState<StudyLab[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeDomain, setActiveDomain] = React.useState<number | null>(null);

  // Generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = React.useState(false);
  const [generatorTopicId, setGeneratorTopicId] = React.useState<number | undefined>(undefined);

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
            Scenario-driven exam prep, Terraform & CloudFormation templates, and read-only SDK verification checks.
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
            <span>Timed Mock Exam (65 Qs)</span>
          </Link>
        </div>
      </div>

      {/* Mandatory AWS Account & Cost Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          <span className="font-bold text-amber-600 dark:text-amber-400">Cost Safety & Verification Warning:</span>
          <p>
            Always practice in a <strong>dedicated AWS sandbox account</strong> with an active $5 AWS Budget alert. Verification checks run strictly read-only checks via server-side restricted IAM roles. Never configure or store root credentials. Every lab contains a mandatory teardown checklist.
          </p>
        </div>
      </div>

      {/* Domain Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveDomain(null)}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeDomain === null
              ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] font-mono opacity-80 uppercase tracking-wider">All Domains</div>
          <div className="text-xs font-bold truncate">All Topics (27)</div>
        </button>

        {AWS_DOMAINS.map((domain) => {
          const isSelected = activeDomain === domain.num;
          return (
            <button
              key={domain.num}
              onClick={() => setActiveDomain(isSelected ? null : domain.num)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-sm"
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
          placeholder="Search AWS services & concepts (e.g. IAM, VPC, S3, RDS, DynamoDB, CloudFront, Lambda)..."
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
                  Intermediate • 50 Min
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {labs[0].title}
              </h3>
              <p className="text-xs text-slate-300">
                Multi-AZ Subnets, Internet & NAT Gateways, Terraform code, and automated verification checks.
              </p>
            </div>
          </div>

          <button
            onClick={() => alert(`Phase 5 AWS Lab Workspace: ${labs[0].title}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm"
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
          <span>PHASE 2 READY</span>
        </div>

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
            {filteredTopics.map((topic) => (
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
                  <span className="text-[11px] font-mono text-slate-400">
                    {topic.lab_count || 0} Labs • {topic.question_count || 0} Questions
                  </span>

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
                      onClick={() => alert(`Phase 5: Guided AWS Lab for ${topic.name}`)}
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

      {/* Generator Modal */}
      <QuestionGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        topics={topics}
        defaultTopicId={generatorTopicId}
        onQuestionsGenerated={() => loadData()}
      />
    </div>
  );
}
