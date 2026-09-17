"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Save,
  Trash2,
  Printer,
  Plus,
  Clock,
  Building2,
  Briefcase,
  UserCheck,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  Sliders,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Edit3,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface CoverLetterData {
  id?: number;
  title: string;
  company: string;
  role: string;
  recipient: string;
  job_description: string;
  tone: string;
  include_photo: boolean;
  content: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PROFILE = {
  name: "Khalfan Athman",
  title: "Senior Software Engineer & Cloud Architect",
  email: "contact@khalfanathman.dev",
  phone: "+254 792 570 913",
  location: "Nairobi, Kenya",
  portfolio: "https://khalfanathman.dev",
  linkedin: "https://linkedin.com/in/khalfanathman",
  github: "https://github.com/AbuArwa001",
  avatarUrl: "https://avatars.githubusercontent.com/u/88195864?v=4",
};

const DEFAULT_LETTER_BODY = `Dear Hiring Team,

I am writing to express my strong enthusiasm for the [Role] position at [Company]. With extensive hands-on expertise architecting high-availability backend microservices, enterprise cloud infrastructures (AWS, OCI), and modern full-stack web applications, I have consistently driven measurable outcomes and engineering resilience across distributed systems.

Throughout my career, I have specialized in building robust Python/Django REST Framework APIs, resilient PostgreSQL data pipelines, and responsive Next.js frontends. Notably, my work entails designing multi-region serverless architectures, implementing zero-trust IAM governance, and accelerating deployment pipelines with CI/CD automation. I take pride in engineering systems that not only scale reliably under peak loads, but also deliver intuitive, low-latency user experiences.

What excites me particularly about [Company] is your commitment to technical innovation and high-impact solutions. The challenges presented in this role align seamlessly with my track record of decomposing complex requirements into elegant, high-throughput software architectures while mentoring cross-functional engineering teams.

I would welcome the opportunity to discuss how my technical acumen, cloud certifications (AWS, Cisco, Oracle), and relentless focus on software excellence can drive tangible value for [Company]. Thank you for your time and consideration.

Sincerely,

Khalfan Athman
Senior Software Engineer & Cloud Architect`;

export default function CoverLetterPage() {
  const { data: session } = useSession();
  const [letters, setLetters] = React.useState<CoverLetterData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [generatingAI, setGeneratingAI] = React.useState(false);
  const [notification, setNotification] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Active letter state
  const [activeLetterId, setActiveLetterId] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("Senior Engineer Application");
  const [company, setCompany] = React.useState("Tech Vanguard Corp");
  const [role, setRole] = React.useState("Senior Backend & Cloud Engineer");
  const [recipient, setRecipient] = React.useState("Hiring Manager & Engineering Leadership");
  const [jobDescription, setJobDescription] = React.useState("");
  const [tone, setTone] = React.useState("Confident & Technical");
  const [includePhoto, setIncludePhoto] = React.useState(false);
  const [content, setContent] = React.useState(DEFAULT_LETTER_BODY);
  const [aiCustomPrompt, setAiCustomPrompt] = React.useState("");

  const apiUrl = getApiUrl();

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch saved letters from backend
  const fetchLetters = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v1/letters/`);
      if (res.ok) {
        const data = await res.json();
        const letterList = Array.isArray(data) ? data : data.results || [];
        setLetters(letterList);
      }
    } catch (err) {
      console.error("Failed to load cover letters:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  // Load a letter from history
  const handleSelectLetter = (item: CoverLetterData) => {
    setActiveLetterId(item.id || null);
    setTitle(item.title || "Untitled Application");
    setCompany(item.company || "");
    setRole(item.role || "");
    setRecipient(item.recipient || "Hiring Team");
    setJobDescription(item.job_description || "");
    setTone(item.tone || "Confident & Technical");
    setIncludePhoto(item.include_photo || false);
    setContent(item.content || "");
    showNotification(`Loaded draft for ${item.company || "application"}`);
  };

  // Create new blank letter
  const handleNewLetter = () => {
    setActiveLetterId(null);
    setTitle("New Application Letter");
    setCompany("");
    setRole("");
    setRecipient("Hiring Manager");
    setJobDescription("");
    setTone("Confident & Technical");
    setIncludePhoto(false);
    setContent(
      DEFAULT_LETTER_BODY.replace(/\[Role\]/g, "Software Engineer").replace(/\[Company\]/g, "your organization")
    );
    showNotification("Created new draft");
  };

  // Save or Update Letter in DRF backend
  const handleSaveLetter = async () => {
    try {
      setSaving(true);
      const payload: CoverLetterData = {
        title: title || `${role} - ${company}`,
        company,
        role,
        recipient,
        job_description: jobDescription,
        tone,
        include_photo: includePhoto,
        content,
      };

      const url = activeLetterId
        ? `${apiUrl}/api/v1/letters/${activeLetterId}/`
        : `${apiUrl}/api/v1/letters/`;
      const method = activeLetterId ? "PUT" : "POST";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to save: HTTP ${res.status}`);
      }

      const saved = await res.json();
      setActiveLetterId(saved.id);
      showNotification(`Successfully saved to database!`);
      fetchLetters();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Error saving cover letter", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete letter permanently from DRF backend
  const handleDeleteLetter = async (id: number) => {
    if (!confirm("Are you sure you want to delete this letter permanently from the database?")) {
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(`${apiUrl}/api/v1/letters/${id}/`, {
        method: "DELETE",
        headers,
      });

      if (res.ok || res.status === 204) {
        showNotification("Letter deleted from database");
        if (activeLetterId === id) {
          handleNewLetter();
        }
        fetchLetters();
      } else {
        throw new Error(`Delete failed with status ${res.status}`);
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to delete letter", "error");
    }
  };

  // AI-Assisted Tailoring Engine
  const handleGenerateAI = async (preset?: string) => {
    setGeneratingAI(true);
    try {
      const targetRole = role || "Senior Software Engineer";
      const targetCompany = company || "your company";
      const toneDescriptor = tone || "Confident & Technical";

      // Simulate realistic AI generation with rich Khalfan domain knowledge
      await new Promise((r) => setTimeout(r, 1200));

      let generated = "";

      if (preset === "devops" || aiCustomPrompt.toLowerCase().includes("cloud") || aiCustomPrompt.toLowerCase().includes("devops")) {
        generated = `Dear ${recipient || "Hiring Team"} at ${targetCompany},

I am writing to express my eager interest in the ${targetRole} opening at ${targetCompany}. Bringing demonstrated proficiency as a certified AWS Solutions Architect and Oracle Cloud Infrastructure specialist, I specialize in architecting highly scalable, immutable cloud topologies, zero-downtime CI/CD workflows, and containerized microservices.

Throughout my engineering tenure, I have engineered production environments leveraging Docker, Kubernetes, Terraform (IaC), and resilient DRF/PostgreSQL services. A recurring theme in my career has been optimizing system throughput, reducing infrastructure costs through intelligent auto-scaling, and enforcing strict compliance and automated monitoring pipelines. At ${targetCompany}, where operational reliability and agility are paramount, I can immediately streamline delivery cycles and elevate infrastructure robustness.

${jobDescription ? `Reviewing your stated requirements regarding ${jobDescription.slice(0, 180)}..., my background directly addresses these objectives through proven production implementations and automation first-principles.` : `I have consistently championed proactive infrastructure telemetry, distributed tracing, and fault-tolerant architecture across cloud-native ecosystems.`}

I look forward to discussing how my cloud architecture background, automation discipline, and certified engineering rigor can contribute to ${targetCompany}'s continued growth. Thank you for your consideration.

Sincerely,

Khalfan Athman
Senior Software Engineer & Cloud Architect`;
      } else if (preset === "fullstack" || aiCustomPrompt.toLowerCase().includes("frontend") || aiCustomPrompt.toLowerCase().includes("fullstack")) {
        generated = `Dear ${recipient || "Hiring Team"} at ${targetCompany},

I am thrilled to submit my application for the ${targetRole} role at ${targetCompany}. With deep hands-on expertise spanning modern React/Next.js architectures, TypeScript, and high-performance Python/Django backend APIs, I build end-to-end digital experiences that are blazingly fast, visually captivating, and architecturally resilient.

In my recent projects, I have designed sophisticated state-driven interfaces, built real-time WebSocket communication layers, and crafted mission-critical RESTful microservices. My approach balances aesthetic precision with algorithmic efficiency: every user-facing interaction is backed by clean, type-safe code, rigorous testing, and optimized database queries.

${jobDescription ? `Given ${targetCompany}'s focus on ${jobDescription.slice(0, 160)}..., my experience bridging complex system logic with intuitive user journeys makes me uniquely equipped to deliver immediate velocity.` : `I excel in environments that demand rapid innovation without compromising on software craft or maintainability.`}

I would welcome the opportunity to discuss how my end-to-end full-stack capabilities can help propel ${targetCompany}'s product roadmap forward. Thank you for your time and consideration.

Sincerely,

Khalfan Athman
Senior Software Engineer & Cloud Architect`;
      } else {
        generated = `Dear ${recipient || "Hiring Team"} at ${targetCompany},

It is with keen interest that I apply for the ${targetRole} position at ${targetCompany}. As a software engineer dedicated to building scalable distributed systems and cloud infrastructure, I bring a proven track record of architecting high-reliability software that translates complex organizational goals into tangible engineering results.

My technical foundation is rooted in Python, Django REST Framework, modern web frameworks, relational database optimization, and cloud architecture (AWS & OCI). Over the course of various mission-critical initiatives, I have spearheaded system refactors, designed robust RESTful and asynchronous architectures, and implemented automated deployment pipelines that elevated deployment frequency and system uptime.

${jobDescription ? `Your requirements for ${jobDescription.slice(0, 180)}... resonate deeply with my hands-on background. I have repeatedly solved similar challenges by combining structured architectural patterns with pragmatic execution.` : `I thrive in collaborative, high-standard teams where engineering excellence, clean design, and continuous improvement are prioritized.`}

I am eager to bring my problem-solving drive and technical leadership to ${targetCompany}. Thank you for your review, and I look forward to the possibility of speaking with you soon.

Sincerely,

Khalfan Athman
Senior Software Engineer & Cloud Architect`;
      }

      setContent(generated);
      showNotification("AI generated letter based on your parameters!");
    } catch (err) {
      showNotification("AI generation encountered an error", "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Trigger browser print for pristine PDF generation
  const handlePrint = () => {
    window.print();
  };

  // Render dynamic date
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 backdrop-blur-xl"
              : "bg-red-500/15 border-red-500/30 text-red-300 backdrop-blur-xl"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner & Actions (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Application Architect
            </span>
            {activeLetterId ? (
              <span className="text-[11px] font-mono text-emerald-500">
                • DB Record #{activeLetterId}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-400">
                • Unsaved Draft
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Application Letter Architect
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Craft, AI-tailor, save to database, and download executive cover letters without dashboard chrome.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewLetter}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200/80 dark:bg-white/[0.05] hover:bg-slate-300 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white border border-slate-300 dark:border-white/[0.08] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Draft</span>
          </button>

          <button
            onClick={handleSaveLetter}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{activeLetterId ? "Update in DB" : "Save to DB"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Controls / Right Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls, AI Tailor & Database Retrieval (Print Hidden) */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
          {/* Saved Letters Accordion / History Drawer */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                  Saved Letters in Database ({letters.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Persistent Records</span>
            </div>

            <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading saved letters...</div>
              ) : letters.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No letters stored in database yet. Save your first one!
                </div>
              ) : (
                letters.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      activeLetterId === item.id
                        ? "bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300 font-medium"
                        : "bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                    }`}
                    onClick={() => handleSelectLetter(item)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">
                          {item.company || "Unnamed Company"}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.role || "Role"} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Saved"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.id) handleDeleteLetter(item.id);
                        }}
                        className="p-1 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete letter from database"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form Fields: Role, Company, Recipient */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
              <Building2 className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                Application Target Parameters
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Safaricom"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Cloud Architect"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Recipient Title / Name
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Engineering Director"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Writing Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Confident & Technical">Confident & Technical</option>
                  <option value="Executive & Strategic">Executive & Strategic</option>
                  <option value="Innovative & Enthusiastic">Innovative & Enthusiastic</option>
                  <option value="Concise & Impact-Driven">Concise & Impact-Driven</option>
                </select>
              </div>
            </div>

            {/* Photo Toggle */}
            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Include Headshot in Letterhead
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Clean portrait header (Toggle off for strict ATS single-column)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIncludePhoto(!includePhoto)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  includePhoto ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    includePhoto ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* AI Tailoring Assistant */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-blue-950/20 to-slate-900/40 dark:bg-[#0c1222]/90 backdrop-blur-xl border border-indigo-500/30 dark:border-indigo-500/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-heading">
                  AI Letter Co-Pilot
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Admin Exclusive
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Job Requirements / Keywords (Optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste snippets from job posting e.g. 'Seeking AWS architect with Terraform, Docker, Django microservices...'"
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleGenerateAI("devops")}
                disabled={generatingAI}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                ⚡ DevOps & Cloud Focus
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAI("fullstack")}
                disabled={generatingAI}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                ⚡ Full-Stack & React Focus
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAI("general")}
                disabled={generatingAI}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                ⚡ Executive Leadership
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleGenerateAI()}
              disabled={generatingAI}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-primary hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {generatingAI ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Letter with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Generate & Tailor Letter with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Document Canvas (Pure White Sheet with Letterhead) */}
        <div className="lg:col-span-7">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-8 sm:p-12 transition-all min-h-[750px] relative font-sans leading-relaxed print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none">
            {/* Pristine Executive Letterhead */}
            <div className="border-b-2 border-slate-900/90 pb-6 mb-8 flex items-start justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-heading uppercase">
                  {DEFAULT_PROFILE.name}
                </h2>
                <div className="text-xs sm:text-sm font-semibold tracking-wider text-blue-700 uppercase mt-0.5">
                  {DEFAULT_PROFILE.title}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-3 font-medium">
                  <span>{DEFAULT_PROFILE.email}</span>
                  <span>•</span>
                  <span>{DEFAULT_PROFILE.phone}</span>
                  <span>•</span>
                  <span>{DEFAULT_PROFILE.location}</span>
                  <span>•</span>
                  <a href={DEFAULT_PROFILE.portfolio} className="text-blue-600 hover:underline">
                    khalfanathman.dev
                  </a>
                </div>
              </div>

              {/* Optional Tasteful Portrait Avatar */}
              {includePhoto && (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm flex-shrink-0 ml-4">
                  <img
                    src={DEFAULT_PROFILE.avatarUrl}
                    alt={DEFAULT_PROFILE.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Date & Recipient Block */}
            <div className="mb-6 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">{todayFormatted}</div>
              <div className="pt-2 font-bold text-slate-900">{recipient || "Hiring Team"}</div>
              <div className="font-semibold text-slate-800">{company || "Target Organization"}</div>
              <div className="text-slate-500">Re: Application for {role || "Open Position"}</div>
            </div>

            {/* Letter Body - Editable Directly in Canvas */}
            <div className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none resize-none selection:bg-blue-100 p-0"
                placeholder="Compose your application letter here..."
              />
            </div>

            {/* Formal Footer / Signature */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Executive Cover Letter • {DEFAULT_PROFILE.name}</span>
              <span>Generated & Tailored via Portfolio Mission Control</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
