import type { Metadata } from "next";
import "./globals.css";
import { runtime } from "@/lib/runtime";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: runtime.company.displayName,
  description: runtime.company.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={runtime.company.language.startsWith("fa") ? "fa" : "en"} dir={runtime.company.rtl ? "rtl" : "ltr"}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
