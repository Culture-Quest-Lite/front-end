"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Tag,
  LogOut,
  BookOpen,
  MapPin,
  Map,
  Tags,
  LayoutGrid,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
// import { toast } from "sonner";
// import { logoutFromNextClientToNextServer } from "@/services/auth.service";
// import { useAppContext } from "@/app/AppProvider";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const menuGroups: Array<{
  items: MenuItem[];
}> = [
  {
    items: [
      { title: "Tổng quan", href: "/curator", icon: LayoutDashboard },
      { title: "Hotspot", href: "/curator/hotspot", icon: MapPin },
      { title: "Câu chuyện", href: "/curator/stories", icon: BookOpen },
      { title: "Chủ đề tuyến", href: "/curator/themes", icon: Tags },
      { title: "Tuyến hành trình", href: "/curator/routes", icon: Map },
      {
        title: "Cấp bậc",
        href: "/curator/levels",
        icon: LayoutGrid,
      },
      {
        title: "Tags",
        href: "/curator/tags",
        icon: Tag,
      },
    ],
  },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function CuratorSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  //   const { setTokens } = useAppContext();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/curator") return pathname === "/curator";
    if (href === "/curator/hotspot") {
      return pathname === href || pathname.startsWith("/curator/hotspot/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar className="h-screen border-r border-[#E7EBF2] bg-[#FCFCFD]">
      <SidebarHeader className="border-b border-[#E7EBF2] bg-[#FCFCFD] p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-[68px] w-[68px] shrink-0">
            <Image
              src="/logo2.png"
              alt="CultureQuest Lite"
              fill
              sizes="68px"
              priority
              className="object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-[17px] font-semibold leading-none tracking-[-0.03em] text-slate-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              CultureQuest Lite
            </h1>
            <span className="mt-2 inline-flex items-center rounded-full bg-[#FFF1F7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D94A8D] ring-1 ring-[#F7DCE8]">
              Curator
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#FCFCFD] py-4">
        {menuGroups.map((group, index) => (
          <SidebarGroup key={index} className="mb-6 last:mb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex w-full items-center gap-2.5 rounded-xl text-[13px] transition-colors",
                            active
                              ? "bg-[linear-gradient(90deg,_#fff1f7_0%,_#fff6ee_100%)] text-[#D94A8D] font-semibold shadow-[0_8px_20px_rgba(235,72,155,0.08)] ring-1 ring-[#F7DCE8]"
                              : "text-slate-600 hover:bg-[#FFF7FA] hover:text-[#D94A8D]",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="py-2.5 pl-1.5 pr-3">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#E7EBF2] bg-[#FCFCFD] p-4">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-slate-600 transition-colors hover:bg-[#FFF7FA] hover:text-[#D94A8D]"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
