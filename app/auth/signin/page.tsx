"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Server,
  Database,
  Cpu,
  Globe,
  Zap,
  CheckCircle2,
  ExternalLink,
  KeyRound,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      setLoading(false);
      if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Invalid username/email or password.");
      }
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleQuickFill = () => {
    setEmail("khalfan@khalfanathman.dev");
    setPassword("Admin@Portfolio2026!");
    setError("");
    setAutofilled(true);
    setTimeout(() => setAutofilled(false), 2500);
  };

  const systemStatusItems = [
    { label: "DRF API Engine", val: "v3.15 Operational", icon: Server, color: "text-emerald-400" },
    { label: "Neon PostgreSQL", val: "SSL Secured Pool", icon: Database, color: "text-blue-400" },
    { label: "JWT Auth Layer", val: "Stateless Rotation", icon: Lock, color: "text-purple-400" },
    { label: "Edge Gateway", val: "Vercel / Cloudflare", icon: Cpu, color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-grid-mesh selection:bg-primary/30">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Main Responsive Cockpit Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        {/* Left Column: Architectural Showcase Deck (Hidden on small mobile, visible on tablet/desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div>
            {/* Brand Emblem */}
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-6 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-primary flex items-center justify-center text-white font-black text-xs shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                KA
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wider text-foreground uppercase font-heading">
                  Khalfan Athman
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Lead Systems Architect & Engineer
                </span>
              </div>
              <div className="ml-2 pl-2 border-l border-white/10 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Node
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading text-white leading-[1.15]">
              Executive Portfolio{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-primary bg-clip-text text-transparent">
                Control Center
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-xl leading-relaxed">
              Unified administrative command deck for managing live showcase projects, verified credentials, 
              client testimonials, and real-time backend telemetry across decoupled Next.js & DRF infrastructure.
            </p>
          </div>

          {/* Real-time Telemetry Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {systemStatusItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-3.5 flex flex-col justify-between transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono truncate">
                      {item.val}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture Highlights Pill Row */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-white">Stateless Security Protocol</span>
                <p className="text-[11px] text-slate-400">256-bit JWT authentication with automated token refresh</p>
              </div>
            </div>
            <a
              href="https://khalfanathman.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Public Portfolio <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Right Column: High-End Sign-In Deck */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-panel rounded-3xl p-7 sm:p-9 relative overflow-hidden shadow-2xl border border-white/[0.08]">
            {/* Header / Security Badge */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-heading">
                    Admin Sign-In
                  </h2>
                  <p className="text-[11px] text-slate-400">Access master dashboard</p>
                </div>
              </div>

              {/* Developer Quick-Fill Helper Badge */}
              <button
                type="button"
                onClick={handleQuickFill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[11px] font-semibold text-blue-300 transition-all cursor-pointer shadow-sm group"
                title="Click to automatically fill master administrator credentials"
              >
                <Zap className="h-3 w-3 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>{autofilled ? "Filled!" : "Autofill Admin"}</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Username / Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between"
                >
                  <span>Username or Email</span>
                  <span className="text-[10px] text-slate-400 font-normal">admin or email</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="khalfan@khalfanathman.dev"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between"
                >
                  <span>Password</span>
                  <span className="text-[10px] text-slate-400 font-normal">Encrypted</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl glass-input text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Animated Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    className="text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-center gap-2.5 overflow-hidden"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit CTA Button with Shimmer */}
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white font-semibold text-sm hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
              >
                {/* Shimmer light overlay */}
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Authorize & Enter Dashboard</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Status Footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                TLS 1.3 Verified
              </span>
              <a
                href={process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://khalfanathman.dev"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Live Site</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
