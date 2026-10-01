"use client";

import * as React from "react";
import Link from "next/link";
import {
  Network,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Calculator,
} from "lucide-react";

// ── Subnetting Math Utilities ────────────────────────────────────────────────
function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join(".");
}

function maskFromCidr(cidr: number): number {
  return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
}

function calculateSubnetDetails(ip: string, cidr: number) {
  const ipInt = ipToInt(ip);
  const maskInt = maskFromCidr(cidr);
  const wildcardInt = ~maskInt >>> 0;
  const netInt = (ipInt & maskInt) >>> 0;
  const bcastInt = (netInt | wildcardInt) >>> 0;

  let firstUsableInt = netInt + 1;
  let lastUsableInt = bcastInt - 1;
  let usableHosts = Math.pow(2, 32 - cidr) - 2;

  if (cidr === 31) {
    firstUsableInt = netInt;
    lastUsableInt = bcastInt;
    usableHosts = 2; // RFC 3021 point-to-point
  } else if (cidr === 32) {
    firstUsableInt = netInt;
    lastUsableInt = netInt;
    usableHosts = 1;
  }

  return {
    ip,
    cidr,
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    networkAddress: intToIp(netInt),
    broadcastAddress: intToIp(bcastInt),
    firstUsable: intToIp(firstUsableInt),
    lastUsable: intToIp(lastUsableInt),
    usableHosts: Math.max(0, usableHosts),
  };
}

// Generates random realistic IPv4 addresses within typical private/public blocks
function generateRandomSubnetProblem() {
  const commonPrefixes = [24, 25, 26, 27, 28, 29, 30, 22, 23, 20, 19, 16];
  const cidr = commonPrefixes[Math.floor(Math.random() * commonPrefixes.length)];

  const ranges = [
    { a: 192, b: 168, c: Math.floor(Math.random() * 255) },
    { a: 172, b: 16 + Math.floor(Math.random() * 16), c: Math.floor(Math.random() * 255) },
    { a: 10, b: Math.floor(Math.random() * 255), c: Math.floor(Math.random() * 255) },
  ];
  const r = ranges[Math.floor(Math.random() * ranges.length)];
  const d = Math.floor(Math.random() * 254) + 1;
  const ip = `${r.a}.${r.b}.${r.c}.${d}`;

  return calculateSubnetDetails(ip, cidr);
}

export default function SubnettingPracticePage() {
  const [problem, setProblem] = React.useState<ReturnType<typeof calculateSubnetDetails> | null>(null);
  const [userNet, setUserNet] = React.useState("");
  const [userFirst, setUserFirst] = React.useState("");
  const [userLast, setUserLast] = React.useState("");
  const [userBcast, setUserBcast] = React.useState("");
  const [userMask, setUserMask] = React.useState("");
  const [userWildcard, setUserWildcard] = React.useState("");
  const [userHosts, setUserHosts] = React.useState("");

  const [hasChecked, setHasChecked] = React.useState(false);
  const [score, setScore] = React.useState({ correct: 0, total: 0 });
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);

  // Initialize first problem on mount
  React.useEffect(() => {
    loadNewProblem();
  }, []);

  const loadNewProblem = () => {
    const p = generateRandomSubnetProblem();
    setProblem(p);
    setUserNet("");
    setUserFirst("");
    setUserLast("");
    setUserBcast("");
    setUserMask("");
    setUserWildcard("");
    setUserHosts("");
    setHasChecked(false);
    setShowHint(false);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || hasChecked) return;

    const isNetCorrect = userNet.trim() === problem.networkAddress;
    const isFirstCorrect = userFirst.trim() === problem.firstUsable;
    const isLastCorrect = userLast.trim() === problem.lastUsable;
    const isBcastCorrect = userBcast.trim() === problem.broadcastAddress;
    const isMaskCorrect = userMask.trim() === problem.subnetMask;
    const isWildcardCorrect = userWildcard.trim() === problem.wildcardMask;
    const isHostsCorrect = parseInt(userHosts.trim(), 10) === problem.usableHosts;

    const allCorrect =
      isNetCorrect &&
      isFirstCorrect &&
      isLastCorrect &&
      isBcastCorrect &&
      isMaskCorrect &&
      isWildcardCorrect &&
      isHostsCorrect;

    setHasChecked(true);
    setScore((prev) => ({
      correct: prev.correct + (allCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (allCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
    } else {
      setStreak(0);
    }
  };

  if (!problem) return null;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              CCNA 200-301 Mastery
            </span>
            <span className="text-xs text-slate-400 font-mono">Subnetting Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            <span>Interactive Subnetting Practice Tool</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Speed drill for network calculations: network ID, valid host ranges, broadcast, and wildcard masks.
          </p>
        </div>

        {/* Gamification Stats */}
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{streak}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Streak (Best {bestStreak})</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-emerald-500 font-mono">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {score.correct}/{score.total} Correct
            </div>
          </div>
        </div>
      </div>

      {/* Target IP & CIDR Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 shadow-xl text-white text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Given Host IP & Prefix</span>
        </div>

        <div className="text-3xl sm:text-5xl font-mono font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          {problem.ip} <span className="text-amber-400">/{problem.cidr}</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Calculate the subnet parameters for this host IP address. Fill out all fields and verify your answer.
        </p>
      </div>

      {/* Input Form Formats */}
      <form onSubmit={handleCheck} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subnet Mask */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Subnet Mask (Dotted Decimal)</span>
              {hasChecked && (
                <span className={`text-[11px] font-mono font-bold ${userMask.trim() === problem.subnetMask ? "text-emerald-500" : "text-rose-500"}`}>
                  {userMask.trim() === problem.subnetMask ? "✓ Correct" : `✗ Answer: ${problem.subnetMask}`}
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 255.255.255.0"
              value={userMask}
              onChange={(e) => setUserMask(e.target.value)}
              disabled={hasChecked}
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
                hasChecked
                  ? userMask.trim() === problem.subnetMask
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              }`}
            />
          </div>

          {/* Wildcard Mask */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Wildcard Mask (for ACL / OSPF)</span>
              {hasChecked && (
                <span className={`text-[11px] font-mono font-bold ${userWildcard.trim() === problem.wildcardMask ? "text-emerald-500" : "text-rose-500"}`}>
                  {userWildcard.trim() === problem.wildcardMask ? "✓ Correct" : `✗ Answer: ${problem.wildcardMask}`}
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 0.0.0.255"
              value={userWildcard}
              onChange={(e) => setUserWildcard(e.target.value)}
              disabled={hasChecked}
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
                hasChecked
                  ? userWildcard.trim() === problem.wildcardMask
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              }`}
            />
          </div>

          {/* Network Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Network ID / Address</span>
              {hasChecked && (
                <span className={`text-[11px] font-mono font-bold ${userNet.trim() === problem.networkAddress ? "text-emerald-500" : "text-rose-500"}`}>
                  {userNet.trim() === problem.networkAddress ? "✓ Correct" : `✗ Answer: ${problem.networkAddress}`}
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 192.168.1.0"
              value={userNet}
              onChange={(e) => setUserNet(e.target.value)}
              disabled={hasChecked}
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
                hasChecked
                  ? userNet.trim() === problem.networkAddress
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              }`}
            />
          </div>

          {/* Broadcast Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Broadcast Address</span>
              {hasChecked && (
                <span className={`text-[11px] font-mono font-bold ${userBcast.trim() === problem.broadcastAddress ? "text-emerald-500" : "text-rose-500"}`}>
                  {userBcast.trim() === problem.broadcastAddress ? "✓ Correct" : `✗ Answer: ${problem.broadcastAddress}`}
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 192.168.1.255"
              value={userBcast}
              onChange={(e) => setUserBcast(e.target.value)}
              disabled={hasChecked}
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
                hasChecked
                  ? userBcast.trim() === problem.broadcastAddress
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              }`}
            />
          </div>

          {/* First Usable Host */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>First Usable Host IP</span>
              {hasChecked && (
                <span className={`text-[11px] font-mono font-bold ${userFirst.trim() === problem.firstUsable ? "text-emerald-500" : "text-rose-500"}`}>
                  {userFirst.trim() === problem.firstUsable ? "✓ Correct" : `✗ Answer: ${problem.firstUsable}`}
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 192.168.1.1"
              value={userFirst}
              onChange={(e) => setUserFirst(e.target.value)}
              disabled={hasChecked}
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
                hasChecked
                  ? userFirst.trim() === problem.firstUsable
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              }`}
            />
          </div>

          {/* Last Usable Host */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Last Usable Host IP</span>
              {hasChecked && (
                <span className={`text-[11px] font-mono font-bold ${userLast.trim() === problem.lastUsable ? "text-emerald-500" : "text-rose-500"}`}>
                  {userLast.trim() === problem.lastUsable ? "✓ Correct" : `✗ Answer: ${problem.lastUsable}`}
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 192.168.1.254"
              value={userLast}
              onChange={(e) => setUserLast(e.target.value)}
              disabled={hasChecked}
              className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
                hasChecked
                  ? userLast.trim() === problem.lastUsable
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              }`}
            />
          </div>
        </div>

        {/* Usable Hosts Count */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Total Usable Host Addresses (2^(32-H) - 2)</span>
            {hasChecked && (
              <span className={`text-[11px] font-mono font-bold ${parseInt(userHosts.trim(), 10) === problem.usableHosts ? "text-emerald-500" : "text-rose-500"}`}>
                {parseInt(userHosts.trim(), 10) === problem.usableHosts ? "✓ Correct" : `✗ Answer: ${problem.usableHosts}`}
              </span>
            )}
          </label>
          <input
            type="number"
            required
            placeholder="e.g. 254"
            value={userHosts}
            onChange={(e) => setUserHosts(e.target.value)}
            disabled={hasChecked}
            className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm border transition-colors ${
              hasChecked
                ? parseInt(userHosts.trim(), 10) === problem.usableHosts
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                  : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-200"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            }`}
          />
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-500 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showHint ? "Hide Formula" : "Show Subnetting Formula & Cheat Sheet"}</span>
          </button>

          <div className="flex items-center gap-2.5">
            {hasChecked ? (
              <button
                type="button"
                onClick={loadNewProblem}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <span>Next Problem</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Check Answers</span>
              </button>
            )}
          </div>
        </div>

        {/* Cheat sheet / Formula accordion */}
        {showHint && (
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
            <h4 className="font-bold font-mono uppercase text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Subnetting Quick Formulas</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-mono leading-relaxed">
              <li><strong>Block Size (Magic Number):</strong> 256 - [interesting octet of subnet mask]</li>
              <li><strong>Usable Hosts:</strong> 2^(32 - CIDR) - 2</li>
              <li><strong>Wildcard Mask:</strong> 255.255.255.255 - Subnet Mask</li>
              <li><strong>Network ID:</strong> Host IP with host bits set to 0</li>
              <li><strong>Broadcast IP:</strong> Host IP with host bits set to 1</li>
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
