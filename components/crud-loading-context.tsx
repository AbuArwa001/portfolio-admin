"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Loader2, Sparkles, ShieldCheck } from "lucide-react";

interface CrudLoadingContextType {
  isLoading: boolean;
  message: string;
  submessage?: string;
  startLoading: (message: string, submessage?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(action: () => Promise<T>, message: string, submessage?: string) => Promise<T>;
}

const CrudLoadingContext = createContext<CrudLoadingContextType | undefined>(undefined);

export function CrudLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Executing database operation...");
  const [submessage, setSubmessage] = useState<string | undefined>(
    "Syncing with PostgreSQL database cluster"
  );

  const startLoading = useCallback((msg: string, sub?: string) => {
    setMessage(msg);
    setSubmessage(sub ?? "Synchronizing record with remote DRF PostgreSQL database");
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(action: () => Promise<T>, msg: string, sub?: string): Promise<T> => {
      startLoading(msg, sub);
      try {
        const result = await action();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return (
    <CrudLoadingContext.Provider
      value={{ isLoading, message, submessage, startLoading, stopLoading, withLoading }}
    >
      {children}

      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with ultra-premium blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1222]/95 p-7 shadow-2xl shadow-blue-500/10 text-white backdrop-blur-2xl overflow-hidden"
            >
              {/* Glowing ambient backgrounds */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

              <div className="flex flex-col items-center text-center space-y-4">
                {/* Cybernetic Multi-ring Spinner */}
                <div className="relative flex items-center justify-center w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-b-indigo-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                  <div className="absolute inset-4 rounded-full border border-cyan-400/30 border-r-cyan-400 animate-spin [animation-duration:2s]" />
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Database className="w-4 h-4 text-white animate-pulse" />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10px] font-mono font-bold tracking-wider text-blue-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  POSTGRESQL CLUSTER SYNC
                </div>

                {/* Primary Message */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight font-heading">
                    {message}
                  </h3>
                  {submessage && (
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      {submessage}
                    </p>
                  )}
                </div>

                {/* Progress bar shimmer line */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden relative">
                  <motion.div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full w-1/2"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.4,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Stateless DRF Transaction • Neon SSL
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CrudLoadingContext.Provider>
  );
}

export function useCrudLoading() {
  const context = useContext(CrudLoadingContext);
  if (!context) {
    throw new Error("useCrudLoading must be used within a CrudLoadingProvider");
  }
  return context;
}
