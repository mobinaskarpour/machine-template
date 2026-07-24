import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "THE MACHINE — دید مدیریتی",
  description: "سیستم‌عامل اجرایی هوش مصنوعی برای ساخت‌وساز",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`dark ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
