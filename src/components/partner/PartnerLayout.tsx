"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PartnerSidebar } from "./PartnerSidebar";

interface PartnerLayoutProps {
  children: ReactNode;
}

export function PartnerLayout({ children }: PartnerLayoutProps) {
  return (
    <SidebarProvider>
      <div className="cq-partner-compact flex min-h-screen w-full min-w-0 bg-[linear-gradient(180deg,_#fbfbfc_0%,_#f6f8fb_100%)] text-slate-900">
        <PartnerSidebar />

        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 flex h-12 items-center border-b border-[#E7EBF2] bg-[#FCFCFD]/90 px-4 backdrop-blur-sm">
            <SidebarTrigger className="mr-3" />
            <div className="flex-1" />
          </header>

          <div className="flex-1 min-w-0 overflow-y-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}