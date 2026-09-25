"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  Download,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  UploadCloud,
  FileUp,
  Sparkles,
  X,
  FileCheck,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";

interface JobApplication {
  id?: number;
  company: string;
  role: string;
  status: string;
  link: string;
  done: boolean;
  google_search_link: string;
  job_requirements: string;
  date_applied: string | null;
  take_by: string;
  oa: boolean;
  phone_screen: boolean;
  interview: boolean;
  interview_done: boolean;
  notes?: string;
  created_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
  Applied: {
    label: "Applied",
    color: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  Interviewing: {
    label: "Interviewing",
    color: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  Offer: {
    label: "Offer",
    color: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  Rejected: {
    label: "Rejected",
    color: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
  "Not yet Applied": {
    label: "Not yet Applied",
    color: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
  },
};

export default function ApplicationsPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [notification, setNotification] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Single Role Modal / Form state
  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState<JobApplication>({
    company: "",
    role: "",
    status: "Applied",
    link: "",
    done: false,
    google_search_link: "",
    job_requirements: "",
    date_applied: new Date().toISOString().split("T")[0],
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
  });

  // Batch Import Spreadsheet State
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [previewItems, setPreviewItems] = React.useState<JobApplication[]>([]);
  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const [selectedFileName, setSelectedFileName] = React.useState<string>("");
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const apiUrl = getApiUrl();

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch applications
  const fetchApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v1/applications/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        setApplications(list);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle Quick Inline Toggle (Done, OA, Phone Screen, Interview, Interview Done)
  const handleToggleField = async (app: JobApplication, field: keyof JobApplication) => {
    if (!app.id) return;
    const updatedVal = !app[field];
    const updatedList = applications.map((item) =>
      item.id === app.id ? { ...item, [field]: updatedVal } : item
    );
    setApplications(updatedList);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }
      await fetch(`${apiUrl}/api/v1/applications/${app.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ [field]: updatedVal }),
      });
      showToast(`Updated ${String(field)} for ${app.company}`);
    } catch (err) {
      console.error("Toggle error:", err);
      showToast("Failed to update status", "error");
      fetchApplications();
    }
  };

  // Save new or edit application
  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.role) {
      showToast("Company and Role are required", "error");
      return;
    }

    try {
      setSaving(true);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const url = editingId
        ? `${apiUrl}/api/v1/applications/${editingId}/`
        : `${apiUrl}/api/v1/applications/`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Failed to save: HTTP ${res.status}`);
      }

      showToast(editingId ? "Application updated!" : "Application recorded!");
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchApplications();
    } catch (err: any) {
      showToast(err.message || "Failed to save application", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete Application
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this tracked role?")) return;

    try {
      const headers: Record<string, string> = {};
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }
      const res = await fetch(`${apiUrl}/api/v1/applications/${id}/`, {
        method: "DELETE",
        headers,
      });
      if (res.ok || res.status === 204) {
        showToast("Application deleted");
        fetchApplications();
      }
    } catch {
      showToast("Error deleting application", "error");
    }
  };

  const openEditModal = (app: JobApplication) => {
    setEditingId(app.id || null);
    setFormData({ ...app });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      company: "",
      role: "",
      status: "Applied",
      link: "",
      done: false,
      google_search_link: "",
      job_requirements: "",
      date_applied: new Date().toISOString().split("T")[0],
      take_by: "",
      oa: false,
      phone_screen: false,
      interview: false,
      interview_done: false,
    });
  };

  // Trigger Excel Download
  const handleExportExcel = () => {
    window.open(`${apiUrl}/api/v1/applications/export-excel/`, "_blank");
  };

  // Handle Drag & Drop / File Input Selection
  const handleFileSelect = async (file: File) => {
    setSelectedFileName(file.name);
    setParsing(true);
    setPreviewItems([]);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dry_run", "true");
      form.append("skip_duplicates", String(skipDuplicates));

      const headers: Record<string, string> = {};
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(`${apiUrl}/api/v1/applications/import-file/?dry_run=true`, {
        method: "POST",
        headers,
        body: form,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to parse file (${res.status})`);
      }

      const data = await res.json();
      const items = data.items || [];
      setPreviewItems(items);
      setSelectedIndices(new Set(items.map((_: any, idx: number) => idx)));
      showToast(`Detected ${items.length} records ready for review`);
    } catch (err: any) {
      showToast(err.message || "Failed to parse spreadsheet file", "error");
    } finally {
      setParsing(false);
    }
  };

  // Quick Select Local/Server Template
  const handleLoadServerTemplate = async (templateKey: string, label: string) => {
    setSelectedFileName(label);
    setParsing(true);
    setPreviewItems([]);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(`${apiUrl}/api/v1/applications/import-file/?dry_run=true`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_file: templateKey,
          dry_run: true,
          skip_duplicates: skipDuplicates,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load template");
      }

      const data = await res.json();
      const items = data.items || [];
      setPreviewItems(items);
      setSelectedIndices(new Set(items.map((_: any, idx: number) => idx)));
      showToast(`Parsed ${items.length} roles from ${label}`);
    } catch (err: any) {
      showToast(err.message || "Failed to load template", "error");
    } finally {
      setParsing(false);
    }
  };

  // Toggle selection
  const handleToggleSelectRow = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === previewItems.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(previewItems.map((_, idx) => idx)));
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    const itemsToImport = previewItems.filter((_, idx) => selectedIndices.has(idx));
    if (itemsToImport.length === 0) {
      showToast("No records selected to import", "error");
      return;
    }

    setImporting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(`${apiUrl}/api/v1/applications/bulk-create/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          applications: itemsToImport,
          skip_duplicates: skipDuplicates,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Bulk import failed");
      }

      const data = await res.json();
      showToast(
        `Imported ${data.count || itemsToImport.length} applications! (${data.skipped_count || 0} existing skipped)`
      );
      setShowImportModal(false);
      setPreviewItems([]);
      setSelectedFileName("");
      fetchApplications();
    } catch (err: any) {
      showToast(err.message || "Failed to complete import", "error");
    } finally {
      setImporting(false);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.job_requirements || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Telemetry metrics
  const totalTracked = applications.length;
  const interviewingCount = applications.filter((a) => a.status === "Interviewing" || a.interview).length;
  const appliedCount = applications.filter((a) => a.status === "Applied").length;
  const offersCount = applications.filter((a) => a.status === "Offer").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 backdrop-blur-xl"
              : "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300 backdrop-blur-xl"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" /> Tracking Telemetry
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Template: Applied Roles & Detailed Job Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Applied Roles Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Monitor pipeline milestones, assessments, interview stages, and import/export formatted spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Import Button */}
          <button
            onClick={() => {
              setPreviewItems([]);
              setSelectedFileName("");
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            title="Import Excel or CSV spreadsheet"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Import Spreadsheet</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download full tracker as formatted Excel sheet"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>

          {/* Add Role Button */}
          <button
            onClick={() => {
              setEditingId(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Role</span>
          </button>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Tracked</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading mt-1">
            {totalTracked}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active Pipeline Records</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">Applied</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-heading mt-1">
            {appliedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Submitted Submissions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400">In Interview</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-heading mt-1">
            {interviewingCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active Rounds & Shortlists</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Offers</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-heading mt-1">
            {offersCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Verified Extensions</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, role or requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["All", "Applied", "Interviewing", "Offer", "Rejected", "Not yet Applied"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#080d1a] border-b border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Company & Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date Applied</th>
                <th className="p-3.5 text-center">OA</th>
                <th className="p-3.5 text-center">Phone Screen</th>
                <th className="p-3.5 text-center">Interview</th>
                <th className="p-3.5 text-center">Done?</th>
                <th className="p-3.5">Requirements / Notes</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading tracked applications...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching applications found. Click "Import Spreadsheet" or "Add Role" to begin tracking.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG["Applied"];
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Company & Role */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white font-heading text-sm">
                          {app.company}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                          {app.role}
                        </div>
                        {app.link && (
                          <a
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                          >
                            <ExternalLink className="h-3 w-3" /> Job Link
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* Date Applied */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {app.date_applied || "—"}
                      </td>

                      {/* OA Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "oa")}
                          className="cursor-pointer"
                          title="Toggle Online Assessment"
                        >
                          {app.oa ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Phone Screen Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "phone_screen")}
                          className="cursor-pointer"
                          title="Toggle Phone Screen"
                        >
                          {app.phone_screen ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Interview Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "interview")}
                          className="cursor-pointer"
                          title="Toggle Interview"
                        >
                          {app.interview ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Done? Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "done")}
                          className="cursor-pointer"
                          title="Toggle Done"
                        >
                          {app.done ? (
                            <CheckSquare className="h-4 w-4 text-blue-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Requirements / Notes */}
                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="line-clamp-2" title={app.job_requirements || app.notes || ""}>
                          {app.job_requirements || app.notes || "No specific notes"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => app.id && handleDelete(app.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Batch Import Spreadsheet */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                    Import Spreadsheet & Auto-Populate
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload your Excel (.xlsx, .xls) or CSV file to parse fields and add multiple job records automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quick-Load Local Tracker Spreadsheets:
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleLoadServerTemplate("complete_tracker", "Complete_Job_Application_Tracker.xlsx")}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm cursor-pointer"
                >
                  ⚡ Complete_Job_Tracker.xlsx
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadServerTemplate("applied_roles", "Applied Roles - Tracking Spreadsheet.xlsx")}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm cursor-pointer"
                >
                  ⚡ Applied_Roles.xlsx
                </button>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv,.tsv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2.5 ${
                dragActive
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : "border-slate-300 dark:border-white/[0.15] bg-slate-50/50 dark:bg-white/[0.01] hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5"
              }`}
            >
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <FileUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedFileName ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                      Selected: {selectedFileName}
                    </span>
                  ) : (
                    "Drag and drop your spreadsheet here, or click to browse"
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports .xlsx, .xls, .csv, and .json formats
                </p>
              </div>
            </div>

            {/* Parsing State */}
            {parsing && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="text-xs font-medium">Parsing and auto-mapping spreadsheet columns...</span>
              </div>
            )}

            {/* Live Preview Section */}
            {previewItems.length > 0 && (
              <div className="space-y-3">
                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedIndices.size === previewItems.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      <span>
                        {selectedIndices.size === previewItems.length
                          ? "Deselect All"
                          : `Select All (${previewItems.length})`}
                      </span>
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {selectedIndices.size} of {previewItems.length} selected
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Skip duplicates (match Company & Role)</span>
                  </label>
                </div>

                {/* Table of Parsed Records */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-[#080d1a] border-b border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">✓</th>
                        <th className="p-3">Company & Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date Applied</th>
                        <th className="p-3">Key Requirements & Notes</th>
                        <th className="p-3 text-center">Interview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                      {previewItems.map((item, idx) => {
                        const isSelected = selectedIndices.has(idx);
                        const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG["Applied"];
                        return (
                          <tr
                            key={idx}
                            onClick={() => handleToggleSelectRow(idx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-indigo-50/40 dark:bg-indigo-500/10"
                                : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="p-3 text-center">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mx-auto" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400 mx-auto" />
                              )}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white font-heading">
                                {item.company}
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 text-xs">
                                {item.role}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {item.date_applied || "—"}
                            </td>
                            <td className="p-3 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                              <div className="line-clamp-2">
                                {item.job_requirements || item.notes || "—"}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {item.interview ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  Shortlisted
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.08]">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {previewItems.length > 0
                  ? `${selectedIndices.size} of ${previewItems.length} records ready to import`
                  : "Select a spreadsheet file to preview records"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/[0.1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || selectedIndices.size === 0}
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Import {selectedIndices.size} Applications</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Single Application */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                {editingId ? "Edit Tracked Application" : "Track New Application"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApplication} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Google, AWS"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Cloud Engineer"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Application Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Not yet Applied">Not yet Applied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Date of Application
                  </label>
                  <input
                    type="date"
                    value={formData.date_applied || ""}
                    onChange={(e) => setFormData({ ...formData, date_applied: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Job Link / Posting URL
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Job Requirements / Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.job_requirements}
                  onChange={(e) => setFormData({ ...formData, job_requirements: e.target.value })}
                  placeholder="Key stack, interviewers, recruiter notes..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Checkboxes Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.oa}
                    onChange={(e) => setFormData({ ...formData, oa: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>OA Complete</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.phone_screen}
                    onChange={(e) => setFormData({ ...formData, phone_screen: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Phone Screen</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.interview}
                    onChange={(e) => setFormData({ ...formData, interview: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Interview</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.done}
                    onChange={(e) => setFormData({ ...formData, done: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Done</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/[0.1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Application" : "Save Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
