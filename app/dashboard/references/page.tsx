"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Quote, Loader2, CheckCircle2, AlertCircle, ExternalLink, Globe,
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
}

const empty = (): Reference => ({
  name: "", title: "", company: "", relationship: "",
  quote: "", email: "", phone: "", linkedin: "",
});

function Field({
  label, value, onChange, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

export default function ReferencesManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${getApiUrl()}/api/v1/references/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [refs, setRefs] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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

  const updateField = (idx: number, field: keyof Reference, value: string) => {
    setRefs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading References...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground font-heading">Referees & Testimonials</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage endorsements displayed on the public references page ({refs.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`${portfolioUrl}/references`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-3.5 w-3.5" /> Public View <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <button
            onClick={() => setRefs((prev) => [empty(), ...prev])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-6px] shadow-primary/60"
          >
            <Plus className="h-4 w-4" /> Add Referee
          </button>
        </div>
      </div>

      {/* Toast */}
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
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {refs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3 rounded-2xl border border-dashed border-border/60 bg-card/40">
          <Quote className="h-10 w-10 text-primary/30" />
          <p className="text-sm font-medium">No references found.</p>
          <button
            onClick={() => setRefs([empty()])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add your first referee
          </button>
        </div>
      )}

      <div className="space-y-6">
        {refs.map((ref, idx) => (
          <motion.div
            key={ref.id ?? `new-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-5 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Referee #{idx + 1}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {ref.name || "Unnamed Referee"}
                </span>
                {!ref.id && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    Unsaved
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDelete(ref, idx)}
                disabled={deleting === ref.id}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
              >
                {deleting === ref.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
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
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Recommendation / Endorsement Quote
                </label>
                <textarea
                  rows={3}
                  value={ref.quote}
                  onChange={(e) => updateField(idx, "quote", e.target.value)}
                  placeholder="A testimonial detailing Khalfan's engineering competence and work ethic..."
                  className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave(ref, idx)}
                disabled={saving === (ref.id ?? "new")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-[0_0_20px_-6px] shadow-primary/60 cursor-pointer"
              >
                {saving === (ref.id ?? "new") ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> {ref.id ? "Update Referee" : "Save Referee"}</>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
