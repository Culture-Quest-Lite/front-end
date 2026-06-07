import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CuratorSidebar } from "@/components/curator/CuratorSidebar";

interface CuratorLayoutProps {
  children: ReactNode;
}

export function CuratorLayout({ children }: CuratorLayoutProps) {
  return (
    <SidebarProvider>
      <div className="cq-curator-compact min-h-screen flex w-full min-w-0 bg-slate-50 text-slate-900">
        <CuratorSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 flex h-12 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm">
            <SidebarTrigger className="mr-3" />
            <div className="flex-1" />
          </header>
          <div className="flex-1 min-w-0 overflow-y-auto p-4">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
