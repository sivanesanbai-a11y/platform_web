"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { performLogout } from "@/lib/auth";
import {
  Users,
  ShieldCheck,
  Wrench,
  FileText,
  Phone,
  Mail,
  CheckCircle2,
  Edit2,
  UserCheck,
  Briefcase,
  X,
  Upload,
  Plus,
  LogIn,
  Building2,
  Award,
  Sparkles,
  Lock,
  LogOut,
  Maximize2,
  Minimize2,
  Search,
  ArrowRight,
  Camera,
  UserPlus,
  Filter,
  Key,
} from "lucide-react";
import {
  StaffProfile,
  getStaffProfiles,
  saveStaffProfile,
  COMPANY_STAFF_PROFILES,
} from "@/lib/team-profiles";
import { syncFormToCloud } from "@/lib/sync";
import { getPersistentSession, savePersistentSession, clearPersistentSession } from "@/lib/auth-session";

export default function TeamClient() {
  const [staffList, setStaffList] = useState<StaffProfile[]>(COMPANY_STAFF_PROFILES);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewFitMode, setViewFitMode] = useState<"compact" | "detailed">("detailed");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [deptFilter, setDeptFilter] = useState<string>("All");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editResponsibilities, setEditResponsibilities] = useState("");

  // Create new worker form state
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("nunes123");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDept, setNewDept] = useState("Servicing & Calibration Lab");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [newResponsibilities, setNewResponsibilities] = useState(
    "Perform assigned instrumentation duties\nMaintain customer equipment records & service compliance\nCoordinate with team members on daily job cards"
  );
  const [newModules, setNewModules] = useState<("Purchasing" | "Servicing" | "Quotations" | "Approvals" | "Calibration" | "Administration")[]>([
    "Servicing",
  ]);

  // Real data counters from localStorage
  const [counts, setCounts] = useState({
    serviceCount: 0,
    purchaseCount: 0,
    quoteCount: 0,
  });

  const loadData = () => {
    const profiles = getStaffProfiles();
    setStaffList(profiles);

    try {
      const sRaw = localStorage.getItem("nunes:service_jobs");
      const pRaw = localStorage.getItem("nunes:purchasing_orders");
      const qRaw = localStorage.getItem("nunes:quotations");
      setCounts({
        serviceCount: sRaw ? JSON.parse(sRaw).length : 0,
        purchaseCount: pRaw ? JSON.parse(pRaw).length : 0,
        quoteCount: qRaw ? JSON.parse(qRaw).length : 0,
      });
      const session = getPersistentSession();
      if (session?.email) setCurrentUser(session.email.toLowerCase());
    } catch {}
  };

  useEffect(() => {
    loadData();
    window.addEventListener("nunes:records-synced", loadData);
    return () => window.removeEventListener("nunes:records-synced", loadData);
  }, []);

  // Determine whether active user is Admin or MD
  const userLower = currentUser.toLowerCase();
  const isAdminOrMd = Boolean(
    userLower &&
      (userLower.includes("admin") ||
        userLower.includes("md") ||
        userLower.startsWith("md@") ||
        userLower.startsWith("admin@") ||
        userLower === "md" ||
        userLower === "admin")
  );

  // Identify current worker profile
  const myProfile: StaffProfile =
    staffList.find((s) => {
      const u = s.username.toLowerCase();
      const e = s.email.toLowerCase();
      return (
        userLower === u ||
        userLower === e ||
        userLower.includes(u) ||
        (userLower.startsWith("md") && s.username === "md") ||
        (userLower.startsWith("admin") && s.username === "admin")
      );
    }) || staffList[1] || staffList[0];

  const openEditModal = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setEditName(staff.name);
    setEditRole(staff.role);
    setEditDept(staff.department);
    setEditPhone(staff.phone);
    setEditAvatarUrl(staff.avatarUrl || "");
    setEditResponsibilities(staff.responsibilities.join("\n"));
    setEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const updated: StaffProfile = {
      ...selectedStaff,
      name: editName.trim(),
      role: editRole.trim(),
      department: editDept.trim(),
      phone: editPhone.trim(),
      avatarUrl: editAvatarUrl.trim() || undefined,
      responsibilities: editResponsibilities
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    saveStaffProfile(updated);
    setStaffList(getStaffProfiles());
    setEditModalOpen(false);
    setNotification(`✓ Profile updated for ${updated.name}`);
    setTimeout(() => setNotification(""), 3500);
  };

  const openCreateModal = () => {
    setNewName("");
    setNewUsername("");
    setNewPassword("nunes123");
    setNewEmail("");
    setNewPhone("+91 ");
    setNewRole("Junior Service Engineer");
    setNewDept("Servicing & Calibration Lab");
    setNewAvatarUrl("");
    setNewModules(["Servicing"]);
    setCreateModalOpen(true);
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) {
      alert("Please provide at least a Full Name and Login Username.");
      return;
    }

    const cleanUsername = newUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    const initials = newName
      .trim()
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "NW";

    const gradients = [
      "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
      "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
      "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
    ];
    const avatarBg = gradients[Math.floor(Math.random() * gradients.length)];

    const newStaff: StaffProfile = {
      id: `staff-${cleanUsername}-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      username: cleanUsername,
      email: newEmail.trim() || `${cleanUsername}@nunesinstruments.com`,
      role: newRole.trim() || "Operations Technician",
      department: newDept.trim() || "Operations",
      phone: newPhone.trim() || "+91 98420 00000",
      avatarBg,
      avatarTextColor: "#ffffff",
      avatarUrl: newAvatarUrl.trim() || undefined,
      initials,
      modules: newModules.length > 0 ? newModules : ["Servicing"],
      responsibilities: newResponsibilities
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      status: "Active",
    };

    // 1. Save staff profile locally
    saveStaffProfile(newStaff);

    // 2. Also save login credentials in 3d_auth_users so this new worker can log in directly!
    try {
      const existingAuthUsers = JSON.parse(localStorage.getItem("3d_auth_users") || "[]");
      const updatedAuthUsers = existingAuthUsers.filter(
        (u: any) => u.email.toLowerCase().replace(/\s+/g, "") !== cleanUsername
      );
      const authUserEntry = {
        email: cleanUsername,
        password: newPassword.trim() || "nunes123",
      };
      updatedAuthUsers.push(authUserEntry);
      localStorage.setItem("3d_auth_users", JSON.stringify(updatedAuthUsers));

      // 3. Sync new staff profile and credentials to cloud for multi-device visibility
      void syncFormToCloud("auth_user", cleanUsername, newStaff.name, {
        profile: newStaff,
        auth: authUserEntry,
      });
    } catch {}

    setStaffList(getStaffProfiles());
    setCreateModalOpen(false);
    setNotification(`✓ Created worker account for ${newStaff.name}! Active on all devices.`);
    setTimeout(() => setNotification(""), 4500);
  };

  const handleAvatarFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setter(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSwitchSession = (staff: StaffProfile) => {
    try {
      const sessionData = {
        email: staff.email,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        department: staff.department,
        loginAt: new Date().toISOString(),
      };
      savePersistentSession(sessionData);
      setCurrentUser(staff.email.toLowerCase());
      setNotification(`✓ Switched active operator to ${staff.name}`);
      setTimeout(() => setNotification(""), 3500);
      window.dispatchEvent(new CustomEvent("nunes:records-synced"));
    } catch {}
  };

  const handleSignOut = () => {
    clearPersistentSession();
    window.location.href = "/login";
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    if (deptFilter !== "All") {
      if (deptFilter === "Executive" && !s.isExecutive && !s.department.toLowerCase().includes("executive")) return false;
      if (deptFilter === "Purchasing" && !s.modules.includes("Purchasing")) return false;
      if (deptFilter === "Servicing" && !s.modules.includes("Servicing")) return false;
      if (deptFilter === "Calibration" && !s.modules.includes("Calibration")) return false;
      if (deptFilter === "Quotations" && !s.modules.includes("Quotations")) return false;
    }
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.modules.some((m) => m.toLowerCase().includes(q))
    );
  });

  // Regular workers only see their own profile details. Admin & MD see all workers.
  const effectiveTab = isAdminOrMd ? activeTab : "mine";

  return (
    <main
      className="page"
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0",
        padding: viewFitMode === "compact" ? "14px 20px 60px" : "20px 24px 80px",
        boxSizing: "border-box",
      }}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f766e",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            fontWeight: 700,
            fontSize: "14px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* HEADER & FIT-PAGE CONTROLS */}
      <div
        style={{
          marginBottom: viewFitMode === "compact" ? "14px" : "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          width: "100%",
        }}
      >
        <div>
          <div
            style={{
              color: "#0f766e",
              fontWeight: 800,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isAdminOrMd ? (
              <>
                <Sparkles size={13} style={{ color: "#d97706" }} /> Nunes Instruments • Company Personnel Directory (Master Admin)
              </>
            ) : (
              <>
                <ShieldCheck size={13} style={{ color: "#0f766e" }} /> Nunes Instruments • Personal Personnel Account
              </>
            )}
          </div>
          <h1
            style={{
              fontSize: viewFitMode === "compact" ? "22px" : "26px",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "4px",
            }}
          >
            {isAdminOrMd && activeTab === "all"
              ? "Team Personnel & Worker Accounts"
              : `My Personal Profile: ${myProfile.name}`}
          </h1>
          <p style={{ color: "#64748b", fontSize: "13.5px", marginTop: "2px" }}>
            {isAdminOrMd && activeTab === "all"
              ? `Unified company workforce directory (${staffList.length} registered profiles). Master administration view.`
              : `${myProfile.role} • ${myProfile.department} (Personal Workstation Records)`}
          </p>
        </div>

        {/* Top Control Buttons: Register Worker, Fit Page, View Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Create New Worker Account Button - Visible to MD and Admin only */}
          {isAdminOrMd && (
            <button
              type="button"
              onClick={openCreateModal}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 750,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                boxShadow: "0 4px 14px rgba(15,118,110,0.3)",
                transition: "transform 0.15s ease",
              }}
              title="Register a new employee or worker profile"
            >
              <UserPlus size={15} />
              <span>+ Create New Worker Profile</span>
            </button>
          )}

          {/* Fit Page Toggle Button */}
          <button
            type="button"
            onClick={() => setViewFitMode((prev) => (prev === "compact" ? "detailed" : "compact"))}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: viewFitMode === "compact" ? "#f0fdfa" : "#ffffff",
              color: viewFitMode === "compact" ? "#0f766e" : "#475569",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            title={viewFitMode === "compact" ? "Switch to Detailed Grid" : "Fit Page (Compact View)"}
          >
            {viewFitMode === "compact" ? (
              <>
                <Maximize2 size={13} /> Fit Page: Compact (ON)
              </>
            ) : (
              <>
                <Minimize2 size={13} /> Fit Page (Minimize)
              </>
            )}
          </button>

          {/* Tab Switcher - Only shown to MD & Admin so normal workers only see their own profile */}
          {isAdminOrMd ? (
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                padding: "3px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                style={{
                  padding: "6px 13px",
                  borderRadius: "7px",
                  border: "none",
                  background: activeTab === "all" ? "#0f766e" : "transparent",
                  color: activeTab === "all" ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                All Workers ({staffList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mine")}
                style={{
                  padding: "6px 13px",
                  borderRadius: "7px",
                  border: "none",
                  background: activeTab === "mine" ? "#0f766e" : "transparent",
                  color: activeTab === "mine" ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                My Profile ({myProfile.name.split(" ")[0]})
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "#f0fdfa",
                border: "1px solid #99f6e4",
                color: "#0f766e",
                padding: "6px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 750,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <UserCheck size={14} /> My Account Only ({myProfile.name})
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MY PROFILE TAB VIEW (ONLY VIEW SHOWN FOR INDIVIDUAL WORKERS)
          ========================================================================= */}
      {effectiveTab === "mine" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          {/* Active Operator Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)",
              border: "1.5px solid #a7f3d0",
              borderLeft: "5px solid #0f766e",
              borderRadius: "14px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#0f766e",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <UserCheck size={16} />
              </div>
              <div style={{ fontSize: "13px", color: "#0f5132" }}>
                <b>Active Operator Session:</b> You are logged in as <b>{myProfile.name}</b> ({myProfile.role}). All operations saved on this device will be linked to your personnel account.
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#dc2626",
                cursor: "pointer",
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>

          {/* MAIN OPERATOR CARD */}
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #0f766e",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(15,118,110,0.10)",
              padding: viewFitMode === "compact" ? "20px" : "28px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                gap: "24px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "22px",
              }}
            >
              {/* Profile Avatar / Photo with direct upload */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: viewFitMode === "compact" ? "76px" : "96px",
                    height: viewFitMode === "compact" ? "76px" : "96px",
                    borderRadius: "20px",
                    background: myProfile.avatarBg,
                    color: myProfile.avatarTextColor,
                    display: "grid",
                    placeItems: "center",
                    fontSize: viewFitMode === "compact" ? "28px" : "36px",
                    fontWeight: 800,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    border: "3px solid #ffffff",
                  }}
                >
                  {myProfile.avatarUrl ? (
                    <img
                      src={myProfile.avatarUrl}
                      alt={myProfile.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    myProfile.initials
                  )}
                </div>

                {/* Upload Photo Button Badge */}
                <label
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    background: "#0f766e",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    border: "2px solid #ffffff",
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={13} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const res = ev.target?.result as string;
                          if (res) {
                            const updated = { ...myProfile, avatarUrl: res };
                            saveStaffProfile(updated);
                            setStaffList(getStaffProfiles());
                            setNotification("✓ Profile photo updated successfully");
                            setTimeout(() => setNotification(""), 3500);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Title & Metadata */}
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {myProfile.name}
                  </h2>
                  <span
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#0f766e",
                      padding: "2px 10px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    Active Session
                  </span>
                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    ID: {myProfile.id}
                  </span>
                </div>

                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f766e", marginTop: "4px" }}>
                  {myProfile.role}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Building2 size={14} /> {myProfile.department}
                </div>

                {/* Edit Button */}
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(myProfile)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      background: "#0f766e",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(15,118,110,0.2)",
                    }}
                  >
                    <Edit2 size={13} /> Edit My Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Information & Operational Duties Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {/* Direct Contact Details */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "14px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "12px",
                  }}
                >
                  Direct Contact Information
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#1e293b" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Mail size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Company Email</span>
                      <b>{myProfile.email}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#1e293b" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#f0fdf4",
                        color: "#16a34a",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Phone size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Phone Number</span>
                      <b>{myProfile.phone}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#1e293b" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#fdf4ff",
                        color: "#c026d3",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <UserCheck size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>Duty Status</span>
                      <b style={{ color: "#0f766e" }}>{myProfile.status} (Verified)</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Operational Modules with Quick Jump Links */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "14px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "12px",
                  }}
                >
                  My Assigned Operations
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {myProfile.modules.map((m) => {
                    let href = "/dashboard";
                    let label = `Open ${m}`;
                    if (m === "Purchasing") {
                      href = "/forms/purchasing";
                      label = "Open Purchasing Orders Form →";
                    } else if (m === "Servicing") {
                      href = "/forms/servicing";
                      label = "Open Servicing Jobs Form →";
                    } else if (m === "Quotations") {
                      href = "/quotations";
                      label = "Open Official Quotations Hub →";
                    } else if (m === "Approvals") {
                      href = "/forms/purchasing";
                      label = "Review Commercial Approvals →";
                    } else if (m === "Calibration") {
                      href = "/forms/servicing";
                      label = "Open Calibration Lab Sheet →";
                    }

                    return (
                      <Link
                        key={m}
                        href={href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#0f172a",
                          textDecoration: "none",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={13} style={{ color: "#0f766e" }} />
                          {m} Module
                        </span>
                        <span style={{ fontSize: "11px", color: "#0f766e" }}>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Core Responsibilities Checklist */}
            {viewFitMode !== "compact" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "10px",
                  }}
                >
                  Core Operational Responsibilities
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px" }}>
                  {myProfile.responsibilities.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "12.5px",
                        color: "#334155",
                        background: "#f8fafc",
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ color: "#0f766e", fontWeight: 800 }}>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ALL WORKERS & PERSONNEL DIRECTORY (ACCESSIBLE TO ADMIN & MD ONLY)
          ========================================================================= */}
      {isAdminOrMd && effectiveTab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          {/* Top Stats Overview Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              width: "100%",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#f0fdfa",
                  color: "#0f766e",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                  {staffList.length} Personnel
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Registered Accounts</div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#fdf4ff",
                  color: "#c026d3",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Wrench size={18} />
              </div>
              <div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                  {counts.serviceCount} Jobs
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Servicing &amp; Calibration</div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                  {counts.purchaseCount} Orders
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Purchasing &amp; Commercials</div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#fffbeb",
                  color: "#b45309",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Award size={18} />
              </div>
              <div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>ISO 17025</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>NABL Standards Lab</div>
              </div>
            </div>
          </div>

          {/* Filter Chips & Search Bar Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              background: "#ffffff",
              padding: "12px 16px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Department Filter Chips */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginRight: "4px" }}>
                Filter:
              </span>
              {["All", "Servicing", "Purchasing", "Quotations", "Calibration", "Executive"].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDeptFilter(dept)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: deptFilter === dept ? "1px solid #0f766e" : "1px solid #e2e8f0",
                    background: deptFilter === dept ? "#f0fdfa" : "#f8fafc",
                    color: deptFilter === dept ? "#0f766e" : "#475569",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f8fafc",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                minWidth: "260px",
                flex: "1 1 300px",
                maxWidth: "450px",
              }}
            >
              <Search size={14} style={{ color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search worker by name, role, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: "12.5px",
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ALL WORKER CARDS GRID (100% Fluid Width) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                viewFitMode === "compact"
                  ? "repeat(auto-fill, minmax(290px, 1fr))"
                  : "repeat(auto-fill, minmax(340px, 1fr))",
              gap: viewFitMode === "compact" ? "12px" : "16px",
              width: "100%",
            }}
          >
            {filteredStaff.map((staff) => {
              const isCurrent =
                currentUser === staff.email.toLowerCase() ||
                currentUser === staff.username.toLowerCase();

              return (
                <article
                  key={staff.id}
                  style={{
                    background: "#ffffff",
                    border: isCurrent ? "2px solid #0f766e" : "1px solid #e2e8f0",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: isCurrent
                      ? "0 8px 24px rgba(15,118,110,0.12)"
                      : "0 2px 8px rgba(15,23,42,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* Active User Top Badge */}
                  {isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#0f766e",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        zIndex: 2,
                      }}
                    >
                      <UserCheck size={12} /> Active
                    </div>
                  )}

                  {/* Card Header */}
                  <div
                    style={{
                      padding: viewFitMode === "compact" ? "14px 16px 10px" : "18px 18px 12px",
                      display: "flex",
                      gap: "14px",
                      alignItems: "center",
                      borderBottom: "1px solid #f8fafc",
                    }}
                  >
                    {/* Avatar with Direct Photo Upload Option */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: viewFitMode === "compact" ? "52px" : "62px",
                          height: viewFitMode === "compact" ? "52px" : "62px",
                          borderRadius: "14px",
                          background: staff.avatarBg,
                          color: staff.avatarTextColor,
                          display: "grid",
                          placeItems: "center",
                          fontSize: viewFitMode === "compact" ? "18px" : "22px",
                          fontWeight: 800,
                          boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                          overflow: "hidden",
                        }}
                      >
                        {staff.avatarUrl ? (
                          <img
                            src={staff.avatarUrl}
                            alt={staff.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          staff.initials
                        )}
                      </div>

                      {/* Small Camera Button for Instant Photo Replacement */}
                      <label
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          right: "-4px",
                          background: "#ffffff",
                          color: "#0f766e",
                          border: "1px solid #cbd5e1",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                        }}
                        title={`Update photo for ${staff.name}`}
                      >
                        <Camera size={11} />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const res = ev.target?.result as string;
                                if (res) {
                                  const updated = { ...staff, avatarUrl: res };
                                  saveStaffProfile(updated);
                                  setStaffList(getStaffProfiles());
                                  setNotification(`✓ Photo updated for ${staff.name}`);
                                  setTimeout(() => setNotification(""), 3500);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: viewFitMode === "compact" ? "15.5px" : "17px",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {staff.name}
                        </span>
                        {staff.isExecutive && (
                          <span title="Executive Directorate" style={{ color: "#d97706", flexShrink: 0 }}>
                            <Sparkles size={13} />
                          </span>
                        )}
                      </h3>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f766e" }}>
                        {staff.role}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Building2 size={11} /> {staff.department}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: viewFitMode === "compact" ? "12px 16px" : "14px 18px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {/* Contact Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        fontSize: "11px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#475569" }}>
                        <Mail size={12} style={{ color: "#64748b" }} />
                        <span
                          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={staff.email}
                        >
                          {staff.email.replace("@nunesinstruments.com", "")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#475569" }}>
                        <Phone size={12} style={{ color: "#64748b" }} />
                        <span>{staff.phone}</span>
                      </div>
                    </div>

                    {/* Assigned Modules */}
                    <div>
                      <div
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Assigned Modules
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {staff.modules.map((m) => {
                          let color = { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
                          if (m === "Purchasing") color = { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
                          if (m === "Servicing") color = { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" };
                          if (m === "Calibration") color = { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" };
                          if (m === "Quotations") color = { bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
                          if (m === "Approvals") color = { bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8" };
                          if (m === "Administration") color = { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff" };

                          return (
                            <span
                              key={m}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "8px",
                                background: color.bg,
                                border: `1px solid ${color.border}`,
                                color: color.text,
                                fontSize: "10.5px",
                                fontWeight: 700,
                              }}
                            >
                              {m}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Responsibilities Preview in Detailed Mode */}
                    {viewFitMode !== "compact" && staff.responsibilities.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: "3px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Key Responsibilities
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "11.5px", color: "#475569", lineHeight: "1.4" }}>
                          {staff.responsibilities.slice(0, 2).map((r, i) => (
                            <li key={i} style={{ marginBottom: "2px" }}>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginTop: "auto",
                        paddingTop: "10px",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          background: "#f1f5f9",
                          color: "#334155",
                          border: "none",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchSession(staff)}
                        style={{
                          flex: 1.2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          background: isCurrent ? "#f0fdfa" : "#0f766e",
                          color: isCurrent ? "#0f766e" : "#ffffff",
                          border: isCurrent ? "1px solid #99f6e4" : "none",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title={`Switch browser session to ${staff.name}`}
                      >
                        <LogIn size={12} /> {isCurrent ? "Active Operator" : "Switch Operator"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE NEW WORKER PROFILE MODAL
          ========================================================================= */}
      {createModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "560px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f766e", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserPlus size={18} /> Register New Worker Profile
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, marginTop: "2px" }}>
                  Add a new technician, sales executive, or lab engineer account. Automatically saved on all devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleCreateWorker}
              style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Photo Upload */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "6px" }}>
                  Profile Picture (Optional):
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "14px",
                      background: "#0f766e",
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "20px",
                      fontWeight: 800,
                      overflow: "hidden",
                      border: "2px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  >
                    {newAvatarUrl ? (
                      <img src={newAvatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Camera size={22} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarFileUpload(e, setNewAvatarUrl)}
                      style={{ fontSize: "12px" }}
                    />
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                      Upload PNG/JPG photo from device or keep stylish initial avatar.
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name & Username */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Full Name *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavitha Murugan"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newUsername) {
                        setNewUsername(e.target.value.toLowerCase().split(" ")[0] || "");
                      }
                    }}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Login Username *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kavitha"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Password & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Login Password:
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Phone Number:
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98420 12345"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Designation / Role:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Service Engineer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Department:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Servicing & Calibration"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Assigned Module Checkboxes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "6px" }}>
                  Assigned Operational Modules:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(["Servicing", "Purchasing", "Quotations", "Calibration", "Approvals", "Administration"] as const).map(
                    (mod) => {
                      const isSelected = newModules.includes(mod);
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewModules(newModules.filter((m) => m !== mod));
                            } else {
                              setNewModules([...newModules, mod]);
                            }
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: isSelected ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                            background: isSelected ? "#f0fdfa" : "#f8fafc",
                            color: isSelected ? "#0f766e" : "#475569",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {isSelected && <CheckCircle2 size={13} />}
                          <span>{mod}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                  Key Responsibilities (one per line):
                </label>
                <textarea
                  rows={3}
                  value={newResponsibilities}
                  onChange={(e) => setNewResponsibilities(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px", lineHeight: "1.4" }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "8px",
                    background: "#0f766e",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 750,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15,118,110,0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <UserPlus size={15} /> Save &amp; Register Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT PROFILE MODAL
          ========================================================================= */}
      {editModalOpen && selectedStaff && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setEditModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "540px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Edit Profile: {selectedStaff.name}
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, marginTop: "2px" }}>
                  Update operator designation, phone number, responsibilities, or photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Photo Upload */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "6px" }}>
                  Profile Photo:
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "14px",
                      background: selectedStaff.avatarBg,
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "20px",
                      fontWeight: 800,
                      overflow: "hidden",
                      border: "2px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  >
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      selectedStaff.initials
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarFileUpload(e, setEditAvatarUrl)}
                      style={{ fontSize: "12px" }}
                    />
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                      Upload PNG or JPG from your computer to customize avatar.
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Contact Phone:
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Role / Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                    Department:
                  </label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 750, color: "#334155", marginBottom: "4px" }}>
                  Responsibilities (one per line):
                </label>
                <textarea
                  rows={3}
                  value={editResponsibilities}
                  onChange={(e) => setEditResponsibilities(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", lineHeight: "1.4" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: "#0f766e",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 750,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15,118,110,0.25)",
                  }}
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}