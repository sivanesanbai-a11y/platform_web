const fs = require('fs');
const path = require('path');

// 1. Append .loader CSS to src/app/globals.css
const cssPath = path.resolve(__dirname, '../src/app/globals.css');
let cssContent = fs.readFileSync(cssPath, 'utf8').trimEnd();

const loaderCss = `

/* =========================================================
   3D CYLINDRICAL LENS TEXT WAVE LOADER (.loader)
   ========================================================= */

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52vh;
  width: 100%;
  padding: 30px 16px;
}

.loader-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 38px 48px 30px;
  background: linear-gradient(145deg, rgba(11, 31, 51, 0.94) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.loader {
  --main-size: 3.6em;
  --text-color: #ffffff;
  --shine-color: #ffffff40;
  --shadow-color: #aaaaaa;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none;
  position: relative;
  font-size: var(--main-size);
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-color);
  width: 7.3em;
  height: 1em;
  filter: drop-shadow(0 0 0.05em var(--shine-color));
}

.loader .text {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  position: absolute;
}

.loader .text:nth-child(1) {
  clip-path: polygon(0% 0%, 11.11% 0%, 11.11% 100%, 0% 100%);
  font-size: calc(var(--main-size) / 20);
  margin-left: -2.1em;
  opacity: 0.6;
}

.loader .text:nth-child(2) {
  clip-path: polygon(11.11% 0%, 22.22% 0%, 22.22% 100%, 11.11% 100%);
  font-size: calc(var(--main-size) / 16);
  margin-left: -0.98em;
  opacity: 0.7;
}

.loader .text:nth-child(3) {
  clip-path: polygon(22.22% 0%, 33.33% 0%, 33.33% 100%, 22.22% 100%);
  font-size: calc(var(--main-size) / 13);
  margin-left: -0.33em;
  opacity: 0.8;
}

.loader .text:nth-child(4) {
  clip-path: polygon(33.33% 0%, 44.44% 0%, 44.44% 100%, 33.33% 100%);
  font-size: calc(var(--main-size) / 11);
  margin-left: -0.05em;
  opacity: 0.9;
}

.loader .text:nth-child(5) {
  clip-path: polygon(44.44% 0%, 55.55% 0%, 55.55% 100%, 44.44% 100%);
  font-size: calc(var(--main-size) / 10);
  margin-left: 0em;
  opacity: 1;
}

.loader .text:nth-child(6) {
  clip-path: polygon(55.55% 0%, 66.66% 0%, 66.66% 100%, 55.55% 100%);
  font-size: calc(var(--main-size) / 11);
  margin-left: 0.05em;
  opacity: 0.9;
}

.loader .text:nth-child(7) {
  clip-path: polygon(66.66% 0%, 77.77% 0%, 77.77% 100%, 66.66% 100%);
  font-size: calc(var(--main-size) / 13);
  margin-left: 0.33em;
  opacity: 0.8;
}

.loader .text:nth-child(8) {
  clip-path: polygon(77.77% 0%, 88.88% 0%, 88.88% 100%, 77.77% 100%);
  font-size: calc(var(--main-size) / 16);
  margin-left: 0.98em;
  opacity: 0.7;
}

.loader .text:nth-child(9) {
  clip-path: polygon(88.88% 0%, 100% 0%, 100% 100%, 88.88% 100%);
  font-size: calc(var(--main-size) / 20);
  margin-left: 2.1em;
  opacity: 0.6;
}

.loader .text span {
  animation:
    scrolling 2s cubic-bezier(0.1, 0.6, 0.9, 0.4) infinite,
    shadow 2s cubic-bezier(0.1, 0.6, 0.9, 0.4) infinite;
}

.loader .text:nth-child(1) span {
  background: linear-gradient(
    to right,
    var(--text-color) 4%,
    var(--shadow-color) 7%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(2) span {
  background: linear-gradient(
    to right,
    var(--text-color) 9%,
    var(--shadow-color) 13%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(3) span {
  background: linear-gradient(
    to right,
    var(--text-color) 15%,
    var(--shadow-color) 18%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(4) span {
  background: linear-gradient(
    to right,
    var(--text-color) 20%,
    var(--shadow-color) 23%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(6) span {
  background: linear-gradient(
    to right,
    var(--shadow-color) 29%,
    var(--text-color) 32%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(7) span {
  background: linear-gradient(
    to right,
    var(--shadow-color) 34%,
    var(--text-color) 37%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(8) span {
  background: linear-gradient(
    to right,
    var(--shadow-color) 39%,
    var(--text-color) 42%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .text:nth-child(9) span {
  background: linear-gradient(
    to right,
    var(--shadow-color) 45%,
    var(--text-color) 48%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.loader .line {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 0.05em;
  width: calc(var(--main-size) / 2);
  margin-top: 0.9em;
  border-radius: 0.05em;
}

.loader .line::before {
  content: "";
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: var(--text-color);
  opacity: 0.3;
}

.loader .line::after {
  content: "";
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: var(--text-color);
  border-radius: 0.05em;
  transform: translateX(-90%);
  animation: wobble 2s cubic-bezier(0.5, 0.8, 0.5, 0.2) infinite;
}

@keyframes wobble {
  0% {
    transform: translateX(-90%);
  }
  50% {
    transform: translateX(90%);
  }
  100% {
    transform: translateX(-90%);
  }
}

@keyframes scrolling {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes shadow {
  0% {
    background-position: -98% 0;
  }
  100% {
    background-position: 102% 0;
  }
}

@media (max-width: 600px) {
  .loader {
    --main-size: 2.5em !important;
  }
  .loader-card {
    padding: 28px 20px 22px;
    border-radius: 18px;
  }
}
`;

fs.writeFileSync(cssPath, cssContent + '\n' + loaderCss + '\n', 'utf8');
console.log('Appended .loader CSS to globals.css');

// 2. Update DashboardClient.tsx
const dashPath = path.resolve(__dirname, '../src/components/DashboardClient.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
if (!dashContent.includes('CylindricalLoader')) {
  dashContent = `import CylindricalLoader from '@/components/CylindricalLoader';\n` + dashContent;
}
dashContent = dashContent.replace(
  `if(!overview||!tasks)return <main className="page"><div className="center"><div><div className="spinner"/><b>Opening company dashboard…</b><p>Loading the latest saved view.</p></div></div></main>;`,
  `if(!overview||!tasks)return <main className="page"><CylindricalLoader text="LOADING" /></main>;`
);
fs.writeFileSync(dashPath, dashContent, 'utf8');
console.log('Updated DashboardClient.tsx');

// 3. Update TasksClient.tsx
const tasksPath = path.resolve(__dirname, '../src/components/TasksClient.tsx');
let tasksContent = fs.readFileSync(tasksPath, 'utf8');
if (!tasksContent.includes('CylindricalLoader')) {
  tasksContent = `import CylindricalLoader from '@/components/CylindricalLoader';\n` + tasksContent;
}
tasksContent = tasksContent.replace(
  `if(!data)return <main className="page"><div className="center"><div><div className="spinner"/>Loading work queue…</div></div></main>;`,
  `if(!data)return <main className="page"><CylindricalLoader text="LOADING" /></main>;`
);
fs.writeFileSync(tasksPath, tasksContent, 'utf8');
console.log('Updated TasksClient.tsx');

// 4. Update ActivityClient.tsx
const activityPath = path.resolve(__dirname, '../src/components/ActivityClient.tsx');
let activityContent = fs.readFileSync(activityPath, 'utf8');
if (!activityContent.includes('CylindricalLoader')) {
  activityContent = `import CylindricalLoader from '@/components/CylindricalLoader';\n` + activityContent;
}
activityContent = activityContent.replace(
  `if(!d)return <main className="page"><div className="center"><div><div className="spinner"/>Loading activity…</div></div></main>;`,
  `if(!d)return <main className="page"><CylindricalLoader text="LOADING" /></main>;`
);
fs.writeFileSync(activityPath, activityContent, 'utf8');
console.log('Updated ActivityClient.tsx');

// 5. Update FormsClient.tsx LoadingSkeleton
const formsPath = path.resolve(__dirname, '../src/components/FormsClient.tsx');
let formsContent = fs.readFileSync(formsPath, 'utf8');
if (!formsContent.includes('CylindricalLoader')) {
  formsContent = `import CylindricalLoader from '@/components/CylindricalLoader';\n` + formsContent;
}
const oldSkeleton = `export function LoadingSkeleton() {
  return (
    <div className="process-skeleton-grid">
      {[1, 2].map((k) => (
        <div key={k} className="process-skeleton-card">
          <div className="skeleton-hero shimmer" />
          <div className="skeleton-body">
            <div className="skeleton-metrics shimmer" />
            <div className="skeleton-stages shimmer" />
            <div className="skeleton-actions shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}`;
const newSkeleton = `export function LoadingSkeleton() {
  return <CylindricalLoader text="LOADING" />;
}`;
if (formsContent.includes(oldSkeleton)) {
  formsContent = formsContent.replace(oldSkeleton, newSkeleton);
  fs.writeFileSync(formsPath, formsContent, 'utf8');
  console.log('Updated FormsClient.tsx LoadingSkeleton');
}
