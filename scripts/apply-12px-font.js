const fs = require('fs');
const path = require('path');

const globalsPath = path.resolve(__dirname, '..', 'src', 'app', 'globals.css');
const landingPath = path.resolve(__dirname, '..', 'src', 'app', 'landing', 'landing.css');

let globalsCss = fs.readFileSync(globalsPath, 'utf8');

// 1. Update @media (min-width: 961px) section around lines 188-224
const oldDesktopRegex = /\/\* =========================================================\s+V6\.4\.7 LARGE OFFICE TEXT — readability first[\s\S]+?@media \(min-width: 961px\)\{[\s\S]+?\}\s+/m;

const newDesktopBlock = `/* =========================================================
   V6.4.8 UNIFIED 12PX EQUAL TYPOGRAPHY (DESKTOP)
   ========================================================= */
@media (min-width: 961px){
  .sidebar{width:260px;padding:16px 14px}.main{margin-left:260px}
  .brand{gap:10px;padding:4px 8px 18px}.brandmark{width:36px;height:36px;font-size:14px}.brand b{font-size:12px}.brand span{font-size:11px;margin-top:2px}
  .nav{gap:4px}.nav a{gap:10px;padding:8px 10px;font-size:12px;border-radius:9px}.nav svg{width:16px;height:16px}
  .side-foot{font-size:12px;line-height:1.5;gap:5px}.side-foot b{font-size:12px}.side-foot em{font-size:11px}
  .topbar{height:60px;padding:0 24px}.global-search{max-width:720px}.global-search input{height:38px;font-size:12px;padding-left:38px}.global-search>svg{width:16px}.global-search kbd{font-size:10px;top:9px}.live-pill{font-size:12px;padding:6px 10px}.role-pill span{font-size:11px}.role-pill b{font-size:12px}.icon-button{width:38px;height:38px}
  .page{padding:22px 26px}.eyebrow,.module-kicker{font-size:12px}.page-head h1,.welcome-row h1{font-size:18px}.page-head p,.welcome-row p{font-size:12px;line-height:1.5}.btn{font-size:12px;min-height:36px;padding:8px 14px}.text-link{font-size:12px}
  .exec-kpi{min-height:80px;padding:12px 14px}.exec-kpi-copy span{font-size:12px}.exec-kpi-copy strong{font-size:20px}.exec-kpi-copy small{font-size:12px;line-height:1.4}.exec-kpi-icon{width:40px;height:40px}.exec-kpi-icon svg{width:18px;height:18px}
  .section-head h2{font-size:14px}.section-head p{font-size:12px}.chart-heading span{font-size:12px}.chart-heading b{font-size:12px}.chart-heading strong{font-size:16px}
  .module-title-row h2{font-size:15px}.module-title-row p{font-size:12px}.module-metrics span{font-size:11px}.module-metrics b{font-size:12px}.chart-card-head h3{font-size:13px}.chart-card-head p,.chart-card-head a{font-size:12px}
  .stage-bar span,.service-bar>span{font-size:12px}.stage-bar b,.stage-bar small,.service-bar>b{font-size:11px}.legend-list b,.legend-list strong{font-size:11px}
  .record-head span{font-size:11px}.record-head b{font-size:12px}.record-head small{font-size:11px}.record-finance span{font-size:11px}.record-finance b{font-size:12px}.people-row span{font-size:11px}
  .live-output-head h3{font-size:15px}.live-output-head p{font-size:12px}.live-output-kicker{font-size:12px}.dashboard-output-table th{font-size:12px;padding:10px 12px}.dashboard-output-table td{font-size:12px;padding:10px 12px}.dashboard-output-table td>b{font-size:12px}.dashboard-output-table td>span{font-size:12px}.dashboard-output-table td>small{font-size:11px}.output-stage,.output-report-btn{font-size:12px!important}.output-progress>em{font-size:11px}
  .attention-list b,.activity-feed b,.activity-feed p{font-size:12px}.attention-list span,.activity-feed small{font-size:11px}.source-badge{font-size:11px}
  .output-error b,.error-state b{font-size:12px}.output-error span,.error-state span,.error-state small{font-size:12px;line-height:1.45}
}
`;

if (oldDesktopRegex.test(globalsCss)) {
  globalsCss = globalsCss.replace(oldDesktopRegex, newDesktopBlock);
  console.log('Successfully replaced desktop typography block.');
} else {
  console.warn('Old desktop regex did not match, check manual matching.');
}

// 2. Replace lines 1424-1905 EXECUTIVE READABLE TYPOGRAPHY with UNIFIED 12PX EQUAL TYPOGRAPHY
const oldExecTypoRegex = /\/\* ============================================================\s+NUNES OPERATIONS WORKSPACE — EXECUTIVE READABLE TYPOGRAPHY[\s\S]+?\/\* =========================================================\s+2026 TACTILE MICRO-INTERACTIONS SUITE/m;

const newExecTypoBlock = `/* ============================================================
   NUNES OPERATIONS WORKSPACE — UNIFIED 12PX EQUAL TYPOGRAPHY
   Requirement: The entire website font is set as 12 equally.
   ============================================================ */

/* 1. Base Typography (Strict 12px Foundation) */
html {
  font-size: 12px !important;
  -webkit-text-size-adjust: 100%;
}

body {
  font-size: 12px !important;
  line-height: 1.5 !important;
}

/* 2. Global Equal 12px Font Across All Standard Elements */
body,
p,
span:not(.material-symbols-outlined):not([class*="lucide"]),
label,
input,
select,
textarea,
button,
table,
th,
td,
a,
li,
small,
kbd,
em,
.eyebrow,
.module-kicker,
.dash-eyebrow,
.live-output-kicker,
.nunes-tag,
.source-badge,
.output-stage,
.priority,
.status-chip,
.modern-status,
.role-pill,
.role-pill span,
.role-pill b,
.live-pill,
.chart-heading span,
.chart-heading b,
.dash-card-head > div > span,
.module-snapshot-head small,
.paperPreviewSummary span,
.nunes-kpi-summary span,
.dashboard-page-v2 .source-badge,
.dashboard-page-v2 .modern-status,
.page-head p,
.welcome-row p,
.dash-welcome p,
.dash-card-head p,
.section-head p,
.module-title-row p,
.live-output-head p,
.timeline-time span,
.timeline-time b,
.timeline-top small,
.timeline-card p,
.detail-note,
.task-title-row p,
.task-meta span,
.task-meta b,
.sub,
.dash-donut-center span,
.dash-status-list > div > span,
.chart-legend,
.activity-feed small,
.activity-list-v2 span,
.attention-list span,
.attention-list-v2 > a > div span,
.healthy-state span,
.side-foot,
.side-foot span,
.side-foot em,
.side-foot b,
.brand span,
.brand b,
.search-copy small,
.search-status,
.notify-item small,
.popover-title span,
.app-card-body > p,
.future-module-note span,
.workflow-preview span,
.person-copy p,
.person-copy small,
.person-stats span,
.detail-field span,
.workflow-step p,
.workflow-step small,
.document-grid small,
.message-list small,
.history-list small,
.architecture-grid p,
.registry-head p,
.registry-grid span,
.registry-grid b,
.runtime-list span,
.runtime-list strong,
.process-box span,
.process-box small,
.dash-kpi-label,
.exec-kpi-copy span,
.period-tile small,
.module-metrics span,
.record-finance span,
.application-stats span,
.dash-kpi > small,
.exec-kpi-copy small,
.period-tile p,
.period-tile p span,
.nav a,
.dashboard-shell .nav a,
.sidebar a,
.sidebar button,
.sidebar span,
.btn,
.mini-btn,
.modern-view-btn,
.output-report-btn,
.text-link,
.dash-link,
.popover-footer,
.period-control button,
.tabs button,
.browser-login-actions a,
.dashboard-page-v2 .modern-view-btn,
.dashboard-page-v2 .period-control button,
.btn.primary,
.table th,
.dash-table th,
.dashboard-output-table th,
.nunes-table th,
.dashboard-page-v2 .dash-table th,
.table td,
.dash-table td,
.dashboard-output-table td,
.nunes-table td,
.dashboard-page-v2 .dash-table td,
.table td b,
.dash-table td > b,
.dashboard-output-table td > b,
.dashboard-page-v2 .dash-table td > b,
.dash-table td > small,
.dashboard-output-table td > small,
.dashboard-output-table td > span,
.dashboard-page-v2 .dash-table td > small,
.nunes-form-fields label,
.global-search input,
.toolbar-search input,
.nunes-form-fields input,
.nunes-form-fields select,
.nunes-form-fields textarea,
.search,
.filter-toolbar select,
.nunes-step-btn,
.nunes-step-num,
.attention-list-v2 > a > div b,
.activity-list-v2 b,
.dash-status-list b,
[role="dialog"] label,
[role="dialog"] input,
[role="dialog"] select,
[role="dialog"] button,
[role="dialog"] p,
[role="dialog"] span,
[role="dialog"] td,
[role="dialog"] th,
[data-radix-portal] label,
[data-radix-portal] input,
[data-radix-portal] select,
[data-radix-portal] button,
[data-radix-portal] p,
[data-radix-portal] span {
  font-size: 12px !important;
}

/* 3. Equal Font-Size Overrides for All Tailwind Text Utilities */
.text-\\[8px\\],
.text-\\[8\\.5px\\],
.text-\\[9px\\],
.text-\\[9\\.5px\\],
.text-\\[10px\\],
.text-\\[10\\.5px\\],
.text-\\[11px\\],
.text-\\[11\\.5px\\],
.text-\\[12px\\],
.text-\\[12\\.5px\\],
.text-\\[13px\\],
.text-\\[13\\.5px\\],
.text-\\[14px\\],
.text-\\[14\\.5px\\],
.text-\\[15px\\],
.text-\\[15\\.5px\\],
.text-\\[16px\\],
.text-xs,
.text-sm,
.text-base {
  font-size: 12px !important;
  line-height: 1.5 !important;
}

/* 4. Balanced Heading Hierarchy (Compact & Clean to Fit Page) */
.page-head h1,
.welcome-row h1,
.dash-welcome h1 {
  font-size: 18px !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
}

.dash-card-head h2,
.section-head h2,
.nunes-card-head h2,
.module-title-row h2,
.dashboard-page-v2 .dash-card-head h2 {
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
}

.chart-card-head h3,
.module-snapshot-head h3,
.task-title-row h3,
.timeline-card h3,
.live-output-head h3,
.dashboard-page-v2 .module-snapshot-head h3 {
  font-size: 13px !important;
  font-weight: 650 !important;
  line-height: 1.3 !important;
}

/* 5. Metrics & KPI Highlight Values */
.dash-kpi > strong,
.exec-kpi-copy strong {
  font-size: 20px !important;
  font-weight: 800 !important;
  line-height: 1.15 !important;
}

.period-tile strong {
  font-size: 17px !important;
  font-weight: 800 !important;
  line-height: 1.15 !important;
}

/* =========================================================
   2026 TACTILE MICRO-INTERACTIONS SUITE`;

if (oldExecTypoRegex.test(globalsCss)) {
  globalsCss = globalsCss.replace(oldExecTypoRegex, newExecTypoBlock);
  console.log('Successfully replaced executive typography with unified 12px equal typography.');
} else {
  console.warn('Old executive typography regex did not match, check manual matching.');
}

fs.writeFileSync(globalsPath, globalsCss, 'utf8');
console.log('Updated globals.css');

// 3. Update landing.css to protect landing page typography
let landingCss = fs.readFileSync(landingPath, 'utf8');

// Ensure landing.css has protected !important on vw units so global 12px does not distort landing page hero
if (!landingCss.includes('/* LANDING HERO TYPOGRAPHY SAFEGUARDS */')) {
  landingCss += `

/* LANDING HERO TYPOGRAPHY SAFEGUARDS */
.footer .tag { font-size: .88vw !important; }
.footer .headline { font-size: 1.66vw !important; }
.footer .footer-nav { font-size: 1.075vw !important; }
.footer .note { font-size: .733vw !important; }
.footer .contact-links a { font-size: 1.075vw !important; }
.heart-login-btn { font-size: 15px !important; }

@media (max-width: 700px) {
  .footer .tag { font-size: 14px !important; }
  .footer .headline { font-size: clamp(22px, 6.3vw, 30px) !important; }
  .footer .footer-nav { font-size: 17px !important; }
  .footer .note { font-size: 14px !important; }
  .heart-login-btn { font-size: 14px !important; }
}
`;
  fs.writeFileSync(landingPath, landingCss, 'utf8');
  console.log('Updated landing.css with typography safeguards.');
}
