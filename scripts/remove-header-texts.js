const fs = require('fs');
const path = require('path');

// 1. DashboardClient.tsx
const dashPath = path.resolve(__dirname, '../src/components/DashboardClient.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

const dashTarget = ` const now=new Date();
 return <main className="page dashboard-page-v2">
  <section className="dash-welcome">
   <div><span className="dash-eyebrow">NUNES Enterprise Platform</span><h1>Dashboard</h1><p>Live Purchasing and Servicing overview · {now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p></div>
   <div className="dash-welcome-actions"><Link href="/forms" className="btn primary"><FileText/>Open forms</Link><Link href="/tasks" className="btn"><Clock3/>Work queue</Link></div>
  </section>`;

const dashReplacement = ` return <main className="page dashboard-page-v2">
  <section className="dash-welcome" style={{ justifyContent: 'flex-end', marginBottom: '16px' }}>
   <div className="dash-welcome-actions"><Link href="/forms" className="btn primary"><FileText/>Open forms</Link><Link href="/tasks" className="btn"><Clock3/>Work queue</Link></div>
  </section>`;

const normalize = s => s.replace(/\r\n/g, '\n');
let normDash = normalize(dashContent);
if (normDash.includes(normalize(dashTarget))) {
  normDash = normDash.replace(normalize(dashTarget), normalize(dashReplacement));
  fs.writeFileSync(dashPath, normDash.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Updated DashboardClient.tsx');
} else {
  console.error('Failed to find dashTarget in DashboardClient.tsx');
}

// 2. TasksClient.tsx
const tasksPath = path.resolve(__dirname, '../src/components/TasksClient.tsx');
let tasksContent = fs.readFileSync(tasksPath, 'utf8');

const tasksTarget = ` return <main className="page"><div className="page-head"><div><h1>Work queue</h1></div></div>`;
const tasksReplacement = ` return <main className="page">`;

let normTasks = normalize(tasksContent);
if (normTasks.includes(normalize(tasksTarget))) {
  normTasks = normTasks.replace(normalize(tasksTarget), normalize(tasksReplacement));
  fs.writeFileSync(tasksPath, normTasks.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Updated TasksClient.tsx');
} else {
  console.error('Failed to find tasksTarget in TasksClient.tsx');
}
