"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Award, Loader2, CheckCircle2, AlertCircle, ExternalLink, Globe,
} from "lucide-react";

interface Certification {
  id?: number;
  name: string;
  issuer: string;
  date: string;
  in_progress?: boolean;
  badge?: string;
  credential_url?: string;
  type?: string;
}

const empty = (): Certification => ({
  name: "",
  issuer: "",
  date: new Date().toISOString().split("T")[0],
  in_progress: false,
  badge: "",
  credential_url: "",
  type: "cloud",
});

export default function CertificationsManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1/certifications/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [certs, setCerts] = useState<Certification[]>([]);
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
      .then((data) => setCerts(Array.isArray(data) ? data : []))
      .catch(() => showToast("error", "Failed to load certifications."))
      .finally(() => setLoading(false));
  }, [API]);

  const handleSave = async (cert: Certification, idx: number) => {
    if (!token) return showToast("error", "Authentication session required.");
    setSaving(cert.id ?? "new");
    try {
      const method = cert.id ? "PATCH" : "POST";
      const url = cert.id ? `${API}${cert.id}/` : API;
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(cert),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved: Certification = await res.json();
      setCerts((prev) => {
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
      showToast("success", cert.id ? "Certification updated." : "Certification created.");
    } catch {
      showToast("error", "Failed to save certification.");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (cert: Certification, idx: number) => {
    if (!cert.id) {
      setCerts((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!token) return showToast("error", "Authentication session required.");
    setDeleting(cert.id);
    try {
      const res = await fetch(`${API}${cert.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setCerts((prev) => prev.filter((_, i) => i !== idx));
      showToast("success", "Certification deleted.");
    } catch {
      showToast("error", "Failed to delete certification.");
    } finally {
      setDeleting(null);
    }
  };

  const updateField = (idx: number, field: keyof Certification, value: any) => {
    setCerts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading Credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground font-heading">Certifications & Credentials</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage verified credentials & badges ({certs.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`${portfolioUrl}/cetificates`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-3.5 w-3.5" /> Public View <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <button
            onClick={() => setCerts((prev) => [empty(), ...prev])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-6px] shadow-primary/60"
          >
            <Plus className="h-4 w-4" /> Add Certificate
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

      <div className="space-y-6">
        {certs.map((cert, idx) => (
          <motion.div
            key={cert.id ?? `new-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-5 shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Cert #{idx + 1}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {cert.name || "Untitled Certificate"}
                </span>
                {cert.in_progress && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20">
                    In Progress
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDelete(cert, idx)}
                disabled={deleting === cert.id}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
              >
                {deleting === cert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Certificate Name
                </label>
                <input
                  type="text"
                  value={cert.name}
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  onChange={(e) => updateField(idx, "name", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Issuing Organisation
                </label>
                <input
                  type="text"
                  value={cert.issuer}
                  placeholder="e.g. Amazon Web Services (AWS)"
                  onChange={(e) => updateField(idx, "issuer", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Issue Date / Year
                </label>
                <input
                  type="text"
                  value={cert.date}
                  placeholder="e.g. 2024 or 2024-05-12"
                  onChange={(e) => updateField(idx, "date", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Credential URL / Verification Link
                </label>
                <input
                  type="url"
                  value={cert.credential_url || ""}
                  placeholder="https://www.credly.com/badges/..."
                  onChange={(e) => updateField(idx, "credential_url", e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cert.in_progress || false}
                    onChange={(e) => updateField(idx, "in_progress", e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                  />
                  Mark as In Progress
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave(cert, idx)}
                disabled={saving === (cert.id ?? "new")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-[0_0_20px_-6px] shadow-primary/60 cursor-pointer"
              >
                {saving === (cert.id ?? "new") ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> {cert.id ? "Update Certificate" : "Save Certificate"}</>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
