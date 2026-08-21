"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type TitleRule = {
  pattern: RegExp;
  title: string;
};

const ROUTE_TITLE_RULES: TitleRule[] = [
  { pattern: /^\/$/, title: "Culture Quest Lite | Đăng nhập" },
  { pattern: /^\/reset-password\/?$/, title: "Đặt lại mật khẩu" },

  { pattern: /^\/admin\/users-manager(?:\/|$)/, title: "Người dùng" },
  { pattern: /^\/admin\/permissions(?:\/|$)/, title: "Phân quyền" },
  { pattern: /^\/admin\/subscriptions(?:\/|$)/, title: "Gói đăng ký" },
  { pattern: /^\/admin\/settings(?:\/|$)/, title: "Bán kính địa điểm" },
  {
    pattern: /^\/admin\/partner-verification(?:\/|$)/,
    title: "Duyệt đối tác",
  },
  {
    pattern: /^\/admin\/content-review\/[^/]+(?:\/|$)/,
    title: "Chi tiết duyệt nội dung",
  },
  { pattern: /^\/admin\/content-review(?:\/|$)/, title: "Duyệt nội dung" },
  {
    pattern: /^\/admin\/tag-review(?:\/|$)/,
    title: "Kiểm duyệt thẻ và câu chuyện",
  },
  { pattern: /^\/admin\/moderation(?:\/|$)/, title: "Xử lý báo cáo" },
  { pattern: /^\/admin\/review-history(?:\/|$)/, title: "Lịch sử duyệt" },
  { pattern: /^\/admin\/analytics(?:\/|$)/, title: "Phân tích" },
  { pattern: /^\/admin(?:\/|$)/, title: "Tổng quan" },

  { pattern: /^\/curator\/hotspot\/create(?:\/|$)/, title: "Tạo địa điểm" },
  {
    pattern: /^\/curator\/hotspot\/[^/]+(?:\/|$)/,
    title: "Chi tiết địa điểm",
  },
  { pattern: /^\/curator\/hotspot(?:\/|$)/, title: "Địa điểm" },

  { pattern: /^\/curator\/stories\/create(?:\/|$)/, title: "Tạo câu chuyện" },
  {
    pattern: /^\/curator\/stories\/[^/]+\/edit(?:\/|$)/,
    title: "Chỉnh sửa câu chuyện",
  },
  {
    pattern: /^\/curator\/stories\/[^/]+(?:\/|$)/,
    title: "Chi tiết câu chuyện",
  },
  { pattern: /^\/curator\/stories(?:\/|$)/, title: "Câu chuyện" },

  { pattern: /^\/curator\/routes\/create(?:\/|$)/, title: "Tạo tuyến đường" },
  {
    pattern: /^\/curator\/routes\/[^/]+(?:\/|$)/,
    title: "Chi tiết tuyến",
  },
  { pattern: /^\/curator\/routes(?:\/|$)/, title: "Tuyến đường" },

  { pattern: /^\/curator\/levels\/create(?:\/|$)/, title: "Tạo cấp bậc" },
  {
    pattern: /^\/curator\/levels\/[^/]+(?:\/|$)/,
    title: "Chi tiết cấp bậc",
  },
  { pattern: /^\/curator\/levels(?:\/|$)/, title: "Cấp bậc" },

  { pattern: /^\/curator\/tags\/[^/]+(?:\/|$)/, title: "Chi tiết thẻ" },
  { pattern: /^\/curator\/tags(?:\/|$)/, title: "Thẻ" },

  { pattern: /^\/curator\/themes\/create(?:\/|$)/, title: "Tạo chủ đề" },
  {
    pattern: /^\/curator\/themes\/[^/]+(?:\/|$)/,
    title: "Chi tiết chủ đề",
  },
  { pattern: /^\/curator\/themes(?:\/|$)/, title: "Chủ đề" },
  { pattern: /^\/curator(?:\/|$)/, title: "Tổng quan" },

  { pattern: /^\/partner\/voucher(?:\/|$)/, title: "Voucher" },
  { pattern: /^\/partner\/setting(?:\/|$)/, title: "Cài đặt" },
  { pattern: /^\/partner(?:\/|$)/, title: "Tổng quan đối tác" },
];

const FALLBACK_TITLE_SELECTORS = [
  "main .cq-page-title",
  "main [data-page-title]",
  "main h1",
];

function normalizeTitle(title?: string | null) {
  return title?.trim().replace(/\s+/g, " ") || null;
}

function getMappedRouteTitle(pathname: string) {
  return (
    ROUTE_TITLE_RULES.find((rule) => rule.pattern.test(pathname))?.title ?? null
  );
}

function getExplicitTabTitle() {
  const explicitNodes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-tab-title]"),
  );

  for (let index = explicitNodes.length - 1; index >= 0; index -= 1) {
    const title = normalizeTitle(explicitNodes[index]?.dataset.tabTitle);

    if (title) {
      return title;
    }
  }

  return null;
}

function getFallbackDomTitle() {
  for (const selector of FALLBACK_TITLE_SELECTORS) {
    const title = normalizeTitle(
      document.querySelector<HTMLElement>(selector)?.textContent,
    );

    if (title) {
      return title;
    }
  }

  return null;
}

export function RouteDocumentTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    let frameId = 0;

    const updateTitle = () => {
      const nextTitle =
        getExplicitTabTitle() ??
        getMappedRouteTitle(pathname) ??
        getFallbackDomTitle();

      if (nextTitle && document.title !== nextTitle) {
        document.title = nextTitle;
      }
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTitle);
    };

    scheduleUpdate();

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, {
      attributeFilter: ["data-tab-title"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  return null;
}
