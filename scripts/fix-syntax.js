const fs = require('fs');
const path = require('path');

const globalsPath = path.resolve(__dirname, '..', 'src', 'app', 'globals.css');
let css = fs.readFileSync(globalsPath, 'utf8');

const targetStart = '/* =========================================================\r\n   V6.4.8 UNIFIED 12PX EQUAL TYPOGRAPHY (DESKTOP)';
const targetEnd = '.chart-loading{height:100%';

// Let's normalize newlines to check
console.log('Finding target regions...');
const startIdx = css.indexOf('V6.4.8 UNIFIED 12PX EQUAL TYPOGRAPHY (DESKTOP)');
const endIdx = css.indexOf('.chart-loading{height:100%');

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const commentStart = css.lastIndexOf('/*', startIdx);
  const chunk = css.slice(commentStart, endIdx);
  console.log('Found chunk of length:', chunk.length);

  const cleanBlock = `/* =========================================================
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
  css = css.slice(0, commentStart) + cleanBlock + css.slice(endIdx);
  fs.writeFileSync(globalsPath, css, 'utf8');
  console.log('Successfully fixed desktop media query and removed duplicate block.');
}
