import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CuratorSidebar } from "@/components/curator/CuratorSidebar";

interface CuratorLayoutProps {
  children: ReactNode;
}

export function CuratorLayout({ children }: CuratorLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full min-w-0 bg-slate-50 text-slate-900">
        <CuratorSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-sm flex items-center px-6 sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
          </header>
          <div className="flex-1 min-w-0 overflow-y-auto p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
