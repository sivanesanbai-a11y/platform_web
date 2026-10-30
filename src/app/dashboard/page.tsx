import DashboardClient from "@/components/DashboardClient";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "Dashboard — NUNES Operations Platform",
  description: "Executive control tower, real-time KPI metrics, servicing, purchasing, and business telemetry.",
};

export default function DashboardPage() {
  return (
    <ErrorBoundary fallbackTitle="Operations Dashboard">
      <DashboardClient />
    </ErrorBoundary>
  );
}
