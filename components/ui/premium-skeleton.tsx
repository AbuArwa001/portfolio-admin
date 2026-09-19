"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function PremiumSkeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-200/80 dark:bg-white/[0.05] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/[0.08] before:to-transparent ${className}`}
      {...props}
    />
  );
}

export function SkeletonHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="space-y-2">
        <PremiumSkeleton className="h-5 w-32 rounded-full" />
        <PremiumSkeleton className="h-8 w-64 rounded-xl" />
        <PremiumSkeleton className="h-4 w-96 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <PremiumSkeleton className="h-10 w-28 rounded-xl" />
        <PremiumSkeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#0c1222]/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <PremiumSkeleton className="h-4 w-24 rounded-md" />
        <PremiumSkeleton className="h-7 w-7 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <PremiumSkeleton className="h-3 w-16" />
          <PremiumSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <PremiumSkeleton className="h-3 w-16" />
          <PremiumSkeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-1.5">
        <PremiumSkeleton className="h-3 w-28" />
        <PremiumSkeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonEditorDossier() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonHeader />
      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <PremiumSkeleton key={i} className="h-8 w-28 rounded-xl" />
        ))}
      </div>
      {/* Content panel skeleton */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1222]/80 p-6 sm:p-8 space-y-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
