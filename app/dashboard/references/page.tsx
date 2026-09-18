"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Quote,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Share2,
  Copy,
  Check,
  X,
  Send,
  MessageSquare,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface Reference {
  id?: number;
  name: string;
  title: string;
  company: string;
  relationship: string;
  quote: string;
  email: string;
  phone: string;
  linkedin: string;
  is_approved?: boolean;
  created_at?: string;
}

const empty = (): Reference => ({
  name: "",
  title: "",
  company: "",
  relationship: "",
  quote: "",
  email: "",
  phone: "",
  linkedin: "",
  is_approved: true,
});

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[42px] sm:min-h-0 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

export default function ReferencesManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${getApiUrl()}/api/v1/references/`;

  const getPortfolioUrl = () => {
    let url = process.env.NEXT_PUBLIC_PORTFOLIO_URL;
    if (!url || !url.trim()) {
      return process.env.NODE_ENV === "production"
        ? "https://www.khalfanathman.dev"
        : "http://localhost:3000";
    }
    return url.replace(/\/+$/, "");
  };

  const portfolioUrl = getPortfolioUrl();

  const [refs, setRefs] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Filter tab state
  const [activeTab, setActiveTab] = useState<"all" | "published" | "pending">("all");

  // Share / Invite Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => setRefs(Array.isArray(data) ? data : []))
      .catch(() => showToast("error", "Failed to load references from DRF API."))
      .finally(() => setLoading(false));
  }, [API]);

  const handleSave = async (ref: Reference, idx: number) => {
    if (!token) return showToast("error", "Authentication required.");
    setSaving(ref.id ?? "new");
    try {
      const method = ref.id ? "PATCH" : "POST";
      const url = ref.id ? `${API}${ref.id}/` : API;
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(ref),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved: Reference = await res.json();
      setRefs((prev) => {
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
      showToast("success", ref.id ? "Reference updated." : "Reference added.");
    } catch {
      showToast("error", "Failed to save reference.");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleApproval = async (ref: Reference, idx: number) => {
    if (!ref.id) return;
    if (!token) return showToast("error", "Authentication required.");
    setToggling(ref.id);
    try {
      const res = await fetch(`${API}${ref.id}/toggle_approval/`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRefs((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], is_approved: data.is_approved };
        return next;
      });
      showToast(
        "success",
        data.is_approved
          ? "Reference approved and published to portfolio!"
          : "Reference hidden from portfolio."
      );
    } catch {
      showToast("error", "Failed to update approval status.");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (ref: Reference, idx: number) => {
    if (!ref.id) {
      setRefs((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!token) return showToast("error", "Authentication required.");
    setDeleting(ref.id);
    try {
      const res = await fetch(`${API}${ref.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setRefs((prev) => prev.filter((_, i) => i !== idx));
      showToast("success", "Reference deleted.");
    } catch {
      showToast("error", "Failed to delete reference.");
    } finally {
      setDeleting(null);
    }
  };

  const updateField = (idx: number, field: keyof Reference, value: any) => {
    setRefs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Build the personalized invite link
  const getShareLink = () => {
    const base = `${portfolioUrl}/references/submit`;
    const params = new URLSearchParams();
    if (inviteName.trim()) params.set("name", inviteName.trim());
    if (inviteEmail.trim()) params.set("email", inviteEmail.trim());
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const getInviteMessage = () => {
    const link = getShareLink();
    const greeting = inviteName.trim() ? `Dear ${inviteName.trim()},` : "Dear Colleague,";
    return `${greeting}\n\nI hope this message finds you well. I am updating my professional engineering portfolio (khalfanathman.dev) and would be deeply grateful to include your endorsement.\n\nCould you please take 2 minutes to fill in your referee details and recommendation here:\n${link}\n\nThank you so much for your time and continuous support!\n\nWarm regards,\nKhalfan Athman`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getInviteMessage());
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // Computed counts
  const pendingCount = refs.filter((r) => r.is_approved === false).length;
  const publishedCount = refs.filter((r) => r.is_approved !== false).length;

  const filteredRefs = refs.filter((r) => {
    if (activeTab === "pending") return r.is_approved === false;
    if (activeTab === "published") return r.is_approved !== false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
          Loading References...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              Executive Testimonials
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • {refs.length} Total Referees
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Referees &amp; Endorsements
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Manage professional references, send self-fill forms to referees, and approve endorsements.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Send Form to Referee Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer w-full sm:w-auto min-h-[42px] sm:min-h-0"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>Send Form to Referee</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Public View */}
            <a
              href={`${portfolioUrl}/references`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all min-h-[42px] sm:min-h-0"
            >
              <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Public View</span>
              <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
            </a>

            {/* Add Referee manually */}
            <button
              onClick={() => setRefs((prev) => [empty(), ...prev])}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer min-h-[42px] sm:min-h-0"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add Referee</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] w-full sm:w-fit overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "all"
              ? "bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          All ({refs.length})
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === "published"
              ? "bg-white dark:bg-white/[0.1] text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          Published ({publishedCount})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === "pending"
              ? "bg-white dark:bg-white/[0.1] text-amber-600 dark:text-amber-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          Pending Review ({pendingCount})
        </button>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
                : "bg-red-400/10 border-red-400/30 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty State ── */}
      {filteredRefs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3 rounded-2xl border border-dashed border-border/60 bg-card/40">
          <Quote className="h-10 w-10 text-primary/30" />
          <p className="text-sm font-medium">
            {activeTab === "pending"
              ? "No pending submissions to review."
              : activeTab === "published"
              ? "No published references yet."
              : "No references found."}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 text-xs font-medium hover:bg-violet-500/20 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Send form to a referee
            </button>
            <button
              onClick={() => setRefs([empty()])}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add manually
            </button>
          </div>
        </div>
      )}

      {/* ── Referee Cards ── */}
      <div className="space-y-6">
        {filteredRefs.map((ref, idx) => (
          <motion.div
            key={ref.id ?? `new-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 md:p-7 flex flex-col gap-5 shadow-sm transition-all ${
              ref.is_approved === false
                ? "border-amber-500/40 bg-amber-500/[0.03] dark:bg-amber-500/[0.02]"
                : "border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl"
            }`}
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                  Referee #{idx + 1}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  {ref.name || "Unnamed Referee"}
                </span>

                {/* Status Badge */}
                {!ref.id ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                    Unsaved Draft
                  </span>
                ) : ref.is_approved === false ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pending Review
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Published Live
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/[0.04]">
                {/* 1-Click Approve / Unpublish Toggle */}
                {ref.id && (
                  <button
                    onClick={() => handleToggleApproval(ref, idx)}
                    disabled={toggling === ref.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 min-h-[38px] sm:min-h-0 ${
                      ref.is_approved === false
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                        : "border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {toggling === ref.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : ref.is_approved === false ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Approve &amp; Publish</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Unpublish</span>
                      </>
                    )}
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ref, idx)}
                  disabled={deleting === ref.id}
                  className="p-2 sm:p-1.5 rounded-xl sm:rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40 cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center border border-slate-200 sm:border-0 dark:border-white/[0.08]"
                  title="Delete Referee"
                >
                  {deleting === ref.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Full Name"
                value={ref.name}
                placeholder="e.g. Dr. Ahmed Hassan"
                onChange={(v) => updateField(idx, "name", v)}
              />
              <Field
                label="Job Title"
                value={ref.title}
                placeholder="e.g. Chief Technology Officer"
                onChange={(v) => updateField(idx, "title", v)}
              />
              <Field
                label="Company / Organisation"
                value={ref.company}
                placeholder="e.g. Jamia Mosque Committee"
                onChange={(v) => updateField(idx, "company", v)}
              />
              <Field
                label="Professional Relationship"
                value={ref.relationship}
                placeholder="e.g. Direct Supervisor / Lead Architect"
                onChange={(v) => updateField(idx, "relationship", v)}
              />
              <Field
                label="Email Address"
                value={ref.email}
                type="email"
                placeholder="email@example.com"
                onChange={(v) => updateField(idx, "email", v)}
              />
              <Field
                label="Phone (optional)"
                value={ref.phone}
                placeholder="+254 7..."
                onChange={(v) => updateField(idx, "phone", v)}
              />
              <div className="md:col-span-2">
                <Field
                  label="LinkedIn URL"
                  value={ref.linkedin}
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  onChange={(v) => updateField(idx, "linkedin", v)}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recommendation / Endorsement Quote
                </label>
                <textarea
                  rows={3}
                  value={ref.quote}
                  onChange={(e) => updateField(idx, "quote", e.target.value)}
                  placeholder="A testimonial detailing Khalfan's engineering competence and work ethic..."
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y"
                />
              </div>
            </div>

            {/* Save & Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
              <div className="text-[11px] text-slate-400 font-mono">
                {ref.created_at ? `Submitted: ${new Date(ref.created_at).toLocaleDateString()}` : "Not yet saved"}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleSave(ref, idx)}
                  disabled={saving === (ref.id ?? "new")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer min-h-[42px] sm:min-h-0"
                >
                  {saving === (ref.id ?? "new") ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> {ref.id ? "Update Referee" : "Save Referee"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Invite / Send Form Modal ── */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0c1222] p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6"
            >
              {/* Close button */}
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title */}
              <div className="pr-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20 mb-2 sm:mb-3">
                  <Sparkles className="h-3.5 w-3.5" /> Referee Invitation
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                  Send Form to Referee
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Share this secure form with your referee so they can directly fill in their name, title, company, quote, and contact info.
                </p>
              </div>

              {/* Optional Personalization */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-3">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Optional: Personalize Link for Referee
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <input
                    type="text"
                    placeholder="Referee Name (e.g. Dr. Ahmed)"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[40px] sm:min-h-0 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Referee Email (e.g. ahmed@supkem.org)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#070b14] text-slate-900 dark:text-white text-base sm:text-xs min-h-[40px] sm:min-h-0 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Generated Link Box */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Direct Form Link
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14]">
                  <input
                    type="text"
                    readOnly
                    value={getShareLink()}
                    className="flex-1 px-2 py-1.5 bg-transparent text-xs text-slate-900 dark:text-white font-mono focus:outline-none select-all truncate min-w-0"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 1-Click Share Actions */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick Share Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getInviteMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Email (mailto) */}
                  <a
                    href={`mailto:${inviteEmail.trim()}?subject=${encodeURIComponent(
                      "Professional Reference Request — Khalfan Athman"
                    )}&body=${encodeURIComponent(getInviteMessage())}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Send Email</span>
                  </a>

                  {/* Copy Message */}
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Form Preview link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06] text-xs text-slate-500">
                <span>Want to see how it looks to referees?</span>
                <a
                  href={getShareLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                >
                  <span>Preview Form</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
