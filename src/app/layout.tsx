import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

import { AppToastProvider } from "@/components/providers/AppToastProvider";

export const metadata: Metadata = {
  title: "Culture Quest Lite | Đăng nhập",
  description: "Trang đăng nhập cho Culture Quest Lite",
  icons: {
    icon: "/favicon-logo3.png",
    shortcut: "/favicon-logo3.png",
    apple: "/favicon-logo3.png",
  },
};

/**
 * Edge tự chèn nút hiện mật khẩu (::-ms-reveal) và nút xoá (::-ms-clear) vào
 * mọi input[type=password], làm hiện hai icon con mắt cạnh nút ẩn/hiện của app.
 *
 * Rule này KHÔNG đặt được trong globals.css: Lightning CSS (pipeline CSS của
 * Tailwind v4 + Turbopack) coi pseudo-element tiền tố -ms- là legacy và xoá
 * hẳn khỏi bundle — đã kiểm chứng trong chunk CSS đã build. Đưa thẳng vào thẻ
 * style của layout để không đi qua bước xử lý đó.
 */
const hideNativePasswordRevealCss = `
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none !important;
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <style dangerouslySetInnerHTML={{ __html: hideNativePasswordRevealCss }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <AppToastProvider />
      </body>
    </html>
  );
}
