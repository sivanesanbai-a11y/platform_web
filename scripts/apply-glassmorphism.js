const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../src/app/globals.css');
let content = fs.readFileSync(cssPath, 'utf8').trimEnd();

const glassCss = `

/* =========================================================
   ULTRA-PREMIUM GLASSMORPHISM SYSTEM (TOPBAR & SIDEBAR)
   ========================================================= */

/* 1. Frosted Glass Topbar Floating Island */
.shell .topbar,
.dashboard-shell .topbar,
.topbar {
  background: rgba(255, 255, 255, 0.70) !important;
  backdrop-filter: blur(24px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(190%) !important;
  border: 1px solid rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 10px 32px -4px rgba(15, 23, 42, 0.08), 
              0 2px 8px -2px rgba(15, 23, 42, 0.04), 
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 
              inset 0 -1px 1px 0 rgba(15, 23, 42, 0.03) !important;
}

/* Frosted Search Input Inside Topbar */
.shell .topbar .global-search input,
.dashboard-shell .topbar .global-search input,
.topbar .global-search input {
  background: rgba(248, 250, 252, 0.58) !important;
  border: 1px solid rgba(203, 213, 225, 0.65) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04), 
              0 1px 0 rgba(255, 255, 255, 0.85) !important;
  color: #1e293b !important;
}

.shell .topbar .global-search input:focus,
.dashboard-shell .topbar .global-search input:focus,
.topbar .global-search input:focus {
  background: rgba(255, 255, 255, 0.88) !important;
  border-color: rgba(59, 130, 246, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 
              inset 0 1px 2px rgba(15, 23, 42, 0.02) !important;
}

/* Glassmorphism for Topbar Action Buttons */
.shell .topbar .top-pill-btn,
.dashboard-shell .topbar .top-pill-btn,
.top-pill-btn {
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.06), 
              inset 0 1px 0.5px rgba(255, 255, 255, 0.9) !important;
}

/* WhatsApp Glass Pill */
.shell .topbar .top-pill-btn.pill-whatsapp,
.dashboard-shell .topbar .top-pill-btn.pill-whatsapp,
.top-pill-btn.pill-whatsapp {
  background: rgba(236, 253, 245, 0.68) !important;
  border: 1px solid rgba(167, 243, 208, 0.8) !important;
  color: #059669 !important;
}

.shell .topbar .top-pill-btn.pill-whatsapp:hover,
.dashboard-shell .topbar .top-pill-btn.pill-whatsapp:hover,
.top-pill-btn.pill-whatsapp:hover {
  background: rgba(209, 250, 229, 0.84) !important;
  border-color: #6ee7b7 !important;
  color: #047857 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.22), 
              inset 0 1px 0.5px rgba(255, 255, 255, 0.95) !important;
}

/* Gmail Glass Pill */
.shell .topbar .top-pill-btn.pill-gmail,
.dashboard-shell .topbar .top-pill-btn.pill-gmail,
.top-pill-btn.pill-gmail {
  background: rgba(254, 242, 242, 0.68) !important;
  border: 1px solid rgba(254, 202, 202, 0.8) !important;
  color: #dc2626 !important;
}

.shell .topbar .top-pill-btn.pill-gmail:hover,
.dashboard-shell .topbar .top-pill-btn.pill-gmail:hover,
.top-pill-btn.pill-gmail:hover {
  background: rgba(254, 226, 226, 0.84) !important;
  border-color: #fca5a5 !important;
  color: #b91c1c !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.2), 
              inset 0 1px 0.5px rgba(255, 255, 255, 0.95) !important;
}

/* Delete Icon Glass Pill */
.shell .topbar .top-pill-btn.pill-delete-icon,
.dashboard-shell .topbar .top-pill-btn.pill-delete-icon,
.top-pill-btn.pill-delete-icon {
  background: rgba(254, 242, 242, 0.68) !important;
  border: 1px solid rgba(254, 202, 202, 0.8) !important;
  color: #dc2626 !important;
}

.shell .topbar .top-pill-btn.pill-delete-icon:hover,
.dashboard-shell .topbar .top-pill-btn.pill-delete-icon:hover,
.top-pill-btn.pill-delete-icon:hover {
  background: rgba(254, 226, 226, 0.88) !important;
  border-color: #f87171 !important;
  color: #b91c1c !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.22), 
              inset 0 1px 0.5px rgba(255, 255, 255, 0.95) !important;
}

/* Notification Bell Glass Pill */
.shell .topbar .topbar-bell,
.dashboard-shell .topbar-bell,
.topbar .topbar-bell {
  background: rgba(248, 250, 252, 0.65) !important;
  border: 1px solid rgba(226, 232, 240, 0.78) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.05), 
              inset 0 1px 0.5px rgba(255, 255, 255, 0.9) !important;
}

.shell .topbar .topbar-bell:hover,
.dashboard-shell .topbar .topbar-bell:hover,
.topbar .topbar-bell:hover {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: #cbd5e1 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1), 
              inset 0 1px 0.5px rgba(255, 255, 255, 0.95) !important;
}

/* Glass Popovers */
.search-popover,
.notify-popover {
  background: rgba(255, 255, 255, 0.82) !important;
  backdrop-filter: blur(28px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
  border: 1px solid rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.18), 
              0 0 0 1px rgba(0, 0, 0, 0.04), 
              inset 0 1px 1px rgba(255, 255, 255, 0.9) !important;
}

/* 2. Frosted Glass Dark Slate Sidebar */
.shell .sidebar,
.dashboard-shell .sidebar,
.sidebar {
  background: linear-gradient(180deg, rgba(11, 27, 44, 0.74) 0%, rgba(9, 21, 35, 0.82) 100%) !important;
  backdrop-filter: blur(26px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(26px) saturate(190%) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.10) !important;
  box-shadow: 6px 0 32px -4px rgba(0, 0, 0, 0.32), 
              inset -1px 0 0 rgba(255, 255, 255, 0.06), 
              inset 1px 0 0 rgba(255, 255, 255, 0.04) !important;
  color: #f1f5f9 !important;
}

/* Sidebar Nav Links Glass Styling */
.shell .sidebar .nav a,
.dashboard-shell .sidebar .nav a,
.sidebar .nav a {
  background: rgba(255, 255, 255, 0.035) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  color: #cbd5e1 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
}

.shell .sidebar .nav a:hover,
.dashboard-shell .sidebar .nav a:hover,
.sidebar .nav a:hover {
  background: rgba(255, 255, 255, 0.10) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  transform: translateX(4px) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22), 
              inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

.shell .sidebar .nav a.active,
.dashboard-shell .sidebar .nav a.active,
.sidebar .nav a.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.88) 0%, rgba(29, 78, 216, 0.96) 100%) !important;
  border: 1px solid rgba(147, 197, 253, 0.45) !important;
  color: #ffffff !important;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.42), 
              inset 0 1px 1px rgba(255, 255, 255, 0.4) !important;
  transform: scale(1.01) !important;
}

/* Sidebar Snooze Toggles and Brand Glass Accents */
.shell .sidebar .sidebar-snooze-toggle,
.dashboard-shell .sidebar .sidebar-snooze-toggle,
.sidebar-snooze-toggle {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  color: #94a3b8 !important;
}

.shell .sidebar .sidebar-snooze-toggle:hover,
.dashboard-shell .sidebar .sidebar-snooze-toggle:hover,
.sidebar-snooze-toggle:hover {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}

.shell .sidebar .snooze-pill-btn,
.dashboard-shell .sidebar .snooze-pill-btn,
.snooze-pill-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  color: #94a3b8 !important;
}

.shell .sidebar .snooze-pill-btn:hover,
.dashboard-shell .sidebar .snooze-pill-btn:hover,
.snooze-pill-btn:hover {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}

.shell .sidebar .brand-badge,
.dashboard-shell .sidebar .brand-badge,
.brand-badge {
  background: rgba(56, 189, 248, 0.16) !important;
  border: 1px solid rgba(56, 189, 248, 0.35) !important;
  color: #38bdf8 !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
}
`;

fs.writeFileSync(cssPath, content + '\n' + glassCss + '\n', 'utf8');
console.log('Appended glassmorphism styles successfully!');
