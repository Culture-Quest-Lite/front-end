import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="cq-admin-compact min-h-screen flex w-full min-w-0 bg-[linear-gradient(180deg,_#fbfbfc_0%,_#f6f8fb_100%)] text-slate-900">
        <AdminSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 flex h-12 items-center border-b border-[#E7EBF2] bg-[#FCFCFD]/90 px-4 backdrop-blur-sm">
            <SidebarTrigger className="mr-3" />
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <div className="flex-1 min-w-0 overflow-y-auto p-4">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
