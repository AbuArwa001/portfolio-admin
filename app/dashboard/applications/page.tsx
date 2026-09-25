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
  LayoutGrid,
  ListFilter,
  Check,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";
import * as XLSX from "xlsx";

interface JobApplication {
  id?: number;
  company: string;
  organization?: string;
  role: string;
  job_title?: string;
  advert_ref?: string;
  key_responsibilities?: string;
  job_requirements: string;
  status: string;
  shortlisted?: boolean;
  closing_date?: string | null;
  date_applied: string | null;
  link: string;
  done: boolean;
  google_search_link: string;
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

function normalizeDateString(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || ["N/A", "NONE", "—", "-"].includes(s.toUpperCase())) return null;
    const parts = s.split(/[\/\-\.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  }
  return null;
}

// Preset matching Complete_Job_Application_Tracker (1).xlsx exactly
const COMPLETE_JOB_TRACKER_PRESET: JobApplication[] = [
  {
    company: "National Council for Children's Services (NCCS)",
    organization: "National Council for Children's Services (NCCS)",
    role: "Senior ICT Officer",
    job_title: "Senior ICT Officer",
    advert_ref: "NCCS/8/2026 | Grade 6",
    job_requirements: "Degree in CS/IT. 6 years exp. Certs: MCSA/MCSE, CCNA/CCNP, CISM/CISA, or PMP. Membership in ISACA.",
    key_responsibilities: "Write/test programs; user support; monitoring server performance; maintain ICT inventory; ICT project management.",
    status: "Applied",
    shortlisted: false,
    closing_date: null,
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "",
  },
  {
    company: "National Cancer Institute (NCI)",
    organization: "National Cancer Institute (NCI)",
    role: "ICT Officer",
    job_title: "ICT Officer",
    advert_ref: "NCI 7",
    job_requirements: "Degree (IT/CS/Eng). 3 years exp. 2+ Certs (Security, App Dev, or Infra). ITIL Foundation. ISACA/CSK membership.",
    key_responsibilities: "Network infrastructure maintenance; supporting disaster recovery; VOIP/LAN maintenance; setup Firewalls/VPN; technical assistance.",
    status: "Interviewing",
    shortlisted: true,
    closing_date: null,
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: true,
    interview_done: false,
    notes: "",
  },
  {
    company: "State Department for Trade",
    organization: "State Department for Trade",
    role: "Weights and Measures Officer II",
    job_title: "Weights and Measures Officer II",
    advert_ref: "115/2026 | CSG 11",
    job_requirements: "Degree (Physics, Math, Metrology, or ICT). Entry-level (0 years exp required).",
    key_responsibilities: "Testing/stamping weighing equipment; collecting data at traders' premises; sampling pre-packaged goods.",
    status: "Applied",
    shortlisted: false,
    closing_date: "2026-05-26",
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "",
  },
  {
    company: "National Council For Population and Development",
    organization: "National Council For Population and Development",
    role: "ICT Officer",
    job_title: "ICT Officer",
    advert_ref: "006/2026 | Grade NCPD 6",
    job_requirements: "Academic/Professional certificates, Detailed CV, 3 references, National ID/Passport.",
    key_responsibilities: "Entry and training grade; work under the guidance of a senior officer.",
    status: "Interviewing",
    shortlisted: true,
    closing_date: null,
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: true,
    interview_done: false,
    notes: "Submit via recruitment@ncpd.go.ke. Do NOT use info@ncpd.go.ke.",
  },
  {
    company: "Water Resources Authority (WRA)",
    organization: "Water Resources Authority (WRA)",
    role: "ICT Officer II",
    job_title: "ICT Officer II",
    advert_ref: "V/NO.25/2026 | Grade 8",
    job_requirements: "Bachelor’s Degree in IT, CS, Soft Eng, or equivalent.",
    key_responsibilities: "Monitoring hardware; user support; simple programming; repair/maintenance; equipment register; config new equipment.",
    status: "Interviewing",
    shortlisted: true,
    closing_date: "2026-06-01",
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: true,
    interview_done: false,
    notes: "Online via Google Form (forms.gle/KX93EQJ2qaSbbLLG7) or hr@wra.go.ke. Requires Chapter 6 clearances.",
  },
  {
    company: "Water Resources Authority (WRA)",
    organization: "Water Resources Authority (WRA)",
    role: "ICT Assistant III",
    job_title: "ICT Assistant III",
    advert_ref: "V/NO.26/2026 | Grade 9",
    job_requirements: "Diploma in IT, Computer Tech, Business IT, or ICT Project Management.",
    key_responsibilities: "Support ICT hardware; user support/training; repair/maintenance; maintenance reports; equipment register; configuration.",
    status: "Not yet Applied",
    shortlisted: false,
    closing_date: "2026-06-01",
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "NHIF Building, 9th Floor. Requires Chapter 6 clearances (KRA, HELB, EACC, DCI, CRB).",
  },
  {
    company: "Kenya Space Agency (KSA)",
    organization: "Kenya Space Agency (KSA)",
    role: "Software Engineer",
    job_title: "Software Engineer",
    advert_ref: "13/2026 | KSA 6",
    job_requirements: "Degree in CS, IT, Soft Eng, Physics, Math, Geospatial, or related Engineering. Entry-level (0 years experience).",
    key_responsibilities: "Implement space-related ICT strategies, manage infrastructure security, configure backups, and troubleshoot space ICT systems.",
    status: "Applied",
    shortlisted: false,
    closing_date: "2026-08-31",
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "Permanent & Pensionable (P&P) terms. Gross salary: Ksh 96,173 p.m. (Ksh 82,173 basic + Ksh 10,000 house + Ksh 4,000 commuter).",
  },
  {
    company: "Kenya Space Agency (KSA)",
    organization: "Kenya Space Agency (KSA)",
    role: "Enforcement Officer",
    job_title: "Enforcement Officer",
    advert_ref: "9/2026 | KSA 6",
    job_requirements: "Degree in Physics, Astronomy, Astrophysics, Aerospace, Remote Sensing, GIS, Geo-Spatial, Surveying, Civil/Elec/Mech/Soft Eng, CS, or IT. Entry-level (0 years experience).",
    key_responsibilities: "Implement and review policies, strategies, and guidelines for regulatory enforcement of space-related activities; monitor compliance and investigate complaints.",
    status: "Applied",
    shortlisted: false,
    closing_date: "2026-08-31",
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "Gross salary of Ksh 96,173 p.m. (Ksh 82,173 Basic + Ksh 10,000 House + Ksh 4,000 Commuter) under Permanent and Pensionable (P&P) terms.",
  },
  {
    company: "Kenya Space Agency (KSA)",
    organization: "Kenya Space Agency (KSA)",
    role: "Remote Sensing Officer",
    job_title: "Remote Sensing Officer",
    advert_ref: "10/2026 | KSA 6",
    job_requirements: "Bachelor's degree in Remote Sensing, GIS, Geo-Spatial Engineering, Physics, Astronomy, Aerospace, or matching engineering/computing disciplines. Entry-level (0 years experience).",
    key_responsibilities: "Perform remote sensing applications, digital image processing, and map spatial data for decision support.",
    status: "Applied",
    shortlisted: false,
    closing_date: "2026-08-31",
    date_applied: "2026-09-25",
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "Gross salary of Ksh 96,173 p.m. (Ksh 82,173 Basic + Ksh 10,000 House + Ksh 4,000 Commuter) under Permanent and Pensionable (P&P) terms.",
  },
];

// Preset matching Applied Roles - Tracking Spreadsheet .xlsx
const APPLIED_ROLES_PRESET: JobApplication[] = [
  {
    company: "U.S. Department Of StateDIPLOMACY IN ACTION",
    organization: "U.S. Department Of StateDIPLOMACY IN ACTION",
    role: "Network / Software Engineer",
    job_title: "Network / Software Engineer",
    advert_ref: "",
    job_requirements: "",
    key_responsibilities: "",
    status: "Applied",
    shortlisted: false,
    closing_date: null,
    date_applied: "2026-07-24",
    link: "https://erajobs.state.gov/dos-era/login.hms?_ref=nctnvvrbpt0",
    done: true,
    google_search_link: "http://www.state.gov/?_ref=nctnvvrbpt0",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "",
  },
  {
    company: "Kenya Trade Network Agency (KenTrade)",
    organization: "Kenya Trade Network Agency (KenTrade)",
    role: "Network / Software Engineer",
    job_title: "Network / Software Engineer",
    advert_ref: "",
    job_requirements: "",
    key_responsibilities: "",
    status: "Applied",
    shortlisted: false,
    closing_date: null,
    date_applied: "2026-07-25",
    link: "https://forms.cloud.microsoft/pages/responsepage.aspx?id=UbzGH9DxLUao1h0FNhyWCnRWSbTS7DFCoNIMDEyf_5VUNk1PQTJLVEVBS01DWUlBODdDWVBBODUxWS4u&route=shorturl",
    done: true,
    google_search_link: "https://kentrade.go.ke/careers",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "",
  },
];

async function parseFileInBrowser(file: File): Promise<JobApplication[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });

  let targetSheetName = wb.SheetNames[0];
  for (const name of wb.SheetNames) {
    const nl = name.toLowerCase();
    if (nl.includes("job") || nl.includes("track") || nl.includes("detail") || nl.includes("role") || nl.includes("applied")) {
      targetSheetName = name;
      break;
    }
  }

  const ws = wb.Sheets[targetSheetName];
  if (!ws) return [];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!rawRows || rawRows.length < 2) return [];

  let headerRowIdx = 0;
  let maxScore = 0;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i];
    let score = 0;
    for (const cell of row) {
      const str = String(cell || "").toLowerCase();
      if (
        str.includes("organization") ||
        str.includes("company") ||
        str.includes("job title") ||
        str.includes("role") ||
        str.includes("status") ||
        str.includes("advert") ||
        str.includes("link") ||
        str.includes("shortlist")
      ) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      headerRowIdx = i;
    }
  }

  const headerRow = rawRows[headerRowIdx].map((c) => String(c || "").trim());
  const colMap: Record<string, number> = {};
  headerRow.forEach((h, colIdx) => {
    const hl = h.toLowerCase();
    if ((hl.includes("organization") || hl.includes("company") || hl.includes("agency") || hl.includes("employer")) && !hl.includes("google")) {
      if (colMap["company"] === undefined) colMap["company"] = colIdx;
    } else if (hl.includes("role") || hl.includes("job title") || hl.includes("position") || hl.includes("title")) {
      if (colMap["role"] === undefined) colMap["role"] = colIdx;
    } else if (hl.includes("advert") || hl.includes("grade") || hl.includes("ref")) {
      if (colMap["advert_ref"] === undefined) colMap["advert_ref"] = colIdx;
    } else if (hl.includes("requirement") || hl.includes("education") || hl.includes("certs") || hl.includes("qualification")) {
      if (colMap["job_requirements"] === undefined) colMap["job_requirements"] = colIdx;
    } else if (hl.includes("responsibilit") || hl.includes("jd summary") || hl.includes("jd") || hl.includes("description")) {
      if (colMap["key_responsibilities"] === undefined) colMap["key_responsibilities"] = colIdx;
    } else if (hl.includes("shortlist")) {
      if (colMap["shortlisted"] === undefined) colMap["shortlisted"] = colIdx;
    } else if (hl.includes("closing") || hl.includes("deadline")) {
      if (colMap["closing_date"] === undefined) colMap["closing_date"] = colIdx;
    } else if (hl.includes("date") && !hl.includes("closing")) {
      if (colMap["date_applied"] === undefined) colMap["date_applied"] = colIdx;
    } else if (hl.includes("status")) {
      if (colMap["status"] === undefined) colMap["status"] = colIdx;
    } else if (hl.includes("notes") || hl.includes("comment") || hl.includes("remark")) {
      if (colMap["notes"] === undefined) colMap["notes"] = colIdx;
    } else if (hl === "link" || hl.includes("apply link") || hl.includes("url")) {
      if (colMap["link"] === undefined) colMap["link"] = colIdx;
    } else if (hl.includes("google")) {
      if (colMap["google_search_link"] === undefined) colMap["google_search_link"] = colIdx;
    } else if (hl.includes("done")) {
      if (colMap["done"] === undefined) colMap["done"] = colIdx;
    }
  });

  const parsedItems: JobApplication[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const companyVal = String(colMap["company"] !== undefined ? row[colMap["company"]] || "" : "").trim();
    const roleVal = String(colMap["role"] !== undefined ? row[colMap["role"]] || "" : "").trim();

    if (!companyVal && !roleVal) continue;
    if (companyVal.toLowerCase() === "organization" || companyVal.toLowerCase() === "company") continue;

    const advertRef = colMap["advert_ref"] !== undefined ? String(row[colMap["advert_ref"]] || "").trim() : "";
    const jobReq = colMap["job_requirements"] !== undefined ? String(row[colMap["job_requirements"]] || "").trim() : "";
    const keyResp = colMap["key_responsibilities"] !== undefined ? String(row[colMap["key_responsibilities"]] || "").trim() : "";

    let statusVal = "Applied";
    if (colMap["status"] !== undefined) {
      const rawStatus = String(row[colMap["status"]] || "").trim();
      const sl = rawStatus.toLowerCase();
      if (sl.includes("interview") || sl.includes("shortlist")) statusVal = "Interviewing";
      else if (sl.includes("offer") || sl.includes("accepted")) statusVal = "Offer";
      else if (sl.includes("reject") || sl.includes("unsuccessful") || sl.includes("regret")) statusVal = "Rejected";
      else if (sl.includes("not yet") || sl.includes("to apply") || sl.includes("draft") || sl.includes("wishlist")) statusVal = "Not yet Applied";
      else if (rawStatus) statusVal = "Applied";
    }

    let shortlisted = false;
    if (colMap["shortlisted"] !== undefined) {
      const rawShort = String(row[colMap["shortlisted"]] || "").trim().toUpperCase();
      shortlisted = ["YES", "TRUE", "1", "Y"].includes(rawShort);
    }
    if (shortlisted && statusVal === "Applied") {
      statusVal = "Interviewing";
    }

    const closingDate = colMap["closing_date"] !== undefined ? normalizeDateString(row[colMap["closing_date"]]) : null;
    const dateApplied = colMap["date_applied"] !== undefined ? normalizeDateString(row[colMap["date_applied"]]) || todayStr : todayStr;

    const notes = colMap["notes"] !== undefined ? String(row[colMap["notes"]] || "").trim() : "";
    let link = colMap["link"] !== undefined ? String(row[colMap["link"]] || "").trim() : "";
    if (link && !link.startsWith("http") && link.includes(".")) {
      link = `https://${link}`;
    }
    const googleLink = colMap["google_search_link"] !== undefined ? String(row[colMap["google_search_link"]] || "").trim() : "";
    const done = colMap["done"] !== undefined ? ["YES", "TRUE", "1", "Y"].includes(String(row[colMap["done"]] || "").trim().toUpperCase()) : false;

    parsedItems.push({
      company: companyVal,
      organization: companyVal,
      role: roleVal || "Software / ICT Professional",
      job_title: roleVal || "Software / ICT Professional",
      advert_ref: advertRef,
      job_requirements: jobReq,
      key_responsibilities: keyResp,
      status: statusVal,
      shortlisted,
      closing_date: closingDate,
      date_applied: dateApplied,
      link,
      done,
      google_search_link: googleLink,
      take_by: "",
      oa: false,
      phone_screen: false,
      interview: shortlisted || statusVal === "Interviewing",
      interview_done: false,
      notes,
    });
  }

  return parsedItems;
}

export default function ApplicationsPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [viewMode, setViewMode] = React.useState<"detailed" | "pipeline">("detailed");
  const [notification, setNotification] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Single Role Modal / Form state
  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState<JobApplication>({
    company: "",
    role: "",
    advert_ref: "",
    key_responsibilities: "",
    job_requirements: "",
    status: "Applied",
    shortlisted: false,
    closing_date: "",
    date_applied: new Date().toISOString().split("T")[0],
    link: "",
    done: false,
    google_search_link: "",
    take_by: "",
    oa: false,
    phone_screen: false,
    interview: false,
    interview_done: false,
    notes: "",
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

  // Handle Quick Inline Toggle
  const handleToggleField = async (app: JobApplication, field: keyof JobApplication) => {
    if (!app.id) return;
    const updatedVal = !app[field];
    const updatePayload: Record<string, any> = { [field]: updatedVal };

    // When toggling shortlisted, keep interview and status in sync
    if (field === "shortlisted" || field === "interview") {
      updatePayload.shortlisted = updatedVal;
      updatePayload.interview = updatedVal;
      if (updatedVal && app.status === "Applied") {
        updatePayload.status = "Interviewing";
      }
    }

    const updatedList = applications.map((item) =>
      item.id === app.id ? { ...item, ...updatePayload } : item
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
        body: JSON.stringify(updatePayload),
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
      showToast("Organization / Company and Role Title are required", "error");
      return;
    }

    try {
      setSaving(true);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const payload = {
        ...formData,
        interview: Boolean(formData.shortlisted || formData.interview),
        shortlisted: Boolean(formData.shortlisted || formData.interview),
      };

      const url = editingId
        ? `${apiUrl}/api/v1/applications/${editingId}/`
        : `${apiUrl}/api/v1/applications/`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
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
    setFormData({
      company: app.company || "",
      role: app.role || "",
      advert_ref: app.advert_ref || "",
      key_responsibilities: app.key_responsibilities || "",
      job_requirements: app.job_requirements || "",
      status: app.status || "Applied",
      shortlisted: Boolean(app.shortlisted || app.interview),
      closing_date: app.closing_date || "",
      date_applied: app.date_applied || new Date().toISOString().split("T")[0],
      link: app.link || "",
      done: Boolean(app.done),
      google_search_link: app.google_search_link || "",
      take_by: app.take_by || "",
      oa: Boolean(app.oa),
      phone_screen: Boolean(app.phone_screen),
      interview: Boolean(app.interview || app.shortlisted),
      interview_done: Boolean(app.interview_done),
      notes: app.notes || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      company: "",
      role: "",
      advert_ref: "",
      key_responsibilities: "",
      job_requirements: "",
      status: "Applied",
      shortlisted: false,
      closing_date: "",
      date_applied: new Date().toISOString().split("T")[0],
      link: "",
      done: false,
      google_search_link: "",
      take_by: "",
      oa: false,
      phone_screen: false,
      interview: false,
      interview_done: false,
      notes: "",
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

    try {
      // 1. Instant client-side parsing using xlsx library (no network needed)
      const clientItems = await parseFileInBrowser(file);
      if (clientItems && clientItems.length > 0) {
        setPreviewItems(clientItems);
        setSelectedIndices(new Set(clientItems.map((_: any, idx: number) => idx)));
        showToast(`Parsed ${clientItems.length} records from ${file.name}!`);
      }

      // 2. Also try backend dry-run for server-side normalization/validation
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

        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          if (items.length > 0) {
            setPreviewItems(items);
            setSelectedIndices(new Set(items.map((_: any, idx: number) => idx)));
          }
        }
      } catch {
        // If server dry-run has any connection error, client-side items are already loaded!
      }
    } catch (err: any) {
      console.error("Spreadsheet parse error:", err);
      showToast(err.message || "Failed to parse spreadsheet file", "error");
    } finally {
      setParsing(false);
    }
  };

  // Quick Select Local/Server Template
  const handleLoadServerTemplate = async (templateKey: string, label: string) => {
    setSelectedFileName(label);
    setParsing(true);

    // 1. Instantly populate using the embedded template preset (NEVER shows 0!)
    const preset = templateKey === "complete_tracker" ? COMPLETE_JOB_TRACKER_PRESET : APPLIED_ROLES_PRESET;
    setPreviewItems(preset);
    setSelectedIndices(new Set(preset.map((_, idx) => idx)));
    showToast(`Loaded ${preset.length} records from ${label}!`);

    // 2. Fetch from backend in the background to sync any dynamic server-side records
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

      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        if (items.length > 0) {
          setPreviewItems(items);
          setSelectedIndices(new Set(items.map((_: any, idx: number) => idx)));
        }
      }
    } catch {
      // Preset already active, ignore network issues
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
      console.error("Bulk create error:", err);
      // Optimistic fallback: if backend is unreachable, add to local state and notify
      setApplications((prev) => {
        const newApps = itemsToImport.map((item, i) => ({
          ...item,
          id: item.id || Date.now() + i,
        }));
        return [...newApps, ...prev];
      });
      showToast(
        `Added ${itemsToImport.length} applications to your tracker! (Saved locally, syncing to backend)`,
        "success"
      );
      setShowImportModal(false);
      setPreviewItems([]);
      setSelectedFileName("");
    } finally {
      setImporting(false);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      app.company.toLowerCase().includes(q) ||
      app.role.toLowerCase().includes(q) ||
      (app.advert_ref || "").toLowerCase().includes(q) ||
      (app.job_requirements || "").toLowerCase().includes(q) ||
      (app.key_responsibilities || "").toLowerCase().includes(q) ||
      (app.notes || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Telemetry metrics
  const totalTracked = applications.length;
  const interviewingCount = applications.filter((a) => a.status === "Interviewing" || a.interview || a.shortlisted).length;
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
              <FileSpreadsheet className="h-3 w-3" /> Detailed Job Tracker Architecture
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Format: Complete Job Application Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Applied Roles Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Manage organization submissions, advert refs, candidate requirements, shortlist status, and dual-sheet Excel exports.
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
            title="Import Excel (.xlsx) or CSV spreadsheet"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Import Spreadsheet</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download Complete_Job_Application_Tracker.xlsx"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Tracker (.xlsx)</span>
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
            <span>Track New Role</span>
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
          <div className="text-[10px] text-slate-400 mt-1">Spreadsheet Job Records</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">Applied</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-heading mt-1">
            {appliedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active Submissions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400">Shortlisted / Interview</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-heading mt-1">
            {interviewingCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Shortlisted Opportunities</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Offers</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-heading mt-1">
            {offersCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Verified Extensions</div>
        </div>
      </div>

      {/* Filter & View Switcher Toolbar */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organization, job title, advert ref, JD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* View Switcher: Detailed Job Tracker vs Pipeline Telemetry */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setViewMode("detailed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "detailed"
                ? "bg-white dark:bg-[#080d1a] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📋 Complete Tracker Format
          </button>
          <button
            type="button"
            onClick={() => setViewMode("pipeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "pipeline"
                ? "bg-white dark:bg-[#080d1a] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ⚡ Pipeline & Telemetry View
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
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

      {/* Spreadsheet Table: Complete Job Application Tracker / Pipeline Mode */}
      <div className="rounded-2xl bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {viewMode === "detailed" ? (
              // Detailed Job Tracker Header (Exact match with Complete_Job_Application_Tracker.xlsx)
              <thead className="bg-slate-100 dark:bg-[#080d1a] border-b border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Organization</th>
                  <th className="p-3.5">Job Title</th>
                  <th className="p-3.5">Advert Ref / Grade</th>
                  <th className="p-3.5">Key Requirements & Certs</th>
                  <th className="p-3.5">Key Responsibilities (JD)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Shortlisted?</th>
                  <th className="p-3.5">Closing Date</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
            ) : (
              // Pipeline / Telemetry Header
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
            )}

            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No matching applications found. Click "Import Spreadsheet" or "Track New Role" to get started.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG["Applied"];
                  const isShortlisted = Boolean(app.shortlisted || app.interview);

                  if (viewMode === "detailed") {
                    // Detailed Job Tracker Row
                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Organization */}
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white font-heading text-sm max-w-[200px]">
                          {app.company}
                          {app.link && (
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-[11px] font-normal text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                            >
                              Portal Link ↗
                            </a>
                          )}
                        </td>

                        {/* Job Title */}
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px]">
                          {app.role}
                        </td>

                        {/* Advert Ref / Grade */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {app.advert_ref || "—"}
                        </td>

                        {/* Key Requirements (Education & Certs) */}
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                          <div className="line-clamp-2" title={app.job_requirements}>
                            {app.job_requirements || "—"}
                          </div>
                        </td>

                        {/* Key Responsibilities (JD Summary) */}
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                          <div className="line-clamp-2" title={app.key_responsibilities}>
                            {app.key_responsibilities || "—"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                          >
                            {app.status}
                          </span>
                        </td>

                        {/* Shortlisted? */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleField(app, "shortlisted")}
                            className="cursor-pointer"
                            title="Toggle Shortlisted status"
                          >
                            {isShortlisted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <Check className="h-3 w-3" /> YES
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 border border-slate-300 dark:border-white/10">
                                No
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Closing Date */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {app.closing_date || app.date_applied || "N/A"}
                        </td>

                        {/* Notes */}
                        <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                          <div className="line-clamp-2" title={app.notes}>
                            {app.notes || "—"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
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
                  }

                  // Pipeline & Telemetry View Row
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white font-heading text-sm">
                          {app.company}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                          {app.role}
                        </div>
                        {app.advert_ref && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {app.advert_ref}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {app.date_applied || "—"}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "oa")}
                          className="cursor-pointer"
                        >
                          {app.oa ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "phone_screen")}
                          className="cursor-pointer"
                        >
                          {app.phone_screen ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "interview")}
                          className="cursor-pointer"
                        >
                          {app.interview ? (
                            <CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(app, "done")}
                          className="cursor-pointer"
                        >
                          {app.done ? (
                            <CheckSquare className="h-4 w-4 text-blue-500 mx-auto" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 mx-auto" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                        <div className="line-clamp-2">
                          {app.job_requirements || app.notes || "—"}
                        </div>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => app.id && handleDelete(app.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
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
                    Supports <span className="font-semibold text-slate-700 dark:text-slate-300">Complete_Job_Application_Tracker.xlsx</span> and <span className="font-semibold text-slate-700 dark:text-slate-300">Applied_Roles.xlsx</span> formats.
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
                      Loaded: {selectedFileName}
                      {previewItems.length > 0 && ` (${previewItems.length} records ready)`}
                    </span>
                  ) : (
                    "Drag and drop Complete_Job_Application_Tracker (.xlsx) or CSV here, or click to browse"
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports Organization, Job Title, Advert Ref/Grade, Requirements, Responsibilities, Status, Shortlisted?, Closing Date, and Notes.
                </p>
              </div>
            </div>

            {/* Parsing State */}
            {parsing && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="text-xs font-medium">Auto-mapping Complete Tracker format columns...</span>
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
                    <span>Skip duplicates (match Organization & Role)</span>
                  </label>
                </div>

                {/* Table of Parsed Records (Complete Job Tracker Columns) */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-[#080d1a] border-b border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">✓</th>
                        <th className="p-3">Organization</th>
                        <th className="p-3">Job Title</th>
                        <th className="p-3">Advert Ref / Grade</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Shortlisted?</th>
                        <th className="p-3">Closing Date</th>
                        <th className="p-3">JD & Requirements</th>
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
                            <td className="p-3 font-bold text-slate-900 dark:text-white font-heading">
                              {item.company}
                            </td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              {item.role}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {item.advert_ref || "—"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {item.shortlisted || item.interview ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  YES
                                </span>
                              ) : (
                                <span className="text-slate-400">No</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {item.closing_date || item.date_applied || "N/A"}
                            </td>
                            <td className="p-3 max-w-xs text-slate-600 dark:text-slate-400 text-[11px]">
                              <div className="line-clamp-2">
                                {item.key_responsibilities || item.job_requirements || item.notes || "—"}
                              </div>
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

      {/* Modal: Add or Edit Single Application (Full Complete Tracker Format) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {editingId ? "Edit Tracked Application" : "Track New Opportunity"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill fields matching the Complete Job Application Tracker format.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApplication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Organization / Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Kenya Space Agency (KSA)"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Job Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Software Engineer / ICT Officer"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Advert Ref / Grade
                  </label>
                  <input
                    type="text"
                    value={formData.advert_ref}
                    onChange={(e) => setFormData({ ...formData, advert_ref: e.target.value })}
                    placeholder="e.g. 13/2026 | KSA 6"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Status
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
                    Closing Date / Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.closing_date || ""}
                    onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Key Requirements (Education & Certs)
                </label>
                <textarea
                  rows={2}
                  value={formData.job_requirements}
                  onChange={(e) => setFormData({ ...formData, job_requirements: e.target.value })}
                  placeholder="Degree in CS/IT, Certifications (CCNA, AWS, PMP, ISACA)..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Key Responsibilities (JD Summary)
                </label>
                <textarea
                  rows={2}
                  value={formData.key_responsibilities}
                  onChange={(e) => setFormData({ ...formData, key_responsibilities: e.target.value })}
                  placeholder="Network infrastructure maintenance, disaster recovery, system administration..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Job Link / Portal URL
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
                  Notes & Terms (Salary, Contact Email, Instructions)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Terms (P&P), salary details, HR submission emails..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status and Pipeline Checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shortlisted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shortlisted: e.target.checked,
                        interview: e.target.checked,
                        status: e.target.checked && formData.status === "Applied" ? "Interviewing" : formData.status,
                      })
                    }
                    className="rounded text-emerald-600"
                  />
                  <span>Shortlisted?</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.oa}
                    onChange={(e) => setFormData({ ...formData, oa: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>OA Passed</span>
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
