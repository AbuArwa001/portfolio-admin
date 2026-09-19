"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Clock, RefreshCw, LogOut, CheckCircle2 } from "lucide-react";

export function SessionCountdownModal() {
  const { data: session, update, status } = useSession();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const [extendSuccess, setExtendSuccess] = useState(false);
  const hasLoggedOut = useRef(false);

  // Check token expiration periodically
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    // Check if session already reported TokenExpired
    if ((session as any)?.error === "TokenExpired") {
      if (!hasLoggedOut.current) {
        hasLoggedOut.current = true;
        signOut({ callbackUrl: "/auth/signin?expired=true" });
      }
      return;
    }

    const expiresAt = (session as any)?.accessTokenExpires as number | undefined;
    if (!expiresAt) return;

    const checkExpiration = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      // Auto-logout when token hits 0
      if (remaining <= 0 && !hasLoggedOut.current) {
        hasLoggedOut.current = true;
        signOut({ callbackUrl: "/auth/signin?expired=true" });
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [session, status]);

  // Listen for global auth:session-expired events dispatched by fetch wrappers
  useEffect(() => {
    const handleAuthExpired = () => {
      if (!hasLoggedOut.current) {
        hasLoggedOut.current = true;
        signOut({ callbackUrl: "/auth/signin?expired=true" });
      }
    };

    window.addEventListener("auth:session-expired", handleAuthExpired);
    return () => window.removeEventListener("auth:session-expired", handleAuthExpired);
  }, []);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      // Trigger NextAuth jwt refresh callback
      await update();
      setExtendSuccess(true);
      setTimeout(() => {
        setExtendSuccess(false);
        setSecondsRemaining(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to extend session:", err);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogOutNow = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  // Show countdown when <= 300 seconds (5 minutes) remaining
  const shouldShowModal =
    status === "authenticated" &&
    secondsRemaining !== null &&
    secondsRemaining > 0 &&
    secondsRemaining <= 300;

  const minutes = Math.floor((secondsRemaining ?? 0) / 60);
  const seconds = (secondsRemaining ?? 0) % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {shouldShowModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Glassmorphic backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          {/* Countdown Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#0c1222]/95 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-white backdrop-blur-2xl overflow-hidden"
          >
            {/* Ambient amber / red glows */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-red-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="flex flex-col items-center text-center space-y-4">
              {/* Animated Warning Icon with Pulsing Halo */}
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping [animation-duration:2s]" />
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
              </div>

              {/* Security Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                SESSION SECURITY TIMEOUT
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight font-heading">
                  Session Nearing Expiration
                </h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Your JWT access token for the DRF PostgreSQL API will expire soon. Extend your session to avoid interruption.
                </p>
              </div>

              {/* Large Digital Countdown Display */}
              <div className="w-full py-4 px-6 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col items-center justify-center shadow-inner">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">
                  Automatic Logout In
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-amber-400 tabular-nums">
                  {formattedTime}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  onClick={handleLogOutNow}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out Now
                </button>

                <button
                  onClick={handleExtendSession}
                  disabled={isExtending || extendSuccess}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {extendSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
                      Extended!
                    </>
                  ) : isExtending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Renewing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Stay Signed In
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
