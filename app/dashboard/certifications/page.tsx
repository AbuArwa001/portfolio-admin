"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Award,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Network,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

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

const emptyCert = (): Certification => ({
  name: "",
  issuer: "",
  date: new Date().toISOString().split("T")[0],
  in_progress: false,
  badge: "",
  credential_url: "",
  type: "aws",
});

const emptyBadge = (): Certification => ({
  name: "",
  issuer: "",
  date: new Date().toISOString().split("T")[0],
  in_progress: false,
  badge: "",
  credential_url: "",
  type: "badge",
});

export default function CertificationsManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${getApiUrl()}/api/v1/certifications/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [resolvingIdx, setResolvingIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "cert" | "badge">("all");
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
      .catch(() => showToast("error", "Failed to load credentials."))
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
      showToast("success", cert.id ? "Credential updated." : "Credential created.");
    } catch {
      showToast("error", "Failed to save credential.");
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
      showToast("success", "Credential removed.");
    } catch {
      showToast("error", "Failed to delete credential.");
    } finally {
      setDeleting(null);
    }
  };

  const updateField = (idx: number, field: keyof Certification, val: any) => {
    setCerts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Auto-detect badge name & official image from link
  const handleResolveBadgeFromLink = async (idx: number, urlOverride?: string) => {
    const cert = certs[idx];
    const targetUrl = urlOverride || cert.credential_url;
    if (!targetUrl || targetUrl.trim().length < 5) {
      showToast("error", "Please enter a credential or verification URL first.");
      return;
    }

    setResolvingIdx(idx);
    try {
      const res = await fetch(`/api/badges/resolve?url=${encodeURIComponent(targetUrl.trim())}`);
      if (!res.ok) throw new Error("Could not resolve badge");
      const data = await res.json();

      setCerts((prev) => {
        const next = [...prev];
        const item = { ...next[idx] };
        if (data.name && (!item.name || item.name.trim() === "")) {
          item.name = data.name;
        } else if (data.name && item.type === "badge") {
          item.name = data.name;
        }
        if (data.image) {
          item.badge = data.image;
        }
        if (data.issuer && (!item.issuer || item.issuer.trim() === "")) {
          item.issuer = data.issuer;
        }
        if (!item.type || item.type === "other" || item.type === "cloud") {
          item.type = "badge";
        }
        next[idx] = item;
        return next;
      });

      showToast("success", `Resolved official badge: ${data.name}`);
    } catch {
      showToast("error", "Could not automatically resolve badge from link. You can enter details manually.");
    } finally {
      setResolvingIdx(null);
    }
  };

  const filteredCertsWithIndex = certs
    .map((cert, index) => ({ cert, index }))
    .filter(({ cert }) => {
      if (filter === "badge") return cert.type === "badge";
      if (filter === "cert") return cert.type !== "badge";
      return true;
    });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 text-xs font-semibold text-purple-400 bg-purple-500/10 rounded-full border border-purple-500/20">
            <Award className="h-3.5 w-3.5" />
            <span>Credentials Management</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Certifications &amp; Digital Badges
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add or paste a credential link to automatically display the official badge and name.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`${portfolioUrl}/cetificates`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>View Live Page</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={() => {
              setCerts([emptyBadge(), ...certs]);
              setFilter("badge");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Network className="h-4 w-4" />
            <span>+ Add Badge</span>
          </button>

          <button
            onClick={() => {
              setCerts([emptyCert(), ...certs]);
              setFilter("cert");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Certificate</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-card border border-border/60 p-1 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({certs.length})
          </button>
          <button
            onClick={() => setFilter("cert")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "cert"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Certifications ({certs.filter((c) => c.type !== "badge").length})
          </button>
          <button
            onClick={() => setFilter("badge")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "badge"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Badges ({certs.filter((c) => c.type === "badge").length})
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: Enter a Credly or Cisco link and click{" "}
          <span className="font-bold text-foreground">✨ Auto-Detect</span> to fetch the official badge graphic.
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
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Credentials */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading credentials...</p>
        </div>
      ) : filteredCertsWithIndex.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl p-8 bg-card/40">
          <Award className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-bold text-foreground">No credentials in this view</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "+ Add Badge" or "+ Add Certificate" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCertsWithIndex.map(({ cert, index }) => (
            <motion.div
              key={cert.id ?? `new-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-5 shadow-sm"
            >
              {/* Item Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      cert.type === "badge"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {cert.type === "badge" ? "Digital Badge" : "Certification"}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {cert.name || "Untitled Credential"}
                  </span>
                  {cert.in_progress && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      In Progress
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(cert, index)}
                  disabled={deleting === cert.id}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  title="Delete Credential"
                >
                  {deleting === cert.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Name / Official Title
                  </label>
                  <input
                    type="text"
                    value={cert.name}
                    placeholder="e.g. CCNA: Enterprise Networking, Security..."
                    onChange={(e) => updateField(index, "name", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Issuer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={cert.issuer}
                    placeholder="e.g. Cisco Networking Academy / Credly"
                    onChange={(e) => updateField(index, "issuer", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Type Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Category Type
                  </label>
                  <select
                    value={cert.type || "badge"}
                    onChange={(e) => updateField(index, "type", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="badge">Digital Badge (Credly / Academy)</option>
                    <option value="aws">AWS Certification</option>
                    <option value="oracle">Oracle Certification</option>
                    <option value="alx">ALX Africa Certification</option>
                    <option value="other">Other Professional Certification</option>
                  </select>
                </div>

                {/* Credential URL with Auto-Detect */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Credential Verification URL (Credly / Academy Link)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleResolveBadgeFromLink(index)}
                      disabled={resolvingIdx === index}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      {resolvingIdx === index ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Fetching badge...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-yellow-400" />
                          <span>✨ Auto-Detect Official Badge &amp; Name</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={cert.credential_url || ""}
                      placeholder="https://www.credly.com/org/cisco/badge/..."
                      onChange={(e) => updateField(index, "credential_url", e.target.value)}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (pasted && (!cert.badge || !cert.name)) {
                          setTimeout(() => handleResolveBadgeFromLink(index, pasted), 100);
                        }
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2.5 rounded-xl border border-border/60 bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                        title="Open Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Issue Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={cert.date}
                    onChange={(e) => updateField(index, "date", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Badge Image URL */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Official Badge Graphic URL (Image path or Credly image)
                  </label>
                  <input
                    type="text"
                    value={cert.badge || ""}
                    placeholder="/badges/cisco-ccna.png OR https://images.credly.com/..."
                    onChange={(e) => updateField(index, "badge", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* In Progress */}
                <div className="flex items-center gap-3 pt-6">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cert.in_progress || false}
                      onChange={(e) => updateField(index, "in_progress", e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                    />
                    Mark as In Progress
                  </label>
                </div>
              </div>

              {/* Live Badge Preview Box */}
              {(cert.badge || cert.name) && (
                <div className="p-3.5 rounded-xl bg-accent/30 border border-border/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-background border border-border/60 p-1 flex items-center justify-center shrink-0">
                      {cert.badge ? (
                        <img
                          src={cert.badge}
                          alt={cert.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/badges/cisco-ccna.png";
                          }}
                        />
                      ) : (
                        <Award className="h-6 w-6 text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Live Badge Display
                        </span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {cert.type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate mt-0.5">
                        {cert.name || "Untitled"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {cert.issuer || "No issuer specified"} · {cert.date}
                      </p>
                    </div>
                  </div>

                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
                    >
                      <span>Verify</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSave(cert, index)}
                  disabled={saving === (cert.id ?? "new")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-[0_0_20px_-6px] shadow-primary/60 cursor-pointer"
                >
                  {saving === (cert.id ?? "new") ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />{" "}
                      {cert.id ? "Update Credential" : "Save Credential"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
