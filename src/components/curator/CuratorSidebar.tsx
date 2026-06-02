"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Tag,
  Users,
  LogOut,
  BookOpen,
  MapPin,
  Map,
  ShieldCheck,
  Clock,
  BarChart3,
  Shield,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
// import { toast } from "sonner";
// import { logoutFromNextClientToNextServer } from "@/services/auth.service";
// import { useAppContext } from "@/app/AppProvider";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const menuGroups: Array<{
  label: string;
  items: MenuItem[];
}> = [
  {
    label: "CHUNG",
    items: [{ title: "Tổng quan", href: "/curator", icon: LayoutDashboard }],
  },
  {
    label: "CURATOR",
    items: [
      { title: "Hotspot", href: "/curator/hotspot", icon: MapPin },
      { title: "Câu chuyện", href: "/curator/stories", icon: BookOpen },
      { title: "Tuyến hành trình", href: "/curator/routes", icon: Map },
      {
        title: "Danh mục & Thẻ",
        href: "/curator/categories-and-tags",
        icon: Tag,
      },
    ],
  },
  //   {
  //     label: "ADMIN",
  //     items: [
  //       {
  //         title: "Duyệt nội dung",
  //         href: "/admin/content-review",
  //         icon: ShieldCheck,
  //       },
  //       { title: "Lịch sử duyệt", href: "/admin/review-history", icon: Clock },
  //       { title: "Người dùng", href: "/admin/users-manager", icon: Users },
  //       { title: "Phân tích", href: "/admin/analytics", icon: BarChart3 },
  //       { title: "Kiểm duyệt", href: "/admin/moderation", icon: Shield },
  //       { title: "Cài đặt", href: "/admin/settings", icon: Settings },
  //     ],
  //   },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function CuratorSidebar() {
  const pathname = usePathname();
  //   const { setTokens } = useAppContext();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/curator") return pathname === "/curator";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  //   const handleLogout = async () => {
  //     try {
  //     //   await logoutFromNextClientToNextServer();
  //       toast.success("Đăng xuất thành công");
  //     } catch (e) {
  //       console.error(e);
  //       toast.error(e instanceof Error ? e.message : "Đăng xuất thất bại");
  //     } finally {
  //       try {
  //         setTokens({ accessToken: "", refreshToken: "", expiresAt: "" });
  //       } catch (err) {
  //         console.error("Clear tokens error:", err);
  //       }

  //       try {
  //         router.replace("/login");
  //       } catch (err) {
  //         console.error("Redirect error:", err);
  //       }
  //     }
  //   };

  return (
    <Sidebar className="h-screen border-r border-slate-200 bg-white">
      <SidebarHeader className="p-5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-[#f6caa1] flex items-center justify-center">
            <span className="font-semibold text-white">CQ</span>
          </div>

          <div>
            <h1 className="font-semibold text-slate-900 text-base">
              Culture Quest
            </h1>
            <p className="text-xs text-slate-500">Lite - CMS & Curator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-white">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-6 last:mb-0">
            <SidebarGroupLabel className="px-4 text-slate-500 text-[11px] uppercase tracking-[0.22em] mb-3 font-semibold">
              {group.label}
            </SidebarGroupLabel>

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
                            "relative flex items-center gap-3 w-full rounded-xl transition-colors text-sm",
                            active
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          {active ? (
                            <span className="absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-rose-500" />
                          ) : null}
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span className="py-3 pl-2 pr-4">{item.title}</span>
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

      <SidebarFooter className="p-4 border-t border-gray-200 bg-white">
        <button
          type="button"
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#a29d9b] transition-colors"
          // onClick={() => void handleLogout()}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
