"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  ExternalLink,
  Search,
  Sparkles,
  MessageSquare,
  Calendar,
  Layers,
  ChevronRight,
  Briefcase,
  AlertCircle,
  X,
  CheckCircle2,
  Award,
  Terminal,
  RefreshCw,
  Send,
  ArrowLeft,
  ArrowRight,
  User,
  Bot,
  HelpCircle,
  Check,
  BookOpen,
  Clock,
  Zap,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  ThumbsUp,
  ShieldAlert,
} from "lucide-react";
import {
  getStudyOrganizations,
  createStudyOrganization,
  updateStudyOrganization,
  deleteStudyOrganization,
  generateInterviewBrief,
  getAvailableApplications,
  importJobApplication,
  getMockInterviews,
  startMockInterview,
  respondToMockInterview,
  finishMockInterview,
  getStudyTopics,
} from "@/lib/study-api";
import type {
  StudyOrganization,
  StudyInterviewBrief,
  StudyMockInterview,
  StudyTopic,
  AvailableApplication,
} from "@/types/study";

const STATUS_COLORS: Record<string, string> = {
  Wishlist: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  Applied: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Interviewing: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold animate-pulse",
  Offer: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold",
  Rejected: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

export default function InterviewPrepPage() {
  const [organizations, setOrganizations] = React.useState<StudyOrganization[]>([]);
  const [topics, setTopics] = React.useState<StudyTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("All");

  // Selected Org for Deep-Dive Workspace
  const [activeOrgId, setActiveOrgId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<"brief" | "mock" | "notes">("brief");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [availableApps, setAvailableApps] = React.useState<AvailableApplication[]>([]);
  const [loadingApps, setLoadingApps] = React.useState(false);

  // Form State for Add Org
  const [companyName, setCompanyName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [companyUrl, setCompanyUrl] = React.useState("");
  const [jobPostingUrl, setJobPostingUrl] = React.useState("");
  const [status, setStatus] = React.useState<"Wishlist" | "Applied" | "Interviewing" | "Offer" | "Rejected">("Interviewing");
  const [rawJdText, setRawJdText] = React.useState("");
  const [submittingOrg, setSubmittingOrg] = React.useState(false);

  // Brief Generation State
  const [generatingBrief, setGeneratingBrief] = React.useState(false);
  const [briefInputText, setBriefInputText] = React.useState("");
  const [showBriefInputModal, setShowBriefInputModal] = React.useState(false);
  const [expandedTechQuestion, setExpandedTechQuestion] = React.useState<number | null>(0);
  const [expandedStarQuestion, setExpandedStarQuestion] = React.useState<number | null>(0);

  // Mock Interview State
  const [mockSession, setMockSession] = React.useState<StudyMockInterview | null>(null);
  const [candidateMessage, setCandidateMessage] = React.useState("");
  const [mockMode, setMockMode] = React.useState<"mixed" | "technical" | "behavioral">("mixed");
  const [startingMock, setStartingMock] = React.useState(false);
  const [sendingTurn, setSendingTurn] = React.useState(false);
  const [evaluatingMock, setEvaluatingMock] = React.useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // Load Data
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [orgsData, topicsData] = await Promise.all([
        getStudyOrganizations().catch(() => []),
        getStudyTopics().catch(() => []),
      ]);
      setOrganizations(orgsData);
      setTopics(topicsData);

      // Auto-select first org if available
      if (orgsData.length > 0 && !activeOrgId) {
        setActiveOrgId(orgsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load interview prep data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const activeOrg = React.useMemo(() => {
    return organizations.find((o) => o.id === activeOrgId) || organizations[0] || null;
  }, [organizations, activeOrgId]);

  // Scroll chat to bottom on transcript update
  React.useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mockSession?.transcript, sendingTurn]);

  // Load Mock Interviews when switching active Org
  React.useEffect(() => {
    if (activeOrg) {
      getMockInterviews(activeOrg.id)
        .then((mocks) => {
          if (mocks && mocks.length > 0) {
            setMockSession(mocks[0]);
          } else {
            setMockSession(null);
          }
        })
        .catch(() => setMockSession(null));
    }
  }, [activeOrg?.id]);

  // Handle Add Organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !role.trim()) return;

    try {
      setSubmittingOrg(true);
      const created = await createStudyOrganization({
        company_name: companyName.trim(),
        role: role.trim(),
        company_url: companyUrl.trim(),
        job_posting_url: jobPostingUrl.trim(),
        status,
        notes: rawJdText.trim() ? `Job Context:\n${rawJdText.trim()}` : "",
      });

      // If raw text was provided, immediately generate brief
      if (rawJdText.trim() || jobPostingUrl.trim()) {
        try {
          const brief = await generateInterviewBrief(created.id, { raw_text: rawJdText.trim() });
          created.brief = brief;
        } catch (bErr) {
          console.error("Error auto-generating brief:", bErr);
        }
      }

      setOrganizations((prev) => [created, ...prev]);
      setActiveOrgId(created.id);
      setIsAddModalOpen(false);

      // Reset
      setCompanyName("");
      setRole("");
      setCompanyUrl("");
      setJobPostingUrl("");
      setRawJdText("");
    } catch (err) {
      console.error("Failed to create organization:", err);
      alert("Failed to save organization. Please verify your connection.");
    } finally {
      setSubmittingOrg(false);
    }
  };

  // Open Applications Import Modal
  const handleOpenImportModal = async () => {
    setIsImportModalOpen(true);
    try {
      setLoadingApps(true);
      const apps = await getAvailableApplications();
      setAvailableApps(apps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  // Handle Import Application
  const handleImportApp = async (appId: number) => {
    try {
      const imported = await importJobApplication(appId);
      setOrganizations((prev) => {
        const filtered = prev.filter((o) => o.id !== imported.id);
        return [imported, ...filtered];
      });
      setActiveOrgId(imported.id);
      setIsImportModalOpen(false);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import application into interview prep.");
    }
  };

  // Handle Generate/Regenerate Brief
  const handleTriggerBriefGeneration = async () => {
    if (!activeOrg) return;
    try {
      setGeneratingBrief(true);
      const brief = await generateInterviewBrief(activeOrg.id, { raw_text: briefInputText });
      setOrganizations((prev) =>
        prev.map((o) => (o.id === activeOrg.id ? { ...o, brief } : o))
      );
      setShowBriefInputModal(false);
      setBriefInputText("");
    } catch (err) {
      console.error("Failed to generate brief:", err);
      alert("Failed to generate interview brief.");
    } finally {
      setGeneratingBrief(false);
    }
  };

  // Start Mock Interview Session
  const handleStartMock = async () => {
    if (!activeOrg) return;
    try {
      setStartingMock(true);
      const session = await startMockInterview(activeOrg.id, {
        role_title: activeOrg.role,
        mode: mockMode,
      });
      setMockSession(session);
      setActiveTab("mock");
    } catch (err) {
      console.error("Failed to start mock interview:", err);
      alert("Could not start mock interview.");
    } finally {
      setStartingMock(false);
    }
  };

  // Send Candidate Message in Mock Interview
  const handleSendCandidateTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mockSession || !candidateMessage.trim() || sendingTurn) return;

    const messageText = candidateMessage.trim();
    setCandidateMessage("");

    // Optimistically append candidate turn
    const updatedTranscript = [
      ...mockSession.transcript,
      {
        role: "candidate" as const,
        content: messageText,
        timestamp: new Date().toISOString(),
      },
    ];
    setMockSession({ ...mockSession, transcript: updatedTranscript });

    try {
      setSendingTurn(true);
      const res = await respondToMockInterview(mockSession.id, {
        candidate_message: messageText,
        mode: mockMode,
      });
      setMockSession((prev) =>
        prev
          ? {
              ...prev,
              transcript: res.transcript,
              is_completed: res.is_completed,
            }
          : null
      );
    } catch (err) {
      console.error("Error submitting mock response:", err);
      alert("Failed to receive interviewer response. Please try again.");
    } finally {
      setSendingTurn(false);
    }
  };

  // Finish and Evaluate Mock Interview
  const handleFinishMock = async () => {
    if (!mockSession) return;
    try {
      setEvaluatingMock(true);
      const finalized = await finishMockInterview(mockSession.id);
      setMockSession(finalized);
      // Update score in org list
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === activeOrg?.id
            ? { ...o, latest_mock_score: finalized.overall_score }
            : o
        )
      );
    } catch (err) {
      console.error("Failed to evaluate mock:", err);
      alert("Failed to evaluate mock interview.");
    } finally {
      setEvaluatingMock(false);
    }
  };

  // Filter organizations
  const filteredOrgs = organizations.filter((o) => {
    const matchesSearch =
      o.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" || o.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalOrgs = organizations.length;
  const briefsCount = organizations.filter((o) => !!o.brief).length;
  const interviewingCount = organizations.filter((o) => o.status === "Interviewing").length;
  const avgMockScore = React.useMemo(() => {
    const scores = organizations
      .map((o) => o.latest_mock_score)
      .filter((s): s is number => typeof s === "number" && s > 0);
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [organizations]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Metrics Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Module C: Organization Intelligence
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Role Match & Mock Simulator
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Organization Interview Preparation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Target company intelligence, job requirements mapped directly to your portfolio projects, STAR behavioral framework outlines, and an interactive Claude mock interview simulator.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleOpenImportModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4 text-purple-500" />
            <span>Import Job Application</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Target Company</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Target Companies</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{totalOrgs}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Pipelines</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{interviewingCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dossiers Ready</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {briefsCount} / {totalOrgs}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Mock Score</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {avgMockScore ? `${avgMockScore}/100` : "No Mocks Yet"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Column (Target Orgs Selector) + Right Column (Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Organization List & Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <span>Target Companies</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {filteredOrgs.length} shown
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies or roles..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Status Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {["All", "Interviewing", "Applied", "Wishlist", "Offer"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                    selectedStatus === st
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Organizations Scroll List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  Loading target companies...
                </div>
              ) : filteredOrgs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Building2 className="w-6 h-6 mx-auto opacity-40 text-slate-400" />
                  <div>No companies match your search.</div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-purple-500 hover:underline font-medium text-[11px]"
                  >
                    Add a new company
                  </button>
                </div>
              ) : (
                filteredOrgs.map((org) => {
                  const isSelected = org.id === activeOrg?.id;
                  const hasBrief = !!org.brief;
                  return (
                    <div
                      key={org.id}
                      onClick={() => setActiveOrgId(org.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-50/70 dark:bg-purple-950/20 border-purple-500/80 shadow-sm ring-1 ring-purple-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {org.company_name}
                          </h3>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {org.role}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] border font-mono shrink-0 ${
                            STATUS_COLORS[org.status] || STATUS_COLORS.Wishlist
                          }`}
                        >
                          {org.status}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          {hasBrief ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Dossier Ready</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              Brief Unbuilt
                            </span>
                          )}
                        </div>

                        {typeof org.latest_mock_score === "number" && org.latest_mock_score > 0 ? (
                          <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                            Mock: {org.latest_mock_score}/100
                          </span>
                        ) : (
                          <span className="text-slate-400">No Mock</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Workspace for Active Organization (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeOrg ? (
            <div className="space-y-5">
              {/* Organization Header Banner */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {activeOrg.company_name}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] border font-mono ${
                          STATUS_COLORS[activeOrg.status] || STATUS_COLORS.Wishlist
                        }`}
                      >
                        {activeOrg.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {activeOrg.role}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeOrg.company_url && (
                      <a
                        href={activeOrg.company_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Website</span>
                      </a>
                    )}

                    {activeOrg.job_posting_url && (
                      <a
                        href={activeOrg.job_posting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Job Posting</span>
                      </a>
                    )}

                    <button
                      onClick={() => setShowBriefInputModal(true)}
                      disabled={generatingBrief}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-sm shadow-purple-600/20 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{activeOrg.brief ? "Regenerate Brief" : "Generate Brief"}</span>
                    </button>
                  </div>
                </div>

                {/* Workspace Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pt-2 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab("brief")}
                    className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === "brief"
                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>AI Prep Dossier</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("mock")}
                    className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === "mock"
                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Mock Interview Simulator</span>
                    {mockSession && !mockSession.is_completed && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === "notes"
                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Prep Notes & Contacts</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: AI PREP DOSSIER */}
              {activeTab === "brief" && (
                <div className="space-y-5">
                  {!activeOrg.brief ? (
                    <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          No Prep Dossier Generated Yet
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Claude will analyze {activeOrg.company_name}, cross-reference requirements against your portfolio projects, and construct predicted questions with STAR answers.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBriefInputModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-sm shadow-purple-600/20"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Dossier Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Section 1: Company Intelligence & Tech Stack */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-500" />
                            <span>Company Architecture & Tech Intelligence</span>
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            Claude AI Analysis
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          {activeOrg.brief.company_summary}
                        </p>

                        <div>
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Likely Core Technology Stack & Infrastructure
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeOrg.brief.tech_stack.map((tech, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Role Requirements to Portfolio Match Matrix */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-500" />
                            <span>Requirements to Portfolio Proof Matrix</span>
                          </h3>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            Personalized
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          How to map your actual portfolio projects (AWS Multi-Tier VPC, SeaFood Platform, etc.) to what this role demands.
                        </p>

                        <div className="space-y-3">
                          {activeOrg.brief.role_requirements_map?.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {item.requirement}
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                                    item.match_strength === "High"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  {item.match_strength || "High"} Match
                                </span>
                              </div>

                              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                                <span className="text-slate-500 dark:text-slate-400">Your Portfolio Proof: </span>
                                {item.candidate_skill_or_project || (item.matched_skills ? item.matched_skills.join(", ") : "AWS High-Availability & Cisco CCNA")}
                              </div>

                              {item.recommended_angle && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
                                  <span className="font-bold text-slate-900 dark:text-white">Recommended Pitch Angle: </span>
                                  {item.recommended_angle}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Predicted Technical Questions & Deep-Dive Answers */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-blue-500" />
                            <span>Predicted Technical Interview Questions</span>
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            {activeOrg.brief.technical_questions?.length || 0} Questions
                          </span>
                        </div>

                        <div className="space-y-3">
                          {activeOrg.brief.technical_questions?.map((tq, idx) => {
                            const isExpanded = expandedTechQuestion === idx;
                            return (
                              <div
                                key={idx}
                                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 transition-all"
                              >
                                <button
                                  onClick={() =>
                                    setExpandedTechQuestion(isExpanded ? null : idx)
                                  }
                                  className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                  <div className="space-y-1">
                                    {tq.category && (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        {tq.category}
                                      </span>
                                    )}
                                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                      {tq.question}
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Expert Suggested Answer Structure
                                      </div>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                        {tq.suggested_answer}
                                      </p>
                                    </div>

                                    {tq.deep_dive_topics && tq.deep_dive_topics.length > 0 && (
                                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                        <span className="text-slate-400 font-bold">Blueprint Topics:</span>
                                        {tq.deep_dive_topics.map((tag, tIdx) => (
                                          <span
                                            key={tIdx}
                                            className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 4: Behavioral Questions (STAR Framework) */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-amber-500" />
                            <span>Behavioral Questions (STAR Framework Outlines)</span>
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            {activeOrg.brief.behavioral_star_questions?.length || 0} Questions
                          </span>
                        </div>

                        <div className="space-y-3">
                          {activeOrg.brief.behavioral_star_questions?.map((sq, idx) => {
                            const isExpanded = expandedStarQuestion === idx;
                            return (
                              <div
                                key={idx}
                                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
                              >
                                <button
                                  onClick={() =>
                                    setExpandedStarQuestion(isExpanded ? null : idx)
                                  }
                                  className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                  <div className="space-y-1">
                                    {sq.competency && (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                        {sq.competency}
                                      </span>
                                    )}
                                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                      {sq.question}
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-[10px] uppercase">
                                        Situation
                                      </span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                        {sq.situation || sq.star_situation}
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase">
                                        Task
                                      </span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                        {sq.task || sq.star_task}
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                                      <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-[10px] uppercase">
                                        Action
                                      </span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                        {sq.action || sq.star_action}
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase">
                                        Result
                                      </span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                        {sq.result || sq.star_result}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 5: Strategic Questions for Candidate to Ask Interviewer */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-500" />
                          <span>Thoughtful Questions to Ask the Interviewers</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeOrg.brief.questions_to_ask?.map((q, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                            >
                              <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 6: 30 / 60 / 90 Day Strategic Plan */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span>30 / 60 / 90 Day Study & Onboarding Roadmap</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: "day_30", label: "First 30 Days", color: "blue" },
                            { key: "day_60", label: "Days 31 to 60", color: "purple" },
                            { key: "day_90", label: "Days 61 to 90", color: "emerald" },
                          ].map(({ key, label, color }) => {
                            const planItem = (activeOrg.brief?.study_plan_30_60_90 as any)?.[key];
                            const title = planItem?.title || label;
                            const focusAreas: string[] = Array.isArray(planItem)
                              ? planItem
                              : planItem?.focus_areas || [];

                            return (
                              <div
                                key={key}
                                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400">
                                    {label}
                                  </span>
                                </div>
                                <div className="font-bold text-xs text-slate-900 dark:text-white">
                                  {title}
                                </div>
                                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                  {focusAreas.map((f, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-1.5">
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span className="leading-relaxed">{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 7: Linked Certification Topics Quick Launch */}
                      {activeOrg.linked_topic_details && activeOrg.linked_topic_details.length > 0 && (
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" />
                            <span>Linked Certification Topics Required by this Role</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeOrg.linked_topic_details.map((t) => (
                              <div
                                key={t.id}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                              >
                                <div>
                                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                                    {t.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Ref: {t.blueprint_ref || "Official Blueprint"}
                                  </div>
                                </div>
                                <Link
                                  href={`/dashboard/study/exam?topic=${t.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[10px] transition-colors"
                                >
                                  <span>Quiz</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MOCK INTERVIEW SIMULATOR */}
              {activeTab === "mock" && (
                <div className="space-y-4">
                  {/* Mock Launcher Bar if no active mock or completed */}
                  {(!mockSession || mockSession.is_completed) && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                          <Terminal className="w-4 h-4" />
                          <span>Interactive AI Technical Interview Simulator</span>
                        </div>
                        <p className="text-xs text-slate-300 max-w-lg">
                          Practice in real-time with Claude acting as the hiring manager for {activeOrg.company_name}. Choose your interview focus mode:
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px] font-bold">
                          {(["mixed", "technical", "behavioral"] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setMockMode(m)}
                              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                                mockMode === m
                                  ? "bg-purple-600 text-white"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleStartMock}
                          disabled={startingMock}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{startingMock ? "Starting..." : "Start New Mock"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Mock Session Chat Container */}
                  {mockSession && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[650px]">
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold font-mono text-sm border border-purple-500/20">
                            AI
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              <span>Interviewer at {activeOrg.company_name}</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold uppercase">
                                {mockMode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              Role: {mockSession.role_title}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!mockSession.is_completed && (
                            <button
                              onClick={handleFinishMock}
                              disabled={evaluatingMock || mockSession.transcript.length < 2}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{evaluatingMock ? "Evaluating..." : "Finish & Score"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Chat Messages Body */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans text-xs">
                        {mockSession.transcript.map((msg, idx) => {
                          const isInterviewer = msg.role === "interviewer" || msg.role === "system";
                          return (
                            <div
                              key={idx}
                              className={`flex gap-3 ${
                                isInterviewer ? "justify-start" : "justify-end"
                              }`}
                            >
                              {isInterviewer && (
                                <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-bold shrink-0 mt-1">
                                  <Bot className="w-4 h-4" />
                                </div>
                              )}

                              <div
                                className={`max-w-[82%] sm:max-w-[75%] p-4 rounded-2xl space-y-1.5 leading-relaxed shadow-sm ${
                                  isInterviewer
                                    ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-sm"
                                    : "bg-purple-600 text-white rounded-tr-sm"
                                }`}
                              >
                                <div className="text-[10px] opacity-70 font-mono font-bold">
                                  {isInterviewer ? `Interviewer (${activeOrg.company_name})` : "You (Candidate)"}
                                </div>
                                <div className="whitespace-pre-wrap text-xs sm:text-sm">
                                  {msg.content}
                                </div>
                              </div>

                              {!isInterviewer && (
                                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-mono font-bold shrink-0 mt-1">
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {sendingTurn && (
                          <div className="flex items-center gap-2 text-xs text-purple-500 font-mono p-2">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            <span>Interviewer is analyzing your response and formulating the next question...</span>
                          </div>
                        )}

                        <div ref={chatBottomRef} />
                      </div>

                      {/* Chat Input Bar (if active) */}
                      {!mockSession.is_completed ? (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                          <form onSubmit={handleSendCandidateTurn} className="flex gap-2">
                            <textarea
                              rows={3}
                              value={candidateMessage}
                              onChange={(e) => setCandidateMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  handleSendCandidateTurn();
                                }
                              }}
                              placeholder="Type your response here... (Tip: Structure with STAR format, reference exact protocols or AWS services, press Ctrl+Enter to submit)"
                              className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                            />
                            <button
                              type="submit"
                              disabled={!candidateMessage.trim() || sendingTurn}
                              className="px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              <span className="text-[10px]">Send</span>
                            </button>
                          </form>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">Enter</kbd> to submit</span>
                            <span>{candidateMessage.length} characters</span>
                          </div>
                        </div>
                      ) : (
                        /* Completed Evaluation Card */
                        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-500" />
                                <span className="text-base font-bold text-slate-900 dark:text-white">
                                  Interview Completed — Scorecard
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  {mockSession.feedback?.verdict || "Completed"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Overall score calculated across technical precision, architecture depth, and structured communication.
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-center p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Score</div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                                  {mockSession.overall_score}/100
                                </div>
                              </div>
                            </div>
                          </div>

                          {mockSession.feedback && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {mockSession.feedback.strengths && (
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Key Strengths Demonstrated</span>
                                  </div>
                                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                                    {mockSession.feedback.strengths.map((st, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-emerald-500">•</span>
                                        <span>{st}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {mockSession.feedback.weaknesses && (
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Recommended Improvement Areas</span>
                                  </div>
                                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                                    {mockSession.feedback.weaknesses.map((wk, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-amber-500">•</span>
                                        <span>{wk}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {mockSession.feedback?.detailed_feedback && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                              {mockSession.feedback.detailed_feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PREP NOTES & CONTACTS */}
              {activeTab === "notes" && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span>Company Notes & Interview Contacts</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Personal Preparation Notes
                    </label>
                    <textarea
                      rows={8}
                      value={activeOrg.notes || ""}
                      onChange={(e) => {
                        const newNotes = e.target.value;
                        setOrganizations((prev) =>
                          prev.map((o) =>
                            o.id === activeOrg.id ? { ...o, notes: newNotes } : o
                          )
                        );
                      }}
                      onBlur={() => {
                        updateStudyOrganization(activeOrg.id, { notes: activeOrg.notes }).catch(
                          console.error
                        );
                      }}
                      placeholder="Add interview dates, recruiter notes, salary ranges, questions you want to remember..."
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                    />
                    <div className="text-[10px] text-slate-400 text-right">
                      Changes are automatically saved when you leave the textarea.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Select a target company from the left column
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Or add a new organization to build an AI intelligence brief and practice mock interviews.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD TARGET ORGANIZATION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Add Target Organization
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Amazon Web Services, Cisco, Safaricom"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Role Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Cloud Solutions Architect, Network Engineer"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Application Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Wishlist">Wishlist</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Company Website URL
                  </label>
                  <input
                    type="url"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Job Posting URL (Optional)
                </label>
                <input
                  type="url"
                  value={jobPostingUrl}
                  onChange={(e) => setJobPostingUrl(e.target.value)}
                  placeholder="https://careers.company.com/job/12345"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Job Description / Requirements Text (Optional)
                </label>
                <textarea
                  rows={4}
                  value={rawJdText}
                  onChange={(e) => setRawJdText(e.target.value)}
                  placeholder="Paste the job description or requirements here to allow Claude to generate a highly tailored brief..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrg}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingOrg ? "Saving..." : "Save & Generate Brief"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT FROM JOB TRACKER */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Import from Job Application Tracker
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any role from your existing tracking spreadsheet or applications tracker. Claude will immediately synthesize a personalized interview dossier.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {loadingApps ? (
                <div className="p-8 text-center text-slate-400 font-mono">
                  Loading applications tracker data...
                </div>
              ) : availableApps.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No applications found in tracker.
                </div>
              ) : (
                availableApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-500/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {app.company}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {app.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                        {app.role}
                      </div>
                      {app.job_requirements && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {app.job_requirements}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleImportApp(app.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                        app.already_imported
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                      }`}
                    >
                      {app.already_imported ? "Re-Import" : "Import & Prep"}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE / REGENERATE BRIEF INPUT */}
      {showBriefInputModal && activeOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Generate Dossier for {activeOrg.company_name}
                </h3>
              </div>
              <button
                onClick={() => setShowBriefInputModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste recent job requirements, interview invitation notes, or recruiter messages. If left blank, Claude will research the company and role directly.
            </p>

            <textarea
              rows={6}
              value={briefInputText}
              onChange={(e) => setBriefInputText(e.target.value)}
              placeholder="Paste job posting text or specific interview topics here..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowBriefInputModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerBriefGeneration}
                disabled={generatingBrief}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generatingBrief ? "Synthesizing Dossier..." : "Generate with Claude"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
