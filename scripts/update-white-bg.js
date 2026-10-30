const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

// 1. Replace .forms-hub-page background
const hubIdx = content.indexOf('.forms-hub-page {');
if (hubIdx !== -1) {
  const closeIdx = content.indexOf('}', hubIdx);
  const oldHub = content.substring(hubIdx, closeIdx + 1);
  const newHub = `.forms-hub-page {\r\n  padding: 36px 32px 56px;\r\n  min-height: calc(100vh - 76px);\r\n  background: #ffffff !important;\r\n  display: flex;\r\n  flex-direction: column;\r\n  justify-content: center;\r\n}`;
  content = content.replace(oldHub, newHub);
  console.log('Replaced .forms-hub-page background with #ffffff');
} else {
  console.log('Could not find .forms-hub-page');
}

// 2. Replace the bottom THEMED COHESION block
const searchStr = 'PROCESS CARDS THEMED COHESION';
const commentIdx = content.indexOf(searchStr);
if (commentIdx !== -1) {
  // Find start of comment block /* ===
  const startIdx = content.lastIndexOf('/*', commentIdx);
  const newBottom = `/* =========================================================================
   PROCESS CARDS CLEAN WHITE CANVAS (PURCHASING & SERVICING)
   Crisp, modern, high-contrast pure white presentation
   ========================================================================= */

.process-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 24px !important;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease !important;
}

.process-card:hover {
  transform: translateY(-3px) !important;
  border-color: #cbd5e1 !important;
  box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06) !important;
}

.process-card.purchasing {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04) !important;
}

.process-card.purchasing:hover {
  transform: translateY(-3px) !important;
  border-color: #93c5fd !important;
  box-shadow: 0 20px 40px -12px rgba(8, 102, 255, 0.14), 0 4px 12px -2px rgba(8, 102, 255, 0.06) !important;
}

.process-card.servicing {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04) !important;
}

.process-card.servicing:hover {
  transform: translateY(-3px) !important;
  border-color: #86efac !important;
  box-shadow: 0 20px 40px -12px rgba(16, 185, 129, 0.14), 0 4px 12px -2px rgba(16, 185, 129, 0.06) !important;
}

/* Crisp Clean White Content Body */
.process-card-content,
.process-card.purchasing .process-card-content,
.process-card.servicing .process-card-content {
  padding: 24px 26px 28px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 22px !important;
  flex: 1 !important;
  background: #ffffff !important;
  border-top: 1px solid #f1f5f9 !important;
}

/* Clean White Metric Tiles */
.metric-tile,
.process-card.purchasing .metric-tile,
.process-card.servicing .metric-tile {
  background: #ffffff !important;
  border: 1px solid #edf2f7 !important;
  border-radius: 14px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03) !important;
  transition: all 0.18s ease !important;
}

.metric-tile:hover,
.process-card.purchasing .metric-tile:hover,
.process-card.servicing .metric-tile:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
  transform: translateY(-1px) !important;
}

/* Clean White Workflow Stage Chips */
.workflow-stage-chip,
.process-card.purchasing .workflow-stage-chip,
.process-card.servicing .workflow-stage-chip {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 999px !important;
  color: #334155 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: all 0.15s ease !important;
}

.workflow-stage-chip:hover,
.process-card.purchasing .workflow-stage-chip:hover,
.process-card.servicing .workflow-stage-chip:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
  transform: translateY(-1px) !important;
}

/* Clean Secondary Action Buttons */
.process-action-btn.secondary,
.process-card.purchasing .process-action-btn.secondary,
.process-card.servicing .process-action-btn.secondary {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #334155 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
}

.process-action-btn.secondary:hover,
.process-card.purchasing .process-action-btn.secondary:hover,
.process-card.servicing .process-action-btn.secondary:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}
`;
  content = content.substring(0, startIdx) + newBottom;
  console.log('Replaced bottom THEMED COHESION with pure white canvas styles');
} else {
  console.log('Could not find bottom THEMED COHESION block');
}

fs.writeFileSync(cssPath, content, 'utf8');
console.log('Successfully written updated globals.css');
