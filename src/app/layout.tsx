import "./globals.css";
import "./landing/landing.css";
import Shell from "@/components/Shell";
import ModulePrewarmer from "@/components/ModulePrewarmer";

export const metadata = {
  title: "NUNES Enterprise Platform",
  description: "NUNES company dashboard, forms, tasks, reports, activity and team operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cloud = Boolean(process.env.VERCEL);
  return (
    <html lang="en">
      <body>
        {cloud ? null : <ModulePrewarmer />}
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
