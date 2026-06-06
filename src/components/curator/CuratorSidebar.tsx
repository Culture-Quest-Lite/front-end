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
  FolderTree,
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
        title: "Danh mục",
        href: "/curator/categories",
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
      <SidebarHeader className="border-b border-slate-200 bg-white ">
        <div className="flex items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sidebar-primary">
            <Image
              src="/logo1.png"
              alt="CultureQuest Lite"
              fill
              sizes="150px"
              priority
              className="object-contain p-0.5"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="whitespace-nowrap text-[17px] font-semibold leading-none tracking-[-0.03em] text-slate-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              CultureQuest Lite
            </h1>
            <p className="mt-1 whitespace-nowrap text-[11px] leading-none text-slate-500">
              Quản lý nội dung
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-white">
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
                            "relative flex items-center gap-3 w-full rounded-xl transition-colors text-sm",
                            active
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
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
