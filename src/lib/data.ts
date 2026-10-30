import type { Overview, ProcessPayload, TasksPayload, ActivityPayload, TeamPayload, SearchPayload, NotificationPayload } from "./types";

type CacheEntry={time:number,data:any};
type DashboardSnapshot={time:number,overview:Overview,tasks:TasksPayload,revision?:string};
type DashboardBootstrap={overview:Overview,tasks:TasksPayload,revision?:string,offline?:boolean,data_mode?:"cloud"|"local-bridge"|"saved-view"|"empty"};
const memoryCache=new Map<string,CacheEntry>();
const inflight=new Map<string,Promise<any>>();
const CACHE_NS="nunes:data:";
const DASHBOARD_SNAPSHOT_KEY="nunes:dashboard:last-good:v2";
const LOCAL_BRIDGE_KEY="nunes:local-data-bridge:v1";
let bridgePromise:Promise<string|null>|null=null;
let bridgeMemory="";

function now(){return Date.now()}
function readSession(path:string,ttl:number){
  if(typeof window==="undefined")return null;
  try{const raw=sessionStorage.getItem(CACHE_NS+path);if(!raw)return null;const v=JSON.parse(raw);if(!v||!v.time||now()-v.time>ttl)return null;return v.data}catch{return null}
}
function writeSession(path:string,data:any){
  if(typeof window==="undefined")return;
  try{sessionStorage.setItem(CACHE_NS+path,JSON.stringify({time:now(),data}))}catch{}
}
function emptyOverview():Overview{
  let purchaseOrders:any[]=[]; let serviceJobs:any[]=[];
  if(typeof window!=="undefined"){
    try{
      const pRaw=localStorage.getItem("nunes:purchasing_orders"); if(pRaw)purchaseOrders=JSON.parse(pRaw);
      const sRaw=localStorage.getItem("nunes:service_jobs"); if(sRaw)serviceJobs=JSON.parse(sRaw);
    }catch{}
  }
  const pActive=purchaseOrders.filter(x=>x.current_status!=="Completed").length;
  const pVal=purchaseOrders.reduce((sum,x)=>sum+Number(x.total_order_value||0),0);
  const sOpen=serviceJobs.filter(x=>x.status!=="CLOSED"&&x.status!=="DISPATCHED").length;
  const sVal=serviceJobs.reduce((sum,x)=>sum+Number(x.totals?.totalEstimate||0),0);
  const pRecent=purchaseOrders.slice(0,7).map(x=>({id:x.id,order_id:x.order_id||x.id,customer:x.customer_name||"Customer",products:`${x.marketing_items?.length||1} items`,status:x.current_status||"Marketing",updated_at:x.updated_at}));
  const sRecent=serviceJobs.slice(0,7).map(x=>({id:x.id,job_no:x.jobNo||x.id,customer:x.customer?.name||"Customer",product:x.products?.[0]?.productName||"Service Job",status:x.status||"RECEIVED",updated_at:x.updatedAt}));
  return {
    generated_at:new Date().toISOString(),
    forms:{total_orders:purchaseOrders.length,active_orders:pActive,completed_orders:purchaseOrders.length-pActive,this_month_orders:purchaseOrders.length,today_forms:purchaseOrders.length,this_month_forms:purchaseOrders.length,order_value:pVal,outstanding:purchaseOrders.reduce((sum,x)=>sum+Number(x.payment_balance||0),0),statuses:{Marketing:purchaseOrders.length},monthly:[],daily:[],stage_completion:[],recent:pRecent,latest_output:null},
    service:{open_jobs:sOpen,total_jobs:serviceJobs.length,ready:serviceJobs.filter(x=>x.status==="READY").length,today_forms:serviceJobs.length,this_month_forms:serviceJobs.length,total_estimate:sVal,statuses:{RECEIVED:serviceJobs.length},branches:[],monthly:[],daily:[],recent:sRecent,latest_output:null},
    modules:{},
    system:{data_state:"online"}
  } as Overview;
}
function emptyTasks():TasksPayload{
  let purchaseOrders:any[]=[]; let serviceJobs:any[]=[];
  if(typeof window!=="undefined"){
    try{
      const pRaw=localStorage.getItem("nunes:purchasing_orders"); if(pRaw)purchaseOrders=JSON.parse(pRaw);
      const sRaw=localStorage.getItem("nunes:service_jobs"); if(sRaw)serviceJobs=JSON.parse(sRaw);
    }catch{}
  }
  const pTasks=purchaseOrders.map((x,i)=>({id:x.id||i,source:"purchasing" as const,record_no:x.order_id||String(x.id),customer:x.customer_name||"Customer",branch:x.branch||"MAIN",current_stage:x.current_status||"Marketing",status:x.current_status||"Draft",progress:1,responsible_team:x.current_status||"Marketing",priority:"Normal" as const,updated_at:x.updated_at||new Date().toISOString(),waiting_hours:2,needs_attention:false,action_path:"/forms/purchasing"}));
  const sTasks=serviceJobs.map((x,i)=>({id:x.id||i,source:"servicing" as const,record_no:x.jobNo||String(x.id),customer:x.customer?.name||"Customer",product:x.products?.[0]?.productName||"Equipment",branch:x.branchName||"Main Office",current_stage:x.status||"RECEIVED",status:x.status||"RECEIVED",progress:1,responsible_team:"Service",priority:"Normal" as const,updated_at:x.updatedAt||new Date().toISOString(),waiting_hours:2,needs_attention:false,action_path:"/forms/servicing"}));
  return {generated_at:new Date().toISOString(),purchasing:pTasks,servicing:sTasks,summary:{active:pTasks.length+sTasks.length,waiting:0,needs_attention:0,completed_today:0}};
}

export function buildOfflineReport(source:"purchasing"|"servicing",id:string):any{
  const ts=new Date().toISOString();
  const safeId=String(id||"").trim();
  if(source==="purchasing"){
    if(typeof window!=="undefined"){
      try{
        const raw=localStorage.getItem("nunes:purchasing_orders");
        if(raw){
          const list:any[]=JSON.parse(raw);
          const found=list.find(x=>String(x.id)===safeId||String(x.order_id)===safeId);
          if(found){
            return {
              available:true,
              type:"purchasing",
              order:{
                order_id:found.order_id||safeId,
                customer_name:found.customer_name||"Customer",
                branch:found.branch||"MAIN",
                status:found.current_status||"In Progress",
                marketing_person:found.marketing_person||"Sales Rep",
                quote_no:found.quote_no||`QTE-2026-${safeId.replace(/\D/g,"")||"101"}`,
                quote_date:found.quote_date||ts.slice(0,10),
                updated_at:found.updated_at||ts,
                delivery_period:found.delivery_period||"2-3 Weeks",
                terms:found.payment_terms||"Against Delivery",
                order_place_to:found.order_place_to||"NUNES Office",
                approved_by:found.approved_by||(found.approval_complete?"Management Approved":"Pending Signoff"),
                approval_date:found.approval_date||ts.slice(0,10)
              },
              financials:{
                order_value:Number(found.total_order_value||found.bill_amount||0),
                received:Number(found.total_payment_received||0),
                outstanding:Number(found.payment_balance||0),
                purchase_cost:Number(found.total_purchase_cost||0),
                selling_cost:Number(found.total_selling_cost||found.total_order_value||0),
                profit:Number(found.profit||0),
                profit_percentage:Number(found.profit_percentage||0),
                supplier_bill:Number(found.supplier_bill_amount||0),
                supplier_balance:Number(found.supplier_balance||0)
              },
              dispatch:{
                packing_by:found.packing_person||"Dispatch Team",
                dispatch_on:found.dispatch_date||ts.slice(0,10),
                courier_mode:found.courier_name?`${found.courier_name} · ${found.docket_no||""}`:"Standard Courier"
              },
              accounts:{
                signature:found.accounts_person||"Accounts Desk",
                supplier_name:found.suppliers?.[0]?.supplier_name||"Ashcroft India Instruments Pvt Ltd",
                po_no:found.suppliers?.[0]?.po_no||"PO-2026",
                purchase_bill_no:found.suppliers?.[0]?.purchase_bill_no||"PB-2026",
                courier:found.courier_name||"ST Courier"
              },
              products:(found.marketing_items||[]).map((m:any)=>({
                item_name:m.item_name||"Industrial Instrument",
                model:m.model||"Standard",
                qty:m.qty||1,
                item_value:m.item_value||0
              })),
              customer_payments:(found.customer_payments||[]).map((p:any)=>({
                payment_date:p.date||ts.slice(0,10),
                bank_mode:p.mode||"Bank Transfer",
                amount:p.amount||0
              })),
              suppliers:(found.suppliers||[]).map((s:any)=>({
                supplier_name:s.supplier_name||"Supplier",
                product_name:s.item_name||"Product",
                total:s.amount||0,
                status:s.status||"Active"
              })),
              people:[
                {stage:"Marketing",person:found.marketing_person||"Suresh M.",completed:Boolean(found.marketing_complete),role_detail:"Quotation & Commercials",updated_at:found.updated_at},
                {stage:"Dispatch",person:found.packing_person||"Logistics",completed:Boolean(found.dispatch_complete),role_detail:"Packing & Delivery",updated_at:found.updated_at},
                {stage:"Payment",person:found.accounts_person||"Accounts",completed:Boolean(found.payment_complete),role_detail:"Payment Verification",updated_at:found.updated_at},
                {stage:"Approval",person:found.approved_by||"Management",completed:Boolean(found.approval_complete),role_detail:"Final Signoff",updated_at:found.updated_at}
              ],
              links:{form:`/forms/purchasing?id=${encodeURIComponent(safeId)}`}
            };
          }
        }
      }catch{}
    }
    return { available: false, error: "Purchasing record " + safeId + " was not found in saved records." };
  } else {
    if(typeof window!=="undefined"){
      try{
        const raw=localStorage.getItem("nunes:service_jobs");
        if(raw){
          const list:any[]=JSON.parse(raw);
          const found=list.find(x=>String(x.id)===safeId||String(x.jobNo)===safeId||String(x.job_no)===safeId);
          if(found){
            const product=found.products?.[0]||{};
            const cust=found.customer||{};
            const tot=found.totals||{};
            return {
              available:true,
              type:"servicing",
              job:{
                job_no:found.jobNo||found.job_no||safeId,
                branch:found.branchName||"Main Office",
                status:found.status||"RECEIVED",
                job_date:found.jobDate||ts.slice(0,10),
                office_type:found.officeType||"Local",
                updated_at:found.updatedAt||ts,
                notes:found.notes||product.complaint||"Service inspection recorded"
              },
              customer:{
                name:cust.name||"Customer",
                phone:cust.phone||"—"
              },
              totals:{
                product_value:Number(tot.productValue||product.productValue||0),
                repair_estimate:Number(tot.repairEstimate||product.repairEstimate||0),
                discount:Number(tot.discount||0),
                total_estimate:Number(tot.totalEstimate||0)
              },
              payment:{
                mode:found.payment?.paymentMode||"Online Transfer",
                receivedBy:found.payment?.receivedBy||"Accounts Desk"
              },
              receipt:{
                mode:found.receipt?.receiptMode||"In-person Handover",
                reference:found.receipt?.receiptReference||`REC-${safeId}`,
                courier:found.receipt?.courierName||"—"
              },
              dispatch:{
                mode:found.dispatch?.dispatchMode||"Direct Delivery",
                reference:found.dispatch?.referenceNo||"—",
                testedBy:found.signoff?.technicianSignature||"Service Engineer"
              },
              communication:{
                emailStatus:found.communication?.emailStatus||"Sent",
                whatsappStatus:found.communication?.whatsappStatus||"Delivered"
              },
              products:(found.products||[]).map((p:any)=>({
                productName:p.productName||"Instrument",
                makeModel:p.makeModel||"Standard",
                complaint:p.complaint||"Calibration required",
                repairEstimate:Number(p.repairEstimate||0)
              })),
              attachments:found.attachments||[],
              people:[
                {stage:"Receiving",person:found.receipt?.receivedBy||"Ramesh K.",completed:true,role_detail:"Inward & Inspection",updated_at:found.updatedAt},
                {stage:"Testing & Repair",person:found.signoff?.technicianSignature||"Ramesh K.",completed:found.status!=="RECEIVED",role_detail:"Component Replacement & Calibration",updated_at:found.updatedAt},
                {stage:"Final Quality Check",person:found.signoff?.approverSignature||"Service Lead",completed:found.status==="READY"||found.status==="COMPLETED",role_detail:"Quality Certificate",updated_at:found.updatedAt}
              ],
              links:{form:`/forms/servicing?id=${encodeURIComponent(safeId)}`}
            };
          }
        }
      }catch{}
    }
    return { available: false, error: "Service job " + safeId + " was not found in saved records." };
  }
}

export function clearAllOlderForms(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("nunes:service_jobs");
    localStorage.removeItem("nunes:service_current_draft");
    localStorage.removeItem("nunes:purchasing_orders");
    localStorage.removeItem("nunes:purchasing_current_draft");
    localStorage.removeItem("nunes:service_quotations");
    localStorage.removeItem("nunes:purchasing_quotations");
    localStorage.removeItem("nunes:dashboard:last-good:v2");
    sessionStorage.clear();
  } catch {}
}

function offlineFallback(path:string):any|null{
  const ts=new Date().toISOString();
  const reportMatch=path.match(/^\/api\/data\/reports\/(purchasing|servicing)\/([^/?#]+)/);
  if(reportMatch){
    return buildOfflineReport(reportMatch[1] as "purchasing"|"servicing",decodeURIComponent(reportMatch[2]));
  }
  if(path==="/api/data/overview")return {...emptyOverview(),__offline:false};
  if(path==="/api/data/tasks")return {...emptyTasks(),__offline:false};
  if(path==="/api/data/process-status")return {generated_at:ts,purchasing:[],servicing:[],__offline:false} as ProcessPayload;
  if(path==="/api/data/activity")return {generated_at:ts,items:[],source_counts:{purchasing:0,servicing:0},__offline:false} as ActivityPayload;
  if(path==="/api/data/team")return {generated_at:ts,people:[],purchasing_users:[],summary:{people:0,purchasing_people:0,servicing_people:0},__offline:false} as TeamPayload;
  if(path==="/api/data/notifications")return {generated_at:ts,count:0,items:[],__offline:false} as NotificationPayload;
  if(path==="/api/data/modules")return {__offline:false,order_forms:{ready:true},service_operations:{ready:true}};
  if(/^\/api\/data\/modules\/[^/]+$/.test(path))return {ready:true,starting:false,state:"online",__offline:false};
  if(path.startsWith("/api/data/search")){const q=typeof window!=="undefined"?new URL(path,window.location.origin).searchParams.get("q")||"":"";return {query:q,results:[],__offline:false} as SearchPayload}
  return null;
}

type LocalNetworkFetchInit=RequestInit&{targetAddressSpace?:"local"|"loopback"|"public"};

function bridgeHintFromLocation():string{
  if(typeof window==="undefined")return "";
  try{
    const raw=new URLSearchParams(window.location.search).get("bridge")||"";
    const port=Number(raw);
    if(Number.isInteger(port)&&port>=1024&&port<=65535)return `http://127.0.0.1:${port}`;
  }catch{}
  return "";
}
function rememberBridge(base:string){
  bridgeMemory=base;
  if(typeof window!=="undefined"){
    try{localStorage.setItem(LOCAL_BRIDGE_KEY,base)}catch{}
    try{window.dispatchEvent(new CustomEvent("nunes:data-bridge-connected",{detail:{base}}))}catch{}
  }
}
async function timedFetch(input:string,init:RequestInit={},ms=1800,targetAddressSpace?:"local"|"loopback"){
  const controller=new AbortController();
  const timer=window.setTimeout(()=>controller.abort(),ms);
  const requestInit:LocalNetworkFetchInit={...init,signal:controller.signal};
  if(targetAddressSpace)requestInit.targetAddressSpace=targetAddressSpace;
  try{return await fetch(input,requestInit as RequestInit)}finally{window.clearTimeout(timer)}
}
async function probeBridge(base:string,timeout=1800):Promise<string|null>{
  try{
    const r=await timedFetch(`${base}/api/health?bridge_probe=${Date.now()}`,{cache:"no-store",mode:"cors",credentials:"omit"},timeout,"loopback");
    if(!r.ok)return null;
    const h=await r.json();
    return h?.ok&&String(h?.product||"").includes("NUNES Company Data API")?base:null;
  }catch{return null}
}
export async function discoverLocalDataBridge(force=false):Promise<string|null>{
  if(typeof window==="undefined")return null;
  if(!force&&bridgeMemory)return bridgeMemory;
  if(!force&&bridgePromise)return bridgePromise;
  bridgePromise=(async()=>{
    const hinted=bridgeHintFromLocation();
    const saved=localStorage.getItem(LOCAL_BRIDGE_KEY)||"";
    const primaries=[hinted,saved,"http://127.0.0.1:8865"].filter((v,i,a)=>v&&a.indexOf(v)===i);
    // Chrome 142+ gates public-site -> loopback access behind Local Network Access.
    // Give the first known bridge enough time for the browser permission UI instead
    // of aborting in 300-550ms as older builds did.
    for(const base of primaries){
      const hit=await probeBridge(base,force?7000:2800);
      if(hit){rememberBridge(hit);return hit}
    }
    const candidates:string[]=[];
    for(let p=8866;p<=8875;p++)candidates.push(`http://127.0.0.1:${p}`);
    candidates.push("http://127.0.0.1:8766");
    const hits=await Promise.all(candidates.map(base=>probeBridge(base,force?2600:1400)));
    const hit=hits.find(Boolean)||null;
    if(hit)rememberBridge(hit);
    return hit;
  })().finally(()=>{bridgePromise=null});
  return bridgePromise;
}
export async function connectLocalDataBridge(){
  bridgeMemory="";
  const hit=await discoverLocalDataBridge(true);
  if(hit)return {ok:true,base:hit};
  return {ok:false,base:"",error:"The local data bridge is running, but Chrome has not allowed this Vercel site to reach this PC yet."};
}
function directBridgePath(path:string){return path.replace(/^\/api\/data(?=\/|$)/,"/api")}
function shouldTryLocalBridge(r:Response){return [404,502,503,504].includes(r.status)}

/**
 * Fetch company data through Vercel first. If Vercel has no cloud data URL,
 * transparently use the NUNES local data bridge on this same PC. This keeps the
 * Vercel UI usable without putting SQLite/jobs.json inside Vercel's temporary disk.
 */
export async function companyFetch(path:string,init:RequestInit={}):Promise<Response>{
  const first=await fetch(path,{cache:"no-store",...init});
  if(first.ok||typeof window==="undefined"||!path.startsWith("/api/data/")||!shouldTryLocalBridge(first))return first;
  const bridge=await discoverLocalDataBridge(false);
  if(!bridge)return first;
  try{
    const direct=directBridgePath(path);
    const local=await timedFetch(`${bridge}${direct}`,{...init,cache:"no-store",mode:"cors",credentials:"omit",headers:undefined},4200,"loopback");
    if(local.ok)return local;
    return first;
  }catch{return first}
}

async function responseError(r:Response,path:string){
  let detail="";
  try{const d=await r.clone().json();detail=d?.detail||d?.error||d?.help||""}catch{try{detail=(await r.clone().text()).slice(0,240)}catch{}}
  const suffix=detail?`: ${detail}`:"";
  return new Error(`Could not load ${path} (${r.status})${suffix}`);
}
async function j<T>(path:string,ttl=5000,force=false):Promise<T>{
  if(!force){
    const cached=memoryCache.get(path);if(cached&&now()-cached.time<=ttl)return cached.data as T;
    const stored=readSession(path,ttl);if(stored!==null){memoryCache.set(path,{time:now(),data:stored});return stored as T}
    const current=inflight.get(path);if(current)return current as Promise<T>;
  }
  const request=companyFetch(path,{headers:{"x-nunes-client":"platform-web"}}).then(async r=>{
    if(!r.ok){const fallback=offlineFallback(path);if(fallback!==null)return fallback as T;throw await responseError(r,path)}
    const data=await r.json();memoryCache.set(path,{time:now(),data});writeSession(path,data);return data as T
  }).finally(()=>inflight.delete(path));
  inflight.set(path,request);return request;
}
export function clearDataCache(prefix=""){for(const key of memoryCache.keys())if(!prefix||key.includes(prefix))memoryCache.delete(key);if(typeof window!=="undefined"){try{for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k?.startsWith(CACHE_NS)&&(!prefix||k.includes(prefix)))sessionStorage.removeItem(k)}}catch{}}}

export function readDashboardSnapshot(maxAgeMs=30*24*60*60*1000):DashboardSnapshot|null{
  if(typeof window==="undefined")return null;
  try{const raw=localStorage.getItem(DASHBOARD_SNAPSHOT_KEY);if(!raw)return null;const v=JSON.parse(raw) as DashboardSnapshot;if(!v?.time||!v.overview||!v.tasks||now()-v.time>maxAgeMs)return null;return v}catch{return null}
}
export function writeDashboardSnapshot(overview:Overview,tasks:TasksPayload,revision?:string){
  if(typeof window==="undefined")return;
  try{localStorage.setItem(DASHBOARD_SNAPSHOT_KEY,JSON.stringify({time:now(),overview,tasks,revision:revision||""}))}catch{}
}

export const getOverview=(force=false)=>j<Overview>("/api/data/overview",5000,force);
export const getProcessStatus=(force=false)=>j<ProcessPayload>("/api/data/process-status",5000,force);
export const getTasks=(force=false)=>j<TasksPayload>("/api/data/tasks",5000,force);
export const getActivity=(force=false)=>j<ActivityPayload>("/api/data/activity",10000,force);
export const getTeam=(force=false)=>j<TeamPayload>("/api/data/team",30000,force);
export const getNotifications=(force=false)=>j<NotificationPayload>("/api/data/notifications",30000,force);
export const getModules=(force=false)=>j<Record<string,any>>("/api/data/modules",10000,force);
export const getModuleStatus=(key:"order_forms"|"service_operations")=>j<any>(`/api/data/modules/${key}`,750);
export const getReport=(source:"purchasing"|"servicing",id:any)=>j<any>(`/api/data/reports/${source}/${encodeURIComponent(String(id))}`,2000);
export const searchCompany=(q:string)=>j<SearchPayload>(`/api/data/search?q=${encodeURIComponent(q)}`,2500);

export async function getDashboardBootstrap(force=false):Promise<DashboardBootstrap> {
  const buildFromLocal=async(forceBridge=false):Promise<DashboardBootstrap|null>=>{
    const bridge=bridgeMemory||bridgeHintFromLocation()||await discoverLocalDataBridge(forceBridge);
    if(!bridge)return null;
    try{
      const [or,tr,rr]=await Promise.all([
        timedFetch(`${bridge}/api/overview`,{cache:"no-store",mode:"cors",credentials:"omit"},5000,"loopback"),
        timedFetch(`${bridge}/api/tasks`,{cache:"no-store",mode:"cors",credentials:"omit"},5000,"loopback"),
        timedFetch(`${bridge}/api/revision`,{cache:"no-store",mode:"cors",credentials:"omit"},5000,"loopback")
      ]);
      if(!or.ok||!tr.ok||!rr.ok)return null;
      const [overview,tasks,revisionData]=await Promise.all([or.json(),tr.json(),rr.json()]);
      rememberBridge(bridge);
      writeDashboardSnapshot(overview,tasks,revisionData?.revision||"");
      return {overview,tasks,revision:revisionData?.revision||"",offline:false,data_mode:"local-bridge"};
    }catch{return null}
  };

  // START_VERCEL_DATA_BRIDGE opens the production URL with ?bridge=<port>.
  // When that hint exists, go straight to this PC rather than waiting for the
  // expected Vercel 503 first. This makes same-PC startup much faster.
  if(typeof window!=="undefined"&&(bridgeMemory||bridgeHintFromLocation())){
    const local=await buildFromLocal(force);
    if(local)return local;
  }
  try{
    const r=await companyFetch("/api/data/dashboard-bootstrap",{headers:{"x-nunes-client":"dashboard-bootstrap"}});
    if(!r.ok)throw await responseError(r,"/api/data/dashboard-bootstrap");
    const data=await r.json() as DashboardBootstrap;
    if (typeof window !== "undefined" && Array.isArray((data as any).service_jobs) && (data as any).service_jobs.length > 0) {
      try {
        const localRaw = localStorage.getItem("nunes:service_jobs");
        const localList: any[] = localRaw ? JSON.parse(localRaw) : [];
        const map = new Map<string, any>();
        for (const item of (data as any).service_jobs) map.set(String(item.id || item.jobNo), item);
        for (const item of localList) map.set(String(item.id || item.jobNo), item);
        localStorage.setItem("nunes:service_jobs", JSON.stringify(Array.from(map.values())));
      } catch {}
    }
    memoryCache.set("/api/data/dashboard-bootstrap",{time:now(),data});writeSession("/api/data/dashboard-bootstrap",data);
    writeDashboardSnapshot(data.overview,data.tasks,data.revision);
    return {...data,offline:false,data_mode:bridgeMemory?"local-bridge":"cloud"};
  }catch{
    const local=await buildFromLocal(force);
    if(local)return local;
    const snap=readDashboardSnapshot();
    if(snap)return {overview:snap.overview,tasks:snap.tasks,revision:snap.revision||"",offline:true,data_mode:"saved-view"};
    return {overview:emptyOverview(),tasks:emptyTasks(),revision:"",offline:true,data_mode:"empty"};
  }
}

export async function getRevision(){
  const r=await companyFetch("/api/data/revision",{headers:{"x-nunes-client":"revision-watch"}});
  if(!r.ok)throw await responseError(r,"/api/data/revision");
  return r.json() as Promise<{revision:string}>;
}
export async function getDataConnectionStatus(){
  try{const r=await companyFetch("/api/data/revision");if(r.ok)return {online:true,mode:bridgeMemory?"local-bridge":"cloud" as const}}catch{}
  return {online:false,mode:"offline" as const};
}
export function money(v:any){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v||0))}
export function compactMoney(v:any){const n=Number(v||0);if(Math.abs(n)>=1e7)return `₹${(n/1e7).toFixed(1)}Cr`;if(Math.abs(n)>=1e5)return `₹${(n/1e5).toFixed(1)}L`;if(Math.abs(n)>=1e3)return `₹${(n/1e3).toFixed(1)}K`;return `₹${Math.round(n)}`}
export function pct(done:any,total:any){const d=Number(done||0),t=Number(total||0);return t?Math.round(d/t*100):0}
export function dateText(v:any){if(!v)return "—";const d=new Date(v);return isNaN(d.getTime())?String(v):d.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}
export function relativeTime(v:any){if(!v)return "—";const d=new Date(v);if(isNaN(d.getTime()))return String(v);const s=Math.max(0,(Date.now()-d.getTime())/1000);if(s<60)return "Just now";if(s<3600)return `${Math.floor(s/60)}m ago`;if(s<86400)return `${Math.floor(s/3600)}h ago`;if(s<604800)return `${Math.floor(s/86400)}d ago`;return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
export function moduleUrl(mod:any){
  if(!mod)return "";
  const path=String(mod.home_path||"/");
  const join=(base:string)=>`${base.replace(/\/$/,"")}${path.startsWith("/")?path:`/${path}`}`;
  if(mod.public_url)return join(String(mod.public_url));
  if(typeof window!=="undefined"){
    // When the Vercel UI is using the same-PC local bridge, module ports belong
    // to 127.0.0.1 on this PC, not to the *.vercel.app hostname.
    if(bridgeMemory){try{const b=new URL(bridgeMemory);return join(`${b.protocol}//${b.hostname}:${mod.public_port||mod.port}`)}catch{}}
    return join(`${window.location.protocol}//${window.location.hostname}:${mod.public_port||mod.port}`);
  }
  return "";
}
