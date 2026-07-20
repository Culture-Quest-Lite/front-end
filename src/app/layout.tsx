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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <AppToastProvider />
      </body>
    </html>
  );
}
