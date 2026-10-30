"use client";

import React from "react";
import ThreeInteractiveAuth from "@/components/auth/ThreeInteractiveAuth";

export default function LoginPage() {
  return <ThreeInteractiveAuth redirectTo="/dashboard" />;
}
