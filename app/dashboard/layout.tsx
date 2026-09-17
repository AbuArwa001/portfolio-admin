"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#070b14] text-foreground bg-grid-mesh selection:bg-primary/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <SiteHeader />
          <main className="flex-1 p-5 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
