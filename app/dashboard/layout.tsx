"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/sidebar-context";
import { CrudLoadingProvider } from "@/components/crud-loading-context";
import { SessionCountdownModal } from "@/components/session-countdown-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <CrudLoadingProvider>
        <SessionCountdownModal />
        <SidebarProvider>
          <div className="flex min-h-screen bg-slate-100/70 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 bg-grid-mesh selection:bg-primary/30 transition-colors duration-200">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <SiteHeader />
              <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </CrudLoadingProvider>
    </AuthGuard>
  );
}
