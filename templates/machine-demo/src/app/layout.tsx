import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { company, buildThemeCss } from "@/lib/demo/config";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: company.metadata.title,
  description: company.metadata.description,
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCss = buildThemeCss();

  return (
    <html
      lang={company.locale.lang}
      dir={company.locale.dir}
      className={`dark ${vazirmatn.variable} h-full antialiased`}
    >
      <head>
        <style
          id="demo-theme-tokens"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className="min-h-full bg-void text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
