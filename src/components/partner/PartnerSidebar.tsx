"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Ticket,
  LogOut,
  HandCoins,
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

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const menuGroups = [
  {
    items: [
      {
        title: "Tổng quan",
        href: "/partner",
        icon: LayoutDashboard,
      },
      {
        title: "Voucher giảm giá",
        href: "/partner/voucher",
        icon: Ticket,
      },
    ],
  },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function PartnerSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/partner") return pathname === "/partner";
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

            <span className="mt-2 inline-flex items-center rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#EA580C] ring-1 ring-[#FED7AA]">
              Partner
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#FCFCFD] py-4">
        {menuGroups.map((group, index) => (
          <SidebarGroup key={index}>
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
                              ? "bg-[linear-gradient(90deg,_#FFF7ED_0%,_#FFFDF8_100%)] text-[#EA580C] font-semibold shadow-[0_8px_20px_rgba(234,88,12,0.08)] ring-1 ring-[#FED7AA]"
                              : "text-slate-600 hover:bg-[#FFF7ED] hover:text-[#EA580C]"
                          )}
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
        <div className="mb-3 rounded-xl border border-orange-100 bg-orange-50 p-3">
          <div className="flex items-center gap-2 text-orange-700">
            <HandCoins className="h-4 w-4" />
            <span className="text-xs font-medium">
              Quản lý voucher của doanh nghiệp
            </span>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-slate-600 transition-colors hover:bg-[#FFF7ED] hover:text-[#EA580C]"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}