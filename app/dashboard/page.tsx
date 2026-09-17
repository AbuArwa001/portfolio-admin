"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Award,
  Quote,
  Code2,
  User,
  FileText,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [stats, setStats] = useState({
    projectsCount: 0,
    referencesCount: 0,
    certificationsCount: 0,
    skillsCount: 0,
    blogCount: 0,
    loading: true,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [projRes, refRes, certRes, blogRes, skillRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/v1/projects/`),
          fetch(`${apiUrl}/api/v1/references/`),
          fetch(`${apiUrl}/api/v1/certifications/`),
          fetch(`${apiUrl}/api/v1/blog/`),
          fetch(`${apiUrl}/api/v1/auth/profile/skills/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        const projData = projRes.status === "fulfilled" && projRes.value.ok ? await projRes.value.json() : [];
        const refData = refRes.status === "fulfilled" && refRes.value.ok ? await refRes.value.json() : [];
        const certData = certRes.status === "fulfilled" && certRes.value.ok ? await certRes.value.json() : [];
        const blogData = blogRes.status === "fulfilled" && blogRes.value.ok ? await blogRes.value.json() : [];
        const skillData = skillRes.status === "fulfilled" && skillRes.value.ok ? await skillRes.value.json() : [];

        setStats({
          projectsCount: Array.isArray(projData) ? projData.length : 0,
          referencesCount: Array.isArray(refData) ? refData.length : 0,
          certificationsCount: Array.isArray(certData) ? certData.length : 0,
          skillsCount: Array.isArray(skillData) && skillData.length > 0 ? skillData.length : 19,
          blogCount: Array.isArray(blogData) ? blogData.length : 0,
          loading: false,
        });
      } catch {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchCounts();
  }, [apiUrl, token]);

  const cards = [
    {
      title: "Projects",
      count: stats.projectsCount,
      label: "Live & Ongoing Work",
      href: "/dashboard/projects",
      icon: FolderKanban,
      color: "from-blue-500 to-indigo-600",
      accent: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    },
    {
      title: "Certifications",
      count: stats.certificationsCount,
      label: "Credentials & Badges",
      href: "/dashboard/certifications",
      icon: Award,
      color: "from-purple-500 to-pink-600",
      accent: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    },
    {
      title: "References",
      count: stats.referencesCount,
      label: "Verified Referees",
      href: "/dashboard/references",
      icon: Quote,
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    },
    {
      title: "Skills & Tech",
      count: stats.skillsCount,
      label: "Proficiency Tags",
      href: "/dashboard/skills",
      icon: Code2,
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    },
    {
      title: "Blog Posts",
      count: stats.blogCount,
      label: "Technical Articles",
      href: "/dashboard/blog",
      icon: BookOpen,
      color: "from-rose-500 to-red-600",
      accent: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-primary/15 via-blue-500/10 to-transparent p-8 lg:p-10"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome Back</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground font-heading">
            Hello, {session?.user?.name || "Khalfan"}!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Manage your live portfolio records, update CV achievements, upload project snapshots, and monitor API connectivity in real time.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px] shadow-primary/60"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Project
            </Link>
            <Link
              href="/dashboard/cv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-xs font-medium text-foreground hover:bg-white/5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-primary" /> Edit CV Data
            </Link>
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Public Site
            </a>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={card.href}
                className="flex flex-col justify-between p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all group h-full shadow-sm hover:shadow-lg hover:shadow-primary/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`p-2 rounded-xl border ${card.accent}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {card.title}
                  </h3>
                  <div className="text-2xl font-black text-foreground mt-1 font-heading">
                    {stats.loading ? (
                      <div className="h-7 w-10 bg-muted/40 animate-pulse rounded" />
                    ) : (
                      card.count
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                  {card.label}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Navigation Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Panel */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-4">
          <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Management Quick Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/dashboard/projects"
              className="p-3.5 rounded-xl border border-border/60 hover:bg-white/5 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Projects CRUD</div>
                  <div className="text-[11px] text-muted-foreground">Add, edit, remove</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/blog"
              className="p-3.5 rounded-xl border border-border/60 hover:bg-white/5 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-rose-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Blog Articles</div>
                  <div className="text-[11px] text-muted-foreground">Compose & publish</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/references"
              className="p-3.5 rounded-xl border border-border/60 hover:bg-white/5 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Quote className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">References</div>
                  <div className="text-[11px] text-muted-foreground">Manage testimonials</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/certifications"
              className="p-3.5 rounded-xl border border-border/60 hover:bg-white/5 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Certifications</div>
                  <div className="text-[11px] text-muted-foreground">Credentials & badges</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/skills"
              className="p-3.5 rounded-xl border border-border/60 hover:bg-white/5 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Code2 className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Skills & Stack</div>
                  <div className="text-[11px] text-muted-foreground">Proficiency & tags</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/dashboard/profile"
              className="p-3.5 rounded-xl border border-border/60 hover:bg-white/5 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-sky-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Profile & Bio</div>
                  <div className="text-[11px] text-muted-foreground">Personal details</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Backend & Architecture Status */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" /> System Architecture & URLs
            </h3>
            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground">DRF Backend:</span>
                <span className="text-emerald-400 font-semibold">{apiUrl}</span>
              </div>
              <div className="p-3 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground">Public Frontend:</span>
                <span className="text-primary font-semibold">{portfolioUrl}</span>
              </div>
              <div className="p-3 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground">Admin Port:</span>
                <span className="text-purple-400 font-semibold">http://localhost:3001</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> JWT Auth Active
            </span>
            <span>Django REST Framework v3.15</span>
          </div>
        </div>
      </div>
    </div>
  );
}
