import type { Viewport } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import ModulePrewarmer from "@/components/ModulePrewarmer";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090d16",
};

export const metadata = {
  title: "NUNES Enterprise Platform",
  description: "NUNES company dashboard, forms, tasks, reports, activity and team operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cloud = Boolean(process.env.VERCEL);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        <ThemeProvider>
          {cloud ? null : <ModulePrewarmer />}
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
