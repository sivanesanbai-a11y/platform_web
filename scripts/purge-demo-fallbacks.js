const fs = require('fs');
const path = require('path');

// 1. src/app/workshop/page.tsx
const workshopPath = path.join(__dirname, '..', 'src', 'app', 'workshop', 'page.tsx');
let workshopCode = fs.readFileSync(workshopPath, 'utf8');
workshopCode = workshopCode.replace(
  'if (list.length === 0) { list = [DEMO_BENCHMARK_JOB]; localStorage.setItem("nunes:service_jobs", JSON.stringify(list)); }',
  '// No demo auto-injection'
);
workshopCode = workshopCode.replace('import { DEMO_BENCHMARK_JOB } from "@/lib/service-defaults";', '');
fs.writeFileSync(workshopPath, workshopCode, 'utf8');
console.log('1. Cleaned workshop page');

// 2. src/app/quotations/page.tsx
const quotPath = path.join(__dirname, '..', 'src', 'app', 'quotations', 'page.tsx');
let quotCode = fs.readFileSync(quotPath, 'utf8');
quotCode = quotCode.replace('import { DEMO_BENCHMARK_JOB } from "@/lib/service-defaults";', '');

// Replace loadServiceJobs
const quotOldLoad = `      let list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      if (list.length === 0) {
        list = [DEMO_BENCHMARK_JOB];
        localStorage.setItem("nunes:service_jobs", JSON.stringify(list));
      }
      setServiceJobs(list);
    } catch {
      setServiceJobs([DEMO_BENCHMARK_JOB]);
    }`;
const quotNewLoad = `      let list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      setServiceJobs(list);
    } catch {
      setServiceJobs([]);
    }`;

quotCode = quotCode.replace(quotOldLoad.replace(/\n/g, '\r\n'), quotNewLoad.replace(/\n/g, '\r\n'));
quotCode = quotCode.replace(quotOldLoad.replace(/\r\n/g, '\n'), quotNewLoad.replace(/\r\n/g, '\n'));

// Replace hardcoded Texmo KPI card in quotations
const oldCard = `            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">Standard Benchmark Reference</div>
              <div className="text-sm font-bold text-slate-800">#SJ-2026-1001</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">Texmo Precision Castings Ltd</div>
            </div>`;

const newCard = `            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">Completed &amp; Dispatched</div>
              <div className="text-2xl font-black text-slate-900">
                {serviceJobs.filter((j) => j.workflow?.stage === "JOB_COMPLETED" || j.status === "CLOSED").length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Closed work orders</div>
            </div>`;

quotCode = quotCode.replace(oldCard.replace(/\n/g, '\r\n'), newCard.replace(/\n/g, '\r\n'));
quotCode = quotCode.replace(oldCard.replace(/\r\n/g, '\n'), newCard.replace(/\r\n/g, '\n'));

fs.writeFileSync(quotPath, quotCode, 'utf8');
console.log('2. Cleaned quotations page');

// 3. src/components/forms/ServicingJobForm.tsx
const servicingPath = path.join(__dirname, '..', 'src', 'components', 'forms', 'ServicingJobForm.tsx');
let servicingCode = fs.readFileSync(servicingPath, 'utf8');

servicingCode = servicingCode.replace("const BENCHMARK_SERVICING: ServiceJob[] = [DEMO_BENCHMARK_JOB];", "const BENCHMARK_SERVICING: ServiceJob[] = [];");
servicingCode = servicingCode.replace("import { blankJob, newProduct, DEMO_BENCHMARK_JOB } from '@/lib/service-defaults';", "import { blankJob, newProduct } from '@/lib/service-defaults';");

const oldServicingLoad = `        let list: ServiceJob[] = raw ? JSON.parse(raw) : [];
        if (list.length === 0) {
          list = [DEMO_BENCHMARK_JOB];
          localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
        }
        setSavedJobsList(list);`;

const newServicingLoad = `        let list: ServiceJob[] = raw ? JSON.parse(raw) : [];
        setSavedJobsList(list);`;

servicingCode = servicingCode.replace(oldServicingLoad.replace(/\n/g, '\r\n'), newServicingLoad.replace(/\n/g, '\r\n'));
servicingCode = servicingCode.replace(oldServicingLoad.replace(/\r\n/g, '\n'), newServicingLoad.replace(/\r\n/g, '\n'));

fs.writeFileSync(servicingPath, servicingCode, 'utf8');
console.log('3. Cleaned servicing job form');

// 4. src/components/Shell.tsx
const shellPath = path.join(__dirname, '..', 'src', 'components', 'Shell.tsx');
let shellCode = fs.readFileSync(shellPath, 'utf8');
shellCode = shellCode.replace('const purgeKey = "nunes_purged_all_demo_v4";', 'const purgeKey = "nunes_purged_all_demo_v5";');
fs.writeFileSync(shellPath, shellCode, 'utf8');
console.log('4. Updated Shell purgeKey to v5');
