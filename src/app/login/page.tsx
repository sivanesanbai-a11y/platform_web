"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getRoleDestination } from "@/lib/role-routing";
import { getPersistentSession } from "@/lib/auth-session";

const ThreeInteractiveAuth = dynamic(
  () => import("@/components/auth/ThreeInteractiveAuth"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.35) 0%, rgba(230, 240, 255, 0.65) 100%), url('/login-bg.jpg') center/cover no-repeat fixed #f1f5f9",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            marginBottom: "12px",
          }}
        />
        <span style={{ fontSize: "12px", color: "#475569" }}>Loading Security Gateway...</span>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    ),
  }
);

export default function LoginPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const session = getPersistentSession();
      if (session?.email) {
        window.location.href = getRoleDestination(session.email);
        return;
      }
    } catch {}
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.4) 0%, rgba(230, 240, 255, 0.7) 100%), url('/login-bg.jpg') center/cover no-repeat fixed #f1f5f9",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            marginBottom: "12px",
          }}
        />
        <span style={{ fontSize: "12px", color: "#475569" }}>Verifying session...</span>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ThreeInteractiveAuth
      redirectTo="/dashboard"
      onSuccess={() => {
        try {
          const session = getPersistentSession();
          if (session?.email) {
            window.location.href = getRoleDestination(session.email);
            return;
          }
        } catch {}
        window.location.href = "/dashboard";
      }}
    />
  );
}
