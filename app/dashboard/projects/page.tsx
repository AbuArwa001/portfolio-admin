"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Loader2, CheckCircle2, AlertCircle,
  FolderKanban, ExternalLink, ImageIcon, X, Upload, Globe,
  Edit2, Check, Sparkles, Layers, Tag, Network, Cloud,
  Smartphone, Server, Terminal, Code2, Search, Filter,
  Github, FileCode, Cpu, Wifi,
} from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { useCrudLoading } from "@/components/crud-loading-context";
import { SkeletonCard } from "@/components/ui/premium-skeleton";

interface Project {
  id?: number;
  name: string;
  description: string;
  link: string;
  github_link?: string;
  status: string;
  completion: string;
  technologies: string;
  type: string;
  image?: string | null;
  image_url?: string | null;
}

const STATUS_OPTIONS = ["Active", "Completed", "In Progress", "Archived", "On Hold"];
const TYPE_OPTIONS = [
  "Network Engineering",
  "AWS Solutions Architect",
  "Mobile App (Flutter / Android)",
  "Web App",
  "API / Backend",
  "Cloud & DevOps",
  "Systems / ALX",
  "CLI Tool",
  "Open Source",
  "Research",
  "Other",
];

const empty = (): Project => ({
  name: "",
  description: "",
  link: "",
  github_link: "",
  status: "Active",
  completion: "100%",
  technologies: "",
  type: "Network Engineering",
  image: null,
});

function Field({
  label, value, onChange, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
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
        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Technology & Company Slug Dictionary for SimpleIcons Logo Resolution
const TECH_LOGO_MAP: Record<string, string> = {
  // Web Frameworks & UI
  "next.js": "nextdotjs",
  "nextjs": "nextdotjs",
  "next": "nextdotjs",
  "react": "react",
  "react.js": "react",
  "react native": "react",
  "vue": "vuedotjs",
  "vue.js": "vuedotjs",
  "vuejs": "vuedotjs",
  "angular": "angular",
  "svelte": "svelte",
  "sveltekit": "svelte",
  "nuxt": "nuxtdotjs",
  "nuxtjs": "nuxtdotjs",
  "astro": "astro",
  "gatsby": "gatsby",
  "remix": "remix",
  "vite": "vite",
  "webpack": "webpack",
  "tailwind": "tailwindcss",
  "tailwind css": "tailwindcss",
  "tailwindcss": "tailwindcss",
  "bootstrap": "bootstrap",
  "sass": "sass",
  "scss": "sass",
  "css": "css3",
  "css3": "css3",
  "html": "html5",
  "html5": "html5",
  "shadcn": "shadcnui",
  "shadcn/ui": "shadcnui",
  "framer": "framer",
  "framer motion": "framer",

  // Languages & Runtimes
  "typescript": "typescript",
  "ts": "typescript",
  "javascript": "javascript",
  "js": "javascript",
  "python": "python",
  "node": "nodedotjs",
  "node.js": "nodedotjs",
  "nodejs": "nodedotjs",
  "bun": "bun",
  "deno": "deno",
  "go": "go",
  "golang": "go",
  "rust": "rust",
  "c++": "cplusplus",
  "cpp": "cplusplus",
  "c#": "csharp",
  "csharp": "csharp",
  "c": "c",
  "java": "openjdk",
  "kotlin": "kotlin",
  "swift": "swift",
  "dart": "dart",
  "flutter": "flutter",
  "php": "php",
  "ruby": "ruby",
  "rails": "rubyonrails",
  "ruby on rails": "rubyonrails",
  "scala": "scala",
  "elixir": "elixir",
  "bash": "gnubash",
  "shell": "gnubash",

  // Backend & APIs
  "django": "django",
  "django rest framework": "django",
  "drf": "django",
  "fastapi": "fastapi",
  "flask": "flask",
  "express": "express",
  "express.js": "express",
  "expressjs": "express",
  "nestjs": "nestjs",
  "spring": "springboot",
  "spring boot": "springboot",
  "laravel": "laravel",
  "graphql": "graphql",
  "apollo": "apollographql",
  "trpc": "trpc",
  "grpc": "grpc",
  "socket.io": "socketdotio",
  "rest api": "postman",

  // Databases & ORMs
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "mysql": "mysql",
  "sqlite": "sqlite",
  "mongodb": "mongodb",
  "mongo": "mongodb",
  "redis": "redis",
  "supabase": "supabase",
  "firebase": "firebase",
  "prisma": "prisma",
  "drizzle": "drizzle",
  "mariadb": "mariadb",
  "neo4j": "neo4j",
  "cassandra": "apachecassandra",
  "elasticsearch": "elasticsearch",
  "dynamodb": "amazondynamodb",

  // Cloud & DevOps
  "docker": "docker",
  "kubernetes": "kubernetes",
  "k8s": "kubernetes",
  "aws": "aws",
  "amazon web services": "aws",
  "aws solutions architect": "aws",
  "aws solution architect": "aws",
  "aws vpc": "aws",
  "vpc": "aws",
  "aws ec2": "aws",
  "ec2": "aws",
  "aws s3": "aws",
  "s3": "aws",
  "aws rds": "aws",
  "rds": "aws",
  "rds multi-az": "aws",
  "aws lambda": "aws",
  "lambda": "aws",
  "route 53": "aws",
  "route53": "aws",
  "cloudfront": "aws",
  "cloudwatch": "aws",
  "cloudformation": "aws",
  "iam": "aws",
  "aws iam": "aws",
  "ecs": "aws",
  "eks": "aws",
  "terraform": "terraform",
  "gcp": "googlecloud",
  "google cloud": "googlecloud",
  "azure": "microsoftazure",
  "microsoft azure": "microsoftazure",
  "vercel": "vercel",
  "netlify": "netlify",
  "heroku": "heroku",
  "render": "render",
  "digitalocean": "digitalocean",
  "cloudflare": "cloudflare",
  "nginx": "nginx",
  "apache": "apache",
  "ansible": "ansible",
  "linux": "linux",
  "ubuntu": "ubuntu",
  "debian": "debian",
  "github": "github",
  "git": "git",
  "gitlab": "gitlab",
  "github actions": "githubactions",
  "jenkins": "jenkins",

  // Network Engineering & Emulators (Packet Tracer, EVE-NG, GNS3)
  "packet tracer": "cisco",
  "cisco packet tracer": "cisco",
  "packettracer": "cisco",
  "cisco": "cisco",
  "cisco ios": "cisco",
  "eve-ng": "eveng",
  "eveng": "eveng",
  "eve ng": "eveng",
  "gns3": "gns3",
  "wireshark": "wireshark",
  "bgp": "network",
  "ospf": "network",
  "vlan": "network",
  "vlans": "network",
  "hsrp": "network",
  "mpls": "network",
  "sd-wan": "network",
  "vpn": "network",
  "ipsec": "network",
  "pfsense": "pfsense",
  "juniper": "junipernetworks",
  "mikrotik": "mikrotik",
  "fortinet": "fortinet",
  "arista": "aristanetworks",

  // Mobile App (Flutter & Android)
  "android": "android",
  "android studio": "android",
  "androidstudio": "android",
  "apk": "android",
  "google play": "googleplay",
  "play store": "googleplay",
  "riverpod": "flutter",
  "bloc": "flutter",

  // AI & Analytics
  "openai": "openai",
  "anthropic": "anthropic",
  "gemini": "googlegemini",
  "google gemini": "googlegemini",
  "pytorch": "pytorch",
  "tensorflow": "tensorflow",
  "huggingface": "huggingface",
  "hugging face": "huggingface",
  "pandas": "pandas",
  "numpy": "numpy",
  "scikit-learn": "scikitlearn",
  "opencv": "opencv",

  // Tools & Design
  "figma": "figma",
  "postman": "postman",
  "jira": "jira",
  "stripe": "stripe",
  "celery": "celery",
  "rabbitmq": "rabbitmq",
  "kafka": "apachekafka",
};

// Pure black monochrome icons that should invert on dark theme
const DARK_INVERT_SLUGS = new Set([
  "nextdotjs", "github", "vercel", "express", "socketdotio", "prisma", "shadcnui", "apple", "x"
]);

// Dedicated crisp vector SVG brand icons
const SPECIAL_ICONS: Record<string, React.ReactNode> = {
  aws: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M18.8 15.3c-.3-.2-.7-.1-.9.2-1.4 1.7-3.6 2.8-6 2.8-3.4 0-6.3-2.2-7.3-5.2-.1-.4-.5-.6-.9-.4-.4.1-.6.5-.4.9 1.3 3.6 4.7 6.2 8.6 6.2 2.8 0 5.4-1.3 7-3.3.2-.3.1-.7-.1-.9z" fill="#FF9900"/>
      <path d="M19.4 13.8l-2.2.3c-.3 0-.5.3-.4.6.1.3.4.5.7.4l1.3-.2-.5 1.2c-.1.3 0 .6.3.7.3.1.6 0 .7-.3l.7-1.7c.1-.4-.2-.8-.6-1z" fill="#FF9900"/>
      <path d="M7 6.5h2.2l1.6 6.2 1.6-6.2h2.2l1.6 6.2 1.6-6.2h2.1L18 14.5h-2.1l-1.5-5.9-1.5 5.9h-2.1L9.2 8.6l-1.5 5.9H5.6L4 6.5h2.1l1.5 5.9z" fill="#FF9900" transform="scale(0.7) translate(5, 2)"/>
    </svg>
  ),
  cisco: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor">
      <rect x="2" y="10" width="2" height="6" rx="1" fill="#049fd9"/>
      <rect x="6" y="6" width="2" height="14" rx="1" fill="#049fd9"/>
      <rect x="10" y="10" width="2" height="6" rx="1" fill="#049fd9"/>
      <rect x="14" y="3" width="2" height="17" rx="1" fill="#049fd9"/>
      <rect x="18" y="10" width="2" height="6" rx="1" fill="#049fd9"/>
      <rect x="22" y="6" width="2" height="14" rx="1" fill="#049fd9"/>
    </svg>
  ),
  eveng: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#00adef" strokeWidth="2"/>
      <path d="M12 3v18M3 12h18" stroke="#00adef" strokeWidth="1.5" strokeDasharray="2 2"/>
      <circle cx="12" cy="12" r="3" fill="#00adef"/>
      <circle cx="7" cy="8" r="1.5" fill="#f58220"/>
      <circle cx="17" cy="16" r="1.5" fill="#f58220"/>
    </svg>
  ),
  gns3: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" stroke="#2b98d6" strokeWidth="2" fill="#2b98d6" fillOpacity="0.2"/>
      <circle cx="12" cy="7" r="1.5" fill="#2b98d6"/>
      <circle cx="7" cy="15" r="1.5" fill="#48bb78"/>
      <circle cx="17" cy="15" r="1.5" fill="#ed8936"/>
      <path d="M12 7l-5 8m5-8l5 8m-10 0h10" stroke="#2b98d6" strokeWidth="1.2"/>
    </svg>
  ),
  wireshark: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M3 17c5-8 10-12 16-12-1 4-3 7-6 9 3 0 5 1 8 3-7 4-13 3-18 0z" fill="#167ac6"/>
    </svg>
  ),
  flutter: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M14.3 2L4 12.3l3.2 3.2L20.7 2h-6.4zm0 10.4L9.5 17.2 14.3 22h6.4l-7.2-7.2 2.8-2.4z" fill="#54C5F8"/>
      <path d="M9.5 17.2l4.8 4.8h6.4l-7.2-7.2-4 2.4z" fill="#01579B"/>
      <path d="M13.5 14.8l-4 2.4 4 4.8 4-4-4-3.2z" fill="#29B6F6"/>
    </svg>
  ),
  dart: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M4.5 4.5l8.5-2 7 7-6 11-11-4 1.5-12z" fill="#0175C2"/>
      <path d="M7 16.5l7 4 5-10-7-7-5 13z" fill="#00B4AB"/>
      <path d="M4.5 4.5l9.5 9.5-7 2.5-2.5-12z" fill="#54C5F8"/>
    </svg>
  ),
  android: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M6 14v4a2 2 0 002 2h8a2 2 0 002-2v-4H6z" fill="#3DDC84"/>
      <path d="M7 10a5 5 0 0110 0H7z" fill="#3DDC84"/>
      <circle cx="9.5" cy="8.5" r="0.8" fill="#fff"/>
      <circle cx="14.5" cy="8.5" r="0.8" fill="#fff"/>
      <path d="M8 5.5l-1.5-2M16 5.5l1.5-2" stroke="#3DDC84" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  terraform: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
      <path d="M3 3h5.5v5.5H3zM9.25 9.25h5.5v5.5h-5.5zM15.5 3h5.5v5.5h-5.5zM9.25 15.5h5.5v5.5h-5.5z" fill="#844FBA"/>
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="#0ea5e9" strokeWidth="2">
      <rect x="9" y="2" width="6" height="4" rx="1"/>
      <rect x="2" y="18" width="6" height="4" rx="1"/>
      <rect x="16" y="18" width="6" height="4" rx="1"/>
      <path d="M12 6v6m0 0H5v6m7-6h7v6"/>
    </svg>
  ),
};

function getTechSlug(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  // Strip version suffixes like "Next.js 15" -> "next.js", "Python 3.12" -> "python"
  const withoutVersion = trimmed.replace(/\s*v?\d+(\.\d+)*\s*$/i, "").trim();

  if (TECH_LOGO_MAP[withoutVersion]) return TECH_LOGO_MAP[withoutVersion];
  if (TECH_LOGO_MAP[trimmed]) return TECH_LOGO_MAP[trimmed];

  // Try direct alphanumeric slug
  const cleanSlug = withoutVersion.replace(/[^a-z0-9]/g, "");
  return cleanSlug;
}

function TechLogo({ tech }: { tech: string }) {
  const slug = getTechSlug(tech);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [tech, slug]);

  // First check special crisp vectors
  if (SPECIAL_ICONS[slug]) {
    return SPECIAL_ICONS[slug];
  }

  const isInvert = DARK_INVERT_SLUGS.has(slug);

  if (!slug || hasError) {
    const initial = tech.trim().charAt(0).toUpperCase() || "#";
    return (
      <span className="w-3.5 h-3.5 rounded-[4px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[9px] flex items-center justify-center font-mono flex-shrink-0">
        {initial}
      </span>
    );
  }

  return (
    <img
      key={slug}
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={tech}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`w-3.5 h-3.5 object-contain flex-shrink-0 transition-transform ${
        isInvert ? "dark:brightness-0 dark:invert" : ""
      }`}
    />
  );
}

const SUGGESTION_GROUPS = [
  {
    category: "Network Engineering",
    icon: "🌐",
    tags: [
      "Cisco Packet Tracer", "EVE-NG", "GNS3", "Wireshark", "Cisco IOS",
      "BGP", "OSPF", "VLANs", "VPN", "pfSense", "HSRP", "IPsec", "Mikrotik"
    ],
  },
  {
    category: "AWS Solutions Architect",
    icon: "☁️",
    tags: [
      "AWS", "AWS VPC", "Terraform", "EC2", "S3", "RDS Multi-AZ",
      "Lambda", "Route 53", "CloudFront", "CloudFormation", "IAM", "ECS"
    ],
  },
  {
    category: "Mobile App (Flutter / Android)",
    icon: "📱",
    tags: [
      "Flutter", "Dart", "Android", "Android Studio", "Firebase",
      "SQLite", "Riverpod", "Bloc", "REST API", "Google Play"
    ],
  },
  {
    category: "Web & Backend",
    icon: "💻",
    tags: [
      "Next.js", "TypeScript", "React", "Python", "Django",
      "PostgreSQL", "Tailwind CSS", "Docker", "Redis", "GraphQL"
    ],
  },
];

interface TechStackPillsEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  projectType?: string;
}

function TechStackPillsEditor({ value, onChange, projectType = "" }: TechStackPillsEditorProps) {
  const techList = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTech, setNewTech] = useState("");
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const defaultGroupIdx = useMemo(() => {
    if (!projectType) return 0;
    const lower = projectType.toLowerCase();
    if (lower.includes("network")) return 0;
    if (lower.includes("aws") || lower.includes("cloud")) return 1;
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("flutter")) return 2;
    return 3;
  }, [projectType]);

  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(defaultGroupIdx);

  useEffect(() => {
    setSelectedGroupIdx(defaultGroupIdx);
  }, [defaultGroupIdx]);

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const handleRemove = (index: number) => {
    const next = techList.filter((_, i) => i !== index);
    onChange(next.join(", "));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(techList[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (trimmed) {
      const next = [...techList];
      next[index] = trimmed;
      onChange(next.join(", "));
    } else {
      handleRemove(index);
    }
    setEditingIndex(null);
  };

  const handleAdd = () => {
    const trimmed = newTech.trim();
    if (trimmed) {
      const additions = trimmed
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const next = [...techList, ...additions];
      onChange(next.join(", "));
    }
    setNewTech("");
    setIsAdding(false);
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (!techList.some((t) => t.toLowerCase() === suggestion.toLowerCase())) {
      const next = [...techList, suggestion];
      onChange(next.join(", "));
    }
  };

  const currentGroup = SUGGESTION_GROUPS[selectedGroupIdx] || SUGGESTION_GROUPS[0];
  const availableSuggestions = currentGroup.tags.filter(
    (s) => !techList.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-blue-500" />
          Interactive Tech Stack & Brand Logos
        </span>
        <span className="text-[10px] text-slate-400">
          Click pill to edit • logos auto-resolve
        </span>
      </div>

      {/* Pills Container */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-slate-100/70 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-white/[0.08] min-h-[42px]">
        {techList.map((tech, ti) => {
          const isEditing = editingIndex === ti;

          if (isEditing) {
            return (
              <div
                key={ti}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500 text-blue-700 dark:text-blue-300 text-xs shadow-sm"
              >
                <TechLogo tech={editingValue || tech} />
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveEdit(ti);
                    } else if (e.key === "Escape") {
                      setEditingIndex(null);
                    }
                  }}
                  className="bg-transparent border-none text-xs font-mono font-medium focus:outline-none w-28 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(ti)}
                  className="p-0.5 rounded hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 cursor-pointer"
                  title="Save"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-500 cursor-pointer"
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={ti}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 text-slate-800 dark:text-slate-200 text-[11px] font-mono font-medium transition-all shadow-sm"
            >
              <TechLogo tech={tech} />
              <span
                onClick={() => handleStartEdit(ti)}
                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
                title="Click to rename"
              >
                {tech}
              </span>
              <button
                type="button"
                onClick={() => handleStartEdit(ti)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-500 transition-opacity cursor-pointer"
                title="Edit name"
              >
                <Edit2 className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(ti)}
                className="opacity-60 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 text-slate-400 transition-all cursor-pointer"
                title="Remove tech"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Add Tech Input / Button */}
        {isAdding ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs">
            {newTech.trim() && <TechLogo tech={newTech} />}
            <input
              ref={addInputRef}
              type="text"
              value={newTech}
              placeholder="e.g. Cisco Packet Tracer, EVE-NG..."
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTech("");
                }
              }}
              className="bg-transparent border-none text-xs font-mono font-medium focus:outline-none w-44 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTech.trim()}
              className="p-0.5 rounded hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 disabled:opacity-30 cursor-pointer"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTech("");
              }}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-400 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-semibold transition-all cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Tech</span>
          </button>
        )}
      </div>

      {/* Quick Suggestions with Domain Categories */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/60 dark:border-white/[0.04]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Domain Suggestions:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {SUGGESTION_GROUPS.map((grp, gi) => (
              <button
                key={grp.category}
                type="button"
                onClick={() => setSelectedGroupIdx(gi)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  selectedGroupIdx === gi
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                    : "bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {grp.icon} {grp.category.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {availableSuggestions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {availableSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddSuggestion(sug)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white dark:bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/40 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-all cursor-pointer shadow-sm"
              >
                <TechLogo tech={sug} />
                <span>+{sug}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryBadge(type: string) {
  const lower = (type || "").toLowerCase();
  if (lower.includes("network")) {
    return {
      label: type,
      icon: <Network className="h-3 w-3 text-cyan-500" />,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    };
  }
  if (lower.includes("aws") || lower.includes("cloud")) {
    return {
      label: type,
      icon: <Cloud className="h-3 w-3 text-amber-500" />,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  }
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("flutter")) {
    return {
      label: type,
      icon: <Smartphone className="h-3 w-3 text-indigo-500" />,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    };
  }
  if (lower.includes("api") || lower.includes("backend")) {
    return {
      label: type,
      icon: <Server className="h-3 w-3 text-emerald-500" />,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  }
  if (lower.includes("systems") || lower.includes("alx")) {
    return {
      label: type,
      icon: <Terminal className="h-3 w-3 text-purple-500" />,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    };
  }
  return {
    label: type || "Web App",
    icon: <Layers className="h-3 w-3 text-blue-500" />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  };
}

function getFieldHelpers(type: string) {
  const lower = (type || "").toLowerCase();
  if (lower.includes("network")) {
    return {
      title: "e.g. Enterprise Multi-Branch Network (Packet Tracer / EVE-NG)",
      link: "Live web topology viewer or simulation demo URL",
      github: "Packet Tracer (.pkt), EVE-NG configs, or GitHub repo URL",
      desc: "Describe network topology, routing protocols (BGP/OSPF), VLANs, failover (HSRP), and testing in Packet Tracer / EVE-NG / GNS3...",
      tech: "Cisco Packet Tracer, EVE-NG, GNS3, Wireshark, BGP, OSPF, VLANs, Cisco IOS",
    };
  }
  if (lower.includes("aws") || lower.includes("cloud")) {
    return {
      title: "e.g. AWS Multi-Tier High-Availability Architecture",
      link: "Live architecture diagram URL or hosted cloud demo",
      github: "Terraform / CloudFormation infrastructure code repository",
      desc: "Describe multi-AZ VPC design, security groups, Auto-Scaling, database replication, and Disaster Recovery...",
      tech: "AWS, AWS VPC, Terraform, EC2, S3, RDS Multi-AZ, Lambda, Route 53",
    };
  }
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("flutter")) {
    return {
      title: "e.g. Flutter Mobile E-Commerce & Delivery (Android)",
      link: "Google Play Store or APK direct download URL",
      github: "Flutter & Dart source code repository URL",
      desc: "Describe mobile architecture, state management (Riverpod/Bloc), offline SQLite caching, Android features, and Firebase...",
      tech: "Flutter, Dart, Android Studio, Firebase, SQLite, Riverpod, REST API",
    };
  }
  return {
    title: "e.g. Production Web Platform",
    link: "https://...",
    github: "https://github.com/...",
    desc: "Describe the architectural challenge, solution, and business impact...",
    tech: "Next.js, TypeScript, Django, PostgreSQL, Tailwind",
  };
}

export default function ProjectsManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const API = `${getApiUrl()}/api/v1/projects/`;
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [imageFiles, setImageFiles] = useState<Record<number, File | null>>({});
  const [clearedImages, setClearedImages] = useState<Set<number>>(new Set());
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("All");

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => showToast("error", "Failed to load projects from DRF backend."))
      .finally(() => setLoading(false));
  }, [API]);

  const { withLoading } = useCrudLoading();

  const handleSave = async (proj: Project, idx: number) => {
    if (!token) return showToast("error", "Authentication session required.");
    setSaving(proj.id ?? "new");
    await withLoading(
      async () => {
        try {
          const method = proj.id ? "PATCH" : "POST";
          const url = proj.id ? `${API}${proj.id}/` : API;

          const imageFile = imageFiles[idx];
          const shouldClear = clearedImages.has(idx);

          const fd = new FormData();
          fd.append("name", proj.name);
          fd.append("description", proj.description);
          fd.append("link", proj.link || "");
          fd.append("github_link", proj.github_link || "");
          fd.append("status", proj.status);
          fd.append("completion", proj.completion);
          fd.append("technologies", proj.technologies);
          fd.append("type", proj.type);

          if (imageFile) {
            fd.append("image", imageFile);
          } else if (shouldClear) {
            fd.append("image", "");
          }

          const res = await fetch(url, {
            method,
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });

          if (res.status === 401) {
            showToast("error", "Your session has expired. You are being logged out.");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
            }
            return;
          }

          if (!res.ok) throw new Error(await res.text());
          const saved: Project = await res.json();
          setProjects((prev) => {
            const next = [...prev];
            next[idx] = saved;
            return next;
          });
          setImageFiles((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
          });
          setClearedImages((prev) => {
            const next = new Set(prev);
            next.delete(idx);
            return next;
          });
          showToast("success", proj.id ? "Project updated successfully!" : "New project created!");
        } catch (e: any) {
          showToast("error", e.message || "Failed to save project.");
        } finally {
          setSaving(null);
        }
      },
      proj.id ? "Updating Production Project" : "Creating New Project",
      "Persisting project attributes to PostgreSQL database"
    );
  };

  const handleDelete = async (proj: Project, idx: number) => {
    if (!proj.id) {
      setProjects((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!token) return showToast("error", "Authentication required.");
    setDeleting(proj.id);
    await withLoading(
      async () => {
        try {
          const res = await fetch(`${API}${proj.id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            showToast("error", "Your session has expired. You are being logged out.");
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:session-expired"));
            }
            return;
          }
          if (!res.ok) throw new Error();
          setProjects((prev) => prev.filter((_, i) => i !== idx));
          showToast("success", "Project deleted.");
        } catch {
          showToast("error", "Failed to delete project.");
        } finally {
          setDeleting(null);
        }
      },
      "Deleting Project Record",
      "Purging entry from database cluster"
    );
  };

  const updateField = (idx: number, field: keyof Project, value: string) => {
    setProjects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleImageChange = (idx: number, file: File | null) => {
    setImageFiles((prev) => ({ ...prev, [idx]: file }));
    if (file) {
      setClearedImages((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
  };

  const handleClearImage = (idx: number) => {
    handleImageChange(idx, null);
    setClearedImages((prev) => new Set(prev).add(idx));
    setProjects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], image_url: null };
      return next;
    });
    if (fileInputRefs.current[idx]) fileInputRefs.current[idx]!.value = "";
  };

  const filteredProjectsWithIndex = useMemo(() => {
    return projects
      .map((proj, idx) => ({ proj, idx }))
      .filter(({ proj }) => {
        const lowerType = (proj.type || "").toLowerCase();
        let matchCat = true;
        if (selectedFilterCategory === "Network Engineering") {
          matchCat = lowerType.includes("network");
        } else if (selectedFilterCategory === "AWS Solutions Architect") {
          matchCat = lowerType.includes("aws") || lowerType.includes("cloud");
        } else if (selectedFilterCategory === "Mobile App") {
          matchCat = lowerType.includes("mobile") || lowerType.includes("flutter") || lowerType.includes("android");
        } else if (selectedFilterCategory !== "All") {
          matchCat = proj.type === selectedFilterCategory;
        }

        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          proj.name.toLowerCase().includes(q) ||
          proj.technologies.toLowerCase().includes(q) ||
          proj.description.toLowerCase().includes(q);

        return matchCat && matchQuery;
      });
  }, [projects, selectedFilterCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading Projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
              Showcase Registry
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              • {projects.length} Total Projects
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Portfolio Projects
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Manage live production deployments, Cisco/EVE-NG network labs, AWS cloud architectures, and Flutter mobile apps.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`${portfolioUrl}/projects`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>Public View</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <button
            onClick={() => setProjects((prev) => [empty(), ...prev])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
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
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#0c1222]/60 border border-slate-200 dark:border-white/[0.06] backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, technologies, or keywords..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#070b14]/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "All", id: "All" },
            { label: "🌐 Network", id: "Network Engineering" },
            { label: "☁️ AWS Cloud", id: "AWS Solutions Architect" },
            { label: "📱 Mobile", id: "Mobile App" },
            { label: "💻 Web App", id: "Web App" },
            { label: "⚙️ API", id: "API / Backend" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedFilterCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400 gap-3 rounded-3xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-white/50 dark:bg-[#0c1222]/50">
          <FolderKanban className="h-10 w-10 text-blue-500/40" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No projects found.</p>
          <button
            onClick={() => setProjects([empty()])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 text-xs font-medium hover:bg-blue-600/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Create your first project
          </button>
        </div>
      ) : filteredProjectsWithIndex.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
          No projects matching your search & category filter.
        </div>
      ) : null}

      {/* Project Cards */}
      <div className="space-y-6">
        {filteredProjectsWithIndex.map(({ proj, idx }) => {
          const stagedImage = imageFiles[idx];
          const previewUrl = stagedImage
            ? URL.createObjectURL(stagedImage)
            : proj.image_url || null;

          const catBadge = getCategoryBadge(proj.type);
          const helpers = getFieldHelpers(proj.type);

          return (
            <motion.div
              key={proj.id ?? `new-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-xl p-6 sm:p-7 flex flex-col gap-5 shadow-sm transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06] flex-wrap gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                    Project #{idx + 1}
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    {proj.name || "Untitled Project"}
                  </span>

                  {/* Category Badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${catBadge.color}`}>
                    {catBadge.icon}
                    <span>{catBadge.label}</span>
                  </span>

                  {!proj.id && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      Unsaved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                      title="Open Live / Demo URL"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                  {proj.github_link && (
                    <a
                      href={proj.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                      title="Open GitHub / Lab Files URL"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(proj, idx)}
                    disabled={deleting === proj.id}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 cursor-pointer"
                    title="Delete Project"
                  >
                    {deleting === proj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Image Uploader */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Snapshot Image / Architecture / Lab Topology Diagram
                </label>
                <div className="flex items-start gap-4">
                  <div className="relative w-28 h-18 rounded-xl border border-border/60 bg-muted/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {previewUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleClearImage(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      ref={(el) => { fileInputRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`project-image-${idx}`}
                      onChange={(e) => handleImageChange(idx, e.target.files?.[0] ?? null)}
                    />
                    <label
                      htmlFor={`project-image-${idx}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border/60 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary cursor-pointer transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {stagedImage ? stagedImage.name : "Select Image / Topology..."}
                    </label>
                    <p className="text-[11px] text-muted-foreground/60">PNG, JPG, WebP, Diagrams (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Project Title"
                  value={proj.name}
                  placeholder={helpers.title}
                  onChange={(v) => updateField(idx, "name", v)}
                />
                <SelectField
                  label="Category / Project Domain"
                  value={proj.type}
                  options={TYPE_OPTIONS}
                  onChange={(v) => updateField(idx, "type", v)}
                />
                <Field
                  label="Live / Demo / Hosted Topology URL"
                  value={proj.link}
                  type="url"
                  placeholder={helpers.link}
                  onChange={(v) => updateField(idx, "link", v)}
                />
                <Field
                  label="GitHub / Topology / Lab Files URL"
                  value={proj.github_link || ""}
                  type="url"
                  placeholder={helpers.github}
                  onChange={(v) => updateField(idx, "github_link", v)}
                />
                <SelectField
                  label="Status"
                  value={proj.status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => updateField(idx, "status", v)}
                />
                <Field
                  label="Completion Level"
                  value={proj.completion}
                  placeholder="e.g. 100% or Lab Verified"
                  onChange={(v) => updateField(idx, "completion", v)}
                />
                <div className="md:col-span-2">
                  <Field
                    label="Tech Stack (comma-separated)"
                    value={proj.technologies}
                    placeholder={helpers.tech}
                    onChange={(v) => updateField(idx, "technologies", v)}
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Description & Technical Case Study Highlights
                  </label>
                  <textarea
                    rows={3}
                    value={proj.description}
                    onChange={(e) => updateField(idx, "description", e.target.value)}
                    placeholder={helpers.desc}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y"
                  />
                </div>
              </div>

              {/* Interactive Editable Tech Pills with Auto Company/Tech Logos */}
              <TechStackPillsEditor
                value={proj.technologies}
                onChange={(v) => updateField(idx, "technologies", v)}
                projectType={proj.type}
              />

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSave(proj, idx)}
                  disabled={saving === (proj.id ?? "new")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving === (proj.id ?? "new") ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-3.5 w-3.5" /> {proj.id ? "Update Project" : "Save Project"}</>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
