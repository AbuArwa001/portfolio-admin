"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Lock,
  Terminal,
  BookOpen,
  Network,
  Shield,
  Cpu,
  Trophy,
  ChevronDown,
  ChevronUp,
  Play,
  Clock,
  Zap,
  Star,
  Layers,
} from "lucide-react";
import type { StudyTopic, StudyLab } from "@/types/study";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface CurriculumStage {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  domainNumbers: number[];
  description: string;
  freeAccess: boolean;
}

interface CurriculumStagesProps {
  topics: StudyTopic[];
  labs: StudyLab[];
  onOpenLab: (lab: StudyLab) => void;
  onGenerateQuestions: (topicId: number) => void;
}

// ──────────────────────────────────────────────────────────────
// CCNA Curriculum Stages (SwitchLab-style 7-stage path)
// ──────────────────────────────────────────────────────────────
const CCNA_STAGES: CurriculumStage[] = [
  {
    id: 1,
    title: "Meet the CLI",
    subtitle: "Navigate device prompts & basic verification",
    icon: Terminal,
    color: "#58a6ff",
    bgColor: "bg-[#1f2f3f]",
    borderColor: "border-[#58a6ff]/30",
    domainNumbers: [1],
    description:
      "Learn to navigate Cisco IOS and identify device modes. Practice show commands and basic device verification before making any configuration changes.",
    freeAccess: true,
  },
  {
    id: 2,
    title: "Network Foundations",
    subtitle: "Ethernet, MAC, ARP, VLANs & packet flow",
    icon: Layers,
    color: "#3fb950",
    bgColor: "bg-[#1a2f1a]",
    borderColor: "border-[#3fb950]/30",
    domainNumbers: [1, 2],
    description:
      "Understand how frames move at Layer 2. Master MAC address tables, ARP, VLAN segmentation, and trunk links.",
    freeAccess: true,
  },
  {
    id: 3,
    title: "Switching",
    subtitle: "VLANs, trunking, STP, EtherChannel",
    icon: Network,
    color: "#d2a8ff",
    bgColor: "bg-[#2a1f3f]",
    borderColor: "border-[#d2a8ff]/30",
    domainNumbers: [2],
    description:
      "Configure access and trunk ports, VTP, STP modes, PortFast, and EtherChannel. Build multi-VLAN campus networks from scratch.",
    freeAccess: false,
  },
  {
    id: 4,
    title: "Routing",
    subtitle: "Router interfaces, static routes, OSPF, EIGRP",
    icon: Network,
    color: "#ffa657",
    bgColor: "bg-[#2f1f0f]",
    borderColor: "border-[#ffa657]/30",
    domainNumbers: [3],
    description:
      "Configure router interfaces, static routes, and dynamic routing protocols. Understand longest-prefix matching and route redistribution.",
    freeAccess: false,
  },
  {
    id: 5,
    title: "Network Security",
    subtitle: "ACLs, device hardening & NAT",
    icon: Shield,
    color: "#f85149",
    bgColor: "bg-[#2f0f0f]",
    borderColor: "border-[#f85149]/30",
    domainNumbers: [5],
    description:
      "Implement standard and extended ACLs, configure NAT/PAT, apply AAA, and harden device access with SSH, banners, and RADIUS.",
    freeAccess: false,
  },
  {
    id: 6,
    title: "IP Services & Automation",
    subtitle: "DHCP, DNS, NTP, SNMP, REST APIs",
    icon: Cpu,
    color: "#d29922",
    bgColor: "bg-[#2f2a0f]",
    borderColor: "border-[#d29922]/30",
    domainNumbers: [4, 6],
    description:
      "Configure DHCP, DNS, NTP. Explore SDN controllers, REST APIs, NETCONF/YANG, and Ansible playbooks for network automation.",
    freeAccess: false,
  },
  {
    id: 7,
    title: "CCNA Capstone",
    subtitle: "Full network build, verify & troubleshoot",
    icon: Trophy,
    color: "#d29922",
    bgColor: "bg-[#2f280a]",
    borderColor: "border-[#d29922]/50",
    domainNumbers: [1, 2, 3, 4, 5, 6],
    description:
      "Build a complete enterprise network from a blank config. Integrate all domains: routing, switching, security, and services. Your CCNA exam readiness checkpoint.",
    freeAccess: false,
  },
];

// ──────────────────────────────────────────────────────────────
// Stage completion calculation
// ──────────────────────────────────────────────────────────────
function getStageProgress(
  stage: CurriculumStage,
  topics: StudyTopic[],
  labs: StudyLab[]
) {
  const stageTopics = topics.filter((t) =>
    stage.domainNumbers.includes(t.domain_number)
  );
  const stageLabs = labs.filter((l) => {
    const topic = topics.find((t) => t.id === l.topic);
    return topic && stage.domainNumbers.includes(topic.domain_number);
  });

  const completedLabs = stageLabs.filter(
    (l) => l.user_attempt?.status === "completed"
  ).length;

  return {
    topicCount: stageTopics.length,
    labCount: stageLabs.length,
    completedLabs,
    labs: stageLabs,
    topics: stageTopics,
    completionPct:
      stageLabs.length > 0
        ? Math.round((completedLabs / stageLabs.length) * 100)
        : 0,
  };
}

// ──────────────────────────────────────────────────────────────
// Stage Card
// ──────────────────────────────────────────────────────────────
function StageCard({
  stage,
  stageIndex,
  progress,
  isExpanded,
  onToggle,
  onOpenLab,
  onGenerateQuestions,
}: {
  stage: CurriculumStage;
  stageIndex: number;
  progress: ReturnType<typeof getStageProgress>;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenLab: (lab: StudyLab) => void;
  onGenerateQuestions: (topicId: number) => void;
}) {
  const Icon = stage.icon;
  const isCompleted = progress.completionPct === 100 && progress.labCount > 0;
  const isStarted = progress.completedLabs > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? `${stage.borderColor} shadow-lg shadow-black/20`
          : "border-[#30363d] hover:border-[#58a6ff]/20"
      } bg-[#161b22]`}
    >
      {/* Stage header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left group"
      >
        {/* Stage number + completion */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm ${
              isCompleted
                ? "bg-[#3fb950]/20 border border-[#3fb950]/50"
                : isStarted
                ? `${stage.bgColor} border ${stage.borderColor}`
                : "bg-[#21262d] border border-[#30363d]"
            }`}
            style={!isCompleted && !isStarted ? {} : {}}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-[#3fb950]" />
            ) : (
              <span style={{ color: isStarted ? stage.color : "#8b949e" }}>
                {stageIndex + 1}
              </span>
            )}
          </div>
          {/* Connection line below (except last stage) */}
          {stageIndex < CCNA_STAGES.length - 1 && (
            <div
              className={`absolute -bottom-[1.625rem] left-1/2 -translate-x-1/2 w-px h-6 ${
                isCompleted ? "bg-[#3fb950]/50" : "bg-[#30363d]"
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-bold"
              style={{ color: isStarted || isExpanded ? stage.color : "#e6edf3" }}
            >
              {stage.title}
            </span>
            {!stage.freeAccess && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/30 font-mono font-bold uppercase tracking-wide">
                Premium
              </span>
            )}
            {stage.freeAccess && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/30 font-mono font-bold uppercase tracking-wide">
                Free
              </span>
            )}
            {isCompleted && (
              <Star className="w-3.5 h-3.5 text-[#d29922] fill-[#d29922]" />
            )}
          </div>
          <div className="text-xs text-[#8b949e] mt-0.5">{stage.subtitle}</div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-[#8b949e] shrink-0">
          <div className="text-center">
            <div className="font-bold text-[#e6edf3]">{progress.topicCount}</div>
            <div>topics</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-[#e6edf3]">{progress.labCount}</div>
            <div>labs</div>
          </div>
          {progress.labCount > 0 && (
            <div className="text-center">
              <div
                className="font-bold"
                style={{
                  color:
                    progress.completionPct === 100
                      ? "#3fb950"
                      : progress.completionPct > 0
                      ? stage.color
                      : "#8b949e",
                }}
              >
                {progress.completionPct}%
              </div>
              <div>done</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progress.labCount > 0 && (
          <div className="hidden md:block w-24 shrink-0">
            <div className="h-1 rounded-full bg-[#21262d] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress.completionPct}%`,
                  background:
                    progress.completionPct === 100 ? "#3fb950" : stage.color,
                }}
              />
            </div>
          </div>
        )}

        <div className="shrink-0 text-[#8b949e]">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[#30363d] p-4 space-y-4">
          <p className="text-xs text-[#8b949e] leading-relaxed">
            {stage.description}
          </p>

          {/* Labs in this stage */}
          {progress.labs.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" style={{ color: stage.color }} />
                Hands-On Labs
              </div>
              <div className="space-y-2">
                {progress.labs.map((lab) => {
                  const attempt = lab.user_attempt;
                  const isLabDone = attempt?.status === "completed";
                  const isLabProgress = attempt?.status === "in_progress";
                  const labScore = attempt?.checker_results?.score;

                  return (
                    <div
                      key={lab.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isLabDone
                          ? "border-[#3fb950]/20 bg-[#3fb950]/5"
                          : "border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]/30"
                      }`}
                    >
                      <div className="shrink-0">
                        {isLabDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
                        ) : isLabProgress ? (
                          <Play className="w-4 h-4 text-[#d29922]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#8b949e]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isLabDone ? "text-[#3fb950]" : "text-[#e6edf3]"
                            }`}
                          >
                            {lab.title}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                              lab.difficulty === "beginner"
                                ? "bg-[#3fb950]/10 text-[#3fb950]"
                                : lab.difficulty === "intermediate"
                                ? "bg-[#d29922]/10 text-[#d29922]"
                                : "bg-[#f85149]/10 text-[#f85149]"
                            }`}
                          >
                            {lab.difficulty}
                          </span>
                          {labScore !== undefined && labScore !== null && (
                            <span className="text-[9px] font-mono font-bold text-[#3fb950]">
                              {labScore}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8b949e]">
                          <Clock className="w-3 h-3" />
                          <span>~{lab.estimated_time_minutes} min</span>
                          <span>•</span>
                          <span>{lab.step_by_step_tasks?.length || 0} tasks</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onOpenLab(lab)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors border border-[#30363d]"
                        >
                          Preview
                        </button>
                        <Link
                          href={`/dashboard/study/labs/${lab.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                          style={{
                            background: isLabDone
                              ? "rgba(63, 185, 80, 0.1)"
                              : `${stage.color}20`,
                            color: isLabDone ? "#3fb950" : stage.color,
                            border: `1px solid ${
                              isLabDone ? "rgba(63,185,80,0.3)" : `${stage.color}40`
                            }`,
                          }}
                        >
                          <Zap className="w-3 h-3" />
                          {isLabDone ? "Redo" : "Launch"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topics in this stage */}
          {progress.topics.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#58a6ff]" />
                Blueprint Topics ({progress.topics.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {progress.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#21262d] border border-[#30363d] text-[10px] text-[#e6edf3] group"
                  >
                    <span className="text-[#8b949e] font-mono">
                      {topic.blueprint_ref}
                    </span>
                    <span className="truncate max-w-[120px]">{topic.name}</span>
                    <button
                      onClick={() => onGenerateQuestions(topic.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d2a8ff] hover:text-[#e6edf3]"
                      title="Generate questions"
                    >
                      <Zap className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {!stage.freeAccess && progress.completedLabs === 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#d29922]/5 border border-[#d29922]/20">
              <div className="flex items-center gap-2 text-[11px] text-[#d29922]">
                <Lock className="w-3.5 h-3.5" />
                <span>Premium stage — all labs & content included</span>
              </div>
              <Link
                href="/dashboard/study/exam?cert=CCNA-200-301&mode=timed_mock"
                className="text-[10px] font-bold text-[#d29922] border border-[#d29922]/30 px-2.5 py-1 rounded-lg hover:bg-[#d29922]/10 transition-colors"
              >
                Start Practice →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export function CurriculumStages({
  topics,
  labs,
  onOpenLab,
  onGenerateQuestions,
}: CurriculumStagesProps) {
  const [expandedStage, setExpandedStage] = React.useState<number | null>(1);

  // Overall completion
  const completedLabs = labs.filter(
    (l) => l.user_attempt?.status === "completed"
  ).length;
  const overallPct =
    labs.length > 0 ? Math.round((completedLabs / labs.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-[#e6edf3]">
            CCNA 200-301 — Learning Path
          </div>
          <div className="text-[11px] font-mono text-[#8b949e]">
            {completedLabs}/{labs.length} labs completed
          </div>
        </div>
        <div className="relative h-2 rounded-full bg-[#21262d] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${overallPct}%`,
              background:
                "linear-gradient(90deg, #58a6ff 0%, #3fb950 50%, #d29922 100%)",
            }}
          />
        </div>
        <div className="grid grid-cols-7 gap-1 text-[8px] font-mono text-[#8b949e]">
          {CCNA_STAGES.map((s, i) => {
            const prog = getStageProgress(s, topics, labs);
            return (
              <div
                key={s.id}
                className="text-center cursor-pointer hover:text-[#e6edf3] transition-colors"
                onClick={() => setExpandedStage(expandedStage === s.id ? null : s.id)}
              >
                <div
                  className="w-full h-1 rounded-full mb-1 transition-all"
                  style={{
                    background:
                      prog.completionPct === 100
                        ? "#3fb950"
                        : prog.completionPct > 0
                        ? s.color
                        : "#21262d",
                  }}
                />
                S{i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage cards */}
      <div className="space-y-3">
        {CCNA_STAGES.map((stage, i) => {
          const progress = getStageProgress(stage, topics, labs);
          return (
            <StageCard
              key={stage.id}
              stage={stage}
              stageIndex={i}
              progress={progress}
              isExpanded={expandedStage === stage.id}
              onToggle={() =>
                setExpandedStage(expandedStage === stage.id ? null : stage.id)
              }
              onOpenLab={onOpenLab}
              onGenerateQuestions={onGenerateQuestions}
            />
          );
        })}
      </div>
    </div>
  );
}
