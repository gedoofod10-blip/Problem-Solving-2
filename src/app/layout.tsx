import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui";
import { ProgressProvider } from "@/components/progress-provider";
import "./globals.css";

const arabicFont = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-arabic-regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/ibm-plex-arabic-semibold.ttf", weight: "500 600", style: "normal" },
    { path: "../../public/fonts/ibm-plex-arabic-bold.ttf", weight: "700 900", style: "normal" },
  ],
  variable: "--font-arabic", display: "swap", fallback: ["Tahoma", "Arial", "sans-serif"],
});

const deploymentUrl = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.URL || "http://localhost:3000";
const siteUrl = deploymentUrl.startsWith("http") ? deploymentUrl : `https://${deploymentUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(URL.canParse(siteUrl) ? siteUrl : "http://localhost:3000"),
  title: { default: "العقل الخوارزمي | فكّر كمبرمج", template: "%s | العقل الخوارزمي" },
  description: "رحلة عربية تفاعلية لتعلّم التفكير الخوارزمي. اكتشف المتغيرات والمنطق والحلقات والمصفوفات، واختبر فهمك واجمع الإنجازات خطوة بخطوة.",
  applicationName: "العقل الخوارزمي", icons: { icon: "/favicon.svg" },
  openGraph: { title: "العقل الخوارزمي — فكّر كمبرمج", description: "لا تحتاج إلى خبرة برمجية. فقط فضولك، والاستعداد للتفكير.", locale: "ar_AR", type: "website", images: ["/images/algorithm-core.png"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0c1117", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ar" dir="rtl" className={arabicFont.variable}><body><ToastProvider><ProgressProvider>{children}</ProgressProvider></ToastProvider></body></html>;
}
