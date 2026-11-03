/* eslint-disable */
// TruFin Accounts (Taxation — Compliance module), ported from the TruFin reference page (trufin-accounts_10 (1).html)
// by scripts/trufin-convert.js. Do not edit by hand: re-run the script instead.
// The page's own logic is kept as-is; only the host hooks differ: it renders into
// ROOT, takes its tab from the sidebar route, and stores data and files on the
// TrustComply server (HOST.openDB / HOST.files) instead of the browser.
const MARKUP="<div class=\"wrap\">\n<header class=\"top\">\n  <div class=\"bar\">\n    <div class=\"entity\">\n      <div class=\"mark\" aria-hidden=\"true\">T</div>\n      <div style=\"min-width:0\">\n        <h1 id=\"coName\">TrustLab Diagnostics Private Limited</h1>\n        <div class=\"cin\" id=\"coCin\">CIN U85100TG2020PTC143059 · Financial statements</div>\n      </div>\n    </div>\n    <div class=\"controls\">\n      <div class=\"ctl\"><label for=\"fySel\">Financial year</label><select id=\"fySel\"></select></div>\n      <div class=\"ctl\"><label for=\"unitSel\">Amounts in</label>\n        <select id=\"unitSel\"><option value=\"1\">₹</option><option value=\"1000\">₹ thousands</option><option value=\"100000\">₹ lakhs</option><option value=\"10000000\">₹ crores</option></select></div>\n      <span id=\"status\" class=\"pill draft\">Draft</span>\n      <button id=\"dlBtn\" class=\"btn dlbtn\" type=\"button\" aria-haspopup=\"dialog\"><svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path d=\"M8 2v8m0 0-3.2-3.2M8 10l3.2-3.2M3 13h10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>Download</button>\n      <button id=\"finBtn\" class=\"btn primary\" type=\"button\">Finalise</button>\n      <button id=\"bkBtn\" class=\"btn small\" type=\"button\" hidden title=\"Save all figures, notes, assets and documents to a file\">Backup</button>\n      <button id=\"rsBtn\" class=\"btn small\" type=\"button\" hidden title=\"Load everything from a backup file\">Restore</button>\n      <input type=\"file\" id=\"rsFile\" accept=\".json,application/json\" hidden>\n      <span id=\"saveState\" class=\"save\" aria-live=\"polite\"></span>\n    </div>\n  </div>\n  <nav class=\"tabs\" role=\"tablist\" id=\"tabs\">\n    <button role=\"tab\" data-tab=\"pl\">Profit &amp; Loss</button>\n    <button role=\"tab\" data-tab=\"bs\">Balance Sheet</button>\n    <button role=\"tab\" data-tab=\"dep\">Depreciation</button>\n    <button role=\"tab\" data-tab=\"assets\">Asset Register</button>\n    <button role=\"tab\" data-tab=\"notes\">Notes</button>\n    <button role=\"tab\" data-tab=\"scr\">Sundry Creditors</button>\n    <button role=\"tab\" data-tab=\"sdr\">Sundry Debtors</button>\n    <button role=\"tab\" data-tab=\"analysis\">Analysis</button>\n    <button role=\"tab\" data-tab=\"docs\">Documents</button>\n    <span class=\"sep\" aria-hidden=\"true\"></span>\n    <button role=\"tab\" data-tab=\"settings\">Settings</button>\n  </nav>\n</header>\n<main id=\"main\"></main>\n</div>\n<div id=\"scrim\" class=\"scrim\" hidden></div>\n<aside id=\"exp\" class=\"drawer\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"expTitle\" hidden></aside>\n<div id=\"tip\" class=\"tip\" role=\"tooltip\" hidden></div>\n<div id=\"toast\" class=\"toast\" hidden></div>";

export function mountAccounts(ROOT,HOST){
"use strict";
/* ---- host integration ---- */
let DEAD=false;const CLEAN=[];
const onG=(t,ev,fn,o)=>{t.addEventListener(ev,fn,o);CLEAN.push(()=>t.removeEventListener(ev,fn,o));};
const byId=id=>{const el=document.getElementById(id);return el&&ROOT.contains(el)?el:null;};
ROOT.innerHTML=MARKUP;

/* ---------- constants ---------- */
const CO={name:"TrustLab Diagnostics Private Limited",cin:"U85100TG2020PTC143059"};
const FIRST_FY=2020;
const DAY=86400000;
const CATS=[
 {n:"Buildings",t:"T",life:"60 years (other than factory buildings)"},
 {n:"Leasehold improvements",t:"T",life:"Lease term or useful life, whichever is shorter"},
 {n:"Laboratory equipment",t:"T",life:"13 years (medical & surgical equipment)"},
 {n:"Furniture and fixtures",t:"T",life:"10 years"},
 {n:"Office equipment",t:"T",life:"5 years"},
 {n:"Computers and IT hardware",t:"T",life:"3 years end-user devices · 6 years servers & networks"},
 {n:"Electrical installations",t:"T",life:"10 years"},
 {n:"Vehicles",t:"T",life:"8 years motor cars · 10 years two-wheelers"},
 {n:"Computer software",t:"I",life:"Intangible (AS 26): expected period of use"},
 {n:"Other intangible assets",t:"I",life:"Intangible (AS 26): expected period of use"}
];
const LOCS=["Begumpet (NRL)","Noida (ZRL)","Bengaluru","Chandigarh","Jammu","Visakhapatnam","Guntur","Anantapur","Mahbubnagar","Nizamabad","Hanumakonda","Karimnagar","Nizampet"];

/* Built-in line items (Schedule III, Division I) */
const BASE={
 rev:{l:"Revenue from operations"}, oth:{l:"Other income"},
 mat:{l:"Cost of materials consumed",h:"Reagents, kits and laboratory consumables"},
 pur:{l:"Purchases of stock-in-trade"},
 inv:{l:"Changes in inventories",h:"Decrease as positive, (increase) as negative"},
 emp:{l:"Employee benefits expense"}, fin:{l:"Finance costs"},
 dep:{l:"Depreciation and amortisation expense",a:"From asset register"},
 oexp:{l:"Other expenses"}, exc:{l:"Exceptional items"}, ctax:{l:"Current tax"}, dtax:{l:"Deferred tax"},
 sc:{l:"Share capital"}, rs:{l:"Reserves and surplus",a:"Opening + profit"}, sam:{l:"Share application money pending allotment"},
 ltb:{l:"Long-term borrowings"}, dtl:{l:"Deferred tax liabilities (net)"}, oltl:{l:"Other long-term liabilities"}, ltp:{l:"Long-term provisions"},
 stb:{l:"Short-term borrowings"}, tpm:{l:"Trade payables — micro and small enterprises"}, tpo:{l:"Trade payables — others"}, ocl:{l:"Other current liabilities"}, stp:{l:"Short-term provisions"},
 ppe:{l:"Property, plant and equipment",a:"From asset register"}, intg:{l:"Intangible assets",a:"From asset register"},
 cwip:{l:"Capital work-in-progress"}, iud:{l:"Intangible assets under development"}, nci:{l:"Non-current investments"}, dta:{l:"Deferred tax assets (net)"},
 ltla:{l:"Long-term loans and advances"}, onca:{l:"Other non-current assets"},
 ci:{l:"Current investments"}, invt:{l:"Inventories"}, tr:{l:"Trade receivables"}, cash:{l:"Cash and cash equivalents"}, stla:{l:"Short-term loans and advances"}, oca:{l:"Other current assets"}
};
const SECS={
 pl:[
  {id:"I",n:"I",label:"Revenue from operations",items:["rev"]},
  {id:"II",n:"II",label:"Other income",items:["oth"]},
  {id:"IV",n:"IV",label:"Expenses",items:["mat","pur","inv","emp","fin","dep","oexp"],hdr:true},
  {id:"VI",n:"VI",label:"Exceptional items",items:["exc"]},
  {id:"VIII",n:"VIII",label:"Tax expense",items:["ctax","dtax"],hdr:true}
 ],
 bs:[
  {id:"SF",grp:"L",label:"(1) Shareholders’ funds",items:["sc","rs"],hdr:true},
  {id:"SAM",grp:"L",label:"(2) Share application money pending allotment",items:["sam"]},
  {id:"NCL",grp:"L",label:"(3) Non-current liabilities",items:["ltb","dtl","oltl","ltp"],hdr:true},
  {id:"CL",grp:"L",label:"(4) Current liabilities",items:["stb","tpm","tpo","ocl","stp"],hdr:true},
  {id:"NCA",grp:"A",label:"(1) Non-current assets",items:["ppe","intg","cwip","iud","nci","dta","ltla","onca"],hdr:true},
  {id:"CA",grp:"A",label:"(2) Current assets",items:["ci","invt","tr","cash","stla","oca"],hdr:true}
 ]
};
const AUTO_KEYS=["dep","ppe","intg","rs"];
const DOC_TYPES=[
 {k:"fs",n:"Signed financial statements",req:true},
 {k:"audit",n:"Auditor’s report",req:true},
 {k:"taxaudit",n:"Tax audit report (Form 3CA/3CB–3CD)"},
 {k:"comp",n:"Income-tax computation",req:true},
 {k:"itr",n:"Income-tax return / ITR-V acknowledgement",req:true},
 {k:"challan",n:"Tax payment challan / receipt",req:true},
 {k:"26as",n:"Form 26AS / AIS / TIS"},
 {k:"tds",n:"TDS returns & acknowledgements"},
 {k:"gst",n:"GST returns & acknowledgements"},
 {k:"roc",n:"ROC filings (AOC-4, MGT-7)"},
 {k:"board",n:"Board / AGM resolutions"},
 {k:"notice",n:"Government notices & replies"},
 {k:"other",n:"Other"}
];
const docTypeName=k=>(DOC_TYPES.find(t=>t.k===k)||{n:k}).n;

/* ---------- helpers ---------- */
const $=s=>ROOT.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const r2=v=>Math.round((v+Number.EPSILON)*100)/100;
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const isObj=o=>o&&typeof o==="object"&&!Array.isArray(o);
const rid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function deepMerge(t,s){for(const k in s){if(isObj(s[k])&&isObj(t[k]))deepMerge(t[k],s[k]);else t[k]=clone(s[k]);}return t;}
const fyId=Y=>Y+"-"+String((Y+1)%100).padStart(2,"0");
const fyLabel=Y=>"FY "+fyId(Y);
const fyS=Y=>Date.UTC(Y,3,1), fyE=Y=>Date.UTC(Y+1,2,31);
const fyDays=Y=>(fyE(Y)-fyS(Y))/DAY+1;
function pd(s){if(!s||typeof s!=="string")return null;const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null;}
function fyOfT(t){const d=new Date(t);const y=d.getUTCFullYear();return d.getUTCMonth()>=3?y:y-1;}
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtD(t){if(t==null||isNaN(t))return "–";const d=new Date(t);return d.getUTCDate()+" "+MON[d.getUTCMonth()]+" "+d.getUTCFullYear();}
const endLabel=Y=>"31 March "+(Y+1);
const fmtSize=b=>b>=1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";

let unit=100000;
try{const u=localStorage.getItem("trufin.unit");if(u)unit=+u;}catch(e){}
const unitName=()=>({1:"₹",1000:"₹ thousands",100000:"₹ lakhs",10000000:"₹ crores"})[unit]||"₹";
const dec=()=>unit===1?0:2;
function fmt(v){
  if(v==null||isNaN(v))return "–";
  const x=v/unit; if(Math.abs(x)<(unit===1?0.5:0.005))return "–";
  const s=Math.abs(x).toLocaleString("en-IN",{minimumFractionDigits:dec(),maximumFractionDigits:dec()});
  return x<0?"("+s+")":s;
}
function fmtIn(v){if(v==null||v==="")return "";const x=+v/unit;return x.toLocaleString("en-IN",{minimumFractionDigits:0,maximumFractionDigits:dec()});}
function fmtRs(v){return "₹"+(+v||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function parseNum(s){
  if(s==null)return null;s=String(s).trim();if(!s)return null;
  let neg=false;if(/^\(.*\)$/.test(s)){neg=true;s=s.slice(1,-1);}
  s=s.replace(/[₹,\s]/g,"");if(s.startsWith("-")){neg=!neg;s=s.slice(1);}
  const v=parseFloat(s);if(isNaN(v))return null;return neg?-v:v;
}
function toast(msg){if(DEAD)return;const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,3400);}

/* ---------- state ---------- */
const now=Date.now();
const CUR_FY=fyOfT(now);
let sel=CUR_FY-1;
try{const s=localStorage.getItem("trufin.fy");if(s&&+s>=FIRST_FY&&+s<=CUR_FY)sel=+s;}catch(e){}
let tab=HOST.tab||"pl";let lastTab=tab;
let depView="fy", myAsset="all", myMetric="dep";
let raw={}, assets=[], docs=[];
let layout={custom:{},order:{},labels:{},period:{},cats:[],locs:[]};
let layoutDirty=false, layoutTimer=null;
const pend={}, timers={};
let db=null,user=null,downloads=null,fileCap=null,uid=null,canWrite=true,canAdmin=true,dbReady=false,isLocal=false;
let showFin=false,form=null,delConfirm=null,flashNote=null;
let setForm={tab:"pl",sec:"I",label:"",hint:"",life:"",from:sel,to:null};
let periodEdit=null;
let docForm=null, docFilter="sel", uploading=false;
let names={};

/* ---------- layout (Settings) ---------- */
function normLayout(l){l=isObj(l)?clone(l):{};return {custom:isObj(l.custom)?l.custom:{},order:isObj(l.order)?l.order:{},labels:isObj(l.labels)?l.labels:{},period:isObj(l.period)?l.period:{},report:isObj(l.report)?l.report:{},bench:isObj(l.bench)?l.bench:{},benchSrc:typeof l.benchSrc==="string"?l.benchSrc:"",cats:Array.isArray(l.cats)?l.cats:[],locs:Array.isArray(l.locs)?l.locs:[]};}
/* Years a line applies to: {from: startYear|null, to: startYear|null}; null = open-ended */
function inPeriod(k,Y){const p=layout.period[k];if(!p)return true;if(p.hidden)return false;if(p.from!=null&&Y<p.from)return false;if(p.to!=null&&Y>p.to)return false;return true;}
function fmtPeriod(k){const p=layout.period[k]||{};if(p.hidden)return "Hidden";const f=p.from,t=p.to;
  if(f==null&&t==null)return "All years";if(f!=null&&t!=null&&f===t)return fyLabel(f)+" only";
  if(f!=null&&t==null)return "From "+fyLabel(f);if(f==null&&t!=null)return "Until "+fyLabel(t);return fyLabel(f)+" – "+fyId(t);}
function yearOpts(v,none){let h=`<option value="" ${v==null?"selected":""}>${none}</option>`;for(let Y=FIRST_FY;Y<=CUR_FY+1;Y++)h+=`<option value="${Y}" ${v===Y?"selected":""}>${fyLabel(Y)}</option>`;return h;}
function yearsWithValue(t,k){const out=[];const ids=new Set(Object.keys(raw).concat(Object.keys(pend)));
  for(const id of ids){const y=yearData(+id.slice(0,4));if(y&&y[t]&&+y[t][k])out.push({id,Y:+id.slice(0,4),fin:y.status==="final"});}
  return out.sort((a,b)=>a.Y-b.Y);}
const allCats=()=>CATS.concat(layout.cats.filter(c=>c&&c.n));
const catType=n=>(allCats().find(c=>c.n===n)||{t:"T"}).t;
const allLocs=()=>LOCS.concat(layout.locs.filter(Boolean));
function secItems(t,sec){
  const cust=Object.keys(layout.custom).filter(k=>layout.custom[k].tab===t&&layout.custom[k].sec===sec.id).sort((a,b)=>(layout.custom[a].at||0)-(layout.custom[b].at||0));
  const all=sec.items.concat(cust);
  const ord=(layout.order[t+":"+sec.id]||[]).filter(k=>all.includes(k));
  return ord.concat(all.filter(k=>!ord.includes(k)));
}
const lineLabel=k=>layout.labels[k]||(layout.custom[k]&&layout.custom[k].label)||(BASE[k]&&BASE[k].l)||k;
const lineHint=k=>(layout.custom[k]&&layout.custom[k].hint)||(BASE[k]&&BASE[k].h)||"";
function lineTab(k){for(const t of ["pl","bs"])for(const s of SECS[t])if(secItems(t,s).includes(k))return t;return null;}
function lineOpts(){const out=[];for(const t of ["pl","bs"])for(const s of SECS[t])for(const k of secItems(t,s))out.push({k,label:(t==="pl"?"P&L · ":"BS · ")+lineLabel(k)});return out;}
function saveLayout(delay){
  layoutDirty=true;clearTimeout(layoutTimer);
  layoutTimer=setTimeout(()=>{
    if(!db){layoutDirty=false;return;}
    const body=clone(layout);
    chain=chain.then(async()=>{try{await db.doc("config/layout").set(body);setSave("Saved");}catch(e){toast("Couldn’t save settings. "+(e&&e.message||""));}layoutDirty=false;});
  },delay||0);
  setSave("Saving…");
}

/* ---------- notes ---------- */
function noteTemplates(){
 const T=(id,title,link,body,kind)=>({id,title,link:link||"",body:body||"",kind:kind||"",tpl:!!body,rows:[]});
 return [
  T("n1","Corporate information","",CO.name+" (CIN "+CO.cin+") is a private limited company incorporated in India under the Companies Act, 2013, with its registered office at Begumpet, Hyderabad. The Company operates NABL-accredited (ISO 15189:2022) diagnostic laboratories on a hub-and-spoke model, with processing laboratories and collection centres across India."),
  T("n2","Significant accounting policies","",
"2.1 Basis of preparation — The financial statements are prepared under the historical cost convention on an accrual basis, in accordance with the Accounting Standards notified under Section 133 of the Companies Act, 2013, and presented in the format prescribed by Schedule III (Division I).\n\n"+
"2.2 Property, plant and equipment — Stated at cost of acquisition, including freight, duties and installation, less accumulated depreciation. Depreciation is charged on the straight-line or written-down value method at the rates recorded in the asset register, which are not lower than those implied by the useful lives in Schedule II. Additions and disposals during the year are depreciated pro-rata from the date the asset is put to use and up to the date of disposal.\n\n"+
"2.3 Intangible assets — Software licences are amortised on a straight-line basis over their expected period of use.\n\n"+
"2.4 Revenue recognition — Revenue from diagnostic services is recognised when the test report is released, net of discounts and GST.\n\n"+
"2.5 Inventories — Reagents and consumables are valued at the lower of cost (FIFO) and net realisable value.\n\n"+
"2.6 Employee benefits — Contributions to provident fund and ESI are charged to the Statement of Profit and Loss as incurred. Gratuity and compensated absences are provided on the basis of actuarial valuation.\n\n"+
"2.7 Taxes on income — Current tax is determined under the Income-tax Act, 1961. Deferred tax is recognised on timing differences, subject to prudence."),
  T("n3","Share capital","sc"),
  T("n4","Reserves and surplus","rs"),
  T("n5","Long-term borrowings","ltb"),
  T("n6","Trade payables","tpo"),
  T("n7","Property, plant and equipment and intangible assets","ppe","","ppe"),
  T("n8","Trade receivables","tr"),
  T("n9","Cash and cash equivalents","cash"),
  T("n10","Revenue from operations","rev"),
  T("n11","Employee benefits expense","emp"),
  T("n12","Finance costs","fin"),
  T("n13","Other expenses","oexp")
 ];
}
/* A new year starts from the previous year's note structure (titles, links, breakup rows) */
function defaultYear(Y){
  const pv=raw[fyId(Y-1)];
  let notes=noteTemplates();
  if(pv&&Array.isArray(pv.notes)&&pv.notes.length)notes=pv.notes.map(n=>Object.assign(clone(n),{rows:(n.rows||[]).map(r=>({id:r.id,label:r.label,v:null}))}));
  return {fy:fyId(Y),status:"draft",pl:{},bs:{},notes};
}
function yearData(Y,force){
  const id=fyId(Y);
  let d=raw[id]?clone(raw[id]):null;
  if(!d&&(pend[id]||force))d=defaultYear(Y);
  if(!d)return null;
  if(pend[id])deepMerge(d,pend[id]);
  if(!Array.isArray(d.notes))d.notes=noteTemplates();
  d.pl=d.pl||{};d.bs=d.bs||{};
  return d;
}
const isFinal=Y=>{const d=yearData(Y);return !!(d&&d.status==="final"&&d.snap);};

/* ---------- depreciation engine ---------- */
let schedCache=new Map();
function schedule(a){
  if(schedCache.has(a))return schedCache.get(a);
  const out=[];
  const cost=+a.cost||0, rate=+a.rate||0, put=pd(a.put);
  if(put==null||cost<=0||rate<=0){schedCache.set(a,out);return out;}
  const resid=r2(cost*(+a.resid||0)/100);
  const disp=pd(a.disp), dispY=disp!=null?fyOfT(disp):null;
  const startY=fyOfT(put);
  const wdv=a.method==="WDV";
  const cap=wdv?Math.max(1,Math.min(60,+a.years||10)):80;
  let acc=0;
  for(let Y=startY;Y<startY+80;Y++){
    if(Y-startY>=cap)break;
    if(dispY!=null&&Y>dispY)break;
    const open=r2(cost-acc);
    if(open-resid<0.01)break;
    let from=fyS(Y),to=fyE(Y),part=false;
    if(Y===startY&&a.basis==="prorata"&&put>from){from=put;part=true;}
    if(dispY===Y){to=disp-DAY;part=true;}
    const days=Math.max(0,Math.round((to-from)/DAY)+1), full=fyDays(Y);
    const frac=part?Math.min(1,days/full):1;
    const annual=wdv?open*rate/100:(cost-resid)*rate/100;
    const dep=r2(Math.max(0,Math.min(annual*frac,open-resid)));
    acc=r2(acc+dep);
    const base=wdv?open:(cost-resid);
    out.push({Y,open,dep,acc,close:r2(cost-acc),pct:base>0?dep/base*100:0,part,days,full,disposed:dispY===Y});
  }
  schedCache.set(a,out);return out;
}
let fyMemo={};
function fySched(Y){
  if(fyMemo[Y])return fyMemo[Y];
  const cats={};const disposals=[];
  const blank=()=>({go:0,add:0,del:0,gc:0,ao:0,fy:0,od:0,ac:0,net:0,prev:0});
  for(const a of assets){
    const put=pd(a.put);if(put==null||!(+a.cost>0))continue;
    const putY=fyOfT(put);if(putY>Y)continue;
    const disp=pd(a.disp),dispY=disp!=null?fyOfT(disp):null;
    if(dispY!=null&&dispY<Y)continue;
    const rows=schedule(a);const cost=+a.cost;
    const c=cats[a.cat]||(cats[a.cat]=Object.assign(blank(),{cat:a.cat,type:catType(a.cat)}));
    const ao=r2(rows.filter(r=>r.Y<Y).reduce((s,r)=>s+r.dep,0));
    const fy=(rows.find(r=>r.Y===Y)||{dep:0}).dep;
    if(putY<Y){c.go+=cost;c.ao+=ao;}else c.add+=cost;
    c.fy+=fy;
    if(dispY===Y){c.del+=cost;c.od+=ao+fy;const nbv=r2(cost-ao-fy),proc=+a.proceeds||0;disposals.push({name:a.name,tag:a.tag,cat:a.cat,date:disp,cost,acc:r2(ao+fy),nbv,proc,gl:r2(proc-nbv)});}
  }
  const rows=Object.values(cats).map(c=>{for(const k of ["go","add","del","ao","fy","od"])c[k]=r2(c[k]);c.gc=r2(c.go+c.add-c.del);c.ac=r2(c.ao+c.fy-c.od);c.net=r2(c.gc-c.ac);c.prev=r2(c.go-c.ao);return c;});
  const list=allCats();const order=n=>{const i=list.findIndex(c=>c.n===n);return i<0?999:i;};
  rows.sort((a,b)=>order(a.cat)-order(b.cat));
  const sum=l=>{const s=blank();for(const r of l)for(const k in s)s[k]=r2(s[k]+r[k]);return s;};
  const res={rows,T:sum(rows.filter(r=>r.type==="T")),I:sum(rows.filter(r=>r.type==="I")),tot:sum(rows),disposals};
  fyMemo[Y]=res;return res;
}
function schedFor(Y){const d=yearData(Y);return d&&d.status==="final"&&d.snap&&d.snap.sched?d.snap.sched:fySched(Y);}

/* ---------- statements ---------- */
let memo={};
function statement(Y,force){
  const key=Y+(force?"f":"");
  if(memo[key]!==undefined)return memo[key];
  memo[key]=null;
  if(Y<FIRST_FY)return null;
  const d=yearData(Y,force);if(!d)return null;
  const fin=d.status==="final"&&d.snap;
  const fs=fin?null:fySched(Y);
  const p={};
  const depv=fin?+d.snap.dep||0:fs.tot.fy;
  for(const s of SECS.pl){let t=0;for(const k of secItems("pl",s)){const v=k==="dep"?depv:(+d.pl[k]||0);p[k]=v;t+=v;}p[s.id]=r2(t);}
  p.ti=r2(p.I+p.II);p.te=p.IV;p.pbe=r2(p.ti-p.te);p.pbt=r2(p.pbe-p.VI);p.pat=r2(p.pbt-p.VIII);
  let rsOpen,src="entered";
  if(fin){rsOpen=+d.snap.rsOpen||0;src="frozen";}
  else if(d.bs.rsOpen!=null&&d.bs.rsOpen!==""){rsOpen=+d.bs.rsOpen;}
  else{const pv=statement(Y-1,false);if(pv){rsOpen=pv.b.rs;src="carried";}else{rsOpen=0;src="none";}}
  const rsOther=+d.bs.rsOther||0;
  const b={};b.rs=r2(rsOpen+p.pat+rsOther);
  b.ppe=fin?+d.snap.ppe||0:fs.T.net;b.intg=fin?+d.snap.intg||0:fs.I.net;
  b.tel=0;b.ta=0;
  for(const s of SECS.bs){let t=0;for(const k of secItems("bs",s)){const v=(k in b&&AUTO_KEYS.includes(k))?b[k]:(+d.bs[k]||0);b[k]=v;t+=v;}b[s.id]=r2(t);if(s.grp==="L")b.tel+=t;else b.ta+=t;}
  b.tel=r2(b.tel);b.ta=r2(b.ta);
  const res={Y,d,p,b,fin:!!fin,rsOpen,rsSrc:src,rsOther,diff:r2(b.tel-b.ta)};
  memo[key]=res;return res;
}
function noteNo(d,k){
  const i=d.notes.findIndex(n=>n.link===k||(n.kind==="ppe"&&(k==="ppe"||k==="intg"||k==="dep")));
  return i<0?"":String(i+1);
}

/* ---------- persistence ---------- */
function setSave(s){if(DEAD)return;$("#saveState").textContent=s;}
function queue(fy,partial){
  if(!canWrite)return;
  pend[fy]=deepMerge(pend[fy]||{},partial);
  clearTimeout(timers[fy]);timers[fy]=setTimeout(()=>flush(fy),650);
  setSave(db?"Saving…":"Not saved");
  render();
}
let chain=Promise.resolve();
function flush(fy){
  clearTimeout(timers[fy]);
  if(!pend[fy]||!db)return chain;
  chain=chain.then(async()=>{
    const cur=pend[fy];if(!cur)return;
    delete pend[fy];
    const ref=db.doc("years/"+fy);
    const known=!!raw[fy];
    raw[fy]=deepMerge(clone(raw[fy]||defaultYear(+fy.slice(0,4))),cur);
    try{
      if(!known){const s=await ref.get();
        if(!s.exists)await ref.set(clone(raw[fy]));
        else await ref.update(cur);
      }else await ref.update(cur);
      setSave(Object.keys(pend).length?"Saving…":("Saved"));
    }catch(e){
      if(e&&e.code==="invalid_argument"){canWrite=false;toast("You can view these accounts but not change them.");render();}
      else{setSave("Not saved");toast("Couldn’t save. "+(e&&e.message?e.message:"Try again in a moment."));}
    }
  });
  return chain;
}
function flushAll(){for(const fy in pend)flush(fy);}
onG(window,"pagehide",flushAll);
onG(document,"visibilitychange",()=>{if(document.visibilityState==="hidden")flushAll();});

/* ---------- rendering ---------- */
function captureFocus(){const a=document.activeElement;if(!a||!a.id||!$("#main").contains(a)||a.type==="file")return null;
  let ss=null,se=null;try{ss=a.selectionStart;se=a.selectionEnd;}catch(e){}return {id:a.id,v:a.value,ss,se};}
function restoreFocus(c){if(!c)return;const el=byId(c.id);if(!el)return;
  if("value" in el&&el.tagName!=="SELECT")el.value=c.v;el.focus({preventScroll:true});try{if(c.ss!=null)el.setSelectionRange(c.ss,c.se);}catch(e){}}

let memoTick=0;
function render(){
  if(DEAD)return;
  memo={};fyMemo={};schedCache=new Map();memoTick++;
  renderHeader();
  const c=captureFocus();
  const V={pl:viewPL,bs:viewBS,dep:viewDep,assets:viewAssets,notes:viewNotes,scr:()=>viewParties("sc"),sdr:()=>viewParties("sd"),analysis:viewAnalysis,docs:viewDocs,settings:viewSettings}[tab]||viewPL;
  $("#main").innerHTML=(db===null&&dbReady?`<div class="banner warn">Couldn’t reach the TrustComply server, so changes you make here aren’t saved. Reload the page to try again.</div>`:"")+V();
  restoreFocus(c);
  renderExport();
  if(tab!==lastTab){lastTab=tab;if(HOST.onTab)HOST.onTab(tab);}
  if(flashNote){const el=byId("note-"+flashNote);if(el){el.scrollIntoView({block:"start"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1600);}flashNote=null;}
}
function renderHeader(){
  const fs=$("#fySel");
  if(!fs.options.length){for(let Y=CUR_FY;Y>=FIRST_FY;Y--){const o=document.createElement("option");o.value=Y;o.textContent=fyLabel(Y);fs.appendChild(o);}}
  fs.value=sel;$("#unitSel").value=String(unit);
  const d=yearData(sel);const fin=d&&d.status==="final";
  const st=$("#status");st.className="pill "+(fin?"final":"draft");
  st.textContent=fin?"Finalised "+fmtD(Date.parse(d.finalisedAt||"")):(d?"Draft":"Not started");
  const b=$("#finBtn");b.textContent=fin?"Reopen":"Finalise";b.className="btn "+(fin?"":"primary");
  b.hidden=!canWrite||!canAdmin;
  for(const t of ROOT.querySelectorAll("#tabs button"))t.setAttribute("aria-selected",t.dataset.tab===tab?"true":"false");
}
const numCell=(v,cls)=>`<td class="n ${cls||""} ${v<0?"neg":""}" data-v="${v==null?"":r2(v)}">${fmt(v)}</td>`;
function inCell(path,v,editable,small,extra){
  if(!editable)return numCell(v);
  const id="in-"+path.replace(/\./g,"-");
  return `<td class="n"><input class="num${small?" sm":""}" id="${id}" data-path="${path}" inputmode="decimal" autocomplete="off" value="${esc(fmtIn(v))}" aria-label="${esc(path)}" ${extra||""}></td>`;
}

function finalisePanel(st){
  if(!showFin)return "";
  const d=st.d,Y=sel;
  if(d.status==="final"){
    return `<div class="banner warn"><span>Reopen ${fyLabel(Y)}? Figures unlock for editing and depreciation is recalculated from the current asset register.</span>
    <span class="toolbar"><button class="btn danger" data-act="reopen">Reopen year</button><button class="btn" data-act="closefin">Cancel</button></span></div>`;
  }
  const checks=[
    {ok:Math.abs(st.diff)<1,t:"Balance sheet balances",d:Math.abs(st.diff)<1?"Assets equal equity and liabilities":"Difference of "+fmtRs(st.diff)},
    {ok:st.p.I>0,t:"Revenue entered",d:st.p.I>0?fmtRs(st.p.I):"Revenue from operations is blank"},
    {ok:assets.length>0,t:"Asset register in use",d:assets.length+" assets · depreciation "+fmtRs(st.p.dep),soft:true},
    {ok:!d.notes.some(n=>n.tpl),t:"Template notes reviewed",d:(d.notes.filter(n=>n.tpl).length||"No")+" notes still carry template text",soft:true}
  ];
  for(const k of ["sc","sd"]){const R=partyRecon(k,st);if(R)checks.push({ok:R.ok,soft:true,t:PK[k].ttl+" agree with the Balance Sheet",d:R.ok?R.S.n+" parties · "+fmtRs(R.S.tot):R.L.filter(l=>!l.ok).map(l=>l.lab+" differs by "+fmtRs(l.diff)).join(" · ")});}
  const blocked=checks.some(c=>!c.ok&&!c.soft);
  return `<div class="sheet"><h3>Finalise ${fyLabel(Y)}</h3>
   <p class="sub" style="margin:0 0 12px">Finalising locks the statements, notes and this year’s depreciation. Later changes to the asset register won’t alter finalised figures. Documents can still be uploaded.</p>
   <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">${checks.map(c=>`<div class="check"><b class="${c.ok?"chkok":"chkbad"}">${c.ok?"✓":c.soft?"!":"✕"}</b><span><strong>${c.t}</strong> <span class="sub">${esc(c.d)}</span></span></div>`).join("")}</div>
   <div class="toolbar"><button class="btn primary" data-act="finalise" ${blocked?"disabled":""}>Finalise ${fyLabel(Y)}</button><button class="btn" data-act="closefin">Cancel</button>
   ${blocked?`<span class="sub">Fix the items marked ✕ to finalise.</span>`:""}</div></div>`;
}
function statusBanner(st){
  const d=st.d;let h="";
  if(d.status==="final"){
    const who=d.finalisedByName?" by "+esc(d.finalisedByName):(d.finalisedBy&&names[d.finalisedBy]?" by "+esc(names[d.finalisedBy]):"");
    h+=`<div class="banner ok"><span><strong>${fyLabel(sel)} is finalised</strong>${who} on ${fmtD(Date.parse(d.finalisedAt||""))}. Figures are locked.</span></div>`;
  }else{
    const pf=yearData(sel-1);
    if(pf&&pf.status==="final"&&pf.snap&&pf.snap.sched){
      const cl=pf.snap.sched.tot.net, op=r2(fySched(sel).tot.go-fySched(sel).tot.ao);
      if(Math.abs(cl-op)>1)h+=`<div class="banner warn"><span>Opening net block for ${fyLabel(sel)} (${fmtRs(op)}) differs from the finalised closing of ${fyLabel(sel-1)} (${fmtRs(cl)}) by ${fmtRs(r2(op-cl))}. An asset dated in a finalised year was changed.</span></div>`;
    }
  }
  return h+finalisePanel(st);
}
function csvBtn(id,name){return (downloads||isLocal)?`<button class="btn small" data-csv="${id}" data-name="${esc(name)}">Download CSV</button>`:"";}
const addLineBtn=(t,s)=>canWrite?`<button class="btn small" data-addline="${t}" data-sec="${s}">Add line item</button><button class="btn small" data-manage="${t}">Manage lines</button>`:"";

/* statement rows, section by section */
function itemRow(t,k,labHtml,cls,st,pv,ed){
  const d=st.d, G=t==="pl"?"p":"b";
  const nn=noteNo(d,k);
  const auto=AUTO_KEYS.includes(k);
  const hint=lineHint(k);
  const lab=`${labHtml}${auto?`<span class="auto">${BASE[k].a}</span>`:""}${!auto&&!inPeriod(k,sel)?`<span class="chip" title="This line is set to ${esc(fmtPeriod(k))} but has amounts here">Outside period · ${esc(fmtPeriod(k))}</span>`:""}${hint?`<span class="hint">${esc(hint)}</span>`:""}`;
  let h=`<tr class="${cls}"><td class="part">${lab}</td><td class="note">${nn?`<button class="notelink" data-note="${nn}">${nn}</button>`:""}</td>${auto?numCell(st[G][k]):inCell(t+"."+k,d[t][k],ed)}${numCell(pv?pv[G][k]:null,"prev")}</tr>`;
  if(k==="rs")h+=rsRows(st,ed);
  return h;
}
function secRows(t,sec,st,pv,ed){
  /* a line shows in a year when it's in its period, or when it carries an amount (this year or the comparative) */
  const has=(s,k)=>!!(s&&s.d&&s.d[t]&&+s.d[t][k]);
  const items=secItems(t,sec).filter(k=>AUTO_KEYS.includes(k)||inPeriod(k,sel)||has(st,k)||(pv&&has(pv,k)));
  if(!items.length)return "";
  const G=t==="pl"?"p":"b";
  const roman=sec.n?`<span class="roman">${sec.n}</span>`:"";
  if(!sec.hdr&&items.length===1)return itemRow(t,items[0],roman+esc(sec.label),t==="pl"?"":"h",st,pv,ed);
  let h=`<tr class="h"><td class="part">${roman}${esc(sec.label)}</td><td></td>${sec.hdr?"<td></td><td></td>":numCell(st[G][sec.id])+numCell(pv?pv[G][sec.id]:null,"prev")}</tr>`;
  for(const k of items)h+=itemRow(t,k,esc(lineLabel(k)),"line",st,pv,ed);
  return h;
}
function sumRow(label,id,n,st,pv,G,final){return `<tr class="${final?"final":"sum"}"><td class="part">${n?`<span class="roman">${n}</span>`:""}${label}</td><td></td>${numCell(st[G][id])}${numCell(pv?pv[G][id]:null,"prev")}</tr>`;}
function rsRows(st,ed){
  const d=st.d;
  const srcTxt={carried:"carried from "+fyLabel(sel-1),entered:"entered",none:"enter opening balance",frozen:"at finalisation"}[st.rsSrc];
  return `<tr class="subrow"><td class="part">Opening balance <span class="hint" style="display:inline">· ${srcTxt}</span></td><td></td>${ed?inCell("bs.rsOpen",st.rsSrc==="entered"?d.bs.rsOpen:"",true,true,st.rsSrc==="entered"?"":`placeholder="${esc(fmtIn(st.rsOpen))}"`):numCell(st.rsOpen)}<td></td></tr>
      <tr class="subrow"><td class="part">Add: profit / (loss) for the year</td><td></td>${numCell(st.p.pat)}<td></td></tr>
      <tr class="subrow"><td class="part">Other movements <span class="hint" style="display:inline">· dividends, transfers</span></td><td></td>${inCell("bs.rsOther",d.bs.rsOther,ed,true)}<td></td></tr>`;
}
const S=(t,id)=>SECS[t].find(s=>s.id===id);
function viewPL(){
  const st=statement(sel,true),pv=statement(sel-1,false);
  const ed=canWrite&&!st.fin;
  let rows=`<tr class="h"><td class="part" colspan="4">Income</td></tr>`;
  rows+=secRows("pl",S("pl","I"),st,pv,ed)+secRows("pl",S("pl","II"),st,pv,ed);
  rows+=sumRow("Total income (I + II)","ti","III",st,pv,"p");
  rows+=secRows("pl",S("pl","IV"),st,pv,ed);
  rows+=sumRow("Total expenses (IV)","te","",st,pv,"p");
  rows+=sumRow("Profit before exceptional items and tax (III − IV)","pbe","V",st,pv,"p");
  rows+=secRows("pl",S("pl","VI"),st,pv,ed);
  rows+=sumRow("Profit before tax (V − VI)","pbt","VII",st,pv,"p");
  rows+=secRows("pl",S("pl","VIII"),st,pv,ed);
  rows+=sumRow("Profit / (loss) for the year (VII − VIII)","pat","IX",st,pv,"p",true);
  return statusBanner(st)+`<section class="sheet">
   <div class="sheet-head"><div><h2>Statement of Profit and Loss</h2><div class="sub">for the year ended ${endLabel(sel)} · amounts in ${unitName()}</div></div><div class="toolbar">${addLineBtn("pl","IV")}${dlBar("pl","Profit and Loss")}</div></div>
   <div class="scroll"><table class="stmt" id="t-pl"><thead><tr><th>Particulars</th><th style="text-align:center">Note</th><th class="n">Year ended<br>${endLabel(sel)}</th><th class="n">Year ended<br>${endLabel(sel-1)}</th></tr></thead><tbody>${rows}</tbody></table></div>
   ${pv?"":`<p class="sub" style="margin:10px 0 0">No figures recorded for ${fyLabel(sel-1)}, so the comparative column is blank.</p>`}
  </section>`;
}
function viewBS(){
  const st=statement(sel,true),pv=statement(sel-1,false);
  const ed=canWrite&&!st.fin;
  let rows=`<tr class="h1"><td class="part" colspan="4">I. Equity and liabilities</td></tr>`;
  for(const s of SECS.bs.filter(s=>s.grp==="L"))rows+=secRows("bs",s,st,pv,ed);
  rows+=sumRow("Total","tel","",st,pv,"b",true);
  rows+=`<tr class="h1"><td class="part" colspan="4">II. Assets</td></tr>`;
  for(const s of SECS.bs.filter(s=>s.grp==="A"))rows+=secRows("bs",s,st,pv,ed);
  rows+=sumRow("Total","ta","",st,pv,"b",true);
  const diff=st.diff;
  return statusBanner(st)+(Math.abs(diff)>=1?`<div class="banner bad"><span><strong>Out of balance by ${fmtRs(diff)}.</strong> Equity and liabilities ${diff>0?"exceed":"fall short of"} total assets.</span></div>`:"")+
  `<section class="sheet">
   <div class="sheet-head"><div><h2>Balance Sheet</h2><div class="sub">as at ${endLabel(sel)} · amounts in ${unitName()}</div></div><div class="toolbar">${addLineBtn("bs","CL")}${dlBar("bs","Balance Sheet")}</div></div>
   <div class="scroll"><table class="stmt" id="t-bs"><thead><tr><th>Particulars</th><th style="text-align:center">Note</th><th class="n">As at<br>${endLabel(sel)}</th><th class="n">As at<br>${endLabel(sel-1)}</th></tr></thead><tbody>${rows}</tbody></table></div>
  </section>`;
}

function faTable(s,Y,id){
  const row=(r,cls,label)=>`<tr class="${cls||""}"><td>${label}</td>${["go","add","del","gc"].map((k,i)=>numCell(r[k],i===0?"bl":"")).join("")}${["ao","fy","od","ac"].map((k,i)=>numCell(r[k],i===0?"bl":"")).join("")}${numCell(r.net,"bl")}${numCell(r.prev)}</tr>`;
  let body="";
  const T=s.rows.filter(r=>r.type==="T"),I=s.rows.filter(r=>r.type==="I");
  if(T.length){body+=`<tr><td class="grp" colspan="11">A. Tangible assets — property, plant and equipment</td></tr>`+T.map(r=>row(r,"",esc(r.cat))).join("")+row(s.T,"subt","Total tangible assets (A)");}
  if(I.length){body+=`<tr><td class="grp" colspan="11">B. Intangible assets</td></tr>`+I.map(r=>row(r,"",esc(r.cat))).join("")+row(s.I,"subt","Total intangible assets (B)");}
  if(!s.rows.length)body=`<tr><td colspan="11" class="sub" style="padding:18px 8px">No assets in use during ${fyLabel(Y)}. Add them in the Asset Register.</td></tr>`;
  else body+=row(s.tot,"tot","Total (A + B)");
  const a1="1 Apr "+Y,a2="31 Mar "+(Y+1),a0="31 Mar "+Y;
  return `<div class="scroll"><table class="fa" ${id?`id="${id}"`:""}><thead>
   <tr><th rowspan="2">Particulars</th><th colspan="4" class="bl">Gross block</th><th colspan="4" class="bl">Accumulated depreciation</th><th colspan="2" class="bl">Net block</th></tr>
   <tr><th class="n bl">As at ${a1}</th><th class="n">Additions</th><th class="n">Deletions</th><th class="n">As at ${a2}</th><th class="n bl">As at ${a1}</th><th class="n">For the year</th><th class="n">On deletions</th><th class="n">As at ${a2}</th><th class="n bl">As at ${a2}</th><th class="n">As at ${a0}</th></tr>
   </thead><tbody>${body}</tbody></table></div>`;
}
function viewDep(){
  const st=statement(sel,true);
  const seg=`<div class="seg" role="group" aria-label="Depreciation view"><button data-depview="fy" aria-pressed="${depView==="fy"}">Schedule for ${fyLabel(sel)}</button><button data-depview="my" aria-pressed="${depView==="my"}">Multi-year view</button></div>`;
  if(depView==="fy"){
    const s=schedFor(sel);
    const disp=(s.disposals||[]);
    return statusBanner(st)+`<div class="toolbar">${seg}${canWrite?`<button class="btn small" data-addline="dep" data-sec="T">Add asset category</button>`:""}</div><section class="sheet">
     <div class="sheet-head"><div><h2>Depreciation schedule</h2><div class="sub">Property, plant and equipment and intangible assets · ${fyLabel(sel)} · amounts in ${unitName()}${st.fin?" · frozen at finalisation":""}</div></div>${dlBar("dep","Depreciation schedule")}</div>
     ${faTable(s,sel,"t-fa")}
     ${disp.length?`<h3 style="margin-top:20px">Assets disposed during the year</h3><div class="scroll"><table class="reg"><thead><tr><th>Asset</th><th>Date</th><th class="n">Cost</th><th class="n">Acc. depreciation</th><th class="n">Book value</th><th class="n">Sale proceeds</th><th class="n">Profit / (loss)</th></tr></thead><tbody>${disp.map(x=>`<tr><td>${esc(x.name)}</td><td>${fmtD(x.date)}</td>${numCell(x.cost)}${numCell(x.acc)}${numCell(x.nbv)}${numCell(x.proc)}${numCell(x.gl)}</tr>`).join("")}</tbody></table></div><p class="sub">Book profit or loss on sale is not posted automatically. Include it in other income or other expenses.</p>`:""}
    </section>`;
  }
  const opts=`<option value="all">All assets</option>`+assets.map(a=>`<option value="${esc(a.id)}" ${myAsset===a.id?"selected":""}>${esc((a.tag?a.tag+" · ":"")+a.name)}</option>`).join("");
  const a=assets.find(x=>x.id===myAsset);
  let body;
  if(!assets.length)body=`<div class="empty">No assets yet. Add one in the Asset Register and its year-by-year schedule appears here.</div>`;
  else if(a)body=assetCard(a,true);
  else body=allAssetsGrid();
  return `<div class="toolbar">${seg}<div class="ctl"><label for="mySel">Asset</label><select id="mySel">${opts}</select></div>
   ${!a&&assets.length?`<div class="ctl"><label>Show</label><div class="seg"><button data-metric="dep" aria-pressed="${myMetric==="dep"}">Depreciation</button><button data-metric="bv" aria-pressed="${myMetric==="bv"}">Closing book value</button></div></div>`:""}</div>`+body;
}
function methodTxt(a){return (a.method==="WDV"?"Written-down value":"Straight line")+" "+(+a.rate||0)+"% p.a.";}
function assetGrid(a,id){
  const rows=schedule(a);
  if(!rows.length)return `<p class="sub">Enter cost, put-to-use date and rate to build the schedule.</p>`;
  const cols=rows.map((r,i)=>`<th class="${r.Y===sel?"cur":""}">${fyLabel(r.Y)}<span class="yr">Year ${i+1}</span></th>`).join("");
  const cell=(r,v)=>`<td class="n ${r.Y===sel?"cur":""}" data-v="${r2(v)}">${fmt(v)}</td>`;
  const pct=r=>`<td class="n ${r.Y===sel?"cur":""}">${r.pct.toFixed(2)}%${r.part?`<span class="pr">${r.disposed?"to sale":"pro-rata"} ${r.days}/${r.full} d</span>`:""}</td>`;
  return `<div class="scroll"><table class="grid" ${id?`id="${id}"`:""}><thead><tr><th>Particulars</th>${cols}</tr></thead><tbody>
   <tr><td>Opening book value</td>${rows.map(r=>cell(r,r.open)).join("")}</tr>
   <tr class="pct"><td>Depreciation %</td>${rows.map(pct).join("")}</tr>
   <tr><td>Depreciation</td>${rows.map(r=>cell(r,r.dep)).join("")}</tr>
   <tr><td>Accumulated depreciation</td>${rows.map(r=>cell(r,r.acc)).join("")}</tr>
   <tr class="bv"><td>Closing book value</td>${rows.map(r=>cell(r,r.close)).join("")}</tr>
  </tbody></table></div>`;
}
function assetCard(a,withCsv){
  const rows=schedule(a);
  return `<section class="sheet"><div class="sheet-head"><div><h2>${esc(a.name)}${a.example?`<span class="chip">Example</span>`:""}</h2><div class="sub">${esc(a.cat)} · amounts in ${unitName()}</div></div>${withCsv?dlBar("asset:"+a.id,a.name):""}</div>
   <div class="assetmeta"><span>Cost <b>${fmtRs(a.cost)}</b></span><span>Put to use <b>${fmtD(pd(a.put))}</b></span><span>Method <b>${methodTxt(a)}</b></span>${+a.resid?`<span>Residual <b>${+a.resid}%</b></span>`:""}<span>First year <b>${a.basis==="prorata"?"Pro-rata by days":"Full year"}</b></span><span>Schedule <b>${rows.length} year${rows.length===1?"":"s"}</b></span>${a.disp?`<span>Disposed <b>${fmtD(pd(a.disp))}</b></span>`:""}</div>
   ${assetGrid(a,"t-asset")}</section>`;
}
function allAssetsGrid(){
  const list=assets.filter(a=>schedule(a).length);
  if(!list.length)return `<div class="empty">None of the assets has enough detail to schedule yet.</div>`;
  let minY=Infinity,maxY=-Infinity;for(const a of list){const r=schedule(a);minY=Math.min(minY,r[0].Y);maxY=Math.max(maxY,r[r.length-1].Y);}
  maxY=Math.min(maxY,minY+24);
  const Ys=[];for(let Y=minY;Y<=maxY;Y++)Ys.push(Y);
  const tot=Ys.map(()=>0);
  const body=list.map(a=>{const r=schedule(a);return `<tr><td><button class="btn link" data-open-asset="${esc(a.id)}">${esc(a.name)}</button><span class="hint">${esc(a.tag||"")} ${methodTxt(a)}</span></td>${Ys.map((Y,i)=>{const x=r.find(q=>q.Y===Y);
    let v=null;if(myMetric==="dep")v=x?x.dep:null;else{if(x)v=x.close;else if(Y>r[r.length-1].Y&&!r[r.length-1].disposed)v=r[r.length-1].close;}
    if(v)tot[i]+=v;return `<td class="n ${Y===sel?"cur":""}" data-v="${v==null?"":r2(v)}">${v==null?"":fmt(v)}</td>`;}).join("")}</tr>`;}).join("");
  return `<section class="sheet"><div class="sheet-head"><div><h2>${myMetric==="dep"?"Depreciation by year":"Closing book value by year"}</h2><div class="sub">All assets · amounts in ${unitName()} · ${fyLabel(sel)} highlighted</div></div>${dlBar("my","Multi-year depreciation")}</div>
   <div class="scroll"><table class="grid" id="t-all"><thead><tr><th>Asset</th>${Ys.map(Y=>`<th class="${Y===sel?"cur":""}">${fyLabel(Y)}</th>`).join("")}</tr></thead><tbody>${body}
   <tr class="tot"><td>Total</td>${tot.map((v,i)=>`<td class="n ${Ys[i]===sel?"cur":""}" data-v="${r2(v)}">${fmt(v)}</td>`).join("")}</tr></tbody></table></div></section>`;
}

/* ---------- asset register ---------- */
function blankForm(){return {id:"",name:"",tag:"",cat:"Laboratory equipment",loc:"",put:"",cost:"",method:"SLM",rate:"20",life:"5",resid:"0",basis:"full",years:"10",disp:"",proceeds:""};}
function formAsset(f){return {id:f.id,name:f.name.trim(),tag:f.tag.trim(),cat:f.cat,loc:f.loc.trim(),put:f.put,cost:parseNum(f.cost)||0,method:f.method,rate:parseNum(f.rate)||0,resid:parseNum(f.resid)||0,basis:f.basis,years:parseNum(f.years)||10,disp:f.disp||"",proceeds:parseNum(f.proceeds)||0};}
function viewAssets(){
  const list=assets.slice().sort((a,b)=>(a.put||"").localeCompare(b.put||""));
  const hasEx=assets.some(a=>a.example);
  const top=`<div class="toolbar"><button class="btn primary" data-act="newasset" ${!canWrite?"disabled":""}>Add asset</button>
    ${hasEx&&canWrite?`<button class="btn" data-act="clearex">Remove example assets</button>`:""}
    <span class="sub">${assets.length} asset${assets.length===1?"":"s"} · depreciation for ${fyLabel(sel)} ${fmtRs(fySched(sel).tot.fy)}</span></div>`;
  const frm=form?formView():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No assets registered. Add your first asset with its cost, date put to use and depreciation rate; the year-by-year schedule builds as you type.</div>`;
  else tbl=`<section class="sheet"><div class="sheet-head"><div><h2>Asset register</h2><div class="sub">Values for ${fyLabel(sel)} · amounts in ${unitName()}</div></div>${dlBar("reg","Asset register")}</div>
   <div class="scroll"><table class="reg" id="t-reg"><thead><tr><th>Tag</th><th>Asset</th><th>Category</th><th>Location</th><th>Put to use</th><th class="n">Cost</th><th>Method</th><th class="n">Dep. ${fyId(sel)}</th><th class="n">Book value ${"31 Mar "+(sel+1)}</th><th></th></tr></thead><tbody>
   ${list.map(a=>{const r=schedule(a);const x=r.find(q=>q.Y===sel);const put=pd(a.put);
     let bv=null;if(put!=null&&fyOfT(put)<=sel){const last=r.filter(q=>q.Y<=sel).pop();bv=last?(last.disposed?0:last.close):+a.cost;}
     const act=delConfirm===a.id?`<span class="sub">Delete?</span><button class="btn small danger" data-del="${esc(a.id)}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
       `<button class="btn small" data-open-asset="${esc(a.id)}">Schedule</button>${canWrite?`<button class="btn small" data-edit="${esc(a.id)}">Edit</button><button class="btn small" data-askdel="${esc(a.id)}" aria-label="Delete ${esc(a.name)}">✕</button>`:""}`;
     return `<tr><td class="tag">${esc(a.tag||"–")}</td><td>${esc(a.name)}${a.example?`<span class="chip">Example</span>`:""}${a.disp?`<span class="chip gray">Disposed</span>`:""}</td><td>${esc(a.cat)}</td><td>${esc(a.loc||"–")}</td><td>${fmtD(put)}</td>${numCell(+a.cost)}<td>${a.method} ${+a.rate}%</td>${numCell(x?x.dep:null)}${numCell(bv)}<td><div class="rowact">${act}</div></td></tr>`;}).join("")}
   </tbody></table></div></section>`;
  return top+frm+tbl;
}
function formView(){
  const f=form,a=formAsset(f),rows=schedule(a);
  const cats=allCats();const cat=cats.find(c=>c.n===f.cat);
  const lockedYs=rows.filter(r=>isFinal(r.Y)).map(r=>fyLabel(r.Y));
  const slm=f.method==="SLM";
  return `<section class="sheet"><h3>${f.id?"Edit asset":"New asset"}</h3>
  <form class="af" id="assetForm" autocomplete="off">
   <div class="fld wide"><label for="f-name">Asset name</label><input type="text" id="f-name" data-f="name" value="${esc(f.name)}" placeholder="e.g. Fully automated chemistry analyser" required></div>
   <div class="fld"><label for="f-tag">Asset tag</label><input type="text" id="f-tag" data-f="tag" value="${esc(f.tag)}" placeholder="e.g. TDPL-LAB-0042"></div>
   <div class="fld"><label for="f-cat">Category</label><select id="f-cat" data-f="cat"><optgroup label="Tangible">${cats.filter(c=>c.t==="T").map(c=>`<option ${c.n===f.cat?"selected":""}>${esc(c.n)}</option>`).join("")}</optgroup><optgroup label="Intangible">${cats.filter(c=>c.t==="I").map(c=>`<option ${c.n===f.cat?"selected":""}>${esc(c.n)}</option>`).join("")}</optgroup></select><span class="hint">Useful life: ${esc(cat?cat.life:"")}</span></div>
   <div class="fld"><label for="f-loc">Location</label><input type="text" id="f-loc" data-f="loc" list="locs" value="${esc(f.loc)}" placeholder="Branch"><datalist id="locs">${allLocs().map(l=>`<option value="${esc(l)}">`).join("")}</datalist></div>
   <div class="fld"><label for="f-put">Date put to use</label><input type="date" id="f-put" data-f="put" value="${esc(f.put)}" required></div>
   <div class="fld"><label for="f-cost">Cost (₹)</label><input type="text" id="f-cost" data-f="cost" inputmode="decimal" value="${esc(f.cost)}" placeholder="Including freight, duties, installation" required></div>
   <div class="fld"><label for="f-method">Method</label><select id="f-method" data-f="method"><option value="SLM" ${slm?"selected":""}>Straight line (SLM)</option><option value="WDV" ${!slm?"selected":""}>Written-down value (WDV)</option></select></div>
   <div class="fld"><label for="f-rate">Depreciation rate (% p.a.)</label><input type="text" id="f-rate" data-f="rate" inputmode="decimal" value="${esc(f.rate)}" required></div>
   ${slm?`<div class="fld"><label for="f-life">Useful life (years)</label><input type="text" id="f-life" data-f="life" inputmode="decimal" value="${esc(f.life)}"><span class="hint">Linked to the rate: 20% ⇄ 5 years</span></div>`
        :`<div class="fld"><label for="f-years">Years to schedule</label><input type="text" id="f-years" data-f="years" inputmode="numeric" value="${esc(f.years)}"><span class="hint">WDV never reaches zero, so set the horizon</span></div>`}
   <div class="fld"><label for="f-resid">Residual value (% of cost)</label><input type="text" id="f-resid" data-f="resid" inputmode="decimal" value="${esc(f.resid)}"><span class="hint">Schedule II allows up to 5%</span></div>
   <div class="fld"><label for="f-basis">First-year depreciation</label><select id="f-basis" data-f="basis"><option value="full" ${f.basis==="full"?"selected":""}>Full year</option><option value="prorata" ${f.basis==="prorata"?"selected":""}>Pro-rata by days in use</option></select></div>
   <div class="fld"><label for="f-disp">Disposal date</label><input type="date" id="f-disp" data-f="disp" value="${esc(f.disp)}"><span class="hint">Leave blank while in use</span></div>
   ${f.disp?`<div class="fld"><label for="f-proceeds">Sale proceeds (₹)</label><input type="text" id="f-proceeds" data-f="proceeds" inputmode="decimal" value="${esc(f.proceeds)}"></div>`:""}
  </form>
  <div class="preview" id="preview">${previewInner()}</div>
  ${lockedYs.length?`<div class="banner warn" style="margin-top:12px"><span>${lockedYs.join(", ")} ${lockedYs.length>1?"are":"is"} finalised. Their figures stay frozen; changes here flow into open years only.</span></div>`:""}
  <div class="formfoot"><button class="btn primary" data-act="saveasset">${f.id?"Save changes":"Add to register"}</button><button class="btn" data-act="cancelasset">Cancel</button><span class="sub" id="formErr"></span></div>
  </section>`;
}
function previewInner(){
  const a=formAsset(form);const rows=schedule(a);
  const head=rows.length?`${rows.length} year${rows.length===1?"":"s"} · ${methodTxt(a)}${a.basis==="prorata"&&rows[0]&&rows[0].part?" · first year pro-rata, balance in year "+rows.length:""}`:"";
  return `<h3>Schedule preview ${head?`<span class="sub" style="font-family:var(--f-body);font-weight:400;font-size:13px">· ${head}</span>`:""}</h3>${assetGrid(a,"")}`;
}
async function saveAsset(){
  const a=formAsset(form);const err=$("#formErr");
  if(!a.name)return err.textContent="Enter the asset name.";
  if(pd(a.put)==null)return err.textContent="Enter the date the asset was put to use.";
  if(!(a.cost>0))return err.textContent="Enter the cost in rupees.";
  if(!(a.rate>0&&a.rate<=100))return err.textContent="Enter a rate between 0 and 100%.";
  if(a.disp&&pd(a.disp)<pd(a.put))return err.textContent="Disposal date is before the put-to-use date.";
  const prev=assets.find(x=>x.id===a.id);
  if(!a.id)a.id=rid("a");
  a.updatedAt=new Date().toISOString();if(prev&&prev.example)a.example=true;
  const i=assets.findIndex(x=>x.id===a.id);if(i>=0)assets[i]=a;else assets.push(a);
  form=null;render();
  if(db){try{await db.doc("assets/"+a.id).set(a);toast(prev?"Asset updated":"Asset added");}catch(e){toast("Couldn’t save the asset. "+(e.message||""));}}
}
async function deleteAsset(id){
  assets=assets.filter(a=>a.id!==id);delConfirm=null;if(myAsset===id)myAsset="all";render();
  if(db){try{await db.doc("assets/"+id).delete();toast("Asset deleted");}catch(e){toast("Couldn’t delete. "+(e.message||""));}}
}

/* ---------- notes ---------- */
function breakupTable(n,st,ed){
  const rows=n.rows||[];
  if(!rows.length)return "";
  const pvd=yearData(sel-1);const pn=pvd?pvd.notes.find(x=>x.id===n.id):null;
  const pvRow=r=>{if(!pn||!pn.rows)return null;const m=pn.rows.find(x=>x.id===r.id)||pn.rows.find(x=>x.label===r.label);return m&&m.v!=null?+m.v:null;};
  const lt=lineTab(n.link);
  const head=lt==="bs"?["As at "+endLabel(sel),"As at "+endLabel(sel-1)]:["Year ended "+endLabel(sel),"Year ended "+endLabel(sel-1)];
  let tot=0,ptot=0,anyPrev=false;
  const body=rows.map(r=>{const v=+r.v||0;tot+=v;const p=pvRow(r);if(p!=null){ptot+=p;anyPrev=true;}
    const conf=delConfirm==="row:"+r.id;
    return `<tr><td>${ed?`<input type="text" class="rl" id="rl-${r.id}" data-note-id="${n.id}" data-nf="rowlabel" data-row="${r.id}" value="${esc(r.label)}" aria-label="Row name">`:esc(r.label)}</td>
     ${ed?`<td class="n"><input class="num" id="rv-${r.id}" data-note-id="${n.id}" data-nf="rowval" data-row="${r.id}" inputmode="decimal" autocomplete="off" value="${esc(fmtIn(r.v))}" aria-label="Amount for ${esc(r.label)}"></td>`:numCell(v)}
     ${numCell(p,"prev")}
     ${ed?`<td class="n" style="width:1%">${conf?`<span class="rowact"><button class="btn small danger" data-delrow="${r.id}" data-note-id="${n.id}">Remove</button><button class="btn small" data-act="canceldel">Keep</button></span>`:`<button class="btn small" data-askdelrow="${r.id}" aria-label="Remove row">✕</button>`}</td>`:""}</tr>`;}).join("");
  tot=r2(tot);
  let agree="";
  if(lt){const sv=lt==="pl"?st.p[n.link]:st.b[n.link];if(sv!=null){const df=r2(tot-sv);
    agree=Math.abs(df)<1?`<div class="agree chkok">✓ Agrees with ${esc(lineLabel(n.link))} in the ${lt==="pl"?"Statement of Profit and Loss":"Balance Sheet"} (${fmtRs(sv)})</div>`
      :`<div class="agree chkbad">Breakup total differs from ${esc(lineLabel(n.link))} (${fmtRs(sv)}) by ${fmtRs(df)}</div>`;}}
  return `<div class="scroll"><table class="brk"><thead><tr><th>Particulars · ${unitName()}</th><th class="n">${head[0]}</th><th class="n">${head[1]}</th>${ed?"<th></th>":""}</tr></thead><tbody>${body}
   <tr class="tot"><td>Total</td>${numCell(tot)}${numCell(anyPrev?r2(ptot):null,"prev")}${ed?"<td></td>":""}</tr></tbody></table></div>${agree}`;
}
function viewNotes(){
  const st=statement(sel,true);const d=st.d;const ed=canWrite&&!st.fin;
  const notes=d.notes;const opts=lineOpts();
  const lineSel=n=>`<select id="nl-${n.id}" data-note-id="${n.id}" data-nf="link" aria-label="Linked line"><option value="">Not linked to a line</option>${opts.map(o=>`<option value="${esc(o.k)}" ${n.link===o.k?"selected":""}>${esc(o.label)}</option>`).join("")}</select>`;
  const cards=notes.map((n,i)=>{
    const no=i+1;
    const ppe=(n.kind==="ppe"?`<div style="margin-top:14px">${faTable(schedFor(sel),sel,"")}</div>`:"")+(n.kind==="ratios"?ratioNoteHtml():"");
    const brk=breakupTable(n,st,ed);
    if(!ed)return `<article class="note" id="note-${no}"><div class="note-head"><span class="note-no">Note ${no}</span><h4>${esc(n.title)}</h4></div>${n.body?`<div class="body">${esc(n.body)}</div>`:(brk||ppe?"":`<div class="sub">No details entered.</div>`)}${brk}${ppe}</article>`;
    const conf=delConfirm==="note:"+n.id;
    return `<article class="note" id="note-${no}"><div class="note-head"><span class="note-no">Note ${no}</span>
      <input type="text" id="nt-${n.id}" data-note-id="${n.id}" data-nf="title" value="${esc(n.title)}" aria-label="Note title">
      ${n.kind==="ppe"?`<span class="sub">Linked to PPE, intangibles and depreciation</span>`:n.kind==="ratios"?`<span class="sub">Generated from the Analysis tab · reasons are entered there</span>`:lineSel(n)}
      ${n.tpl?`<span class="chip">Template text · review</span>`:""}
      <span class="rowact" style="margin-left:auto">${n.kind?"":`<button class="btn small" data-addrow="${n.id}">Add row</button>`}<button class="btn small" data-move="${n.id}" data-dir="-1" ${i===0?"disabled":""} aria-label="Move up">↑</button><button class="btn small" data-move="${n.id}" data-dir="1" ${i===notes.length-1?"disabled":""} aria-label="Move down">↓</button>
      ${n.kind==="ppe"?"":conf?`<button class="btn small danger" data-delnote="${n.id}">Delete note</button><button class="btn small" data-act="canceldel">Keep</button>`:`<button class="btn small" data-askdelnote="${n.id}" aria-label="Delete note">✕</button>`}</span></div>
      <textarea id="nb-${n.id}" data-note-id="${n.id}" data-nf="body" placeholder="${n.kind==="ppe"?"Add any commentary; the schedule below is generated from the asset register.":"Enter the disclosure for this note, or add breakup rows."}">${esc(n.body)}</textarea>${brk}${ppe}</article>`;
  }).join("");
  return statusBanner(st)+`<div class="toolbar"><h2 style="margin:0;font-family:var(--f-display);font-size:20px;font-weight:600">Notes to the financial statements</h2><span class="sub">${fyLabel(sel)} · numbered in order; statement note references update automatically</span><span style="margin-left:auto">${dlBar("notes","Notes")}</span>
   ${ed?`<button class="btn" data-act="addnote">Add note</button>`:""}</div><div class="notes">${cards}</div>`;
}
function editNotes(fn){const d=yearData(sel,true);const notes=clone(d.notes);fn(notes);queue(fyId(sel),{notes});}

/* ================= sundry creditors & sundry debtors (party-wise closing balances as at 31 March) ================= */
const PK={
 sc:{tab:"scr",title:"Sundry creditors",ttl:"Sundry Creditors",who:"creditor",bs:"Trade payables",
   buckets:["Not due","Less than 1 year","1–2 years","2–3 years","More than 3 years"],short:["Not due","< 1 yr","1–2 yrs","2–3 yrs","> 3 yrs"]},
 sd:{tab:"sdr",title:"Sundry debtors",ttl:"Sundry Debtors",who:"debtor",bs:"Trade receivables",
   buckets:["Not due","Less than 6 months","6 months – 1 year","1–2 years","2–3 years","More than 3 years"],short:["Not due","< 6 m","6 m–1 yr","1–2 yrs","2–3 yrs","> 3 yrs"]}
};
const MSME_OPTS=[["unk","Not confirmed"],["micro","Micro"],["small","Small"],["medium","Medium"],["no","Not MSME"]];
const msmeName=v=>(MSME_OPTS.find(o=>o[0]===v)||MSME_OPTS[0])[1];
const isMSE=r=>r.msme==="micro"||r.msme==="small";
const CR_NAT=["Reagents & consumables","Capital goods","Services","Rent","Professional / consultancy","Utilities","Other"];
const ADV_T={sc:[["rev","Revenue supplies"],["cap","Capital goods"]],sd:[["le","Within 365 days"],["gt","Over 365 days"]]};
const advTName=(k,v)=>(ADV_T[k].find(o=>o[0]===v)||ADV_T[k][0])[1];
const ADV_GUIDE={
 sc:{t:"How advances paid to suppliers are treated",l:[
  "An advance is not a trade payable. Enter it in the Advance column, never as a negative amount in the ageing columns, so it does not reduce the trade payables or the MSME dues.",
  "Show it gross, even when the same supplier also has unpaid bills. Schedule III does not allow assets and liabilities to be netted unless there is a legal right of set-off.",
  "Advances for reagents, consumables, services or rent go to Short-term loans and advances, as “Advances to suppliers”. If not expected to be adjusted within 12 months, they move to Long-term loans and advances.",
  "Advances for equipment, fit-outs and other capital goods are “Capital advances”. Schedule III requires them under Long-term loans and advances, not capital work-in-progress.",
  "Classify each advance as secured or unsecured, and considered good or doubtful. An advance with no supply against it for over a year should be reviewed and provided for if doubtful.",
  "Tax: TDS applies at the time of crediting or paying, whichever is earlier, so it is due on an advance payment. GST input tax credit is available only once the invoice is received. Confirm the position with your CA."]},
 sd:{t:"How advances received from customers are treated",l:[
  "An advance is not a trade receivable. Enter it in the Advance column, never as a negative amount in the ageing columns, so it does not reduce trade receivables.",
  "Show it gross, even when the same customer also owes you on earlier bills. Schedule III does not allow netting without a legal right of set-off.",
  "Advances received go to Other current liabilities, as “Advances from customers”. Typical examples are prepaid corporate health check-up packages and hospital tie-up deposits.",
  "Revenue is recognised when the test report is released. Until then the advance stays a liability, and it is adjusted as tests are performed.",
  "Companies Act: an advance for the supply of services is not a deposit only if it is appropriated against the service within 365 days (Companies (Acceptance of Deposits) Rules, 2014, Rule 2(1)(c)(xii)(a)). Mark older advances “Over 365 days” and refund or adjust them.",
  "Tax: most diagnostic services are GST-exempt health care services. Where a taxable service is billed, GST is payable on the advance when it is received. Confirm the position with your CA."]}
};
const DR_CAT=["Corporate (AHC / wellness)","Hospitals, clinics & labs (B2B)","Insurance / TPA","Government / PSU","Franchise & collection partners","Individuals","Other"];
let pq={sc:"",sd:""}, psort={sc:"entry",sd:"entry"}, pImp=null;

const normName=s=>String(s||"").toLowerCase().replace(/&/g," and ").replace(/\b(m\/s|messrs)\b\.?/g,"").replace(/[^a-z0-9]+/g," ").trim();
const partyRows=(Y,k)=>{const d=yearData(Y);return d&&Array.isArray(d[k])?d[k]:[];};
const pTot=r=>r2((r.a||[]).reduce((s,v)=>s+(+v||0),0));
function pMatchKey(r){const g=String(r.gstin||"").trim().toUpperCase();return g?"g:"+g:"n:"+normName(r.name);}
function prevMap(k){const m={};for(const r of partyRows(sel-1,k)){const t=pTot(r),g=String(r.gstin||"").trim().toUpperCase(),n=normName(r.name);
  if(g)m["g:"+g]=r2((m["g:"+g]||0)+t);if(n)m["n:"+n]=r2((m["n:"+n]||0)+t);}return m;}
function prevOf(m,r){const g=String(r.gstin||"").trim().toUpperCase();if(g&&m["g:"+g]!=null)return m["g:"+g];const n=normName(r.name);return n&&m["n:"+n]!=null?m["n:"+n]:null;}
const rsx=v=>{if(v==null||isNaN(v)||Math.abs(v)<0.005)return "–";const s=Math.abs(v).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});return v<0?"("+s+")":s;};
const rsIn=v=>v==null||v===""?"":(+v).toLocaleString("en-IN",{maximumFractionDigits:2});

/* Schedule III ageing groups */
const AGE_GROUPS={
 sc:[["mse","(i) MSME"],["oth","(ii) Others"],["dmse","(iii) Disputed dues — MSME"],["doth","(iv) Disputed dues — Others"]],
 sd:[["good","(i) Undisputed trade receivables — considered good"],["doubt","(ii) Undisputed trade receivables — considered doubtful"],["dgood","(iii) Disputed trade receivables — considered good"],["ddoubt","(iv) Disputed trade receivables — considered doubtful"]]
};
function partySum(k,Y){
  const rows=partyRows(Y,k),nb=PK[k].buckets.length,g={};
  for(const [gk] of AGE_GROUPS[k])g[gk]=Array(nb).fill(0);
  let tot=0,unk=0,neg=0,blank=0,advA=0,advB=0,nAdv=0;
  for(const r of rows){
    const av=+r.adv||0;if(av){nAdv++;if(r.advT===(k==="sc"?"cap":"gt"))advB=r2(advB+av);else advA=r2(advA+av);}
    const gk=k==="sc"?(r.disp?"d":"")+(isMSE(r)?"mse":"oth"):(r.disp?"d":"")+(r.doubt?"doubt":"good");
    for(let i=0;i<nb;i++)g[gk][i]=r2(g[gk][i]+(+(r.a||[])[i]||0));
    const t=pTot(r);tot=r2(tot+t);if(t<0)neg++;if(!t)blank++;
    if(k==="sc"&&(!r.msme||r.msme==="unk"))unk++;
  }
  const gt=gk=>r2(g[gk].reduce((s,v)=>s+v,0));
  const out={rows,g,gt,tot,unk,neg,blank,n:rows.length,advA,advB,adv:r2(advA+advB),nAdv};
  if(k==="sc"){out.mse=r2(gt("mse")+gt("dmse"));out.oth=r2(gt("oth")+gt("doth"));}
  else{out.doubt=r2(gt("doubt")+gt("ddoubt"));const d=yearData(Y);out.prov=d&&d.sdProv!=null?+d.sdProv||0:0;out.net=r2(tot-out.prov);}
  return out;
}
/* what the register says the Balance Sheet should carry, line by line */
function partyRecon(k,st){
  const S=partySum(k,sel);if(!S.n)return null;
  const L=k==="sc"?[{key:"tpm",lab:lineLabel("tpm"),reg:S.mse,src:"Micro and small enterprises in the register"},{key:"tpo",lab:lineLabel("tpo"),reg:S.oth,src:"Medium, non-MSME and not-confirmed parties"}]
                  :[{key:"tr",lab:lineLabel("tr"),reg:S.net,src:"Register total less provision for doubtful debts"}];
  for(const l of L){l.bs=+st.b[l.key]||0;l.diff=r2(l.reg-l.bs);l.ok=Math.abs(l.diff)<1;}
  const A=(k==="sc"?[{key:"stla",amt:S.advA,what:"Advances to suppliers for revenue supplies"},{key:"ltla",amt:S.advB,what:"Capital advances for equipment and other capital goods"}]
                   :[{key:"ocl",amt:S.adv,what:"Advances received from customers",extra:S.advB?"of which "+fmtRs(S.advB)+" is over 365 days old":""}]).filter(a=>a.amt);
  for(const a of A){a.lab=lineLabel(a.key);a.bs=+st.b[a.key]||0;a.ok=a.bs+1>=a.amt;}
  return {S,L,A,ok:L.every(l=>l.ok)&&A.every(a=>a.ok)};
}
function editParties(k,fn,quiet){
  const d=yearData(sel,true);const a=clone(Array.isArray(d[k])?d[k]:[]);fn(a);
  if(quiet){if(!canWrite)return;const fy=fyId(sel);pend[fy]=deepMerge(pend[fy]||{},{[k]:a});clearTimeout(timers[fy]);timers[fy]=setTimeout(()=>flush(fy),650);setSave(db?"Saving…":"Not saved");}
  else queue(fyId(sel),{[k]:a});
}
const blankParty=k=>k==="sc"?{id:rid("p"),name:"",gstin:"",msme:"unk",nat:"",a:[],disp:false}:{id:rid("p"),name:"",gstin:"",cat:"",loc:"",a:[],doubt:false,disp:false};

function selOpts(list,v,none){const l=list.slice();if(v&&!l.includes(v))l.push(v);return `<option value="" ${v?"":"selected"}>${none}</option>`+l.map(x=>`<option ${x===v?"selected":""}>${esc(x)}</option>`).join("");}

function viewParties(k){
  const P=PK[k],st=statement(sel,true),d=st.d,ed=canWrite&&!st.fin,nb=P.buckets.length;
  const all=partyRows(sel,k),pm=prevMap(k),S=partySum(k,sel),R=partyRecon(k,st);
  const prevRows=partyRows(sel-1,k);
  const q=normName(pq[k]);
  let list=all.filter(r=>!q||normName(r.name).includes(q)||String(r.gstin||"").toLowerCase().includes(pq[k].trim().toLowerCase()));
  if(psort[k]==="name")list=list.slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  if(psort[k]==="amt")list=list.slice().sort((a,b)=>pTot(b)-pTot(a));
  const prevYrEnd="31 Mar "+sel;

  /* reconciliation with the Balance Sheet */
  let recon="";
  if(R){
    const rows=R.L.map(l=>`<div class="check"><b class="${l.ok?"chkok":"chkbad"}">${l.ok?"✓":"✕"}</b><span><strong>${esc(l.lab)}</strong> <span class="sub">Register ${fmtRs(l.reg)} · Balance Sheet ${fmtRs(l.bs)}${l.ok?" · agrees":" · difference "+fmtRs(l.diff)}</span><span class="hint">${esc(l.src)}</span></span></div>`).join("");
    const warn=[];
    if(k==="sc"&&S.unk)warn.push(`${S.unk} ${S.unk===1?"party has":"parties have"} MSME status “Not confirmed”. Schedule III shows dues to micro and small enterprises separately, so confirm Udyam registration before finalising.`);
    if(k==="sd"&&S.advB)warn.push(`${fmtRs(S.advB)} of customer advances is over 365 days old. Unless appropriated against services, it can be treated as a deposit under the Companies Act. Adjust or refund it.`);
    recon=`<section class="sheet"><div class="sheet-head"><div><h2 style="font-size:18px">Agreement with the Balance Sheet</h2><div class="sub">${S.n} ${P.who}${S.n===1?"":"s"} · ${k==="sc"?"dues":"receivables"} ${fmtRs(S.tot)}${S.adv?" · advances "+fmtRs(S.adv)+" ("+S.nAdv+")":""}</div></div>
      ${ed&&!R.ok?`<button class="btn primary" data-pact="post" data-pk="${k}">Use register totals for ${k==="sc"?"trade payables":"trade receivables"}</button>`:""}</div>
      <div style="display:flex;flex-direction:column;gap:8px">${rows}</div>
      ${R.A.length?`<h3 style="margin:16px 0 8px;font-size:15px">Advances · shown separately, not netted</h3><div style="display:flex;flex-direction:column;gap:8px">${R.A.map(a=>`<div class="check"><b class="${a.ok?"chkok":"chkbad"}">${a.ok?"✓":"✕"}</b><span><strong>${esc(a.what)} ${fmtRs(a.amt)}</strong>${a.extra?`<span class="sub"> (${esc(a.extra)})</span>`:""} <span class="sub">belong in ${esc(a.lab)} · Balance Sheet ${fmtRs(a.bs)}${a.ok?" · covers them":" · less than the advances, so they are not yet included"}</span><span class="hint">That line can hold other items too, so it should be at least this amount. Show the advances as a breakup row in its note.</span></span></div>`).join("")}</div>`:""}
      ${S.neg?`<div class="banner bad" style="margin-top:12px"><span>${S.neg} ${S.neg===1?"party has":"parties have"} a ${k==="sc"?"debit":"credit"} balance entered in the ageing columns. That is an advance ${k==="sc"?"paid to the supplier":"received from the customer"}, and it is understating ${k==="sc"?"trade payables":"trade receivables"}.</span>${ed?`<button class="btn small" data-pact="mvadv" data-pk="${k}">Move to the Advance column</button>`:""}</div>`:""}
      ${k==="sd"?`<div class="toolbar" style="margin-top:12px"><label class="sub" for="sd-prov">Less: provision for doubtful debts (₹)</label>${ed?`<input class="num" id="sd-prov" data-pprov="1" inputmode="decimal" autocomplete="off" value="${esc(rsIn(d.sdProv))}">`:`<b>${rsx(S.prov)}</b>`}<span class="sub">Balances marked doubtful total ${fmtRs(S.doubt)}</span></div>`:""}
      ${warn.length?`<div class="banner warn" style="margin-top:12px;flex-direction:column;align-items:flex-start">${warn.map(w=>`<span>${esc(w)}</span>`).join("")}</div>`:""}</section>`;
  }

  /* Schedule III ageing */
  let ageing="";
  if(S.n){
    const gtot=Array(nb).fill(0);
    const body=AGE_GROUPS[k].map(([gk,lab])=>{S.g[gk].forEach((v,i)=>gtot[i]=r2(gtot[i]+v));return `<tr><td>${esc(lab)}</td>${S.g[gk].map(v=>`<td class="n">${rsx(v)}</td>`).join("")}<td class="n"><b>${rsx(S.gt(gk))}</b></td></tr>`;}).join("");
    ageing=`<section class="sheet"><div class="sheet-head"><div><h2 style="font-size:18px">Ageing schedule</h2><div class="sub">Schedule III format · outstanding for the following periods from the due date of payment · amounts in ₹</div></div></div>
      <div class="scroll"><table class="brk" style="min-width:${k==="sc"?720:820}px"><thead><tr><th>Particulars</th>${P.buckets.map(b=>`<th class="n">${esc(b)}</th>`).join("")}<th class="n">Total</th></tr></thead>
      <tbody>${body}<tr class="tot"><td>Total</td>${gtot.map(v=>`<td class="n">${rsx(v)}</td>`).join("")}<td class="n">${rsx(S.tot)}</td></tr></tbody></table></div></section>`;
  }

  /* register */
  const conf=id=>delConfirm==="party:"+id;
  const cell=(r,f,inner)=>`<td>${inner}</td>`;
  const txt=(r,f,ph,w)=>ed?`<input type="text" class="pin" style="width:${w}px" id="p-${r.id}-${f}" data-pk="${k}" data-pid="${r.id}" data-pf="${f}" value="${esc(r[f]||"")}" placeholder="${ph}" aria-label="${ph}">`:esc(r[f]||"–");
  const sel_=(r,f,list,none)=>ed?`<select id="p-${r.id}-${f}" data-pk="${k}" data-pid="${r.id}" data-pf="${f}" aria-label="${none}">${selOpts(list,r[f],none)}</select>`:esc(r[f]||"–");
  const chk=(r,f,lab)=>ed?`<input type="checkbox" id="p-${r.id}-${f}" data-pk="${k}" data-pid="${r.id}" data-pf="${f}" ${r[f]?"checked":""} aria-label="${lab}">`:(r[f]?"Yes":"");
  const tot=Array(nb).fill(0);let ptot=0,anyP=false,advTot=0;
  const body=list.map((r,i)=>{
    const a=r.a||[];a.forEach((v,j)=>{if(j<nb)tot[j]=r2(tot[j]+(+v||0));});
    const p=prevOf(pm,r);if(p!=null){ptot=r2(ptot+p);anyP=true;}
    const t=pTot(r);
    const amt=P.buckets.map((b,j)=>ed?`<td class="n"><input class="num sm" id="p-${r.id}-a${j}" data-pk="${k}" data-pid="${r.id}" data-pf="a${j}" inputmode="decimal" autocomplete="off" value="${esc(rsIn(a[j]))}" aria-label="${esc(b)} for ${esc(r.name||"party")}"></td>`:`<td class="n">${rsx(+a[j]||0)}</td>`).join("");
    const mid=k==="sc"
      ?`<td>${ed?`<select id="p-${r.id}-msme" data-pk="${k}" data-pid="${r.id}" data-pf="msme" aria-label="MSME status">${MSME_OPTS.map(o=>`<option value="${o[0]}" ${(r.msme||"unk")===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>`:esc(msmeName(r.msme))}</td><td>${sel_(r,"nat",CR_NAT,"Nature")}</td>`
      :`<td>${sel_(r,"cat",DR_CAT,"Category")}</td><td>${sel_(r,"loc",allLocs(),"Branch")}</td>`;
    const flags=k==="sc"?`<td style="text-align:center">${chk(r,"disp","Disputed")}</td>`:`<td style="text-align:center">${chk(r,"doubt","Doubtful")}</td><td style="text-align:center">${chk(r,"disp","Disputed")}</td>`;
    const advCells=ed?`<td class="n"><input class="num sm" id="p-${r.id}-adv" data-pk="${k}" data-pid="${r.id}" data-pf="adv" inputmode="decimal" autocomplete="off" value="${esc(rsIn(r.adv))}" aria-label="Advance for ${esc(r.name||"party")}"></td><td><select id="p-${r.id}-advT" data-pk="${k}" data-pid="${r.id}" data-pf="advT" aria-label="Advance type">${ADV_T[k].map(o=>`<option value="${o[0]}" ${(r.advT||ADV_T[k][0][0])===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></td>`
      :`<td class="n">${rsx(+r.adv||0)}</td><td>${+r.adv?esc(advTName(k,r.advT)):""}</td>`;
    advTot=r2(advTot+(+r.adv||0));
    const del=ed?`<td class="n" style="width:1%">${conf(r.id)?`<span class="rowact"><button class="btn small danger" data-pact="del" data-pk="${k}" data-pid="${r.id}">Remove</button><button class="btn small" data-act="canceldel">Keep</button></span>`:`<button class="btn small" data-pact="askdel" data-pid="${r.id}" aria-label="Remove ${esc(r.name||"party")}">✕</button>`}</td>`:"";
    return `<tr><td class="sub">${i+1}</td><td>${txt(r,"name","Party name",220)}</td><td>${txt(r,"gstin","GSTIN",150)}</td>${mid}${amt}<td class="n"><b id="pt-${r.id}" class="${t<0?"neg":""}">${rsx(t)}</b></td><td class="n prev">${rsx(p)}</td>${advCells}${flags}${del}</tr>`;
  }).join("");
  const ncol=4+2+nb+2+(k==="sc"?1:2)+(ed?1:0);
  const head=`<tr><th>#</th><th>Party</th><th>GSTIN</th>${k==="sc"?"<th>MSME status</th><th>Nature</th>":"<th>Category</th><th>Branch</th>"}${P.short.map((b,j)=>`<th class="n" title="${esc(P.buckets[j])}">${esc(b)}</th>`).join("")}<th class="n">Total ${k==="sc"?"dues":"due"}</th><th class="n">As at<br>${prevYrEnd}</th><th class="n adv-h">${k==="sc"?"Advance paid":"Advance received"}</th><th class="adv-h">${k==="sc"?"Advance for":"Advance age"}</th>${k==="sc"?"<th>Disputed</th>":"<th>Doubtful</th><th>Disputed</th>"}${ed?"<th></th>":""}</tr>`;
  const foot=list.length?`<tr class="tot"><td></td><td colspan="${k==="sc"?4:4}">Total${list.length<all.length?` · ${list.length} of ${all.length} shown`:""}</td>${tot.map(v=>`<td class="n">${rsx(v)}</td>`).join("")}<td class="n">${rsx(r2(tot.reduce((s,v)=>s+v,0)))}</td><td class="n prev">${anyP?rsx(ptot):"–"}</td><td class="n">${rsx(advTot)}</td><td></td><td colspan="${(k==="sc"?1:2)+(ed?1:0)}"></td></tr>`:"";
  const empty=!all.length?`<div class="empty" style="margin-top:12px">No ${P.who}s recorded as at ${endLabel(sel)}.${ed?` Add parties one by one, import a CSV exported from Tally${prevRows.length?`, or bring forward the ${prevRows.length} parties from ${fyLabel(sel-1)}`:""}.`:""}</div>`
    :!list.length?`<div class="empty" style="margin-top:12px">No party matches “${esc(pq[k])}”.</div>`:"";

  const imp=pImp&&pImp.k===k?`<div class="banner ${pImp.err?"bad":"ok"}" style="margin-top:12px"><span>${esc(pImp.msg)}</span><button class="btn small" data-pact="impclose">Close</button></div>`:"";
  const tools=`<div class="toolbar" style="margin-top:4px">
     ${ed?`<button class="btn primary" data-pact="add" data-pk="${k}">Add ${P.who}</button>
     <button class="btn" data-pact="imp" data-pk="${k}">Import CSV</button><input type="file" id="pimp-${k}" data-pimp="${k}" accept=".csv,text/csv,text/plain" hidden>
     <button class="btn small" data-pact="tpl" data-pk="${k}">CSV template</button>
     ${prevRows.length?`<button class="btn small" data-pact="fwd" data-pk="${k}" title="Adds parties from ${fyLabel(sel-1)} that aren’t in this list, with blank amounts">Bring forward from ${fyLabel(sel-1)}</button>`:""}
     ${all.length?(delConfirm==="pclear:"+k?`<button class="btn small danger" data-pact="clear" data-pk="${k}">Remove all ${all.length}</button><button class="btn small" data-act="canceldel">Keep</button>`:`<button class="btn small" data-pact="askclear" data-pk="${k}">Clear list</button>`):""}`:""}
     <span style="margin-left:auto" class="toolbar">${all.length>5?`<input type="text" id="pq-${k}" data-pq="${k}" value="${esc(pq[k])}" placeholder="Search party or GSTIN" aria-label="Search parties" style="width:200px">`:""}
     ${all.length>1?`<select data-psort="${k}" aria-label="Sort"><option value="entry" ${psort[k]==="entry"?"selected":""}>Entry order</option><option value="name" ${psort[k]==="name"?"selected":""}>Name A–Z</option><option value="amt" ${psort[k]==="amt"?"selected":""}>Amount, high to low</option></select>`:""}</span></div>`;

  return statusBanner(st)+`<section class="sheet">
    <div class="sheet-head"><div><h2>${P.ttl} as at ${endLabel(sel)}</h2><div class="sub">Party-wise closing balances on the last day of ${fyLabel(sel)} · aged from the due date · advances kept in their own column · amounts in ₹ · ${k==="sc"?"supports Note "+(noteNo(d,"tpo")||"–")+" (trade payables)":"supports Note "+(noteNo(d,"tr")||"–")+" (trade receivables)"}</div></div>
    <div class="toolbar">${dlBar(P.tab,P.title)}</div></div>
    ${tools}${imp}
    <details class="advguide" style="margin-top:12px"><summary>${esc(ADV_GUIDE[k].t)}</summary><ul>${ADV_GUIDE[k].l.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></details>
    ${list.length?`<div class="scroll" style="margin-top:12px"><table class="reg ptab" id="t-${P.tab}" style="min-width:${k==="sc"?1560:1720}px"><thead>${head}</thead><tbody>${body}${foot}</tbody></table></div>`:""}${empty}
  </section>${recon}${ageing}`;
}

/* ---- CSV import / template ---- */
function parseCSVText(t){
  const out=[];let row=[],f="",q=false;t=String(t).replace(/^﻿/,"");
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;continue;}
    if(c==='"')q=true;else if(c===","){row.push(f);f="";}else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(f);f="";if(row.some(x=>x.trim()!==""))out.push(row);row=[];}else f+=c;}
  row.push(f);if(row.some(x=>x.trim()!==""))out.push(row);return out;
}
const hkey=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
function amtDrCr(k,s){
  s=String(s==null?"":s).trim();if(!s)return null;let sign=1;
  const m=s.match(/\b(dr|cr)\.?\s*$/i);
  if(m){const dr=m[1].toLowerCase()==="dr";sign=(k==="sc")?(dr?-1:1):(dr?1:-1);s=s.slice(0,m.index).trim();}
  const v=parseNum(s);return v==null?null:r2(v*sign);
}
function importParties(k,text){
  const P=PK[k],nb=P.buckets.length,rows=parseCSVText(text);
  if(!rows.length)return {err:true,msg:"The file is empty."};
  const h=rows[0].map(hkey);
  const find=re=>h.findIndex(x=>re.test(x));
  let hasHead=h.some(x=>/party|name|ledger|vendor|supplier|customer|creditor|debtor|particular/.test(x));
  const ci={name:hasHead?find(/party|name|ledger|vendor|supplier|customer|creditor|debtor|particular/):0,gstin:find(/gst/),msme:find(/msme|udyam|enterprise/),
    nat:find(/nature/),cat:h.findIndex(x=>/categ|segment|type/.test(x)&&!/advance/.test(x)),adv:h.findIndex(x=>/advance/.test(x)&&!/for|type|age|over|365|days|capital/.test(x)),advT:h.findIndex(x=>/advance(for|type|age)|over365|capitaladvance/.test(x)),loc:find(/branch|location|city/),disp:find(/disput/),doubt:find(/doubt/)};
  const bi=P.buckets.map(b=>h.indexOf(hkey(b)));
  if(k==="sc"&&bi[1]<0)bi[1]=h.findIndex(x=>/^(lessthan1y|upto1y|01y|1y)/.test(x));
  if(k==="sd"&&bi[1]<0)bi[1]=h.findIndex(x=>/^(lessthan6m|upto6m|06m)/.test(x));
  let amtCol=bi.every(i=>i<0)?(hasHead?find(/closing|balance|amount|outstanding|total|amt/):1):-1;
  if(!hasHead&&amtCol<0)amtCol=1;
  const yes=v=>/^(y|yes|true|1|x|disputed|doubtful)$/i.test(String(v||"").trim());
  const msmeOf=v=>{v=String(v||"").toLowerCase();return /micro/.test(v)?"micro":/small/.test(v)?"small":/medium/.test(v)?"medium":/^(no|n|non|not msme|not registered)/.test(v)?"no":"unk";};
  const pickList=(list,v)=>{v=String(v||"").trim();if(!v)return "";const m=list.find(x=>x.toLowerCase()===v.toLowerCase());return m||v;};
  const body=hasHead?rows.slice(1):rows;
  let added=0,updated=0,skipped=0,advN=0;
  editParties(k,a=>{
    const idx={};a.forEach((r,i)=>{idx[pMatchKey(r)]=i;const n="n:"+normName(r.name);if(idx[n]==null)idx[n]=i;});
    for(const c of body){
      const name=String(c[ci.name]||"").trim();
      if(!name||/^(total|grand total|sub ?total)$/i.test(name)){skipped++;continue;}
      const rec={name};
      if(ci.gstin>=0&&c[ci.gstin]!=null&&String(c[ci.gstin]).trim())rec.gstin=String(c[ci.gstin]).trim().toUpperCase();
      const amts=Array(nb).fill(null);let anyAmt=false;
      let advIn=null;
      if(amtCol>=0){const v=amtDrCr(k,c[amtCol]);if(v!=null){if(v<0&&ci.adv<0)advIn=-v;else{amts[1]=v;anyAmt=true;}}}
      else bi.forEach((col,j)=>{if(col>=0){const v=amtDrCr(k,c[col]);if(v!=null){amts[j]=v;anyAmt=true;}}});
      if(k==="sc"){if(ci.msme>=0)rec.msme=msmeOf(c[ci.msme]);if(ci.nat>=0)rec.nat=pickList(CR_NAT,c[ci.nat]);}
      else{if(ci.cat>=0)rec.cat=pickList(DR_CAT,c[ci.cat]);if(ci.loc>=0)rec.loc=pickList(allLocs(),c[ci.loc]);if(ci.doubt>=0)rec.doubt=yes(c[ci.doubt]);}
      if(ci.disp>=0)rec.disp=yes(c[ci.disp]);
      if(ci.adv>=0){const v=amtDrCr(k==="sc"?"sd":"sc",c[ci.adv]);if(v!=null)advIn=Math.abs(v);}
      if(advIn!=null){rec.adv=advIn;advN++;}
      if(ci.advT>=0){const v=String(c[ci.advT]||"");rec.advT=k==="sc"?(/cap/i.test(v)?"cap":"rev"):(/^(y|yes|true|1|over|>)/i.test(v.trim())?"gt":"le");}
      const key=rec.gstin?"g:"+rec.gstin:"n:"+normName(name);
      let i=idx[key];if(i==null)i=idx["n:"+normName(name)];
      if(i!=null){Object.assign(a[i],rec);if(anyAmt)a[i].a=amts.map(v=>v==null?null:v);updated++;}
      else{const r=Object.assign(blankParty(k),rec,{a:amts});a.push(r);idx[key]=a.length-1;idx["n:"+normName(name)]=a.length-1;added++;}
    }
  });
  if(!added&&!updated)return {err:true,msg:"No parties found. Use the CSV template, or a file with the party name in the first column and the closing balance in the second."};
  return {err:false,msg:`Imported ${added} new ${added===1?"party":"parties"}${updated?", updated "+updated:""}${skipped?" · skipped "+skipped+" blank or total rows":""}${advN?" · "+advN+" "+(k==="sc"?"debit":"credit")+" balance"+(advN===1?"":"s")+" placed in the Advance column":""}. ${amtCol>=0?"Single balances were placed in the “"+P.buckets[1]+"” column; split them across the ageing columns where needed.":""}`};
}
async function partyTemplate(k){
  const P=PK[k];
  const head=k==="sc"?["Party","GSTIN","MSME status","Nature"].concat(P.buckets,["Disputed","Advance paid","Advance for (Revenue/Capital)"]):["Party","GSTIN","Category","Branch"].concat(P.buckets,["Doubtful","Disputed","Advance received","Advance over 365 days (Y/N)"]);
  const ex=k==="sc"?[["Example Diagnostics Supplies Pvt Ltd","36AAAAA0000A1Z5","Small","Reagents & consumables","25000","180000","","","","N","",""],["Example Equipment Supplier Pvt Ltd","","Not MSME","Capital goods","","","","","","N","500000","Capital"]]
                   :[["Example Corporate Ltd","36AAAAA0000A1Z5","Corporate (AHC / wellness)","Begumpet (NRL)","40000","95000","12000","","","","N","N","",""],["Example Hospital (prepaid tests)","","Hospitals, clinics & labs (B2B)","Bengaluru","","","","","","","N","N","150000","N"]];
  const q=v=>/[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
  await saveFile(P.title+" import template.csv","﻿"+[head].concat(ex).map(r=>r.map(q).join(",")).join("\n"),"text/csv");
}

/* ---- export model (PDF / Excel / CSV), annexures D and E ---- */
function modelParties(k){
  const P=PK[k],S=partySum(k,sel),pm=prevMap(k),nb=P.buckets.length;
  const tot=Array(nb).fill(0);let pt=0;const adv=k==="sc"?"Advance paid":"Advance received";
  const rows=S.rows.slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""))).map(r=>{
    const a=Array.from({length:nb},(_,j)=>+((r.a||[])[j])||0);a.forEach((v,j)=>tot[j]=r2(tot[j]+v));const p=prevOf(pm,r);if(p!=null)pt=r2(pt+p);
    const flags=[r.doubt?"doubtful":"",r.disp?"disputed":""].filter(Boolean).join(", ");
    return {kind:"item",label:(r.name||"–")+(r.gstin?" · "+r.gstin:"")+(flags?" ("+flags+")":""),vals:[k==="sc"?msmeName(r.msme):(r.cat||"–")].concat(a.map(v=>v||null),[pTot(r)||null,p,+r.adv?(+r.adv):null,+r.adv?advTName(k,r.advT):""])};});
  if(rows.length)rows.push({kind:"tot",label:"Total",vals:[""].concat(tot,[S.tot,pt||null,S.adv||null,""])});
  const afterRows=AGE_GROUPS[k].map(([gk,lab])=>({kind:"item",label:lab,vals:S.g[gk].concat([S.gt(gk)])}));
  afterRows.push({kind:"tot",label:"Total",vals:Array.from({length:nb},(_,j)=>r2(AGE_GROUPS[k].reduce((s,[gk])=>s+S.g[gk][j],0))).concat([S.tot])});
  return {key:P.tab,type:"grid",title:P.title+" as at "+endLabel(sel),sub:S.n+" parties · aged from the due date of payment"+(k==="sd"&&S.prov?" · provision for doubtful debts "+fmtRs(S.prov):""),fs:6.6,
    align:["l","l"].concat(Array(nb+3).fill("r"),["l"]),widths:[40,k==="sc"?15:22],fs:6.2,
    flat:["Party",k==="sc"?"MSME status":"Category"].concat(P.short,["Total due","As at 31 Mar "+sel,adv,k==="sc"?"Advance for":"Advance age"]),rows,
    foot:S.adv?(k==="sc"?"Advances paid are not part of trade payables: "+fmtRs(S.advA)+" to suppliers is shown under "+lineLabel("stla")+(S.advB?" and "+fmtRs(S.advB)+" as capital advances under "+lineLabel("ltla"):"")+".":"Advances received of "+fmtRs(S.adv)+" are not part of trade receivables and are shown under "+lineLabel("ocl")+(S.advB?"; "+fmtRs(S.advB)+" is over 365 days old":"")+"."):"",
    empty:"No "+P.who+"s recorded as at "+endLabel(sel)+".",
    after:S.n?{title:"Ageing schedule (Schedule III)",flat:["Particulars"].concat(P.buckets,["Total"]),rows:afterRows,align:["l"].concat(Array(nb+1).fill("r")),widths:[52]}:null};
}


/* ---------- settings ---------- */
const TAB_NAMES={pl:"Profit & Loss",bs:"Balance Sheet",dep:"Depreciation schedule",assets:"Asset Register",notes:"Notes"};
function secOptions(t){
  if(t==="pl")return SECS.pl.map(s=>({v:s.id,l:s.n+" · "+s.label}));
  if(t==="bs")return SECS.bs.map(s=>({v:s.id,l:(s.grp==="L"?"Equity and liabilities · ":"Assets · ")+s.label}));
  if(t==="dep")return [{v:"T",l:"A. Tangible assets — property, plant and equipment"},{v:"I",l:"B. Intangible assets"}];
  if(t==="assets")return allCats().map(c=>({v:c.n,l:"Category · "+c.n})).concat([{v:"__loc",l:"Locations / branches list"}]);
  if(t==="notes"){const d=yearData(sel,true);return d.notes.filter(n=>n.kind!=="ppe").map(n=>({v:n.id,l:"Note "+(d.notes.indexOf(n)+1)+" · "+n.title}));}
  return [];
}
function valuesExist(t,k){
  const ys=[];for(const id in raw){const y=raw[id];if(y&&y[t]&&+y[t][k])ys.push("FY "+id);}
  for(const id in pend){const y=pend[id];if(y&&y[t]&&+y[t][k]&&!ys.includes("FY "+id))ys.push("FY "+id);}
  return ys;
}
function viewSettings(){
  const f=setForm;const opts=secOptions(f.tab);
  if(!opts.some(o=>o.v===f.sec))f.sec=opts[0]?opts[0].v:"";
  const finNote=f.tab==="notes"&&isFinal(sel);
  const nameLbl={pl:"Line item name",bs:"Line item name",dep:"Category name",assets:f.sec==="__loc"?"Location name":"Asset name",notes:"Row name"}[f.tab];
  const btn={pl:"Add line item",bs:"Add line item",dep:"Add category",assets:f.sec==="__loc"?"Add location":"Continue to asset form",notes:"Add row to note"}[f.tab];
  const addCard=`<section class="sheet" id="addcard"><h3>Add a row</h3>
   <p class="sub" style="margin:0 0 14px">Choose the tab, then the section within it. New P&amp;L and Balance Sheet lines apply to every year; note rows are added to ${fyLabel(sel)} and carry into the next year you start.</p>
   <form class="af" id="setForm" autocomplete="off">
    <div class="fld"><label for="s-tab">Tab</label><select id="s-tab" data-s="tab">${Object.keys(TAB_NAMES).map(k=>`<option value="${k}" ${f.tab===k?"selected":""}>${TAB_NAMES[k]}</option>`).join("")}</select></div>
    <div class="fld wide"><label for="s-sec">Section</label><select id="s-sec" data-s="sec">${opts.map(o=>`<option value="${esc(o.v)}" ${f.sec===o.v?"selected":""}>${esc(o.l)}</option>`).join("")}</select></div>
    <div class="fld wide"><label for="s-label">${nameLbl}</label><input type="text" id="s-label" data-s="label" value="${esc(f.label)}" placeholder="${esc({pl:"e.g. Home collection charges",bs:"e.g. Security deposits",dep:"e.g. Cold-chain equipment",assets:f.sec==="__loc"?"e.g. Warangal":"e.g. Biosafety cabinet",notes:"e.g. Rent"}[f.tab])}"></div>
    ${f.tab==="pl"||f.tab==="bs"?`<div class="fld wide"><label for="s-hint">Description (optional)</label><input type="text" id="s-hint" data-s="hint" value="${esc(f.hint)}" placeholder="Shown under the line in small text"></div>
    <div class="fld"><label for="s-from">Applies from</label><select id="s-from" data-s="from">${yearOpts(f.from,"The earliest year")}</select></div>
    <div class="fld"><label for="s-to">Until</label><select id="s-to" data-s="to">${yearOpts(f.to,"Ongoing")}</select><span class="hint">Same year in both = that year only</span></div>`:""}
    ${f.tab==="dep"?`<div class="fld wide"><label for="s-life">Useful-life guidance (optional)</label><input type="text" id="s-life" data-s="life" value="${esc(f.life)}" placeholder="e.g. 13 years (medical & surgical equipment)"></div>`:""}
   </form>
   <div class="formfoot"><button class="btn primary" data-act="setadd" ${!canWrite||finNote?"disabled":""}>${btn}</button><span class="sub" id="setErr">${finNote?fyLabel(sel)+" is finalised, so its notes can’t change. Reopen the year or pick another.":""}</span></div>
  </section>`;

  const layRows=t=>SECS[t].map(s=>{const items=secItems(t,s);
    return `<tr class="sec"><td colspan="3">${esc((s.n?s.n+" · ":"")+s.label)}</td><td class="act"><button class="btn small" data-addline="${t}" data-sec="${s.id}" ${!canWrite?"disabled":""}>Add</button></td></tr>`+
    items.map((k,i)=>{const cust=!!layout.custom[k];const auto=AUTO_KEYS.includes(k);
      const val=cust?layout.custom[k].label:(layout.labels[k]||"");
      const off=!inPeriod(k,sel);
      let h=`<tr><td><input type="text" id="lb-${k}" data-lbl="${k}" value="${esc(val)}" placeholder="${esc(BASE[k]?BASE[k].l:"")}" aria-label="Label" ${!canWrite?"disabled":""}>${cust?`<span class="chip gray" style="margin:3px 0 0">Added</span>`:auto?`<span class="chip green" style="margin:3px 0 0">Auto</span>`:""}</td>
       <td class="act">${auto?`<span class="sub">All years</span>`:`<button class="btn small" data-period="${k}" ${!canWrite?"disabled":""} title="Years this line appears" style="${off?"border-color:var(--gold);color:var(--gold)":""}">${esc(fmtPeriod(k))}</button>`}</td>
       <td class="act"><span class="rowact"><button class="btn small" data-ord="${k}" data-ts="${t}:${s.id}" data-dir="-1" ${i===0||!canWrite?"disabled":""} aria-label="Move up">↑</button><button class="btn small" data-ord="${k}" data-ts="${t}:${s.id}" data-dir="1" ${i===items.length-1||!canWrite?"disabled":""} aria-label="Move down">↓</button></span></td>
       <td class="act">${auto||!canWrite?"":`<button class="btn small" data-period="${k}" data-rm="1">${cust?"Remove":"Hide"}</button>`}</td></tr>`;
      if(periodEdit&&periodEdit.k===k)h+=`<tr><td colspan="4" style="background:var(--sunk)">${periodEditor(t,k)}</td></tr>`;
      return h;}).join("");}).join("");
  const layCard=(t,title)=>`<section class="sheet" id="lay-${t}"><h3>${title}</h3><p class="sub" style="margin:0 0 10px">Rename any line (leave blank for the Schedule III wording), set the years it appears, reorder within a section, or remove lines you added.</p><div class="scroll"><table class="lay">${layRows(t)}</table></div></section>`;

  const used=n=>assets.some(a=>a.cat===n);
  const catCard=`<section class="sheet"><h3>Asset categories</h3>
   <p class="sub" style="margin:0 0 10px">Categories are the rows of the depreciation schedule and the choices in the asset form.</p>
   <div class="scroll"><table class="lay">
    <tr class="sec"><td colspan="2">A. Tangible</td><td class="act"><button class="btn small" data-addline="dep" data-sec="T" ${!canWrite?"disabled":""}>Add</button></td></tr>
    ${catRows("T",used)}
    <tr class="sec"><td colspan="2">B. Intangible</td><td class="act"><button class="btn small" data-addline="dep" data-sec="I" ${!canWrite?"disabled":""}>Add</button></td></tr>
    ${catRows("I",used)}
   </table></div>
   <h3 style="margin-top:16px">Locations</h3>
   <div class="chips">${LOCS.map(l=>`<span style="padding-right:10px">${esc(l)}</span>`).join("")}${layout.locs.map((l,i)=>`<span>${esc(l)}${canWrite?`<button data-delloc="${i}" aria-label="Remove ${esc(l)}">✕</button>`:""}</span>`).join("")}</div>
   <div class="toolbar" style="margin-top:10px"><button class="btn small" data-addline="assets" data-sec="__loc" ${!canWrite?"disabled":""}>Add location</button></div>
  </section>`;
  return `<div class="toolbar"><h2 style="margin:0;font-family:var(--f-display);font-size:20px;font-weight:600">Settings</h2><span class="sub">Layout changes apply to every financial year</span></div>`+
    addCard+`<div class="cols">${layCard("pl","Profit &amp; Loss layout")}${layCard("bs","Balance Sheet layout")}</div>`+catCard+reportCard();
}
function periodEditor(t,k){
  const pe=periodEdit,cust=!!layout.custom[k],name=esc(lineLabel(k));
  const ys=yearsWithValue(t,k),finYs=ys.filter(y=>y.fin),openYs=ys.filter(y=>!y.fin);
  const list=a=>a.map(y=>fyLabel(y.Y)).join(", ");
  let rm="";
  if(pe.rm){
    if(!ys.length){
      rm=cust?`<div class="banner warn"><span>“${name}” has no amounts in any year. Delete it?</span><span class="toolbar"><button class="btn small danger" data-act="purgeline">Delete line</button></span></div>`
             :`<div class="banner warn"><span>Hide “${name}” in every year? You can show it again from here.</span><span class="toolbar"><button class="btn small danger" data-act="hideall">Hide line</button></span></div>`;
    }else{
      const last=ys[ys.length-1].Y;
      rm=`<div class="banner warn" style="flex-direction:column;align-items:flex-start"><span>“${name}” has amounts in ${list(ys)}.</span>
        <span class="toolbar"><button class="btn small" data-act="endafter" data-y="${last}">Stop after ${fyLabel(last)}</button><span class="sub">Keeps the history; hidden from ${fyLabel(last+1)} onwards.</span></span>
        ${cust?(finYs.length?`<span class="sub">Can’t delete: ${list(finYs)} ${finYs.length>1?"are":"is"} finalised. Reopen ${finYs.length>1?"those years":"that year"} first, or stop the line instead.</span>`
          :`<span class="toolbar"><button class="btn small danger" data-act="purgeline">Delete line and clear amounts in ${list(openYs)}</button></span>`)
          :`<span class="toolbar"><button class="btn small" data-act="hideall">Hide in every year</button><span class="sub">Years holding amounts still show it, flagged.</span></span>`}
      </div>`;
    }
  }
  return `<div style="display:flex;flex-direction:column;gap:10px;padding:6px 2px">
    <div class="toolbar"><strong>${name}</strong><span class="sub">appears in</span>
     <div class="ctl"><label for="pe-from">From</label><select id="pe-from" data-pe="from">${yearOpts(pe.from,"The earliest year")}</select></div>
     <div class="ctl"><label for="pe-to">Until</label><select id="pe-to" data-pe="to">${yearOpts(pe.to,"Ongoing")}</select></div>
     <button class="btn small primary" data-act="saveperiod">Save years</button><button class="btn small" data-act="cancelperiod">Close</button></div>
    ${rm}
    <span class="sub">Pick the same year in both for a one-year line. Outside these years the line is hidden; a year that still holds an amount keeps showing it with an “Outside period” flag, so nothing drops out of the totals.</span></div>`;
}
function reportCard(){
  const R=rpt(),dis=canWrite?"":"disabled";
  const f=(k,l,ph,w)=>`<div class="fld${w?" wide":""}"><label for="rp-${k}">${l}</label><input type="text" id="rp-${k}" data-rp="${k}" value="${esc(R[k]||"")}" placeholder="${esc(ph||"")}" ${dis}></div>`;
  return `<section class="sheet" id="signcard"><h3>Report signatures</h3>
   <p class="sub" style="margin:0 0 14px">Printed under the Balance Sheet and the Statement of Profit and Loss in PDF downloads. Blank fields print as lines to sign on.</p>
   <form class="af" autocomplete="off">
    ${f("auditor","Statutory auditor (firm)","e.g. ABC & Associates",true)}${f("frn","Firm registration no.","e.g. 012345S")}${f("partner","Partner")}${f("mno","Membership no.")}
    ${f("d1name","Director 1")}${f("d1des","Designation")}${f("d1din","DIN")}
    ${f("d2name","Director 2")}${f("d2des","Designation")}${f("d2din","DIN")}
    ${f("cfo","Finance head (optional)")}${f("cfodes","Designation")}${f("cs","Company Secretary (optional)")}
    ${f("place","Place of signing")}
    <div class="fld"><label for="rp-date">Date of signing · ${fyLabel(sel)}</label><input type="date" id="rp-date" data-rp="date" value="${esc(R.dates[fyId(sel)]||"")}" ${dis}></div>
   </form></section>`;
}
function catRows(t,used){
  return allCats().filter(c=>c.t===t).map(c=>{const cust=layout.cats.includes(c);const i=layout.cats.indexOf(c);
    return `<tr><td>${esc(c.n)}<span class="hint">${esc(c.life||"")}</span></td><td class="act">${cust?`<span class="chip gray">Added</span>`:""}</td>
     <td class="act">${cust&&canWrite?(used(c.n)?`<span class="sub">In use</span>`:`<button class="btn small" data-delcat="${i}" aria-label="Remove ${esc(c.n)}">✕</button>`):""}</td></tr>`;}).join("");
}
function addFromSettings(){
  const f=setForm,lab=f.label.trim(),err=$("#setErr");
  if(!lab){err.textContent="Enter a name.";$("#s-label").focus();return;}
  if(f.tab==="pl"||f.tab==="bs"){
    const sec=SECS[f.tab].find(s=>s.id===f.sec);
    if(secItems(f.tab,sec).some(k=>lineLabel(k).toLowerCase()===lab.toLowerCase())){err.textContent="That section already has a line with this name.";return;}
    const k=rid("c");layout.custom[k]={tab:f.tab,sec:f.sec,label:lab,hint:f.hint.trim(),at:Date.now()};
    if(f.from!=null&&f.to!=null&&f.from>f.to){err.textContent="“Until” is earlier than “Applies from”.";return;}
    if(f.from!=null||f.to!=null)layout.period[k]={from:f.from,to:f.to};
    saveLayout();
    toast("Added “"+lab+"” to "+TAB_NAMES[f.tab]+" · "+(sec.n?sec.n+" ":"")+sec.label+" · "+fmtPeriod(k));
  }else if(f.tab==="dep"){
    if(allCats().some(c=>c.n.toLowerCase()===lab.toLowerCase())){err.textContent="That category already exists.";return;}
    layout.cats.push({n:lab,t:f.sec,life:f.life.trim()||"As assessed by management"});saveLayout();toast("Category “"+lab+"” added");
  }else if(f.tab==="assets"){
    if(f.sec==="__loc"){if(allLocs().some(l=>l.toLowerCase()===lab.toLowerCase())){err.textContent="That location is already listed.";return;}
      layout.locs.push(lab);saveLayout();toast("Location “"+lab+"” added");}
    else{form=blankForm();form.name=lab;form.cat=f.sec;f.label="";tab="assets";render();window.scrollTo({top:0});return;}
  }else if(f.tab==="notes"){
    if(isFinal(sel))return;
    editNotes(ns=>{const n=ns.find(x=>x.id===f.sec);if(n){n.rows=(n.rows||[]).concat([{id:rid("r"),label:lab,v:null}]);}});
    toast("Row “"+lab+"” added to the note");
  }
  f.label="";f.hint="";f.life="";f.from=sel;f.to=null;render();
}
function jumpToAdd(t,sec){setForm={tab:t,sec:sec,label:"",hint:"",life:"",from:sel,to:null};periodEdit=null;tab="settings";render();const c=$("#addcard");if(c)c.scrollIntoView({block:"start"});const l=$("#s-label");if(l)l.focus({preventScroll:true});}
function purgeLine(k){
  const t=lineTab(k);if(!t||!layout.custom[k])return;
  const ys=yearsWithValue(t,k);if(ys.some(y=>y.fin))return;
  for(const y of ys)queue(y.id,{[t]:{[k]:null}});
  const name=lineLabel(k);
  delete layout.custom[k];delete layout.labels[k];delete layout.period[k];
  for(const o in layout.order)layout.order[o]=layout.order[o].filter(x=>x!==k);
  periodEdit=null;saveLayout();for(const y of ys)flush(y.id);
  toast("Deleted “"+name+"”"+(ys.length?" and cleared its amounts":""));render();
}

/* ---------- documents ---------- */
const ASSET_TYPES={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",csv:"text/csv",txt:"text/plain",json:"application/json",md:"text/markdown"};
const extOf=n=>(String(n).split(".").pop()||"").toLowerCase();
const MAX_ARTIFACT=20*1048576, MAX_LOCAL=50*1048576;
function blankDoc(){return {fy:String(sel),type:"fs",title:"",ref:"",date:"",amount:"",remarks:"",file:null};}
function viewDocs(){
  const canUp=canWrite&&(isLocal||!!fileCap);
  const list=docs.filter(x=>docFilter==="all"||x.fy===String(sel)).slice().sort((a,b)=>(+b.fy-+a.fy)||(DOC_TYPES.findIndex(t=>t.k===a.type)-DOC_TYPES.findIndex(t=>t.k===b.type))||String(b.date||"").localeCompare(String(a.date||"")));
  const yearDocs=docs.filter(x=>x.fy===String(sel));
  const checklist=`<div class="checklist">${DOC_TYPES.filter(t=>t.req).map(t=>{const n=yearDocs.filter(x=>x.type===t.k).length;return `<span class="${n?"have":"miss"}">${n?"✓":"○"} ${esc(t.n)}${n>1?` · ${n}`:""}</span>`;}).join("")}</div>`;
  const top=`<div class="toolbar"><h2 style="margin:0;font-family:var(--f-display);font-size:20px;font-weight:600">Documents</h2>
    <div class="seg" role="group" aria-label="Which years"><button data-docf="sel" aria-pressed="${docFilter==="sel"}">${fyLabel(sel)}</button><button data-docf="all" aria-pressed="${docFilter==="all"}">All years</button></div>
    ${list.length&&(downloads||isLocal)?`<button class="btn dlbtn" data-act="alldocs" style="margin-left:auto" ${exp.busy?"disabled":""}>${exp.busy==="docs"?`<span class="spin" aria-hidden="true"></span>Packing ${list.length} files…`:`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v8m0 0-3.2-3.2M8 10l3.2-3.2M3 13h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Download all ${docFilter==="all"?"documents":fyLabel(sel)+" documents"} · ZIP (${list.length})`}</button>`:""}
    ${canUp?`<button class="btn primary" data-act="newdoc" ${list.length&&(downloads||isLocal)?"":"style=\"margin-left:auto\""}>Upload document</button>`:`<span class="sub" style="margin-left:auto">${canWrite?"Uploading needs edit access to this page.":"View only"}</span>`}</div>
    <section class="sheet"><div class="sheet-head" style="margin-bottom:10px"><h3 style="margin:0">Filing checklist · ${fyLabel(sel)}</h3><div class="toolbar">${dlMenu("docs","Documents index","Index")}${fyMenu()}</div></div>${checklist}</section>`;
  const frm=docForm?docFormView():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No documents ${docFilter==="all"?"yet":"for "+fyLabel(sel)}. Upload signed financial statements, the tax computation, the ITR-V acknowledgement, challans and other government acknowledgements here.</div>`;
  else{
    let lastFy=null;
    const body=list.map(x=>{
      let h="";if(docFilter==="all"&&x.fy!==lastFy){lastFy=x.fy;h+=`<tr><td colspan="7" class="grp" style="background:var(--sunk);font-weight:600">${fyLabel(+x.fy)}</td></tr>`;}
      const conf=delConfirm==="doc:"+x.id;
      const open=(isLocal?`<button class="btn small" data-opendoc="${esc(x.id)}">Open</button>`:`<a class="btn small" href="/_blob/${esc(x.blob)}" target="_blank" rel="noopener">Open</a>`)+((downloads||isLocal)?`<button class="btn small" data-dldoc="${esc(x.id)}">Download</button>`:"");
      const act=conf?`<span class="sub">Delete?</span><button class="btn small danger" data-deldoc="${esc(x.id)}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`
        :open+(canUp?`<button class="btn small" data-askdeldoc="${esc(x.id)}" aria-label="Delete ${esc(x.title)}">✕</button>`:"");
      return h+`<tr><td><strong>${esc(x.title||x.fileName)}</strong><span class="hint">${esc(docTypeName(x.type))}</span></td>
        <td class="tag">${esc(x.ref||"–")}</td><td style="white-space:nowrap">${fmtD(pd(x.date))}</td>${x.amount?numCell(+x.amount):"<td class='n'>–</td>"}
        <td><span class="fname">${esc(x.fileName)}</span><span class="hint">${fmtSize(+x.size||0)} · added ${fmtD(Date.parse(x.uploadedAt||""))}</span></td>
        <td style="max-width:220px">${esc(x.remarks||"")}</td><td><div class="rowact">${act}</div></td></tr>`;
    }).join("");
    tbl=`<section class="sheet"><div class="scroll"><table class="reg"><thead><tr><th>Document</th><th>Reference no.</th><th>Date</th><th class="n">Amount (${unitName()})</th><th>File</th><th>Remarks</th><th></th></tr></thead><tbody>${body}</tbody></table></div></section>`;
  }
  return top+frm+tbl;
}
function docFormView(){
  const f=docForm;const fys=[];for(let Y=CUR_FY;Y>=FIRST_FY;Y--)fys.push(Y);
  const accept=isLocal?"":Object.keys(ASSET_TYPES).map(e=>"."+e).join(",");
  const refPh={itr:"Acknowledgement no. (15 digits)",challan:"BSR code · challan serial no. · date",tds:"Token / RRR no.",gst:"ARN",roc:"SRN",fs:"e.g. UDIN of the auditor",audit:"UDIN",taxaudit:"Acknowledgement no. / UDIN"}[f.type]||"Reference or acknowledgement no.";
  return `<section class="sheet"><h3>Upload document</h3>
   <form class="af" id="docForm" autocomplete="off">
    <div class="fld wide"><label>File</label><label class="drop" id="drop" for="d-file">${f.file?`<b>${esc(f.file.name)}</b> · ${fmtSize(f.file.size)} · choose another`:`<b>Choose a file</b> or drop it here`}<span class="hint">${isLocal?"Any format, up to 50 MB · stored on the TrustComply server":"PDF, image, CSV or text, up to 20 MB · save Excel or Word files as PDF first"}</span></label><input type="file" id="d-file" ${accept?`accept="${accept}"`:""} hidden></div>
    <div class="fld"><label for="d-fy">Financial year</label><select id="d-fy" data-d="fy">${fys.map(Y=>`<option value="${Y}" ${String(Y)===f.fy?"selected":""}>${fyLabel(Y)}</option>`).join("")}</select></div>
    <div class="fld"><label for="d-type">Document type</label><select id="d-type" data-d="type">${DOC_TYPES.map(t=>`<option value="${t.k}" ${f.type===t.k?"selected":""}>${esc(t.n)}</option>`).join("")}</select></div>
    <div class="fld wide"><label for="d-title">Title</label><input type="text" id="d-title" data-d="title" value="${esc(f.title)}" placeholder="e.g. Audited financial statements signed by the Board"></div>
    <div class="fld"><label for="d-ref">Reference no.</label><input type="text" id="d-ref" data-d="ref" value="${esc(f.ref)}" placeholder="${esc(refPh)}"></div>
    <div class="fld"><label for="d-date">Date filed / paid / signed</label><input type="date" id="d-date" data-d="date" value="${esc(f.date)}"></div>
    <div class="fld"><label for="d-amount">Amount (₹, optional)</label><input type="text" id="d-amount" data-d="amount" inputmode="decimal" value="${esc(f.amount)}" placeholder="Tax paid or refund"></div>
    <div class="fld wide"><label for="d-remarks">Remarks</label><input type="text" id="d-remarks" data-d="remarks" value="${esc(f.remarks)}" placeholder="e.g. Filed by statutory auditor; original with CFO"></div>
   </form>
   <div class="formfoot"><button class="btn primary" data-act="savedoc" ${uploading?"disabled":""}>${uploading?"Uploading…":"Upload"}</button><button class="btn" data-act="canceldoc" ${uploading?"disabled":""}>Cancel</button><span class="sub" id="docErr"></span></div>
  </section>`;
}
function pickFile(file){if(!file||!docForm)return;docForm.file=file;if(!docForm.title)docForm.title=file.name.replace(/\.[^.]+$/,"").replace(/[_]+/g," ");render();}
async function saveDoc(){
  const f=docForm,err=$("#docErr");
  if(!f.file){err.textContent="Choose a file to upload.";return;}
  const max=isLocal?MAX_LOCAL:MAX_ARTIFACT;
  if(f.file.size>max){err.textContent="That file is "+fmtSize(f.file.size)+"; the limit is "+fmtSize(max)+".";return;}
  let mime=f.file.type||"application/octet-stream";
  if(!isLocal){const t=ASSET_TYPES[extOf(f.file.name)];if(!t){err.textContent="This format can’t be stored here. Save it as PDF and upload that.";return;}mime=t;}
  uploading=true;render();
  try{
    let blob;
    if(isLocal){blob=rid("f");await idbPut(blob,{blob:f.file,name:f.file.name,type:mime});}
    else{const r=await fileCap.upload(f.file,{type:mime});blob=r.id;}
    const id=rid("d");
    const meta={fy:f.fy,type:f.type,title:f.title.trim()||f.file.name,ref:f.ref.trim(),date:f.date||"",amount:parseNum(f.amount)||0,remarks:f.remarks.trim(),fileName:f.file.name,size:f.file.size,mime,blob,uploadedAt:new Date().toISOString(),uploadedBy:uid||null};
    await db.doc("docs/"+id).set(meta);
    docs=docs.filter(x=>x.id!==id).concat([Object.assign({id},meta)]);
    uploading=false;docForm=null;if(meta.fy!==String(sel))docFilter="all";toast("Uploaded "+meta.title);render();
  }catch(e){
    uploading=false;render();const el=$("#docErr");
    const m={too_large:"The file is too large for this page.",unsupported_type:"This format can’t be stored here. Save it as PDF and upload that.",quota_or_state:"This page’s storage is full. Delete documents you no longer need.",rate_limited:"Too many uploads at once. Wait a moment and try again.",upstream_auth:"Your session expired. Reload the page and try again."}[e&&e.code];
    if(el)el.textContent=m||("Upload failed. "+(e&&e.message||(e&&e.name==="QuotaExceededError"?"Browser storage is full.":"")));
  }
}
async function deleteDoc(id){
  const x=docs.find(d=>d.id===id);delConfirm=null;if(!x){render();return;}
  docs=docs.filter(d=>d.id!==id);render();
  try{
    if(isLocal)await idbDel(x.blob);else if(fileCap)await fileCap.delete(x.blob);
    await db.doc("docs/"+id).delete();toast("Document deleted");
  }catch(e){toast("Couldn’t delete. "+(e&&e.message||""));}
}
async function openLocalDoc(id,download){
  const x=docs.find(d=>d.id===id);if(!x)return;
  try{const rec=await idbGet(x.blob);if(!rec){toast("The file couldn’t be found on the server.");return;}
    const url=URL.createObjectURL(rec.blob);
    if(download){const a=document.createElement("a");a.href=url;a.download=x.fileName;document.body.appendChild(a);a.click();a.remove();}
    else{const w=window.open(url,"_blank");if(!w){const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();}}
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){toast("Couldn’t open the file.");}
}
/* IndexedDB for files in standalone mode */
let idbP=null;
function idb(){if(!idbP)idbP=new Promise((res,rej)=>{const r=indexedDB.open("trufin-files",1);r.onupgradeneeded=()=>r.result.createObjectStore("files");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});return idbP;}
async function idbOp(mode,fn){const d=await idb();return new Promise((res,rej)=>{const tx=d.transaction("files",mode);const rq=fn(tx.objectStore("files"));tx.oncomplete=()=>res(rq?rq.result:undefined);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);});}
const idbPut=(k,v)=>HOST.files.put(k,v);
const idbGet=k=>HOST.files.get(k);
const idbDel=k=>HOST.files.del(k);
const blobToDataURL=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
async function dataURLToBlob(u){const r=await fetch(u);return r.blob();}

/* ---------- finalise ---------- */
function doFinalise(){
  const st=statement(sel,true);
  if(Math.abs(st.diff)>=1)return;
  const s=fySched(sel);
  queue(fyId(sel),{status:"final",finalisedAt:new Date().toISOString(),finalisedBy:uid||null,finalisedByName:HOST.userName||"",
    snap:{dep:st.p.dep,ppe:st.b.ppe,intg:st.b.intg,rsOpen:st.rsOpen,sched:clone(s),assetCount:assets.length}});
  showFin=false;flush(fyId(sel));toast(fyLabel(sel)+" finalised");
}
function doReopen(){queue(fyId(sel),{status:"draft",snap:null,finalisedAt:null,finalisedBy:null,finalisedByName:null});showFin=false;flush(fyId(sel));toast(fyLabel(sel)+" reopened");}

/* ---------- CSV & files ---------- */
async function csv(id,name){
  const t=byId(id);if(!t)return;
  const q=v=>{v=String(v).replace(/\s+/g," ").trim();return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const lines=[q(CO.name),q(name),"Amounts in ₹",""];
  for(const tr of t.rows){const cells=[];for(const c of tr.cells){let v;
      if(c.dataset.v!==undefined&&c.dataset.v!=="")v=c.dataset.v;
      else{const inp=c.querySelector("input");v=inp?(parseNum(inp.value)!=null?r2(parseNum(inp.value)*unit):""):c.textContent;}
      cells.push(q(v));for(let i=1;i<(c.colSpan||1);i++)cells.push("");}
    lines.push(cells.join(","));}
  await saveFile(name.replace(/[^\w\- ]+/g,"").trim()+".csv","﻿"+lines.join("\n"),"text/csv");
}
async function saveFile(filename,text,type){
  if(downloads){try{await downloads.save({filename,data:text});}catch(e){if(e&&e.code!=="declined")toast("Download unavailable here.");}return;}
  const url=URL.createObjectURL(new Blob([text],{type:type+";charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

/* ---------- standalone mode: browser storage ---------- */
const LKEY="trufin.accounts.v1";
const EXAMPLES={
 "ex-haem":{basis:"full",cat:"Laboratory equipment",cost:1850000,disp:"",example:true,loc:"Begumpet (NRL)",method:"SLM",name:"5-part haematology analyser",proceeds:0,put:"2024-04-10",rate:20,resid:0,tag:"EX-LAB-001",years:10},
 "ex-chem":{basis:"prorata",cat:"Laboratory equipment",cost:4200000,disp:"",example:true,loc:"Noida (ZRL)",method:"SLM",name:"Fully automated chemistry analyser",proceeds:0,put:"2023-06-15",rate:7.6923,resid:5,tag:"EX-LAB-002",years:10},
 "ex-server":{basis:"prorata",cat:"Computers and IT hardware",cost:640000,disp:"",example:true,loc:"Begumpet (NRL)",method:"SLM",name:"LIS server and network switches",proceeds:0,put:"2025-08-01",rate:16.6667,resid:0,tag:"EX-IT-001",years:10},
 "ex-furn":{basis:"prorata",cat:"Furniture and fixtures",cost:320000,disp:"",example:true,loc:"Nizamabad",method:"WDV",name:"Phlebotomy chairs and collection-centre furniture",proceeds:0,put:"2022-11-20",rate:25.89,resid:5,tag:"EX-FUR-001",years:10},
 "ex-van":{basis:"prorata",cat:"Vehicles",cost:780000,disp:"",example:true,loc:"Guntur",method:"SLM",name:"Sample transport van",proceeds:0,put:"2022-10-01",rate:12.5,resid:0,tag:"EX-VEH-001",years:10},
 "ex-lis":{basis:"full",cat:"Computer software",cost:1200000,disp:"",example:true,loc:"Begumpet (NRL)",method:"SLM",name:"LIS software licence",proceeds:0,put:"2023-04-01",rate:20,resid:0,tag:"EX-SW-001",years:10}
};
function localDB(){
  let store=null;
  try{store=JSON.parse(localStorage.getItem(LKEY)||"null");}catch(e){}
  if(!isObj(store))store={years:{},assets:clone(EXAMPLES)};
  for(const c of ["years","assets","config","docs"])store[c]=isObj(store[c])?store[c]:{};
  const subs={};
  const persist=()=>{try{localStorage.setItem(LKEY,JSON.stringify(store));}catch(e){toast("This browser is blocking storage, so changes won’t be kept. Use Backup to save a file.");}};
  const snap=c=>{store[c]=store[c]||{};const docs=Object.keys(store[c]).sort().map(id=>({id,exists:true,data:()=>clone(store[c][id])}));return {docs,size:docs.length,empty:!docs.length};};
  const emit=c=>(subs[c]||[]).forEach(f=>f(snap(c)));
  return {
    exportAll:()=>clone(store),
    importAll:s=>{store={};for(const c of ["years","assets","config","docs"])store[c]=isObj(s[c])?s[c]:{};persist();for(const c of Object.keys(store))emit(c);},
    doc(p){const [c,id]=p.split("/");store[c]=store[c]||{};return {
      get:async()=>({id,exists:!!store[c][id],data:()=>clone(store[c][id])}),
      set:async d=>{store[c][id]=clone(d);persist();emit(c);},
      update:async d=>{store[c][id]=deepMerge(store[c][id]||{},d);persist();emit(c);},
      delete:async()=>{delete store[c][id];persist();emit(c);}
    };},
    collection(c){return {onSnapshot(f){(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),0);return ()=>{};}};}
  };
}
$("#bkBtn").addEventListener("click",()=>{flushAll();chain.then(async()=>{if(!db||!db.exportAll)return;
  const data=db.exportAll();const files={};let missing=0;
  for(const id in data.docs){const x=data.docs[id];try{const rec=await idbGet(x.blob);if(rec)files[x.blob]={name:rec.name,type:rec.type,data:await blobToDataURL(rec.blob)};else missing++;}catch(_){missing++;}}
  const d=new Date();const stamp=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  await saveFile("TruFin accounts backup "+stamp+".json",JSON.stringify(Object.assign({app:"TruFin Accounts",savedAt:d.toISOString()},data,{files})),"application/json");
  if(missing)toast(missing+" document file(s) couldn’t be read from the server and aren’t in the backup.");});});
$("#rsBtn").addEventListener("click",()=>$("#rsFile").click());
$("#rsFile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=async()=>{try{const s=JSON.parse(r.result);if(!isObj(s)||(!s.years&&!s.assets))throw 0;
      let nf=0;if(isObj(s.files))for(const k in s.files){const x=s.files[k];try{await idbPut(k,{blob:await dataURLToBlob(x.data),name:x.name,type:x.type});nf++;}catch(_){}}
      for(const k in pend)delete pend[k];try{await db.importAll(s);}catch(err){toast("Couldn’t save the restored data to the server. "+(err&&err.message||""));e.target.value="";return;}
      toast("Restored "+Object.keys(s.years||{}).length+" years, "+Object.keys(s.assets||{}).length+" assets and "+nf+" documents");}
    catch(_){toast("That file isn’t a TruFin accounts backup.");}e.target.value="";};
  r.readAsText(f);});

/* ================= export: download sections or the whole year ================= */
const SHORT="TrustLab";
const REG_ADDR="#31, Street No. 5, Prakash Nagar, Begumpet, Hyderabad – 500016";
const LIBSRC={
  jspdf:["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"],
  autotable:["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js","https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"],
  xlsx:["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js","https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"],
  jszip:["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"]
};
const libDone={};
function loadOne(u){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=u;s.onload=res;s.onerror=()=>{s.remove();rej(new Error("load"));};document.head.appendChild(s);});}
async function needLib(n){
  if(libDone[n])return;
  let ok=false;for(const u of LIBSRC[n]){try{await loadOne(u);ok=true;break;}catch(_){}}
  if(!ok)throw new Error("Couldn’t load the "+(n==="xlsx"?"Excel":n==="jszip"?"ZIP":"PDF")+" builder. Check your internet connection and try again.");
  libDone[n]=true;
}

/* ---- report signatures (Settings) ---- */
const REPORT_DEFAULT={auditor:"",frn:"",partner:"",mno:"",d1name:"Venkata Cherukuri",d1des:"Chairman & Managing Director",d1din:"",d2name:"",d2des:"Director",d2din:"",cfo:"",cfodes:"Business Head – Corporate Services",cs:"",place:"Hyderabad",dates:{}};
const rpt=()=>Object.assign({},REPORT_DEFAULT,layout.report||{},{dates:Object.assign({},(layout.report||{}).dates||{})});

/* ---- section models: one shape shared by PDF, Excel and CSV ---- */
function visItems(t,sec,st,pv){const has=(s,k)=>!!(s&&s.d&&s.d[t]&&+s.d[t][k]);return secItems(t,sec).filter(k=>AUTO_KEYS.includes(k)||inPeriod(k,sel)||has(st,k)||(pv&&has(pv,k)));}
function modelStmt(t){
  const st=statement(sel,true),pv=statement(sel-1,false),d=st.d,G=t==="pl"?"p":"b",rows=[];
  const sec=s=>{const items=visItems(t,s,st,pv);if(!items.length)return;
    if(!s.hdr&&items.length===1){const k=items[0];rows.push({kind:"item",n:s.n,label:s.label,note:noteNo(d,k),cur:st[G][k],prev:pv?pv[G][k]:null,ind:0});subRs(k);return;}
    rows.push({kind:"h",n:s.n,label:s.label,cur:s.hdr?undefined:st[G][s.id],prev:s.hdr?undefined:(pv?pv[G][s.id]:null)});
    for(const k of items){rows.push({kind:"item",label:lineLabel(k),note:noteNo(d,k),cur:st[G][k],prev:pv?pv[G][k]:null,ind:1});subRs(k);}};
  const subRs=k=>{if(k!=="rs")return;
    rows.push({kind:"sub",label:"Opening balance",cur:st.rsOpen,ind:2},{kind:"sub",label:"Add: profit / (loss) for the year",cur:st.p.pat,ind:2});
    if(st.rsOther)rows.push({kind:"sub",label:"Other movements",cur:st.rsOther,ind:2});};
  const sum=(label,id,n,fin)=>rows.push({kind:fin?"final":"sum",n,label,cur:st[G][id],prev:pv?pv[G][id]:null});
  if(t==="pl"){
    rows.push({kind:"h",label:"Income"});
    sec(S("pl","I"));sec(S("pl","II"));sum("Total income (I + II)","ti","III");
    sec(S("pl","IV"));sum("Total expenses (IV)","te","");sum("Profit before exceptional items and tax (III − IV)","pbe","V");
    sec(S("pl","VI"));sum("Profit before tax (V − VI)","pbt","VII");sec(S("pl","VIII"));sum("Profit / (loss) for the year (VII − VIII)","pat","IX",true);
    return {key:"pl",type:"stmt",title:"Statement of Profit and Loss",sub:"for the year ended "+endLabel(sel),cols:["Year ended\n"+endLabel(sel),"Year ended\n"+endLabel(sel-1)],rows,sign:true};
  }
  rows.push({kind:"h1",label:"I. Equity and liabilities"});
  for(const s of SECS.bs.filter(s=>s.grp==="L"))sec(s);
  sum("Total","tel","",true);
  rows.push({kind:"h1",label:"II. Assets"});
  for(const s of SECS.bs.filter(s=>s.grp==="A"))sec(s);
  sum("Total","ta","",true);
  return {key:"bs",type:"stmt",title:"Balance Sheet",sub:"as at "+endLabel(sel),cols:["As at\n"+endLabel(sel),"As at\n"+endLabel(sel-1)],rows,sign:true};
}
function faModel(s,title,sub,key){
  const rows=[];const v=x=>[x.go,x.add,x.del,x.gc,x.ao,x.fy,x.od,x.ac,x.net,x.prev];
  const T=s.rows.filter(r=>r.type==="T"),I=s.rows.filter(r=>r.type==="I");
  if(T.length){rows.push({kind:"h",label:"A. Tangible assets — property, plant and equipment"});T.forEach(r=>rows.push({kind:"item",label:r.cat,vals:v(r)}));rows.push({kind:"subt",label:"Total tangible assets (A)",vals:v(s.T)});}
  if(I.length){rows.push({kind:"h",label:"B. Intangible assets"});I.forEach(r=>rows.push({kind:"item",label:r.cat,vals:v(r)}));rows.push({kind:"subt",label:"Total intangible assets (B)",vals:v(s.I)});}
  if(s.rows.length)rows.push({kind:"tot",label:"Total (A + B)",vals:v(s.tot)});
  const a1="1 Apr "+sel,a2="31 Mar "+(sel+1),a0="31 Mar "+sel;
  return {key,type:"grid",title,sub,fs:7,rows,
    head:[[{content:"Particulars",rowSpan:2},{content:"Gross block",colSpan:4},{content:"Accumulated depreciation",colSpan:4},{content:"Net block",colSpan:2}],
          ["As at\n"+a1,"Additions","Deletions","As at\n"+a2,"As at\n"+a1,"For the\nyear","On\ndeletions","As at\n"+a2,"As at\n"+a2,"As at\n"+a0]],
    flat:["Particulars","Gross block as at "+a1,"Additions","Deletions","Gross block as at "+a2,"Acc. depreciation as at "+a1,"Depreciation for the year","On deletions","Acc. depreciation as at "+a2,"Net block as at "+a2,"Net block as at "+a0],
    empty:"No assets in use during "+fyLabel(sel)+".",
    after:(s.disposals||[]).length?{title:"Assets disposed during the year",flat:["Asset","Date","Cost","Acc. depreciation","Book value","Sale proceeds","Profit / (loss)"],rows:s.disposals.map(x=>({kind:"item",label:x.name,vals:[fmtD(x.date),x.cost,x.acc,x.nbv,x.proc,x.gl]}))}:null};
}
const modelDep=()=>faModel(schedFor(sel),"Depreciation schedule","Property, plant and equipment and intangible assets · "+fyLabel(sel)+(isFinal(sel)?" · as finalised":""),"dep");
function modelMulti(){
  const list=assets.filter(a=>schedule(a).length);
  let minY=Infinity,maxY=-Infinity;for(const a of list){const r=schedule(a);minY=Math.min(minY,r[0].Y);maxY=Math.max(maxY,r[r.length-1].Y);}
  const Ys=[];if(list.length){maxY=Math.min(maxY,minY+24);for(let Y=minY;Y<=maxY;Y++)Ys.push(Y);}
  const block=(metric)=>{const tot=Ys.map(()=>0);const rows=list.map(a=>{const r=schedule(a);return {kind:"item",label:a.name+(a.tag?" ("+a.tag+")":""),vals:Ys.map((Y,i)=>{const x=r.find(q=>q.Y===Y);let v=null;
      if(metric==="dep")v=x?x.dep:null;else{if(x)v=x.close;else if(Y>r[r.length-1].Y&&!r[r.length-1].disposed)v=r[r.length-1].close;}
      if(v)tot[i]+=v;return v;})};});
    rows.push({kind:"tot",label:"Total",vals:tot.map(r2)});return rows;};
  return {key:"my",type:"grid",title:"Multi-year depreciation",sub:"Every asset across its useful life · "+fyLabel(sel)+" highlighted",fs:7.2,maxCols:8,hi:Ys.indexOf(sel),
    flat:["Asset"].concat(Ys.map(fyLabel)),rows:[{kind:"h",label:"Depreciation charge by year"}].concat(block("dep"),[{kind:"h",label:"Closing book value by year"}],block("bv")),
    empty:"No assets with enough detail to schedule."};
}
function modelAsset(a){
  const rows=schedule(a);
  return {key:"asset",type:"grid",title:a.name,sub:a.cat+" · cost "+fmtRs(a.cost)+" · "+methodTxt(a)+" · put to use "+fmtD(pd(a.put)),fs:7.5,maxCols:8,hi:rows.findIndex(r=>r.Y===sel),
    flat:["Particulars"].concat(rows.map((r,i)=>fyLabel(r.Y)+" (Yr "+(i+1)+")")),
    rows:[{kind:"item",label:"Opening book value",vals:rows.map(r=>r.open)},{kind:"item",label:"Depreciation %",vals:rows.map(r=>r.pct.toFixed(2)+"%"+(r.part?" *":""))},
      {kind:"item",label:"Depreciation",vals:rows.map(r=>r.dep)},{kind:"item",label:"Accumulated depreciation",vals:rows.map(r=>r.acc)},{kind:"subt",label:"Closing book value",vals:rows.map(r=>r.close)}],
    foot:rows.some(r=>r.part)?"* Part-year: pro-rata by days in use or to the date of sale.":"",empty:"Not enough detail to schedule this asset."};
}
function modelReg(){
  const list=assets.slice().sort((a,b)=>(a.put||"").localeCompare(b.put||""));
  const tot=[0,0,0];
  const rows=list.map(a=>{const r=schedule(a),x=r.find(q=>q.Y===sel),put=pd(a.put);let bv=null;
    if(put!=null&&fyOfT(put)<=sel){const last=r.filter(q=>q.Y<=sel).pop();bv=last?(last.disposed?0:last.close):+a.cost;}
    tot[0]+=+a.cost||0;tot[1]+=x?x.dep:0;tot[2]+=bv||0;
    return {kind:"item",label:a.tag||"–",vals:[a.name+(a.disp?" (disposed)":""),a.cat,a.loc||"–",fmtD(put),+a.cost,a.method+" "+(+a.rate)+"%",x?x.dep:null,bv]};});
  if(list.length)rows.push({kind:"tot",label:"Total",vals:["","","","",r2(tot[0]),"",r2(tot[1]),r2(tot[2])]});
  return {key:"reg",type:"grid",title:"Asset register",sub:"Values for "+fyLabel(sel),fs:7.3,align:["l","l","l","l","l","r","l","r","r"],widths:[20,"auto",30,24,19,20,17,18,20],
    flat:["Tag","Asset","Category","Location","Put to use","Cost","Method","Dep. "+fyId(sel),"Book value 31 Mar "+(sel+1)],rows,empty:"No assets registered."};
}
function modelNotes(){
  const st=statement(sel,true),d=st.d;const pvd=yearData(sel-1);
  const notes=d.notes.map((n,i)=>{
    let brk=null;
    if(n.rows&&n.rows.length){const pn=pvd?pvd.notes.find(x=>x.id===n.id):null;
      const pvRow=r=>{if(!pn||!pn.rows)return null;const m=pn.rows.find(x=>x.id===r.id)||pn.rows.find(x=>x.label===r.label);return m&&m.v!=null?+m.v:null;};
      const lt=lineTab(n.link);let t=0,pt0=0,anyP=false;
      const rows=n.rows.map(r=>{const v=+r.v||0,p=pvRow(r);t+=v;if(p!=null){pt0+=p;anyP=true;}return {label:r.label,cur:v,prev:p};});
      brk={cols:lt==="bs"?["As at\n"+endLabel(sel),"As at\n"+endLabel(sel-1)]:["Year ended\n"+endLabel(sel),"Year ended\n"+endLabel(sel-1)],rows,tot:r2(t),ptot:anyP?r2(pt0):null};}
    return {no:i+1,title:n.title,body:n.body||"",brk,ppe:n.kind==="ppe",ratios:n.kind==="ratios"?s3Model():null};
  });
  return {key:"notes",type:"notes",title:"Notes to the financial statements",sub:"for the year ended "+endLabel(sel),notes,fa:faModel(schedFor(sel),"","","dep")};
}
function modelDocs(){
  const list=docs.filter(x=>x.fy===String(sel)).sort((a,b)=>DOC_TYPES.findIndex(t=>t.k===a.type)-DOC_TYPES.findIndex(t=>t.k===b.type));
  return {key:"docs",type:"grid",title:"Documents index",sub:"Filings, acknowledgements and signed copies on record for "+fyLabel(sel),fs:7.5,align:["l","l","l","l","r","l"],widths:[42,"auto",32,20,20,36],
    flat:["Document type","Title","Reference no.","Date","Amount","File"],
    rows:list.map(x=>({kind:"item",label:docTypeName(x.type),vals:[x.title||x.fileName,x.ref||"–",x.date?fmtD(pd(x.date)):"–",x.amount?+x.amount:null,x.fileName]})),
    empty:"No documents uploaded for "+fyLabel(sel)+"."};
}
const SECTIONS=[
  {k:"bs",n:"Balance Sheet",d:()=>"As at "+endLabel(sel),m:()=>modelStmt("bs")},
  {k:"pl",n:"Statement of Profit and Loss",d:()=>"Year ended "+endLabel(sel),m:()=>modelStmt("pl")},
  {k:"notes",n:"Notes to the financial statements",d:()=>{const d=yearData(sel,true);return d.notes.length+" notes, with breakups and the PPE schedule";},m:modelNotes},
  {k:"dep",n:"Depreciation schedule",d:()=>"Gross block, accumulated depreciation, net block",m:modelDep},
  {k:"my",n:"Multi-year depreciation",d:()=>"Every asset across its life, charge and book value",m:modelMulti},
  {k:"reg",n:"Asset register",d:()=>assets.length+" assets with this year’s charge",m:modelReg},
  {k:"docs",n:"Documents index",d:()=>{const n=docs.filter(x=>x.fy===String(sel)).length;return n+" document"+(n===1?"":"s")+" on record";},m:modelDocs},
  {k:"scr",n:"Sundry creditors",d:()=>{const n=partyRows(sel,"sc").length;return n+" part"+(n===1?"y":"ies")+" as at "+endLabel(sel)+", with Schedule III ageing";},m:()=>modelParties("sc")},
  {k:"sdr",n:"Sundry debtors",d:()=>{const n=partyRows(sel,"sd").length;return n+" part"+(n===1?"y":"ies")+" as at "+endLabel(sel)+", with Schedule III ageing";},m:()=>modelParties("sd")},
  {k:"an",n:"Financial analysis",d:()=>"Comparatives, ratios, cash flow and trends",m:modelAnalysis}
];
const ANNEX={dep:"Annexure A",my:"Annexure B",reg:"Annexure C",scr:"Annexure D",sdr:"Annexure E",docs:"Annexure F",an:"Annexure G"};

/* ---- PDF ---- */
const PC={green:[28,106,59],ink:[22,33,26],muted:[96,110,100],rule:[196,206,197],band:[233,240,232],gold:[169,127,0]};
const PW=210,PH=297,PM=16;
function pt(s){return String(s==null?"":s).replace(/−/g,"-").replace(/₹/g,"Rs. ").replace(/[⇄→]/g,"-").replace(/[^\x00-\xFF–—‘’“”•…]/g,"");}
const unitPlain=()=>({1:"rupees",1000:"Rs. thousands",100000:"Rs. lakhs",10000000:"Rs. crores"})[unit]||"rupees";
const pnum=v=>v==null||v===""?"":(typeof v==="number"?pt(fmt(v)):pt(v));
function ensure(doc,y,need){if(y+need>PH-20){doc.addPage();return 24;}return y;}
function pdfTitle(doc,m){
  let y=24;
  doc.setFont("times","bold");doc.setFontSize(12.5);doc.setTextColor(...PC.ink);doc.text(pt(CO.name),PW/2,y,{align:"center"});
  y+=4.6;doc.setFont("times","normal");doc.setFontSize(8.3);doc.setTextColor(...PC.muted);doc.text("CIN "+CO.cin,PW/2,y,{align:"center"});
  y+=8.5;if(m.annex){doc.setFont("times","normal");doc.setFontSize(8.5);doc.setTextColor(...PC.muted);doc.text(m.annex.toUpperCase(),PW/2,y-4.2,{align:"center",charSpace:0.6});}
  doc.setFont("times","bold");doc.setFontSize(13);doc.setTextColor(...PC.green);doc.text(pt(m.title),PW/2,y,{align:"center"});
  if(m.sub){y+=5;doc.setFont("times","italic");doc.setFontSize(9.5);doc.setTextColor(...PC.ink);doc.text(doc.splitTextToSize(pt(m.sub),PW-2*PM-20),PW/2,y,{align:"center"});}
  y+=6.5;doc.setFont("times","normal");doc.setFontSize(7.8);doc.setTextColor(...PC.muted);doc.text("(All amounts in "+unitPlain()+" unless otherwise stated)",PW-PM,y,{align:"right"});
  return y+2.5;
}
function pdfStmt(doc,m,y){
  doc.autoTable({startY:y,theme:"plain",margin:{left:PM,right:PM,top:22,bottom:20},
    head:[["","Particulars","Note",pt(m.cols[0]),pt(m.cols[1])]],
    body:m.rows.map(r=>[r.n||"",pt(r.label),r.note||"",r.cur===undefined?"":pnum(r.cur),r.prev===undefined?"":pnum(r.prev)]),
    styles:{font:"times",fontSize:9.4,textColor:PC.ink,cellPadding:{top:1.05,bottom:1.05,left:1.2,right:1.8},valign:"middle",overflow:"linebreak"},
    headStyles:{fontStyle:"bold",fontSize:8.2,textColor:PC.muted,halign:"right",valign:"bottom"},
    columnStyles:{0:{cellWidth:11,textColor:PC.muted,fontSize:8.2},1:{cellWidth:"auto"},2:{cellWidth:12,halign:"center"},3:{cellWidth:32,halign:"right"},4:{cellWidth:32,halign:"right",textColor:PC.muted}},
    didParseCell:c=>{
      if(c.section==="head"){if(c.column.index<=1)c.cell.styles.halign="left";if(c.column.index===2)c.cell.styles.halign="center";return;}
      const r=m.rows[c.row.index],s=c.cell.styles;
      if(r.kind==="h1"){s.fontStyle="bold";s.fontSize=10.4;s.cellPadding={top:4.2,bottom:1.4,left:1.2,right:1.8};}
      if(r.kind==="h"){s.fontStyle="bold";s.cellPadding={top:2.6,bottom:1.05,left:1.2,right:1.8};}
      if(r.kind==="sum"||r.kind==="final"){s.fontStyle="bold";s.cellPadding={top:1.9,bottom:1.9,left:1.2,right:1.8};}
      if(r.kind==="sub"){s.fontSize=8.4;s.fontStyle="italic";s.textColor=PC.muted;}
      if(c.column.index===1&&r.ind)s.cellPadding=Object.assign({},typeof s.cellPadding==="object"?s.cellPadding:{top:1.05,bottom:1.05,right:1.8},{left:1.2+r.ind*4.6});
      if(c.column.index===2&&r.note)s.textColor=PC.green;
    },
    didDrawCell:c=>{
      if(c.section==="head"){doc.setDrawColor(...PC.ink);doc.setLineWidth(0.25);doc.line(c.cell.x,c.cell.y+c.cell.height,c.cell.x+c.cell.width,c.cell.y+c.cell.height);return;}
      if(c.section!=="body"||c.column.index<3)return;
      const r=m.rows[c.row.index],x1=c.cell.x+4,x2=c.cell.x+c.cell.width-1;
      if(r.kind==="sum"||r.kind==="final"){doc.setDrawColor(...PC.ink);doc.setLineWidth(0.2);doc.line(x1,c.cell.y+0.3,x2,c.cell.y+0.3);}
      if(r.kind==="final"){const yb=c.cell.y+c.cell.height-0.4;doc.setLineWidth(0.2);doc.line(x1,yb,x2,yb);doc.line(x1,yb+0.7,x2,yb+0.7);}
    }});
  return doc.lastAutoTable.finalY;
}
function pdfGridTable(doc,m,y,title){
  const nv=m.flat.length-1,maxV=m.maxCols||nv;
  if(!m.rows.length){doc.setFont("times","italic");doc.setFontSize(9.5);doc.setTextColor(...PC.muted);doc.text(pt(m.empty||"Nothing to show."),PM,y+6);return y+10;}
  const chunks=[];for(let i=0;i<nv;i+=maxV)chunks.push([i,Math.min(nv,i+maxV)]);
  chunks.forEach(([a,b],ci)=>{
    if(chunks.length>1){y=ensure(doc,y,14);doc.setFont("times","italic");doc.setFontSize(8.3);doc.setTextColor(...PC.muted);doc.text(pt(m.flat[a+1]+" to "+m.flat[b]),PM,y+3.5);y+=5;}
    if(title){y=ensure(doc,y,14);doc.setFont("times","bold");doc.setFontSize(10);doc.setTextColor(...PC.ink);doc.text(pt(title),PM,y+4);y+=6;}
    const n=b-a+1;
    const head=(m.head&&chunks.length===1)?m.head.map(r=>r.map(c=>typeof c==="string"?pt(c):Object.assign({},c,{content:pt(c.content)}))):[[pt(m.flat[0])].concat(m.flat.slice(a+1,b+1).map(pt))];
    const body=m.rows.map(r=>r.kind==="h"?[{content:pt(r.label),colSpan:n}]:[pt(r.label)].concat(r.vals.slice(a,b).map(pnum)));
    const cs={0:{cellWidth:m.widths?m.widths[0]:42,halign:"left"}};
    for(let j=1;j<n;j++){const al=m.align?m.align[a+j]:"r";cs[j]={halign:al==="l"?"left":al==="c"?"center":"right"};if(m.widths&&m.widths[a+j]!=null)cs[j].cellWidth=m.widths[a+j];}
    doc.autoTable({startY:y,theme:"plain",margin:{left:PM,right:PM,top:22,bottom:20},rowPageBreak:"avoid",head,body,columnStyles:cs,
      styles:{font:"times",fontSize:m.fs||7.5,textColor:PC.ink,cellPadding:{top:1,bottom:1,left:1.1,right:1.1},valign:"middle",lineColor:PC.rule,lineWidth:{bottom:0.1},overflow:"linebreak"},
      headStyles:{fillColor:PC.band,fontStyle:"bold",halign:"center",valign:"middle",fontSize:(m.fs||7.5)-0.2,lineWidth:{bottom:0.25},lineColor:PC.ink},
      didParseCell:c=>{if(c.section!=="body")return;const r=m.rows[c.row.index],s=c.cell.styles;if(!r)return;
        if(r.kind==="h"){s.fontStyle="bold";s.fillColor=PC.band;s.halign="left";}
        if(r.kind==="subt"||r.kind==="tot")s.fontStyle="bold";
        if(m.hi>=0&&c.column.index-1+a===m.hi&&r.kind!=="h")s.fillColor=[226,239,229];},
      didDrawCell:c=>{if(c.section!=="body")return;const r=m.rows[c.row.index];if(!r||r.kind!=="tot")return;
        doc.setDrawColor(...PC.ink);doc.setLineWidth(0.2);doc.line(c.cell.x,c.cell.y+0.2,c.cell.x+c.cell.width,c.cell.y+0.2);
        const yb=c.cell.y+c.cell.height;doc.line(c.cell.x,yb-0.2,c.cell.x+c.cell.width,yb-0.2);doc.line(c.cell.x,yb+0.5,c.cell.x+c.cell.width,yb+0.5);}});
    y=doc.lastAutoTable.finalY+(ci<chunks.length-1?6:3);
  });
  if(m.foot){y=ensure(doc,y,8);doc.setFont("times","italic");doc.setFontSize(7.8);doc.setTextColor(...PC.muted);doc.text(pt(m.foot),PM,y+3.5);y+=6;}
  if(m.after){y=pdfGridTable(doc,Object.assign({fs:m.fs,align:["l","l","r","r","r","r","r"]},m.after),y+4,m.after.title);}
  return y;
}
function pdfNotes(doc,m,y){
  const width=PW-2*PM;
  for(const n of m.notes){
    /* keep a note's heading with its first lines or its table */
    y=ensure(doc,y,n.ppe?64:n.ratios?60:n.brk?38:26);
    doc.setFont("times","bold");doc.setFontSize(10.5);doc.setTextColor(...PC.green);doc.text(String(n.no),PM,y+4);
    doc.setTextColor(...PC.ink);doc.text(pt(n.title),PM+8,y+4);
    doc.setDrawColor(...PC.rule);doc.setLineWidth(0.2);doc.line(PM,y+6,PW-PM,y+6);y+=10;
    if(n.body){doc.setFont("times","normal");doc.setFontSize(9.3);doc.setTextColor(...PC.ink);
      for(const para of n.body.split(/\n/)){if(!para.trim()){y+=1.8;continue;}
        for(const ln of doc.splitTextToSize(pt(para),width)){y=ensure(doc,y,5);doc.text(ln,PM,y+3);y+=4.3;}}
      y+=1.5;}
    if(n.brk){const b=n.brk;
      doc.autoTable({startY:y,theme:"plain",margin:{left:PM,right:PM,top:22,bottom:20},
        head:[["Particulars",pt(b.cols[0]),pt(b.cols[1])]],
        body:b.rows.map(r=>[pt(r.label),pnum(r.cur),pnum(r.prev)]).concat([["Total",pnum(b.tot),pnum(b.ptot)]]),
        styles:{font:"times",fontSize:9,textColor:PC.ink,cellPadding:{top:1,bottom:1,left:1.2,right:1.8}},
        headStyles:{fontStyle:"bold",fontSize:8,textColor:PC.muted,halign:"right",valign:"bottom"},
        columnStyles:{0:{cellWidth:"auto"},1:{cellWidth:32,halign:"right"},2:{cellWidth:32,halign:"right",textColor:PC.muted}},
        didParseCell:c=>{if(c.section==="head"&&c.column.index===0)c.cell.styles.halign="left";if(c.section==="body"&&c.row.index===b.rows.length){c.cell.styles.fontStyle="bold";c.cell.styles.cellPadding={top:1.8,bottom:1.8,left:1.2,right:1.8};}},
        didDrawCell:c=>{if(c.section==="head"){doc.setDrawColor(...PC.ink);doc.setLineWidth(0.2);doc.line(c.cell.x,c.cell.y+c.cell.height,c.cell.x+c.cell.width,c.cell.y+c.cell.height);return;}
          if(c.section==="body"&&c.row.index===b.rows.length&&c.column.index>0){const x1=c.cell.x+4,x2=c.cell.x+c.cell.width-1,yb=c.cell.y+c.cell.height-0.4;doc.setDrawColor(...PC.ink);doc.setLineWidth(0.2);doc.line(x1,c.cell.y+0.3,x2,c.cell.y+0.3);doc.line(x1,yb,x2,yb);doc.line(x1,yb+0.7,x2,yb+0.7);}}});
      y=doc.lastAutoTable.finalY+3;}
    if(n.ppe)y=pdfGridTable(doc,Object.assign({},m.fa,{fs:6.6}),y+1);
    if(n.ratios)y=pdfGridTable(doc,Object.assign({},n.ratios,{fs:6.8}),y+1);
    if(!n.body&&!n.brk&&!n.ppe&&!n.ratios){doc.setFont("times","italic");doc.setFontSize(8.8);doc.setTextColor(...PC.muted);doc.text("No details entered.",PM,y+2);y+=5;}
    y+=5;
  }
  return y;
}
function pdfSign(doc,y){
  const R=rpt(),col=(PW-2*PM)/2,L=PM,Rx=PM+col+6,dash="________________________";
  y=ensure(doc,y+8,66);
  doc.setTextColor(...PC.ink);
  const t=(s,x,yy,b,it,sz)=>{doc.setFont("times",b?"bold":it?"italic":"normal");doc.setFontSize(sz||8.8);doc.text(pt(s),x,yy);};
  let yl=y;
  t("As per our report of even date attached",L,yl,false,true);yl+=5;
  t("For "+(R.auditor||dash),L,yl,true);yl+=4.2;t("Chartered Accountants",L,yl);yl+=4.2;t("Firm Registration No. "+(R.frn||"__________"),L,yl);yl+=15;
  t(R.partner||dash,L,yl,true);yl+=4.2;t("Partner",L,yl);yl+=4.2;t("Membership No. "+(R.mno||"__________"),L,yl);
  let yr=y;
  t("For and on behalf of the Board of Directors of",Rx,yr,false,true);yr+=5;t(CO.name,Rx,yr,true);yr+=15;
  const sig=(name,des,din,x,yy)=>{t(name||dash,x,yy,true);t(des,x,yy+4.2);if(din!==undefined)t("DIN "+(din||"__________"),x,yy+8.4);};
  const half=(col-6)/2;
  sig(R.d1name,R.d1des,R.d1din,Rx,yr);sig(R.d2name,R.d2des||"Director",R.d2din,Rx+half+4,yr);yr+=18;
  if(R.cfo||R.cs){yr+=8;if(R.cfo)sig(R.cfo,R.cfodes||"Chief Financial Officer",undefined,Rx,yr);if(R.cs)sig(R.cs,"Company Secretary",undefined,Rx+half+4,yr);yr+=10;}
  const date=R.dates[fyId(sel)]?fmtD(pd(R.dates[fyId(sel)])):"__________";
  const yb=Math.max(yl,yr)+9;
  t("Place: "+(R.place||"__________"),L,yb);t("Date: "+date,L,yb+4.2);
  t("Place: "+(R.place||"__________"),Rx,yb);t("Date: "+date,Rx,yb+4.2);
  return yb+8;
}
function pdfCover(doc,list){
  const d=yearData(sel);const fin=d&&d.status==="final";
  doc.setFillColor(...PC.green);doc.rect(PM,34,22,1.3,"F");
  doc.setFont("times","normal");doc.setFontSize(9);doc.setTextColor(...PC.muted);doc.text("FINANCIAL STATEMENTS · "+fyLabel(sel).toUpperCase(),PM,44,{charSpace:0.5});
  doc.setFont("times","bold");doc.setFontSize(24);doc.setTextColor(...PC.ink);doc.text(doc.splitTextToSize(pt(CO.name),PW-2*PM),PM,58);
  doc.setFont("times","italic");doc.setFontSize(13);doc.setTextColor(...PC.ink);doc.text("for the year ended "+endLabel(sel),PM,80);
  doc.setFont("times","normal");doc.setFontSize(9);doc.setTextColor(...PC.muted);
  doc.text("CIN "+CO.cin,PM,92);doc.text(pt("Registered office: "+REG_ADDR),PM,97);
  doc.text("Prepared under Schedule III (Division I) to the Companies Act, 2013",PM,102);
  const bx=PM,by=112;doc.setDrawColor(...(fin?PC.green:PC.gold));doc.setLineWidth(0.35);doc.roundedRect(bx,by,PW-2*PM,12,1.5,1.5,"S");
  doc.setFont("times","bold");doc.setFontSize(9.5);doc.setTextColor(...(fin?PC.green:PC.gold));
  doc.text(fin?"Finalised on "+fmtD(Date.parse(d.finalisedAt||"")):"Draft for review — figures may change before finalisation",bx+4,by+7.6);
  doc.setFont("times","bold");doc.setFontSize(11);doc.setTextColor(...PC.ink);doc.text("Contents",PM,142);
  doc.setDrawColor(...PC.rule);doc.setLineWidth(0.2);doc.line(PM,145,PW-PM,145);
  const g=new Date();
  doc.setFont("times","normal");doc.setFontSize(8);doc.setTextColor(...PC.muted);
  doc.text("Generated "+g.getDate()+" "+MON[g.getMonth()]+" "+g.getFullYear()+", "+String(g.getHours()).padStart(2,"0")+":"+String(g.getMinutes()).padStart(2,"0")+" · amounts in "+unitPlain(),PM,PH-22);
}
function pdfToc(doc,toc){
  let y=152;doc.setFontSize(10);
  for(const e of toc){
    doc.setFont("times","normal");doc.setTextColor(...PC.ink);
    const label=pt((e.annex?e.annex+" · ":"")+e.title);doc.text(label,PM,y);
    const pg=String(e.page);doc.text(pg,PW-PM,y,{align:"right"});
    const x1=PM+doc.getTextWidth(label)+2,x2=PW-PM-doc.getTextWidth(pg)-2;
    doc.setTextColor(...PC.rule);let dots="";while(doc.getTextWidth(dots+" .")<x2-x1)dots+=" .";doc.text(dots,x2,y,{align:"right"});
    y+=7;
  }
}
function pdfChrome(doc,spans,opts){
  const n=doc.getNumberOfPages();const d=yearData(sel);const fin=d&&d.status==="final";
  for(let i=1;i<=n;i++){
    doc.setPage(i);
    if(opts.wm){doc.saveGraphicsState();doc.setGState(new doc.GState({opacity:0.07}));doc.setFont("times","bold");doc.setFontSize(96);doc.setTextColor(...PC.ink);doc.text("DRAFT",PW/2+8,PH/2+30,{align:"center",angle:40});doc.restoreGraphicsState();}
    if(opts.cover&&i===1)continue;
    const sp=spans.find(s=>i>=s.from&&i<=s.to);
    doc.setFont("times","normal");doc.setFontSize(7.8);doc.setTextColor(...PC.muted);
    doc.text(pt(CO.name),PM,11);if(sp)doc.text(pt((sp.annex?sp.annex+" · ":"")+sp.title),PW-PM,11,{align:"right"});
    doc.setDrawColor(...PC.green);doc.setLineWidth(0.3);doc.line(PM,13,PW-PM,13);
    doc.setDrawColor(...PC.rule);doc.setLineWidth(0.2);doc.line(PM,PH-14,PW-PM,PH-14);
    doc.text(fyLabel(sel)+(fin?"":" · Draft"),PM,PH-9.5);doc.text("Page "+i+" of "+n,PW-PM,PH-9.5,{align:"right"});
  }
}
async function buildPDF(keys,opts){
  await needLib("jspdf");await needLib("autotable");
  const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4",orientation:"portrait",compress:true});
  doc.setProperties({title:SHORT+" "+fyLabel(sel)+(keys.length===1?" "+(SECTIONS.find(s=>s.k===keys[0])||{n:""}).n:" Financial Statements"),author:CO.name,creator:"TruFin Accounts"});
  const spans=[],toc=[];let first=true;
  if(opts.cover){pdfCover(doc);first=false;}
  for(const k of keys){
    const sdef=SECTIONS.find(s=>s.k===k);const m=k.startsWith("asset:")?modelAsset(assets.find(a=>a.id===k.slice(6))):sdef.m();
    if(opts.bundle&&ANNEX[k])m.annex=ANNEX[k];
    if(!first)doc.addPage();first=false;
    const from=doc.getNumberOfPages();
    let y=pdfTitle(doc,m);
    if(m.type==="stmt"){y=pdfStmt(doc,m,y);if(opts.sign&&m.sign)y=pdfSign(doc,y);}
    else if(m.type==="grid")y=pdfGridTable(doc,m,y);
    else if(m.type==="notes")y=pdfNotes(doc,m,y);
    else if(m.type==="multi")y=pdfMulti(doc,m,y);
    spans.push({from,to:doc.getNumberOfPages(),title:m.title,annex:m.annex});toc.push({title:m.title,annex:m.annex,page:from});
    if(opts.progress)opts.progress();
  }
  if(opts.cover){doc.setPage(1);pdfToc(doc,toc);}
  pdfChrome(doc,spans,opts);
  return doc.output("blob");
}

/* ---- Excel ---- */
function flatRows(m){
  const u=v=>v==null||v===""?"":(typeof v==="number"?r2(v/unit):v);
  if(m.type==="stmt")return {head:["","Particulars","Note",m.cols[0].replace("\n"," "),m.cols[1].replace("\n"," ")],
    rows:m.rows.map(r=>[r.n||"","    ".repeat(r.ind||0)+r.label,r.note||"",r.cur===undefined?"":u(r.cur),r.prev===undefined?"":u(r.prev)])};
  if(m.type==="multi"){const rows=[];
    for(const b of m.blocks){rows.push([b.title]);
      if(b.t==="para")for(const l of b.lines)if(l.trim())rows.push([l]);
      if(b.t==="bars"){rows.push(["Year","Revenue","EBITDA","Profit after tax"]);b.yrs.forEach(f=>rows.push([fyLabel(f.Y),u(f.rev),u(f.ebitda),u(f.pat)]));}
      if(b.t==="grid"){const f=flatRows(Object.assign({type:"grid"},b.m));rows.push(f.head);f.rows.forEach(r=>rows.push(r));}
      rows.push([]);}
    return {head:[m.title+(m.sub?" — "+m.sub:"")],rows};}
  if(m.type==="grid"){const rows=m.rows.map(r=>r.kind==="h"?[r.label]:[r.label].concat(r.vals.map(u)));
    if(m.after){rows.push([],[m.after.title],m.after.flat);m.after.rows.forEach(r=>rows.push([r.label].concat(r.vals.map(u))));}
    if(m.foot)rows.push([],[m.foot]);
    return {head:m.flat,rows};}
  const rows=[];
  for(const n of m.notes){rows.push(["Note "+n.no,n.title]);
    if(n.body)for(const p of n.body.split(/\n/))if(p.trim())rows.push(["",p]);
    if(n.brk){rows.push(["","Particulars",n.brk.cols[0].replace("\n"," "),n.brk.cols[1].replace("\n"," ")]);n.brk.rows.forEach(r=>rows.push(["",r.label,u(r.cur),u(r.prev)]));rows.push(["","Total",u(n.brk.tot),u(n.brk.ptot)]);}
    if(n.ppe){const f=flatRows(m.fa);rows.push(["",...f.head]);f.rows.forEach(r=>rows.push(["",...r]));}
    if(n.ratios){const f=flatRows(n.ratios);rows.push(["",...f.head]);f.rows.forEach(r=>rows.push(["",...r]));}
    rows.push([]);}
  return {head:["Note","Details"],rows};
}
async function buildXLSX(keys){
  await needLib("xlsx");const X=window.XLSX;const wb=X.utils.book_new();const used={};
  const cover=[[CO.name],["CIN "+CO.cin],["Financial statements for the year ended "+endLabel(sel)],[isFinal(sel)?"Finalised":"Draft for review"],["Amounts in "+unitName()+" unless otherwise stated"],[],["Sheet","Contents"]];
  const sheets=[];
  for(const k of keys){const sdef=SECTIONS.find(s=>s.k===k);const m=k.startsWith("asset:")?modelAsset(assets.find(a=>a.id===k.slice(6))):sdef.m();
    const f=flatRows(m);const aoa=[[CO.name],[m.title+(m.sub?" — "+m.sub:"")],["Amounts in "+unitName()],[],f.head].concat(f.rows);
    const ws=X.utils.aoa_to_sheet(aoa);
    const range=X.utils.decode_range(ws["!ref"]);
    for(let R=5;R<=range.e.r;R++)for(let C=0;C<=range.e.c;C++){const c=ws[X.utils.encode_cell({r:R,c:C})];if(c&&c.t==="n")c.z=unit===1?'#,##0;(#,##0);"-"':'#,##0.00;(#,##0.00);"-"';}
    const widths=f.head.map((h,i)=>({wch:i===0?(m.type==="stmt"?5:Math.max(14,Math.min(46,...f.rows.map(r=>String(r[0]||"").length)))):(m.type==="stmt"&&i===1?60:m.type==="notes"&&i===1?90:Math.max(12,Math.min(28,String(h).length+2)))}));
    ws["!cols"]=widths;
    let name=(ANNEX[k]?ANNEX[k].replace("Annexure ","")+" ":"")+(m.type==="grid"&&k.startsWith("asset:")?"Asset "+(m.title||""):(sdef?sdef.n:m.title));
    name=name.replace(/[\\\/\?\*\[\]:]/g,"").slice(0,31);let nm=name,i=2;while(used[nm])nm=name.slice(0,28)+" "+(i++);used[nm]=1;
    sheets.push([nm,ws]);cover.push([nm,m.title]);}
  const cws=X.utils.aoa_to_sheet(cover);cws["!cols"]=[{wch:34},{wch:60}];
  X.utils.book_append_sheet(wb,cws,"Cover");
  for(const [n,ws] of sheets)X.utils.book_append_sheet(wb,ws,n);
  const out=X.write(wb,{bookType:"xlsx",type:"array"});
  return new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
function buildCSV(k){
  const sdef=SECTIONS.find(s=>s.k===k);const m=k.startsWith("asset:")?modelAsset(assets.find(a=>a.id===k.slice(6))):sdef.m();
  const q=v=>{v=String(v==null?"":v).replace(/\s+/g," ").trim();return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const f=flatRows(m);
  const lines=[q(CO.name),q(m.title+(m.sub?" — "+m.sub:"")),q("Amounts in "+unitName()),"",f.head.map(q).join(",")].concat(f.rows.map(r=>r.map(q).join(",")));
  return new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
}

/* ---- ZIP: the complete pack ---- */
async function fileBlob(x){
  if(isLocal){const rec=await idbGet(x.blob);return rec?rec.blob:null;}
  const r=await fetch("/_blob/"+x.blob);if(!r.ok)throw new Error(r.status);return r.blob();
}
async function buildZIP(keys,opts){
  await needLib("jszip");
  const zip=new window.JSZip();const base=SHORT+" "+fyLabel(sel);
  exp.step="Annual report (PDF)";renderExport();
  zip.file(base+" - Financial Statements.pdf",await buildPDF(keys,Object.assign({},opts,{cover:true,bundle:true})));
  exp.step="Workbook (Excel)";renderExport();
  zip.file(base+" - Workbook.xlsx",await buildXLSX(keys));
  const secF=zip.folder("Sections");let i=1;
  for(const k of keys){const s=SECTIONS.find(x=>x.k===k);exp.step=s.n;renderExport();
    secF.file(String(i++).padStart(2,"0")+" "+(ANNEX[k]?ANNEX[k]+" - ":"")+s.n+".pdf",await buildPDF([k],Object.assign({},opts,{cover:false,bundle:true})));}
  const list=docs.filter(x=>x.fy===String(sel));
  if(opts.files&&list.length){
    const dF=zip.folder("Documents");const miss=[];const seen={};
    for(const x of list){exp.step="Documents · "+(x.title||x.fileName);renderExport();
      try{const b=await fileBlob(x);if(!b){miss.push(x.fileName);continue;}
        const folder=docTypeName(x.type).replace(/[\\\/:*?"<>|]/g,"-");
        let nm=(x.fileName||"file").replace(/[\\\/:*?"<>|]/g,"-");if(seen[folder+nm]){nm=nm.replace(/(\.[^.]+)?$/,"-"+x.id.slice(-4)+"$1");}seen[folder+nm]=1;
        dF.folder(folder).file(nm,b);}catch(_){miss.push(x.fileName);}}
    if(miss.length)dF.file("_not included.txt","These files couldn’t be read when the pack was built:\r\n"+miss.join("\r\n"));
  }
  exp.step="Compressing";renderExport();
  return zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
}

/* ---- saving ---- */
async function saveBlob(filename,blob){
  if(downloads){try{await downloads.save({filename,data:blob});return true;}catch(e){if(e&&e.code==="declined")return false;toast(e&&e.code==="rejected_extension"?"That file type can’t be downloaded here.":"Download unavailable here.");return false;}}
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);return true;
}
const fname=(what,ext)=>(SHORT+" "+fyLabel(sel)+" - "+what+"."+ext).replace(/[\\\/:*?"<>|]/g,"-");
async function downloadSection(k,fmtx){
  const label=k.startsWith("asset:")?"Asset schedule "+((assets.find(a=>a.id===k.slice(6))||{}).tag||(assets.find(a=>a.id===k.slice(6))||{}).name||""):SECTIONS.find(s=>s.k===k).n;
  const busyKey=k+":"+fmtx;if(exp.busy)return;exp.busy=busyKey;exp.msg="";renderExport();markBusy(busyKey,true);
  try{
    let blob,ext=fmtx;
    if(fmtx==="pdf")blob=await buildPDF([k],{cover:false,sign:exp.sign,wm:exp.wm});
    else if(fmtx==="xlsx")blob=await buildXLSX([k]);
    else blob=buildCSV(k);
    if(await saveBlob(fname(label,ext),blob))toast("Downloaded "+label);
  }catch(e){console.error(e);toast(e.message||"Couldn’t build the file.");}
  exp.busy=false;renderExport();markBusy(busyKey,false);
}
async function downloadAll(){
  const keys=SECTIONS.map(s=>s.k).filter(k=>exp.inc[k]);
  if(!keys.length){exp.msg="Choose at least one section.";renderExport();return;}
  exp.busy="all";exp.msg="";exp.step="";renderExport();
  try{
    let blob,ext;const opts={sign:exp.sign,wm:exp.wm,files:exp.files};
    if(exp.fmt==="pdf"){let done=0;opts.cover=true;opts.bundle=true;opts.progress=()=>{done++;exp.step=done+" of "+keys.length+" sections";renderExport();};blob=await buildPDF(keys,opts);ext="pdf";}
    else if(exp.fmt==="xlsx"){exp.step="Building workbook";renderExport();blob=await buildXLSX(keys);ext="xlsx";}
    else{blob=await buildZIP(keys,opts);ext="zip";}
    const what={pdf:"Financial Statements",xlsx:"Workbook",zip:"Complete Pack"}[exp.fmt];
    if(await saveBlob(fname(what,ext),blob))exp.msg="Downloaded "+fname(what,ext)+" · "+fmtSize(blob.size);
  }catch(e){exp.msg=e.message||"Couldn’t build the download.";}
  exp.busy=false;exp.step="";renderExport();
}
function markBusy(key,on){ROOT.querySelectorAll(`[data-dl="${key.split(":").slice(0,-1).join(":")}"][data-fmt="${key.split(":").pop()}"]`).forEach(b=>{b.disabled=on;b.classList.toggle("busy",on);});}

/* ---- download panel ---- */
let exp={open:false,fmt:"pdf",inc:{bs:1,pl:1,notes:1,dep:1,my:1,reg:1,scr:1,sdr:1,docs:1,an:1},sign:true,wm:true,files:true,busy:false,msg:"",step:""};
const DLICON=`<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 2v8m0 0-3.2-3.2M8 10l3.2-3.2M3 13h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const dlMenu=(k,label,lead)=>(downloads||isLocal)?`<div class="dl" role="group" aria-label="Download ${esc(label||"")}"><span class="dl-l" title="Download this section">${DLICON}${esc(lead||"This section")}</span><button data-dl="${esc(k)}" data-fmt="pdf">PDF</button><button data-dl="${esc(k)}" data-fmt="xlsx">Excel</button><button data-dl="${esc(k)}" data-fmt="csv">CSV</button></div>`:"";
/* "Full FY set" menu shown beside every section's own download buttons */
let fyPop=false;
function fyMenu(){
  if(!(downloads||isLocal))return "";
  const busy=exp.busy==="all";
  const n=docs.filter(x=>x.fy===String(sel)).length;
  return `<div class="fyset"><button class="btn small fyset-b" data-fypop aria-haspopup="menu" aria-expanded="${fyPop}" ${exp.busy&&!busy?"disabled":""}>${busy?`<span class="spin" aria-hidden="true"></span>Building ${fyLabel(sel)} set…`:`${DLICON}Full ${fyLabel(sel)} set<span aria-hidden="true" class="caret">▾</span>`}</button>
   ${fyPop&&!busy?`<div class="fyset-m" role="menu">
     <button role="menuitem" data-fyall="pdf"><strong>Annual report</strong><span>All statements, notes and annexures in one PDF</span><em>PDF</em></button>
     <button role="menuitem" data-fyall="xlsx"><strong>Workbook</strong><span>One sheet per section</span><em>Excel</em></button>
     <button role="menuitem" data-fyall="zip"><strong>Complete pack</strong><span>Report, workbook, section PDFs${n?" and "+n+" document"+(n===1?"":"s"):""}</span><em>ZIP</em></button>
     <button role="menuitem" data-fyopts class="more">Choose sections and options…</button></div>`:""}</div>`;
}
const dlBar=(k,label)=>`<div class="toolbar dlbar">${dlMenu(k,label)}${fyMenu()}</div>`;
async function quickAll(fmtx){
  fyPop=false;exp.fmt=fmtx;exp.wm=!isFinal(sel);for(const s of SECTIONS)exp.inc[s.k]=1;exp.files=true;
  render();
  await downloadAll();render();if(exp.msg)toast(exp.msg);
}
async function downloadDocFile(id){
  const x=docs.find(d=>d.id===id);if(!x)return;
  if(isLocal){openLocalDoc(id,true);return;}
  try{const b=await fileBlob(x);if(await saveBlob(x.fileName||"document",b))toast("Downloaded "+(x.title||x.fileName));}
  catch(e){toast("Couldn’t fetch that file. Try Open instead.");}
}
async function downloadAllDocs(){
  const list=docs.filter(x=>docFilter==="all"||x.fy===String(sel)).sort((a,b)=>(+a.fy-+b.fy)||DOC_TYPES.findIndex(t=>t.k===a.type)-DOC_TYPES.findIndex(t=>t.k===b.type));
  if(!list.length||exp.busy)return;
  exp.busy="docs";render();
  try{
    await needLib("jszip");const zip=new window.JSZip();const seen={};const miss=[];
    const q=v=>{v=String(v==null?"":v).replace(/\s+/g," ").trim();return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
    const idx=[["Financial year","Document type","Title","Reference no.","Date","Amount (₹)","Remarks","File in this ZIP"].join(",")];
    for(const x of list){
      const folder=(docFilter==="all"?fyLabel(+x.fy)+"/":"")+docTypeName(x.type).replace(/[\\\/:*?"<>|]/g,"-");
      let nm=(x.fileName||"file").replace(/[\\\/:*?"<>|]/g,"-");if(seen[folder+"/"+nm])nm=nm.replace(/(\.[^.]+)?$/,"-"+x.id.slice(-4)+"$1");seen[folder+"/"+nm]=1;
      let ok=true;try{const b=await fileBlob(x);if(b)zip.file(folder+"/"+nm,b);else ok=false;}catch(_){ok=false;}
      if(!ok)miss.push(x.fileName);
      idx.push([fyLabel(+x.fy),docTypeName(x.type),x.title,x.ref,x.date,x.amount||"",x.remarks,ok?folder+"/"+nm:"(not included)"].map(q).join(","));
    }
    zip.file("Documents index.csv","﻿"+idx.join("\r\n"));
    const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
    const name=docFilter==="all"?(SHORT+" - All documents.zip"):fname("Documents","zip");
    if(await saveBlob(name,blob))toast("Downloaded "+(list.length-miss.length)+" of "+list.length+" documents"+(miss.length?" · "+miss.length+" couldn’t be read":""));
  }catch(e){toast(e.message||"Couldn’t build the ZIP.");}
  exp.busy=false;render();
}
function openExport(){exp.open=true;exp.wm=!isFinal(sel);exp.msg="";renderExport();$("#exp").hidden=false;$("#scrim").hidden=false;document.body.style.overflow="hidden";setTimeout(()=>{const f=$("#exp .x");if(f)f.focus();},30);}
function closeExport(){if(exp.busy==="all")return;exp.open=false;$("#exp").hidden=true;$("#scrim").hidden=true;document.body.style.overflow="";$("#dlBtn").focus();}
function renderExport(){
  const el=$("#exp");if(!el||!exp.open)return;
  const d=yearData(sel);const fin=d&&d.status==="final";
  const nDocs=docs.filter(x=>x.fy===String(sel)).length;
  const F=[
    {k:"pdf",t:"Annual report",e:"PDF",d:"Cover and contents, the statements with signature blocks, notes and annexures, paginated and print-ready."},
    {k:"xlsx",t:"Workbook",e:"Excel",d:"A cover sheet plus one sheet per section. Amounts stay as numbers you can check and sum."},
    {k:"zip",t:"Complete pack",e:"ZIP",d:"The annual report, the workbook, every section as its own PDF"+(nDocs?", and the "+nDocs+" uploaded document"+(nDocs===1?"":"s")+" filed by type":"")+"."}];
  const cta={pdf:"Download annual report",xlsx:"Download workbook",zip:"Download complete pack"}[exp.fmt];
  const busyAll=exp.busy==="all";
  el.innerHTML=`<div class="exp-head">
     <div><div class="eyebrow">Download</div><h2 id="expTitle">${fyLabel(sel)} financial statements</h2>
       <div class="exp-meta"><span class="pill ${fin?"final":"draft"}">${fin?"Finalised":"Draft"}</span><span>Amounts in <select id="expUnit" aria-label="Amounts in">${[[1,"₹"],[1000,"₹ thousands"],[100000,"₹ lakhs"],[10000000,"₹ crores"]].map(([v,l])=>`<option value="${v}" ${unit===v?"selected":""}>${l}</option>`).join("")}</select></span></div></div>
     <button class="x" data-x aria-label="Close">✕</button></div>
   <div class="exp-body">
    <section class="exp-block"><h3>The whole year, as one download</h3>
     <div class="fmts" role="radiogroup" aria-label="Format">${F.map(f=>`<button class="fmt" role="radio" aria-checked="${exp.fmt===f.k}" data-fmtpick="${f.k}"><span class="fmt-top"><strong>${f.t}</strong><span class="ext">${f.e}</span></span><span class="fmt-d">${f.d}</span></button>`).join("")}</div>
     <h4>Include</h4>
     <div class="incs">${SECTIONS.map(s=>`<label class="inc"><input type="checkbox" data-inc="${s.k}" ${exp.inc[s.k]?"checked":""}><span><strong>${ANNEX[s.k]?`<em>${ANNEX[s.k].replace("Annexure","Annex.")}</em> `:""}${esc(s.n)}</strong><span class="hint">${esc(s.d())}</span></span></label>`).join("")}</div>
     <h4>Options</h4>
     <div class="opts">
      <label class="tog"><input type="checkbox" data-opt="sign" ${exp.sign?"checked":""}><span>Signature blocks under the Balance Sheet and P&amp;L</span></label>
      <label class="tog"><input type="checkbox" data-opt="wm" ${exp.wm?"checked":""}><span>“DRAFT” watermark on PDF pages${fin?"":" · recommended until finalised"}</span></label>
      ${exp.fmt==="zip"?`<label class="tog"><input type="checkbox" data-opt="files" ${exp.files?"checked":""} ${nDocs?"":"disabled"}><span>Uploaded documents (${nDocs})</span></label>`:""}
     </div>
     <button class="btn primary big" data-all ${exp.busy?"disabled":""}>${busyAll?`<span class="spin" aria-hidden="true"></span>Building${exp.step?" · "+esc(exp.step):"…"}`:cta}</button>
     <p class="exp-msg" aria-live="polite">${esc(exp.msg)}</p>
    </section>
    <section class="exp-block"><h3>One section at a time</h3>
     <ul class="secs">${SECTIONS.map(s=>`<li><div><strong>${esc(s.n)}</strong><span class="hint">${esc(s.d())}</span></div>
        <div class="dl compact" role="group" aria-label="Download ${esc(s.n)}">${["pdf","xlsx","csv"].map(f=>`<button data-dl="${s.k}" data-fmt="${f}" ${exp.busy?"disabled":""} class="${exp.busy===s.k+":"+f?"busy":""}">${{pdf:"PDF",xlsx:"Excel",csv:"CSV"}[f]}</button>`).join("")}</div></li>`).join("")}</ul>
     <p class="sub">Auditor and signatory details for the signature blocks come from <button class="btn link" data-gosign>Settings · Report signatures</button>.</p>
    </section>
   </div>`;
}

/* ================= Financial analysis ================= */
let anView="overview";
try{const v=localStorage.getItem("trufin.an");if(v)anView=v;}catch(e){}
const div=(a,b)=>(b!=null&&a!=null&&isFinite(a)&&isFinite(b)&&Math.abs(b)>1e-9)?a/b:null;
const pct=x=>x==null?null:x*100;
const UNITW={1:"",1000:" thousand",100000:" lakh",10000000:" crore"};
function money(v){if(v==null||isNaN(v))return "–";const s="₹"+fmt(Math.abs(v)).replace(/[()]/g,"")+(UNITW[unit]||"");return v<0?"−"+s:s;}
const pctS=x=>{if(x==null||!isFinite(x))return "–";const a=Math.abs(x),t=(a>=100?Math.round(a).toLocaleString("en-IN"):a.toFixed(1))+"%";return x<0&&t!=="0.0%"?"−"+t:t;};
/* one year's figures, classified for analysis */
function finY(Y){
  if(Y<FIRST_FY||Y>CUR_FY)return null;
  const st=statement(Y,Y===sel);if(!st)return null;
  const p=st.p,b=st.b,d=st.d,g=k=>+p[k]||0,h=k=>+b[k]||0;
  const cogs=g("mat")+g("pur")+g("inv"),emp=g("emp"),fc=g("fin"),dep=g("dep"),te=g("IV");
  const o={Y,st,d,rev:g("I"),oth:g("II"),ti:g("ti"),cogs,emp,fc,dep,te,othx:te-cogs-emp-fc-dep,exc:g("VI"),tax:g("VIII"),ctax:g("ctax"),dtax:g("dtax"),
    pbe:g("pbe"),pbt:g("pbt"),pat:g("pat"),ebitda:g("I")-(te-dep-fc),ebit:g("pbe")+fc,
    nw:h("SF"),samT:h("SAM"),ltb:h("ltb"),stb:h("stb"),debt:h("ltb")+h("stb"),dtl:h("dtl"),dta:h("dta"),
    ca:h("CA"),cl:h("CL"),invt:h("invt"),tr:h("tr"),cash:h("cash"),ci:h("ci"),nci:h("nci"),pay:h("tpm")+h("tpo"),
    ppe:h("ppe"),intg:h("intg"),cwip:h("cwip"),iud:h("iud"),ta:h("ta"),diff:st.diff,an:d.an||{}};
  o.wc=o.ca-o.cl;o.ce=o.nw+o.debt+o.dtl;o.invest=o.nci+o.ci;o.fixed=o.ppe+o.intg;o.tl=h("NCL")+h("CL");o.opEbit=o.ebitda-dep;o.quick=o.ca-o.invt;o.shares=+o.an.shares||0;o.price=+o.an.price||0;
  o.has=!!(o.rev||o.ta||o.te);
  return o;
}
const av=(c,p,k)=>p&&p.has?(c[k]+p[k])/2:c[k];
const posDiv=(a,b)=>b>0?div(a,b):null;
/* ratio library: g group, u unit (x, %, d days, amt), b which direction is better, s3 = Schedule III disclosure */
const G1="Liquidity (short-term survival)",G2="Solvency and leverage (long-term stability)",G3="Efficiency and activity (operational productivity)",G4="Profitability (margin and return quality)",G5="Cash flow and earnings quality",G6="Valuation (market pricing)",G7="Cost structure (share of revenue)";
const CFm=new Map();function CF(c,p){if(!c||!p)return null;const k=c.Y+":"+p.Y;if(!CFm.has(k)||CFm.get(k).t!==memoTick)CFm.set(k,{t:memoTick,v:cashFlow(c,p)});return CFm.get(k).v;}
const perShare=(c,v)=>c.shares>0?v/c.shares:null;
const eps=c=>perShare(c,c.pat),bvps=c=>perShare(c,c.nw),mcap=c=>c.shares>0&&c.price>0?c.shares*c.price:null;
const RATIOS=[
 {g:G1,k:"cr",n:"Current ratio",f:"Current assets ÷ current liabilities. General short-term debt cover; above 1.0 is the usual floor",u:"x",b:"up",s3:["Current assets","Current liabilities"],v:c=>posDiv(c.ca,c.cl)},
 {g:G1,k:"qr",n:"Quick ratio (acid test)",f:"(Current assets − inventories) ÷ current liabilities",u:"x",b:"up",v:c=>posDiv(c.quick,c.cl)},
 {g:G1,k:"cashr",n:"Cash ratio",f:"(Cash and equivalents + current investments) ÷ current liabilities. Strict immediate-payment test",u:"x",b:"up",v:c=>posDiv(c.cash+c.ci,c.cl)},
 {g:G1,k:"dint",n:"Defensive interval",f:"Quick assets ÷ daily operating expenditure (expenses excluding depreciation and finance costs, ÷ 365)",u:"d",b:"up",v:c=>{const d=(c.te-c.dep-c.fc)/365;return d>0?c.quick/d:null;}},
 {g:G1,k:"nwc",n:"Net working capital",f:"Current assets − current liabilities",u:"amt",b:"up",v:c=>c.wc},
 {g:G2,k:"de",n:"Debt-equity ratio (borrowings)",f:"Total borrowings ÷ shareholders’ funds. The Schedule III basis",u:"x",b:"down",s3:["Total borrowings","Shareholders’ equity"],v:c=>posDiv(c.debt,c.nw)},
 {g:G2,k:"tle",n:"Total liabilities to equity",f:"(Non-current + current liabilities) ÷ shareholders’ funds. Leverage and creditor risk",u:"x",b:"down",v:c=>posDiv(c.tl,c.nw)},
 {g:G2,k:"tlta",n:"Debt-to-assets (total liabilities)",f:"Total liabilities ÷ total assets. Share of assets financed by creditors",u:"%",b:"down",v:c=>pct(posDiv(c.tl,c.ta))},
 {g:G2,k:"dtar",n:"Borrowings to total assets",f:"Total borrowings ÷ total assets",u:"%",b:"down",v:c=>pct(posDiv(c.debt,c.ta))},
 {g:G2,k:"eqr",n:"Equity ratio",f:"Shareholders’ funds ÷ total assets",u:"%",b:"up",v:c=>pct(posDiv(c.nw,c.ta))},
 {g:G2,k:"icr",n:"Interest coverage (times interest earned)",f:"EBIT ÷ finance costs",u:"x",b:"up",v:c=>posDiv(c.ebit,c.fc)},
 {g:G2,k:"dscr",n:"Debt service coverage ratio",f:"(PAT + depreciation + finance costs) ÷ (finance costs + principal repaid)",u:"x",b:"up",s3:["Earnings available for debt service","Debt service (interest + principal)"],v:c=>posDiv(c.pat+c.dep+c.fc,c.fc+(+c.an.principal||0))},
 {g:G3,k:"invt",n:"Inventory turnover",f:"Consumables and materials (cost of goods) ÷ average inventories",u:"x",b:"up",s3:["Cost of materials consumed","Average inventories"],v:(c,p)=>posDiv(c.cogs,av(c,p,"invt"))},
 {g:G3,k:"dio",n:"Days inventory outstanding (DSI)",f:"365 ÷ inventory turnover",u:"d",b:"down",v:(c,p)=>{const t=posDiv(c.cogs,av(c,p,"invt"));return t?365/t:null;}},
 {g:G3,k:"trt",n:"Receivables turnover",f:"Revenue ÷ average trade receivables (revenue stands in for net credit sales)",u:"x",b:"up",s3:["Revenue from operations","Average trade receivables"],v:(c,p)=>posDiv(c.rev,av(c,p,"tr"))},
 {g:G3,k:"dso",n:"Days sales outstanding (DSO)",f:"365 ÷ receivables turnover. Average collection period",u:"d",b:"down",v:(c,p)=>{const t=posDiv(c.rev,av(c,p,"tr"));return t?365/t:null;}},
 {g:G3,k:"tpt",n:"Payables turnover",f:"(Materials + other expenses) ÷ average trade payables",u:"x",b:null,s3:["Purchases of goods and services","Average trade payables"],v:(c,p)=>posDiv(c.cogs+c.othx,av(c,p,"pay"))},
 {g:G3,k:"dpo",n:"Days payable outstanding (DPO)",f:"365 ÷ payables turnover",u:"d",b:null,v:(c,p)=>{const t=posDiv(c.cogs+c.othx,av(c,p,"pay"));return t?365/t:null;}},
 {g:G3,k:"ccc",n:"Cash conversion cycle",f:"DSI + DSO − DPO. Days of operations funded by the company itself",u:"d",b:"down",v:(c,p)=>{const a=RV("dio",c,p),b=RV("dso",c,p),d=RV("dpo",c,p);return a==null&&b==null?null:(a||0)+(b||0)-(d||0);}},
 {g:G3,k:"nct",n:"Net capital turnover",f:"Revenue ÷ average working capital",u:"x",b:"up",s3:["Revenue from operations","Average working capital"],v:(c,p)=>posDiv(c.rev,av(c,p,"wc"))},
 {g:G3,k:"ato",n:"Asset turnover",f:"Revenue ÷ average total assets. Sales per rupee of assets",u:"x",b:"up",v:(c,p)=>posDiv(c.rev,av(c,p,"ta"))},
 {g:G3,k:"fato",n:"Fixed asset turnover",f:"Revenue ÷ net property, plant, equipment and intangibles",u:"x",b:"up",v:c=>posDiv(c.rev,c.fixed)},
 {g:G4,k:"gm",n:"Gross profit margin",f:"(Revenue − consumables and materials) ÷ revenue. Pricing power over direct costs",u:"%",b:"up",v:c=>pct(posDiv(c.rev-c.cogs,c.rev))},
 {g:G4,k:"ebitdam",n:"EBITDA margin",f:"EBITDA ÷ revenue",u:"%",b:"up",v:c=>pct(posDiv(c.ebitda,c.rev))},
 {g:G4,k:"ebitm",n:"Operating profit margin (EBIT)",f:"Operating income (EBITDA − depreciation, excluding other income) ÷ revenue",u:"%",b:"up",v:c=>pct(posDiv(c.opEbit,c.rev))},
 {g:G4,k:"pbtm",n:"Pre-tax margin",f:"Profit before tax ÷ revenue",u:"%",b:"up",v:c=>pct(posDiv(c.pbt,c.rev))},
 {g:G4,k:"npm",n:"Net profit margin",f:"Profit after tax ÷ revenue. Bottom-line retention",u:"%",b:"up",s3:["Net profit after tax","Revenue from operations"],v:c=>pct(posDiv(c.pat,c.rev))},
 {g:G4,k:"roa",n:"Return on assets (ROA)",f:"Profit after tax ÷ average total assets",u:"%",b:"up",v:(c,p)=>pct(posDiv(c.pat,av(c,p,"ta")))},
 {g:G4,k:"roe",n:"Return on equity (ROE)",f:"Profit after tax ÷ average shareholders’ funds",u:"%",b:"up",s3:["Net profit after tax","Average shareholders’ equity"],v:(c,p)=>pct(posDiv(c.pat,av(c,p,"nw")))},
 {g:G4,k:"roce",n:"ROCE (Schedule III basis)",f:"EBIT ÷ (net worth + borrowings + deferred tax liability)",u:"%",b:"up",s3:["Earnings before interest and tax","Capital employed"],v:c=>pct(posDiv(c.ebit,c.ce))},
 {g:G4,k:"roce2",n:"ROCE (total assets − current liabilities)",f:"EBIT ÷ (total assets − current liabilities)",u:"%",b:"up",v:c=>pct(posDiv(c.ebit,c.ta-c.cl))},
 {g:G4,k:"roi",n:"Return on investment",f:"Income from investments ÷ average investments",u:"%",b:"up",s3:["Income from investments","Average investments"],v:(c,p)=>{const i=av(c,p,"invest");return c.an.invInc==null||c.an.invInc===""?null:pct(posDiv(+c.an.invInc,i));}},
 {g:G4,k:"etr",n:"Effective tax rate",f:"Tax expense ÷ profit before tax",u:"%",b:null,v:c=>pct(posDiv(c.tax,c.pbt))},
 {g:G5,k:"cfo",n:"Operating cash flow",f:"Net cash from operating activities (derived cash flow)",u:"amt",b:"up",v:(c,p)=>{const f=CF(c,p);return f?f.A:null;}},
 {g:G5,k:"capex",n:"Capital expenditure",f:"Asset additions + increase in capital work-in-progress",u:"amt",b:null,v:(c,p)=>{const f=CF(c,p);return f?f.capex:null;}},
 {g:G5,k:"fcf",n:"Free cash flow",f:"Operating cash flow − capital expenditure",u:"amt",b:"up",v:(c,p)=>{const f=CF(c,p);return f?f.A-f.capex:null;}},
 {g:G5,k:"cfopat",n:"Operating cash flow to net profit",f:"Operating cash flow ÷ profit after tax. Below 1 means profit is not yet cash",u:"x",b:"up",v:(c,p)=>{const f=CF(c,p);return f&&c.pat>0?f.A/c.pat:null;}},
 {g:G5,k:"accr",n:"Accruals ratio",f:"(Profit after tax − operating cash flow) ÷ average total assets. Higher means earnings lean on accruals",u:"%",b:"down",v:(c,p)=>{const f=CF(c,p);return f?pct(posDiv(c.pat-f.A,av(c,p,"ta"))):null;}},
 {g:G5,k:"capdep",n:"Capex to depreciation",f:"Capital expenditure ÷ depreciation. Above 1 means the asset base is growing",u:"x",b:null,v:(c,p)=>{const f=CF(c,p);return f?posDiv(f.capex,c.dep):null;}},
 {g:G6,k:"eps",n:"Earnings per share (EPS)",f:"Profit after tax ÷ shares outstanding",u:"rs",b:"up",v:c=>eps(c)},
 {g:G6,k:"bvps",n:"Book value per share",f:"Shareholders’ funds ÷ shares outstanding",u:"rs",b:"up",v:c=>bvps(c)},
 {g:G6,k:"mcap",n:"Equity value",f:"Value per share × shares outstanding",u:"amt",b:null,v:c=>mcap(c)},
 {g:G6,k:"pe",n:"Price-to-earnings (P/E)",f:"Value per share ÷ EPS",u:"x",b:null,v:c=>{const e=eps(c);return c.price>0&&e>0?c.price/e:null;}},
 {g:G6,k:"pb",n:"Price-to-book (P/B)",f:"Value per share ÷ book value per share",u:"x",b:null,v:c=>{const b=bvps(c);return c.price>0&&b>0?c.price/b:null;}},
 {g:G6,k:"evebitda",n:"EV / EBITDA",f:"(Equity value + borrowings − cash and current investments) ÷ EBITDA. Neutral to capital structure",u:"x",b:null,v:c=>{const m=mcap(c);return m&&c.ebitda>0?(m+c.debt-c.cash-c.ci)/c.ebitda:null;}},
 {g:G6,k:"fcfy",n:"Free cash flow yield",f:"Free cash flow ÷ equity value (FCF per share ÷ value per share)",u:"%",b:null,v:(c,p)=>{const m=mcap(c),f=CF(c,p);return m&&f?pct((f.A-f.capex)/m):null;}},
 {g:G7,k:"cogsp",n:"Consumables and materials",f:"Materials + purchases + inventory change, ÷ revenue",u:"%",b:"down",v:c=>pct(posDiv(c.cogs,c.rev))},
 {g:G7,k:"empp",n:"Employee benefits",f:"Employee benefits expense ÷ revenue",u:"%",b:"down",v:c=>pct(posDiv(c.emp,c.rev))},
 {g:G7,k:"othp",n:"Other expenses",f:"Other expenses ÷ revenue",u:"%",b:"down",v:c=>pct(posDiv(c.othx,c.rev))},
 {g:G7,k:"depp",n:"Depreciation and amortisation",f:"Depreciation ÷ revenue",u:"%",b:null,v:c=>pct(posDiv(c.dep,c.rev))},
 {g:G7,k:"finp",n:"Finance costs",f:"Finance costs ÷ revenue",u:"%",b:"down",v:c=>pct(posDiv(c.fc,c.rev))}
];
const RMAP={};for(const r of RATIOS)RMAP[r.k]=r;
function RV(k,c,p){if(!c||!c.has)return null;const v=RMAP[k].v(c,p&&p.has?p:null);return v==null||!isFinite(v)?null:v;}
function fmtU(u,v){if(v==null||!isFinite(v))return "–";if(u==="x")return v.toFixed(2)+"×";if(u==="%")return pctS(v);if(u==="d")return Math.round(v)+" days";if(u==="amt")return money(v);if(u==="rs")return "₹"+v.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});return String(v);}
function chgU(u,c,p){if(c==null||p==null)return {t:"–",d:null};const d=c-p;
  if((u==="%"&&Math.abs(d)<0.05)||(u==="d"&&Math.abs(d)<0.5)||(u==="x"&&Math.abs(d)<0.005))return {t:"no change",d:0};
  if(u==="%")return {t:(d>=0?"+":"−")+Math.abs(d).toFixed(1)+" pp",d};
  if(u==="d")return {t:(d>=0?"+":"−")+Math.abs(Math.round(d))+" days",d};
  if(u==="x")return {t:(d>=0?"+":"−")+Math.abs(d).toFixed(2),d};
  const r=div(d,Math.abs(p));return {t:r==null?(d?"new":"–"):(r>=0?"+":"−")+pctS(Math.abs(r*100)),d};}
const tone=(b,d)=>b==null||d==null||Math.abs(d)<1e-9?"":((d>0)===(b==="up")?"good":"bad");
const arrow=d=>d==null||Math.abs(d)<1e-9?"":(d>0?"▲":"▼");
const s3var=(c,p)=>c==null||p==null||Math.abs(p)<1e-9?null:(c-p)/Math.abs(p)*100;

/* written observations */
function observations(c,p){
  const O=[];const add=(l,t)=>O.push({l,t});if(!c||!c.has)return O;
  const P=p&&p.has?p:null;
  if(Math.abs(c.diff)>=1)add("risk","The Balance Sheet is out of balance by "+fmtRs(c.diff)+". Balance-sheet ratios and the cash flow are unreliable until it is corrected.");
  if(c.nw<=0&&c.ta)add("risk","Shareholders’ funds are "+(c.nw<0?"negative":"nil")+" ("+money(c.nw)+"). Accumulated losses have eroded the capital.");
  if(P){
    const g=div(c.rev-P.rev,Math.abs(P.rev));
    if(g!=null)add(g>=0.1?"good":g>=0?"info":"watch","Revenue "+(g>=0?"grew ":"fell ")+pctS(Math.abs(g*100))+" to "+money(c.rev)+", from "+money(P.rev)+".");
    const m1=div(c.ebitda,c.rev),m0=div(P.ebitda,P.rev);
    if(m1!=null&&m0!=null){const d=(m1-m0)*100;add(d>=1?"good":d<=-1?"watch":"info","EBITDA margin "+(Math.abs(d)<0.05?"held steady at ":d>0?"improved by "+Math.abs(d).toFixed(1)+" percentage points to ":"narrowed by "+Math.abs(d).toFixed(1)+" percentage points to ")+pctS(m1*100)+" ("+money(c.ebitda)+").");}
    if(c.pat<0&&P.pat>=0)add("risk","The year closed with a loss of "+money(-c.pat)+", against a profit of "+money(P.pat)+" last year.");
    else if(c.pat>0&&P.pat<0)add("good","The company returned to profit: "+money(c.pat)+" after a loss of "+money(-P.pat)+" last year.");
    else if(c.pat<0)add("risk","A loss of "+money(-c.pat)+" for the year, after a loss of "+money(-P.pat)+" last year.");
    else{const gp=div(c.pat-P.pat,Math.abs(P.pat));if(gp!=null&&g!=null&&Math.abs(gp)>=0.05)add(gp>=g?"good":"watch","Profit after tax "+(gp>=0?"rose ":"fell ")+pctS(Math.abs(gp*100))+" to "+money(c.pat)+(gp<g?", slower than revenue":"")+".");}
    if(g!=null)for(const [k,l] of [["cogs","Consumables and materials"],["emp","Employee costs"],["othx","Other expenses"],["fc","Finance costs"]]){
      const gk=div(c[k]-P[k],Math.abs(P[k]));const s1=div(c[k],c.rev),s0=div(P[k],P.rev);
      if(gk!=null&&s1!=null&&s0!=null&&s1>=0.05&&gk-g>0.05)add("watch",l+" rose "+pctS(gk*100)+" against revenue growth of "+pctS(g*100)+", taking them to "+pctS(s1*100)+" of revenue from "+pctS(s0*100)+".");
      else if(gk!=null&&s1!=null&&s0!=null&&s0>=0.05&&g-gk>0.05&&g>0)add("good",l+" grew more slowly than revenue ("+pctS(gk*100)+"), easing to "+pctS(s1*100)+" of revenue from "+pctS(s0*100)+".");}
    const d1=RV("dso",c,P),pp=finY(P.Y-1),d0=RV("dso",P,pp);
    if(d1!=null&&d0!=null&&Math.abs(d1-d0)>=10)add(d1>d0?"watch":"good","Customers took "+Math.round(d1)+" days on average to pay, "+Math.abs(Math.round(d1-d0))+" days "+(d1>d0?"longer":"shorter")+" than last year.");
    const cf=cashFlow(c,P);
    if(cf&&c.ebitda>0){const r=cf.A/c.ebitda;if(r<0.5)add("watch","Only "+pctS(r*100)+" of EBITDA turned into operating cash ("+money(cf.A)+"), mostly because working capital absorbed "+money(-cf.wc)+".");else if(r>=0.8)add("good","Operations generated "+money(cf.A)+" of cash, "+pctS(r*100)+" of EBITDA.");}
    const nwg=div(c.nw-P.nw,Math.abs(P.nw));if(nwg!=null&&Math.abs(nwg)>=0.05&&P.nw>0)add(nwg>0?"info":"watch","Net worth "+(nwg>0?"increased ":"decreased ")+pctS(Math.abs(nwg*100))+" to "+money(c.nw)+".");
  }else add("info","Enter "+fyLabel(c.Y-1)+" figures to see year-on-year changes, average-based ratios and the cash flow.");
  const cr=RV("cr",c,P);if(cr!=null){if(cr<1)add("risk","Current ratio of "+cr.toFixed(2)+"×: current liabilities exceed current assets by "+money(-c.wc)+". Short-term obligations depend on new cash or refinancing.");else if(cr<1.25)add("watch","Current ratio of "+cr.toFixed(2)+"× leaves a thin cushion against short-term obligations.");else if(cr>=1.5)add("good","Current ratio of "+cr.toFixed(2)+"× covers short-term obligations comfortably.");}
  if(c.debt<=0&&c.ta)add("good","No borrowings at the year end.");else{const de=RV("de",c,P);if(de!=null){if(de>2)add("risk","Debt-equity of "+de.toFixed(2)+"×: borrowings are more than twice the net worth.");else if(de>1)add("watch","Debt-equity of "+de.toFixed(2)+"×: borrowings exceed the net worth.");}}
  const ic=RV("icr",c,P);if(ic!=null&&c.fc>0){if(ic<1.5)add("risk","EBIT covers finance costs only "+ic.toFixed(2)+" times.");else if(ic<3)add("watch","Interest coverage of "+ic.toFixed(2)+"× is modest.");else if(ic>=5)add("good","EBIT covers finance costs "+ic.toFixed(1)+" times.");}
  const di=RV("dint",c,P);if(di!=null){if(di<30)add("watch","Liquid assets would cover only "+Math.round(di)+" days of operating spending (defensive interval).");else if(di>=90)add("good","Liquid assets would cover "+Math.round(di)+" days of operating spending without new revenue.");}
  if(P){const cf=CF(c,P);if(cf){const fcf=cf.A-cf.capex;if(fcf<0)add("watch","Free cash flow was negative ("+money(fcf)+"): capital spending of "+money(cf.capex)+" exceeded operating cash of "+money(cf.A)+".");
    if(c.pat>0){const q=cf.A/c.pat;if(q<0.7)add("watch","Operating cash flow was "+q.toFixed(2)+"× net profit: earnings are running ahead of cash, usually through receivables.");}}}
  const dscr=RV("dscr",c,P);if(dscr!=null&&c.debt>0&&!(+c.an.principal))add("info","DSCR uses finance costs only. Enter the principal repaid during the year under Ratios for the full ratio.");
  const rank={risk:0,watch:1,good:2,info:3};return O.sort((a,b)=>rank[a.l]-rank[b.l]);
}
/* cash flow derived from two balance sheets (indirect method) */
const secKeys=(t,id)=>secItems(t,S(t,id));
function cashFlow(c,p){
  if(!c||!p||!c.has||!p.has)return null;
  const B=c.st.b,PB=p.st.b,dv=k=>(+B[k]||0)-(+PB[k]||0);
  const rows=[],add=(l,v,kind)=>rows.push({kind:kind||"item",label:l,v});
  add("A. Cash flow from operating activities",null,"h");
  add("Profit before tax",c.pbt);add("Add: depreciation and amortisation",c.dep);if(c.fc)add("Add: finance costs",c.fc);if(c.oth)add("Less: other income (shown under investing)",-c.oth);
  const op=c.pbt+c.dep+c.fc-c.oth;add("Operating profit before working capital changes",op,"sub");
  let wc=0;
  const wa=secKeys("bs","CA").filter(k=>k!=="cash"&&k!=="ci").concat(secKeys("bs","NCA").filter(k=>!["ppe","intg","cwip","iud","nci","dta"].includes(k)));
  const wl=secKeys("bs","CL").filter(k=>k!=="stb").concat(secKeys("bs","NCL").filter(k=>!["ltb","dtl"].includes(k)));
  for(const k of wa){const d=dv(k);if(Math.abs(d)>=0.5){add("(Increase) / decrease in "+lineLabel(k).toLowerCase(),-d);wc-=d;}}
  for(const k of wl){const d=dv(k);if(Math.abs(d)>=0.5){add("Increase / (decrease) in "+lineLabel(k).toLowerCase(),d);wc+=d;}}
  add("Cash generated from operations",op+wc,"sub");
  if(c.ctax)add("Less: income tax (current tax, as an estimate of tax paid)",-c.ctax);
  const A=op+wc-c.ctax;add("Net cash from operating activities (A)",A,"tot");
  add("B. Cash flow from investing activities",null,"h");
  const s=schedFor(c.Y),adds=s&&s.tot?s.tot.add:0,proc=(s&&s.disposals||[]).reduce((t,x)=>t+(+x.proc||0),0),nbv=(s&&s.disposals||[]).reduce((t,x)=>t+(+x.nbv||0),0);
  if(adds)add("Purchase of property, plant and equipment and intangibles",-adds);
  const dcw=dv("cwip")+dv("iud");if(Math.abs(dcw)>=0.5)add("(Increase) / decrease in capital work-in-progress",-dcw);
  if(proc)add("Proceeds from sale of assets",proc);
  const dinv=dv("nci")+dv("ci");if(Math.abs(dinv)>=0.5)add("(Purchase) / sale of investments",-dinv);
  if(c.oth)add("Other income received",c.oth);
  const Bv=-adds-dcw+proc-dinv+c.oth;add("Net cash from investing activities (B)",Bv,"tot");
  add("C. Cash flow from financing activities",null,"h");
  const eqK=secKeys("bs","SF").filter(k=>k!=="rs");let deq=0;for(const k of eqK)deq+=dv(k);
  const dsam=(+B.SAM||0)-(+PB.SAM||0);
  if(Math.abs(deq)>=0.5)add("Proceeds from issue of share capital",deq);
  if(Math.abs(dsam)>=0.5)add("Share application money received / (allotted)",dsam);
  if(c.st.rsOther)add("Other movements in reserves (dividends, premium, transfers)",c.st.rsOther);
  if(Math.abs(dv("ltb"))>=0.5)add("Increase / (decrease) in long-term borrowings",dv("ltb"));
  if(Math.abs(dv("stb"))>=0.5)add("Increase / (decrease) in short-term borrowings",dv("stb"));
  if(c.fc)add("Finance costs paid",-c.fc);
  const Cv=deq+dsam+c.st.rsOther+dv("ltb")+dv("stb")-c.fc;add("Net cash from financing activities (C)",Cv,"tot");
  const net=A+Bv+Cv;add("Net increase / (decrease) in cash and cash equivalents (A + B + C)",net,"tot");
  add("Cash and cash equivalents at the beginning of the year",p.cash);
  add("Cash and cash equivalents at the end of the year (derived)",p.cash+net,"sub");
  add("Cash and cash equivalents as per the Balance Sheet",c.cash);
  const diff=r2(p.cash+net-c.cash);add("Difference",diff,"diff");
  const why=[];
  const e1=r2(c.dtax-(dv("dtl")-dv("dta")));if(Math.abs(e1)>=0.5)why.push("Deferred tax in the P&L ("+money(c.dtax)+") differs from the movement in deferred tax balances by "+money(e1)+".");
  if(c.st.rsSrc==="entered"){const e2=r2(c.st.rsOpen-p.st.b.rs);if(Math.abs(e2)>=0.5)why.push("Opening reserves entered for "+fyLabel(c.Y)+" differ from last year’s closing reserves by "+money(e2)+".");}
  if(proc||nbv){const e3=r2(proc-nbv);if(Math.abs(e3)>=0.5)why.push("Profit or loss on sale of assets ("+money(e3)+") is not posted automatically; if it is in other income it is counted twice.");}
  if(Math.abs(diff)>=0.5&&!why.length)why.push("A balance-sheet line moved without a matching P&L or cash entry. Check the opening balances against last year’s closing figures.");
  return {rows,A,B:Bv,C:Cv,net,diff,why,wc,capex:Math.max(0,adds+dcw)};
}
/* comparative statements */
/* how many years to compare (2 to 5), remembered per viewer */
let anYears=2,anCS=false;
try{const v=+localStorage.getItem("trufin.anyrs");if(v>=2&&v<=5)anYears=v;}catch(e){}
/* years used for comparison, latest first */
function cmpYears(){return yearsBack(anYears).slice().reverse();}
function compRowsN(t,fs){
  const G=t==="pl"?"p":"b",rows=[],val=(f,k)=>+f.st[G][k]||0;
  const vis=s=>secItems(t,s).filter(k=>AUTO_KEYS.includes(k)||inPeriod(k,sel)||fs.some(f=>f.st.d[t]&&+f.st.d[t][k]));
  const line=(kind,label,get,ind)=>rows.push({kind,label,ind,v:fs.map(get)});
  const sec=s=>{const items=vis(s);if(!items.length)return;
    if(items.length===1&&!s.hdr){line("item",lineLabel(items[0]),f=>val(f,items[0]));return;}
    rows.push({kind:"h",label:(s.n?s.n+". ":"")+s.label});
    for(const k of items)line("item",lineLabel(k),f=>val(f,k),1);
    line("sub","Total "+s.label.replace(/^\(\d\)\s*/,"").toLowerCase(),f=>val(f,s.id));};
  const sum=(l,k,fin)=>line(fin?"tot":"sub",l,f=>val(f,k));
  if(t==="pl"){
    sec(S("pl","I"));sec(S("pl","II"));sum("Total income","ti");sec(S("pl","IV"));
    sum("Profit before exceptional items and tax","pbe");sec(S("pl","VI"));sum("Profit before tax","pbt");sec(S("pl","VIII"));sum("Profit / (loss) for the year","pat",true);
    line("memo","EBITDA (memo)",f=>f.ebitda);line("memo","EBIT (memo)",f=>f.ebit);
  }else{
    rows.push({kind:"g",label:"Equity and liabilities"});for(const s of SECS.bs.filter(s=>s.grp==="L"))sec(s);sum("Total equity and liabilities","tel",true);
    rows.push({kind:"g",label:"Assets"});for(const s of SECS.bs.filter(s=>s.grp==="A"))sec(s);sum("Total assets","ta",true);
  }
  const n=fs.length,span=n>1?fs[0].Y-fs[n-1].Y:0,base=f=>t==="pl"?f.rev:f.ta;
  for(const r of rows){if(!r.v)continue;r.c=r.v[0];r.p=n>1?r.v[1]:null;r.chg=r.p==null?null:r.c-r.p;r.chgP=r.p==null?null:div(r.chg,Math.abs(r.p));
    r.cs=fs.map((f,i)=>div(r.v[i],base(f)));r.cagr=n>=3&&r.kind!=="memo"?cagr(r.v[n-1],r.v[0],span):null;
    r.flag=r.kind!=="memo"&&r.chgP!=null&&Math.abs(r.chgP)>=0.25&&Math.abs(r.chg)>=0.02*Math.max(Math.abs(base(fs[0])||0),1);}
  return rows;
}
const fyShort=Y=>fyId(Y);
const cpS=x=>x==null?"–":(x>=0?"+":"−")+pctS(Math.abs(x*100));
function yearsBack(n){const out=[];for(let Y=sel;Y>=FIRST_FY&&out.length<n;Y--){const f=finY(Y);if(f&&f.has)out.unshift(f);}return out;}
function dupont(c,p){if(!c||!c.has||!c.rev)return null;const P=p&&p.has?p:null;const ta=av(c,P,"ta"),nw=av(c,P,"nw");
  const npm=div(c.pat,c.rev),at=div(c.rev,ta),em=nw>0?div(ta,nw):null;
  const tb=c.pbt>0?div(c.pat,c.pbt):null,ib=c.ebit>0?div(c.pbt,c.ebit):null,om=div(c.ebit,c.rev);
  return {npm,at,em,tb,ib,om,roe:npm!=null&&at!=null&&em!=null?npm*at*em:null};}
let anDu=3,anBE=false;

/* ---------- charts (inline SVG) ---------- */
function niceTicks(lo,hi,n){if(hi===lo){hi=lo+1;}const span=hi-lo,step0=span/(n||4),mag=Math.pow(10,Math.floor(Math.log10(step0))),err=step0/mag;const step=(err>=7.5?10:err>=3.5?5:err>=1.5?2:1)*mag;
  const a=Math.floor(lo/step)*step,b=Math.ceil(hi/step)*step,t=[];for(let v=a;v<=b+step/2;v+=step)t.push(Math.abs(v)<step/1e6?0:v);return t;}
const shortAmt=v=>{const x=v/unit,a=Math.abs(x);return (a>=1e5?(x/1e5).toFixed(1)+"L":a>=1e3?(x/1e3).toFixed(a>=1e4?0:1)+"k":x.toLocaleString("en-IN",{maximumFractionDigits:a<10?1:0}));};
function barPath(x,y0,y1,w){const h=Math.abs(y1-y0);if(h<0.5)return "";const r=Math.min(4,h,w/2);
  if(y1<y0)return `M${x},${y0}V${y1+r}Q${x},${y1} ${x+r},${y1}H${x+w-r}Q${x+w},${y1} ${x+w},${y1+r}V${y0}Z`;
  return `M${x},${y0}V${y1-r}Q${x},${y1} ${x+r},${y1}H${x+w-r}Q${x+w},${y1} ${x+w},${y1-r}V${y0}Z`;}
function chartBars(yrs){
  const S3=[["rev","Revenue"],["ebitda","EBITDA"],["pat","Profit after tax"]];
  const W=640,H=250,L=58,R=10,T=12,B=30;const vals=yrs.flatMap(f=>S3.map(s=>f[s[0]]));
  const t=niceTicks(Math.min(0,...vals),Math.max(0,...vals),4),lo=t[0],hi=t[t.length-1];const y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
  const band=(W-L-R)/yrs.length,gw=Math.min(band*0.72,150),bw=(gw-4)/3;
  let g=t.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="cg${v===0?" z":""}"/><text x="${L-8}" y="${y(v)+4}" class="ca" text-anchor="end">${shortAmt(v)}</text>`).join("");
  yrs.forEach((f,i)=>{const x0=L+band*i+(band-gw)/2;g+=`<text x="${L+band*i+band/2}" y="${H-10}" class="ca" text-anchor="middle">${esc(fyLabel(f.Y).replace("FY ",""))}</text>`;
    S3.forEach(([k,l],j)=>{const v=f[k];g+=`<path d="${barPath(x0+j*(bw+2),y(0),y(v),bw)}" class="s${j+1}" data-tip="${esc(fyLabel(f.Y)+"\n"+l+": "+money(v))}" tabindex="0"/>`;});});
  return `<div class="chart"><div class="lgd">${S3.map(([k,l],j)=>`<span><i class="s${j+1}"></i>${l}</span>`).join("")}<span class="sub">${unitName()}</span></div><div class="scroll"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue, EBITDA and profit after tax by year">${g}</svg></div></div>`;
}
function chartMargins(yrs){
  if(yrs.length<2)return `<p class="sub">Margins over time appear once two years have figures.</p>`;
  const S2=[["ebitdam","EBITDA margin"],["npm","Net profit margin"]];
  const pts=yrs.map((f,i)=>S2.map(([k])=>RV(k,f,finY(f.Y-1))));const vals=pts.flat().filter(v=>v!=null);if(!vals.length)return "";
  const W=640,H=210,L=46,R=14,T=12,B=30;const t=niceTicks(Math.min(0,...vals),Math.max(...vals,1),4),lo=t[0],hi=t[t.length-1];const y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
  const step=(W-L-R)/yrs.length,x=i=>L+step*i+step/2;
  let g=t.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="cg${v===0?" z":""}"/><text x="${L-8}" y="${y(v)+4}" class="ca" text-anchor="end">${v}%</text>`).join("");
  yrs.forEach((f,i)=>{g+=`<rect x="${L+step*i}" y="${T}" width="${step}" height="${H-T-B}" class="hov" data-tip="${esc(fyLabel(f.Y)+"\n"+S2.map(([k,l],j)=>l+": "+pctS(pts[i][j])).join("\n"))}" tabindex="0"/><text x="${x(i)}" y="${H-10}" class="ca" text-anchor="middle">${esc(fyLabel(f.Y).replace("FY ",""))}</text>`;});
  S2.forEach((s,j)=>{const seg=pts.map((p,i)=>p[j]==null?null:[x(i),y(p[j])]).filter(Boolean);if(seg.length>1)g+=`<polyline points="${seg.map(a=>a.join(",")).join(" ")}" class="ln${j+1}"/>`;
    g+=seg.map(a=>`<circle cx="${a[0]}" cy="${a[1]}" r="4.5" class="dt${j+1}"/>`).join("");});
  return `<div class="chart"><div class="lgd">${S2.map(([k,l],j)=>`<span><i class="s${j+1}"></i>${l}</span>`).join("")}</div><div class="scroll"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Margins by year">${g}</svg></div></div>`;
}
const RUPEE=[["cogs","Consumables and materials"],["emp","Employee benefits"],["othx","Other expenses"],["dep","Depreciation"],["fc","Finance costs"],["taxx","Tax and exceptional items"],["pat","Profit after tax"]];
function rupeeSplit(f){if(!f||!f.has||f.ti<=0)return null;const o={cogs:f.cogs,emp:f.emp,othx:f.othx,dep:f.dep,fc:f.fc,taxx:f.tax+f.exc,pat:f.pat};
  if(Object.values(o).some(v=>v<0))return {neg:true};const out={};for(const [k] of RUPEE)out[k]=o[k]/f.ti*100;return out;}
function chartRupee(c,p){
  const a=rupeeSplit(c),b=p&&p.has?rupeeSplit(p):null;if(!a)return "";
  if(a.neg||(b&&b.neg))return `<p class="sub">A loss, negative inventory change or tax credit can’t be shown as shares of income; see the comparative Profit &amp; Loss for the split.</p>`;
  const bar=(s,f)=>`<div class="rbar-row"><span class="rbar-y">${esc(fyId(f.Y))}</span><div class="rbar">${RUPEE.map(([k,l],j)=>s[k]>0.05?`<span class="s${j+1}" style="width:${s[k]}%" data-tip="${esc(fyLabel(f.Y)+"\n"+l+": "+pctS(s[k])+" of total income\n"+money(k==="taxx"?f.tax+f.exc:f[k]))}" tabindex="0"></span>`:"").join("")}</div></div>`;
  return `<div class="chart">${bar(a,c)}${b?bar(b,p):""}
   <table class="rtab"><thead><tr><th>Of each ₹100 of total income</th><th class="n">${esc(fyLabel(c.Y))}</th>${b?`<th class="n">${esc(fyLabel(p.Y))}</th><th class="n">Change</th>`:""}</tr></thead><tbody>
   ${RUPEE.map(([k,l],j)=>{const d=b?a[k]-b[k]:null;return `<tr><td><i class="key s${j+1}"></i>${l}</td><td class="n">₹${a[k].toFixed(1)}</td>${b?`<td class="n">₹${b[k].toFixed(1)}</td><td class="n ${Math.abs(d)<0.05?"":tone(k==="pat"?"up":k==="dep"||k==="taxx"?null:"down",d)}">${d==null?"":Math.abs(d)<0.05?"–":(d>=0?"+":"−")+Math.abs(d).toFixed(1)}</td>`:""}</tr>`;}).join("")}</tbody></table></div>`;
}

/* ---------- views ---------- */
function anInput(path,label,v,ed,hint){const id="in-"+path.replace(/\./g,"-");
  return `<div class="fld"><label for="${id}">${label} (${unitName()})</label>${ed?`<input class="num" style="width:100%" id="${id}" data-path="${path}" inputmode="decimal" autocomplete="off" value="${esc(fmtIn(v))}">`:`<b>${v==null||v===""?"–":fmt(+v)}</b>`}${hint?`<span class="hint">${hint}</span>`:""}</div>`;}
function viewAnalysis(){
  const c=finY(sel),p=finY(sel-1),P=p&&p.has?p:null,pp=P?finY(sel-2):null;
  const views=[["overview","Overview"],["pl","Profit & Loss"],["bs","Balance Sheet"],["ratios","Ratios"],["cash","Cash flow"],["trend","Multi-year"]];
  const head=`<div class="toolbar"><h2 style="margin:0;font-family:var(--f-display);font-size:20px;font-weight:600">Financial analysis</h2><span class="sub">${fyLabel(sel)}${P?" compared with "+fyLabel(sel-1):""} · amounts in ${unitName()}</span><span style="margin-left:auto">${dlBar("an","Financial analysis")}</span></div>
    <div class="toolbar"><div class="seg seg-wrap" role="group" aria-label="Analysis view">${views.map(([k,l])=>`<button data-anv="${k}" aria-pressed="${anView===k}">${esc(l)}</button>`).join("")}</div>${yearsCtl()}</div>`;
  if(!c||!c.has)return head+`<div class="empty">No figures for ${fyLabel(sel)} yet. Enter the Profit &amp; Loss and Balance Sheet, and the analysis builds itself. Add ${fyLabel(sel-1)} too for year-on-year changes.</div>`;
  const warn=(Math.abs(c.diff)>=1?`<div class="banner bad"><span><strong>The Balance Sheet is out of balance by ${fmtRs(c.diff)}.</strong> Balance-sheet ratios and the cash flow use the figures as entered.</span></div>`:"")+(!P?`<div class="banner warn"><span>No figures for ${fyLabel(sel-1)}, so comparisons, averages and the cash flow are not available. Ratios use closing balances.</span></div>`:"");
  const V={overview:anOverview,pl:()=>anComp("pl"),bs:()=>anComp("bs"),ratios:()=>anRatios(c,P,pp),cash:()=>anCash(c,P),trend:anTrend}[anView]||anOverview;
  return head+warn+V(c,P,pp);
}
function yearsCtl(){
  const avail=yearsBack(5).length,eff=Math.min(anYears,Math.max(2,avail));
  if(anView==="cash")return `<span class="sub" style="margin-left:auto">The cash flow always compares two balance sheets.</span>`;
  return `<div class="seg ycmp" role="group" aria-label="Years to compare" style="margin-left:auto"><span class="seg-l">Compare</span>${[2,3,4,5].map(n=>`<button data-anyrs="${n}" aria-pressed="${eff===n}" ${n>Math.max(2,avail)?`disabled title="Only ${avail} year${avail===1?" has":"s have"} figures"`:""}>${n} years</button>`).join("")}</div>`;
}
function kpi(label,val,sub,d,b,dtxt){return `<div class="kpi"><span class="kl">${label}</span><b>${val}</b><span class="kd ${tone(b,d)}">${d==null?"":arrow(d)+" "}${dtxt||""}</span><span class="ks">${sub||""}</span></div>`;}
function anOverview(c,P,pp){
  const ch=(k)=>P?chgU("amt",c[k],P[k]):{t:"",d:null};
  const em=RV("ebitdam",c,P),em0=P?RV("ebitdam",P,pp):null,nm=RV("npm",c,P),nm0=P?RV("npm",P,pp):null;
  const cr=RV("cr",c,P),cr0=P?RV("cr",P,pp):null,de=RV("de",c,P),de0=P?RV("de",P,pp):null,roe=RV("roe",c,P),roe0=P?RV("roe",P,pp):null;
  const vs=P?" vs "+fyLabel(P.Y).replace("FY ",""):"";
  const tiles=`<div class="kpis">
    ${kpi("Revenue",money(c.rev),P?"was "+money(P.rev):"",ch("rev").d,"up",ch("rev").t+vs)}
    ${kpi("EBITDA",money(c.ebitda),"Margin "+pctS(em),chgU("%",em,em0).d,"up",em!=null&&em0!=null?(chgU("%",em,em0).d===0?"margin unchanged":chgU("%",em,em0).t+" margin"):"")}
    ${kpi("Profit after tax",money(c.pat),"Net margin "+pctS(nm),chgU("%",nm,nm0).d,"up",nm!=null&&nm0!=null?(chgU("%",nm,nm0).d===0?"margin unchanged":chgU("%",nm,nm0).t+" margin"):"")}
    ${kpi("Net worth",money(c.nw),"ROE "+pctS(roe)+(roe0!=null?" (was "+pctS(roe0)+")":""),ch("nw").d,"up",ch("nw").t+vs)}
    ${kpi("Current ratio",fmtU("x",cr),"Working capital "+money(c.wc),chgU("x",cr,cr0).d,"up",cr0!=null?"was "+fmtU("x",cr0):"")}
    ${kpi("Debt-equity",c.debt<=0?"Nil":fmtU("x",de),"Borrowings "+money(c.debt),chgU("x",de,de0).d,"down",de0!=null?"was "+fmtU("x",de0):"")}
  </div>`;
  const O=observations(c,P);const lab={risk:"Concern",watch:"Watch",good:"Strength",info:"Note"},ic={risk:"✕",watch:"!",good:"✓",info:"i"};
  const obs=`<section class="sheet"><h3>What the numbers say</h3><ul class="obs">${O.map(o=>`<li class="o-${o.l}"><span class="ob-tag"><b>${ic[o.l]}</b>${lab[o.l]}</span><span>${esc(o.t)}</span></li>`).join("")}</ul><p class="sub" style="margin:10px 0 0">Generated from the figures entered, with fixed thresholds (for example a current ratio under 1, or costs growing 5 points faster than revenue). Read them with the business context.</p></section>`;
  const D=dupont(c,P),D0=P?dupont(P,pp):null;
  const dbox=(l,v,v0,u)=>`<div class="dbox"><span>${l}</span><b>${u==="%"?pctS(v==null?null:v*100):fmtU("x",v)}</b>${v0!==undefined?`<em>${u==="%"?pctS(v0==null?null:v0*100):fmtU("x",v0)} in ${esc(fyLabel(sel-1).replace("FY ",""))}</em>`:""}</div>`;
  const dtog=`<div class="seg" role="group" aria-label="DuPont steps"><button data-andu="3" aria-pressed="${anDu===3}">3-step</button><button data-andu="5" aria-pressed="${anDu===5}">5-step</button></div>`;
  const dx=(l,k,u)=>dbox(l,D[k],D0?D0[k]:undefined,u);
  const dup=D?`<section class="sheet"><div class="sheet-head" style="margin-bottom:6px"><h3 style="margin:0">Return on equity, broken down</h3>${dtog}</div><p class="sub" style="margin:0 0 12px">${anDu===3?"DuPont analysis: how much profit each rupee of sales keeps, how hard the assets work, and how much of the asset base is funded by debt.":"Five-step DuPont splits the net margin into what tax leaves (tax burden), what interest and exceptional items leave (interest burden) and the operating margin, to show where ROE comes from."}</p>
    <div class="dupont">${anDu===3?dx("Net profit margin","npm","%")+`<span class="op">×</span>`:dx("Tax burden · PAT ÷ PBT","tb","x")+`<span class="op">×</span>`+dx("Interest burden · PBT ÷ EBIT","ib","x")+`<span class="op">×</span>`+dx("EBIT margin","om","%")+`<span class="op">×</span>`}${dx("Asset turnover","at","x")}<span class="op">×</span>${dx("Equity multiplier","em","x")}<span class="op">=</span>${dx("Return on equity","roe","%")}</div></section>`:"";
  const ed=canWrite;
  const com=`<section class="sheet"><h3>Management commentary</h3>${ed?`<textarea id="an-comment" data-ancomment rows="4" style="width:100%" placeholder="Your reading of the year: drivers, one-offs, actions. Included in the analysis download.">${esc(c.an.comment||"")}</textarea>`:`<div class="body">${esc(c.an.comment||"No commentary entered.")}</div>`}</section>`;
  return tiles+obs+`<div class="cols2"><section class="sheet"><h3>Where each rupee of income went</h3>${chartRupee(c,P)}</section><section class="sheet"><h3>Revenue, EBITDA and profit</h3>${chartBars(yearsBack(Math.max(anYears,2)))}</section></div>`+dup+com;
}
function anComp(t){
  const fs=cmpYears(),n=fs.length,rows=compRowsN(t,fs);const base=t==="pl"?"% of revenue":"% of total assets";
  const f=v=>v==null?"–":fmt(v);
  const cs=anCS;
  let head=`<th>Particulars</th>`;
  if(cs)head+=fs.map((y,i)=>`<th class="n ${i?"":"cur"}">${esc(fyLabel(y.Y))}</th>`).join("")+(n>1?`<th class="n">Change<br>vs ${esc(fyShort(fs[1].Y))}</th>`:"");
  else{head+=fs.map((y,i)=>`<th class="n ${i?"":"cur"}">${esc(fyLabel(y.Y))}</th>`).join("");
    if(n>1)head+=`<th class="n">Change<br>vs ${esc(fyShort(fs[1].Y))}</th><th class="n">Change %</th>`;
    if(n>=3)head+=`<th class="n">CAGR<br>${n} yrs</th>`;
    head+=n===2?`<th class="n">${base}<br>${esc(fyShort(fs[0].Y))}</th><th class="n">${base}<br>${esc(fyShort(fs[1].Y))}</th>`:`<th class="n">${base}<br>${esc(fyShort(fs[0].Y))}</th>`;}
  const cols=head.split("<th").length-1;
  const body=rows.map(r=>{
    if(r.kind==="g")return `<tr class="cg-g"><td colspan="${cols}">${esc(r.label)}</td></tr>`;
    if(r.kind==="h")return `<tr class="cg-h"><td colspan="${cols}">${esc(r.label)}</td></tr>`;
    let h=`<td style="padding-left:${r.ind?20:8}px">${r.flag?`<span class="fdot" title="Changed by 25% or more">●</span>`:""}${esc(r.label)}</td>`;
    if(cs){h+=r.cs.map((v,i)=>`<td class="n ${i?"prev":"cur"}">${v==null?"–":pctS(v*100)}</td>`).join("");
      if(n>1){const d=r.cs[0]!=null&&r.cs[1]!=null?(r.cs[0]-r.cs[1])*100:null;h+=`<td class="n">${d==null?"–":Math.abs(d)<0.05?"–":(d>=0?"+":"−")+Math.abs(d).toFixed(1)+" pp"}</td>`;}}
    else{h+=r.v.map((v,i)=>`<td class="n ${i?"prev":"cur"}">${f(v)}</td>`).join("");
      if(n>1)h+=`<td class="n ${r.chg<0?"neg":""}">${r.chg==null?"–":fmt(r.chg)}</td><td class="n">${r.chgP==null?(r.c&&!r.p?"new":"–"):cpS(r.chgP)}</td>`;
      if(n>=3)h+=`<td class="n">${r.cagr==null?"–":pctS(r.cagr)}</td>`;
      h+=(n===2?r.cs:[r.cs[0]]).map((v,i)=>`<td class="n ${i?"prev":""}">${v==null?"–":pctS(v*100)}</td>`).join("");}
    return `<tr class="cr-${r.kind}${r.flag?" flag":""}">${h}</tr>`;}).join("");
  const fl=rows.filter(r=>r.flag&&r.kind==="item");
  const tog=`<div class="seg" role="group" aria-label="Show"><button data-ancs="0" aria-pressed="${!cs}">Amounts</button><button data-ancs="1" aria-pressed="${cs}">${t==="pl"?"% of revenue":"% of total assets"}</button></div>`;
  return `<section class="sheet"><div class="sheet-head"><div><h2>${t==="pl"?"Comparative Profit &amp; Loss":"Comparative Balance Sheet"}</h2><div class="sub">${n} year${n===1?"":"s"}, latest first · ${cs?"each line as "+base:unitName()}${n<anYears?" · only "+n+" year"+(n===1?" has":"s have")+" figures":""}</div></div>${tog}</div>
   <div class="scroll"><table class="cmp ${n>=4?"wide":""}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
   ${n>1?`<p class="sub" style="margin:10px 0 0"><span class="fdot">●</span> marks lines that moved by 25% or more from ${fyLabel(fs[1].Y)} and by at least 2% of ${t==="pl"?"revenue":"total assets"}${fl.length?": "+esc(fl.map(r=>r.label).join(", ")):""}.${n>=3?" CAGR is the compound annual growth from "+fyLabel(fs[n-1].Y)+" to "+fyLabel(fs[0].Y)+", shown where both ends are positive.":""}</p>`:""}</section>`;
}
function anRatios(c,P,pp){
  const st=c.st;const ed=canWrite&&!st.fin;const p0=P?finY(sel-2):null;
  const groups=[...new Set(RATIOS.map(r=>r.g))];
  const fs=cmpYears(),n=fs.length,prevOf=f=>finY(f.Y-1);const BM=layout.bench||{},hasBM=Object.keys(BM).length>0,showBM=hasBM||anBE;
  const unitHint={x:"×",["%"]:"%",d:"days",rs:"₹"};
  const tbl=groups.map(g=>`<tr class="cg-h"><td colspan="${n+2+(showBM?1:0)}">${esc(g)}</td></tr>`+RATIOS.filter(r=>r.g===g).map(r=>{const vs=fs.map(f=>RV(r.k,f,prevOf(f)));const d=chgU(r.u,vs[0],n>1?vs[1]:null);
    const bm=BM[r.k]!=null&&BM[r.k]!==""?+BM[r.k]:null;let bcell="";
    if(showBM){if(r.u==="amt")bcell=`<td class="n prev">–</td>`;
      else if(anBE&&canWrite)bcell=`<td class="n"><input class="num sm" style="width:84px" id="bm-${r.k}" data-anbench="${r.k}" inputmode="decimal" value="${bm==null?"":bm}" placeholder="${unitHint[r.u]||""}" aria-label="Benchmark for ${esc(r.n)}"></td>`;
      else{const dd=bm!=null&&vs[0]!=null?vs[0]-bm:null;bcell=`<td class="n">${bm==null?"–":fmtU(r.u,bm)}${dd!=null&&r.b?`<span class="hint ${tone(r.b,dd)}">${Math.abs(dd)<1e-9?"at":(dd>0)===(r.b==="up")?"better":"worse"}</span>`:""}</td>`;}}
    return `<tr><td><strong>${esc(r.n)}</strong>${r.s3?` <span class="chip gray" title="Disclosed under Schedule III">Sch. III</span>`:""}<span class="hint">${esc(r.f)}</span></td>${vs.map((v,i)=>`<td class="n ${i?"prev":"cur"}">${i?fmtU(r.u,v):"<b>"+fmtU(r.u,v)+"</b>"}</td>`).join("")}<td class="n ${tone(r.b,d.d)}">${d.d==null?"–":arrow(d.d)+" "+d.t}</td>${bcell}</tr>`;}).join("")).join("");
  const val=`<section class="sheet"><div class="sheet-head"><div><h2>Valuation inputs · ${esc(fyLabel(sel))}</h2><div class="sub">TrustLab’s shares are not listed, so valuation ratios use a value per share you enter: a registered valuer’s report, a recent allotment or transfer price, or an investor term sheet.</div></div></div>
    <form class="af" autocomplete="off">
      <div class="fld"><label for="an-shares">Shares outstanding</label>${canWrite?`<input type="text" id="an-shares" data-annum="shares" inputmode="numeric" value="${esc(c.an.shares==null?"":(+c.an.shares).toLocaleString("en-IN"))}" placeholder="e.g. 10,00,000">`:`<b>${c.an.shares?(+c.an.shares).toLocaleString("en-IN"):"–"}</b>`}<span class="hint">Weighted average for the year, for EPS under AS 20</span></div>
      <div class="fld"><label for="an-price">Value per share (₹)</label>${canWrite?`<input type="text" id="an-price" data-annum="price" inputmode="decimal" value="${esc(c.an.price==null?"":c.an.price)}" placeholder="e.g. 85.00">`:`<b>${c.an.price?"₹"+c.an.price:"–"}</b>`}</div>
      <div class="fld wide"><label for="an-vbasis">Basis of value</label>${canWrite?`<input type="text" id="an-vbasis" data-antext="vbasis" value="${esc(c.an.vbasis||"")}" placeholder="e.g. Registered valuer, DCF method, report dated 30 June 2026">`:`<b>${esc(c.an.vbasis||"–")}</b>`}</div>
    </form></section>`;
  const s3=RATIOS.filter(r=>r.s3);const why=c.an.why||{};
  const s3rows=s3.map(r=>{const v=RV(r.k,c,P),v0=P?RV(r.k,P,pp):null,vr=s3var(v,v0),big=vr!=null&&Math.abs(vr)>25;const reason=why[r.k]||"";
    return `<tr class="${big&&!reason?"need":""}"><td><strong>${esc(r.n)}</strong><span class="hint">${esc(r.s3[0])} ÷ ${esc(r.s3[1])}</span></td><td class="n">${fmtU(r.u,v)}</td><td class="n prev">${fmtU(r.u,v0)}</td><td class="n ${big?"warn-t":""}">${vr==null?"–":(vr>=0?"+":"−")+Math.abs(vr).toFixed(1)+"%"}</td>
     <td>${ed?`<input type="text" id="why-${r.k}" data-anwhy="${r.k}" value="${esc(reason)}" placeholder="${big?"Required: explain the change":"Optional"}" style="width:100%">`:esc(reason||"–")}${big&&!reason?`<span class="hint warn-t">Variance over 25% needs a reason</span>`:""}</td></tr>`;}).join("");
  const hasNote=(c.d.notes||[]).some(n=>n.kind==="ratios");
  return `<section class="sheet"><div class="sheet-head"><div><h2>Ratios</h2><div class="sub">${n} year${n===1?"":"s"}, latest first. Turnover and return ratios use average balances where the year before has figures.</div></div></div>
    <div class="toolbar" style="margin-bottom:10px">${canWrite?`<button class="btn small" data-act="anbe">${anBE?"Done":hasBM?"Edit benchmarks":"Add peer or target benchmarks"}</button>`:""}
      ${showBM?(anBE&&canWrite?`<input type="text" id="bm-src" data-anbsrc value="${esc(layout.benchSrc||"")}" placeholder="Source, e.g. median of listed diagnostics peers FY 2025-26" style="flex:1 1 280px">`:`<span class="sub">Benchmark: ${esc(layout.benchSrc||"source not stated")}</span>`):`<span class="sub">Compare each ratio with an industry median, a peer or your own target.</span>`}</div>
    <div class="scroll"><table class="cmp rat ${n>=4||showBM?"wide":""}"><thead><tr><th>Ratio</th>${fs.map((f,i)=>`<th class="n ${i?"":"cur"}">${esc(fyLabel(f.Y))}</th>`).join("")}<th class="n">Change${n>1?"<br>vs "+esc(fyShort(fs[1].Y)):""}</th>${showBM?`<th class="n">Benchmark</th>`:""}</tr></thead><tbody>${tbl}</tbody></table></div>
    <p class="sub" style="margin:10px 0 0">Cash-flow measures need the year before; valuation measures need the inputs below. Read ratios against the business model: a hub lab and a collection-centre network carry very different asset and receivable profiles.</p></section>
   ${val}
   <section class="sheet"><div class="sheet-head"><div><h2>Schedule III ratio disclosure</h2><div class="sub">The eleven ratios required in the notes, with the reason for any change of more than 25% from last year.</div></div>
    ${ed?(hasNote?`<span class="pill final">In the notes</span>`:`<button class="btn" data-act="anaddnote">Add as a note to the financial statements</button>`):""}</div>
    <form class="af" style="margin-bottom:14px" autocomplete="off">${anInput("an.principal","Principal repaid on borrowings during the year",c.an.principal,ed,"Completes the debt service coverage ratio")}${anInput("an.invInc","Income from investments",c.an.invInc,ed,"Interest, dividends and gains on investments, for return on investment")}</form>
    <div class="scroll"><table class="cmp s3t"><thead><tr><th>Ratio</th><th class="n">${esc(fyLabel(sel))}</th><th class="n">${esc(fyLabel(sel-1))}</th><th class="n">Variance</th><th style="min-width:240px">Reason for variance</th></tr></thead><tbody>${s3rows}</tbody></table></div>
    ${st.fin?`<p class="sub" style="margin:10px 0 0">${fyLabel(sel)} is finalised, so these inputs are locked.</p>`:""}</section>`;
}
function anCash(c,P){
  const cf=cashFlow(c,P);
  if(!cf)return `<div class="empty">The cash flow is worked out from two balance sheets. Enter ${fyLabel(sel-1)} figures to see it.</div>`;
  const body=cf.rows.map(r=>r.kind==="h"?`<tr class="cg-h"><td colspan="2">${esc(r.label)}</td></tr>`:`<tr class="cr-${r.kind}"><td style="padding-left:${r.kind==="item"?20:8}px">${esc(r.label)}</td><td class="n ${r.v<0?"neg":""} ${r.kind==="diff"&&Math.abs(r.v)>=0.5?"bad-t":""}">${r.kind==="diff"&&Math.abs(r.v)<0.5?"Nil":fmt(r.v)}</td></tr>`).join("");
  return `<section class="sheet"><div class="sheet-head"><div><h2>Cash flow (derived)</h2><div class="sub">Indirect method, worked out from the two balance sheets and the year’s P&amp;L · ${unitName()}</div></div></div>
   <div class="scroll"><table class="cmp cf"><thead><tr><th>Particulars</th><th class="n">${esc(fyLabel(sel))}</th></tr></thead><tbody>${body}</tbody></table></div>
   ${cf.why.length?`<div class="banner warn" style="margin-top:12px;flex-direction:column;align-items:flex-start"><strong>Why the derived cash differs from the Balance Sheet</strong>${cf.why.map(w=>`<span>${esc(w)}</span>`).join("")}</div>`:""}
   <p class="sub" style="margin:10px 0 0">An analytical statement, not the AS 3 cash flow statement. Tax paid is taken as the current tax charge, other income is treated as investing income, and asset purchases come from the asset register.</p></section>`;
}
const TREND=[["rev","Revenue","amt"],["revg","Revenue growth","%"],["ebitda","EBITDA","amt"],["ebitdam","EBITDA margin","%"],["pat","Profit after tax","amt"],["npm","Net profit margin","%"],
  ["nw","Net worth","amt"],["debt","Total borrowings","amt"],["ta","Total assets","amt"],["cash","Cash and cash equivalents","amt"],["cr","Current ratio","x"],["de","Debt-equity","x"],["roe","Return on equity","%"],["roce","Return on capital employed","%"],["dso","Receivable days","d"]];
function trendVal(k,f){const p=finY(f.Y-1);if(k==="revg")return p&&p.has?pct(div(f.rev-p.rev,Math.abs(p.rev))):null;if(RMAP[k])return RV(k,f,p);return f[k];}
function cagr(a,b,n){return a>0&&b>0&&n>0?(Math.pow(b/a,1/n)-1)*100:null;}
function anTrend(){
  const yrs=yearsBack(anYears);
  if(yrs.length<2)return `<section class="sheet"><h3>Multi-year</h3><p class="sub">Trends appear once two or more years have figures. Only ${yrs.length} year has figures so far.</p>${chartBars(yrs)}</section>`;
  const n=yrs[yrs.length-1].Y-yrs[0].Y;
  const rows=TREND.map(([k,l,u])=>{const vs=yrs.map(f=>trendVal(k,f));const cg=u==="amt"&&["rev","ebitda","pat","nw","ta"].includes(k)?cagr(vs[0],vs[vs.length-1],n):null;
    return `<tr><td>${esc(l)}</td>${vs.map((v,i)=>`<td class="n ${i===vs.length-1?"cur":""}">${u==="amt"?(v==null?"–":fmt(v)):fmtU(u,v)}</td>`).join("")}<td class="n">${cg==null?"–":pctS(cg)}</td></tr>`;}).join("");
  return `<div class="cols2"><section class="sheet"><h3>Revenue, EBITDA and profit</h3>${chartBars(yrs)}</section><section class="sheet"><h3>Margins</h3>${chartMargins(yrs)}</section></div>
   <section class="sheet"><div class="sheet-head"><div><h2>${yrs.length}-year view</h2><div class="sub">Amounts in ${unitName()} · CAGR over ${n} year${n===1?"":"s"}</div></div></div>
   <div class="scroll"><table class="cmp trend"><thead><tr><th>Measure</th>${yrs.map((f,i)=>`<th class="n ${i===yrs.length-1?"cur":""}">${esc(fyLabel(f.Y))}</th>`).join("")}<th class="n">CAGR</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

/* ---------- ratio note (Schedule III) for the notes and downloads ---------- */
function s3Model(){
  const c=finY(sel),p=finY(sel-1),P=p&&p.has?p:null,pp=P?finY(sel-2):null;const why=(c&&c.an.why)||{};
  return {type:"grid",fs:7.2,flat:["Ratio","Numerator","Denominator",fyLabel(sel),fyLabel(sel-1),"Variance","Reason for variance over 25%"],align:["l","l","l","r","r","r","l"],widths:[30,26,26,15,15,14,"auto"],
    rows:RATIOS.filter(r=>r.s3).map(r=>{const v=c&&c.has?RV(r.k,c,P):null,v0=P?RV(r.k,P,pp):null,vr=s3var(v,v0);
      return {kind:"item",label:r.n,vals:[r.s3[0],r.s3[1],fmtU(r.u,v),fmtU(r.u,v0),vr==null?"–":(vr>=0?"+":"-")+Math.abs(vr).toFixed(1)+"%",why[r.k]||(vr!=null&&Math.abs(vr)>25?"[Reason to be given]":"")]};})};
}
function ratioNoteHtml(){const m=s3Model();
  return `<div class="scroll" style="margin-top:12px"><table class="brk"><thead><tr>${m.flat.map((h,i)=>`<th class="${i>=3&&i<=5?"n":""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${m.rows.map(r=>`<tr><td>${esc(r.label)}</td>${r.vals.map((v,i)=>`<td class="${i>=2&&i<=4?"n":""}">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}

/* ---------- download model ---------- */
function modelAnalysis(){
  const c=finY(sel),p=finY(sel-1),P=p&&p.has?p:null,pp=P?finY(sel-2):null;
  const fs=cmpYears(),N=fs.length;
  const m={key:"an",type:"multi",title:"Financial analysis",sub:N>1?N+"-year comparison, "+fyLabel(fs[N-1].Y)+" to "+fyLabel(fs[0].Y):fyLabel(sel),blocks:[]};
  if(!c||!c.has){m.blocks.push({t:"para",title:"No figures",lines:["No figures entered for "+fyLabel(sel)+"."]});return m;}
  const lab={risk:"Concern",watch:"Watch",good:"Strength",info:"Note"};
  m.blocks.push({t:"para",title:"Key observations",lines:observations(c,P).map(o=>lab[o.l]+": "+o.t)});
  if(c.an.comment)m.blocks.push({t:"para",title:"Management commentary",lines:String(c.an.comment).split(/\n/)});
  const yrs=yearsBack(anYears);if(yrs.length)m.blocks.push({t:"bars",title:"Revenue, EBITDA and profit after tax ("+unitPlain()+")",yrs});
  const cy=fyLabel(sel),py=fyLabel(sel-1);
  const comp=t=>{const rows=compRowsN(t,fs);const base=t==="pl"?"% of revenue":"% of total assets";const ys=fs.map(f=>fyLabel(f.Y));
    const flat=["Particulars"].concat(ys);if(N>1)flat.push("Change vs "+fyShort(fs[1].Y),"Change %");if(N>=3)flat.push("CAGR");
    const csIdx=N===2?[0,1]:[0];csIdx.forEach(i=>flat.push(base+" "+fyShort(fs[i].Y)));
    const nw=N>=4?16:19;const widths=["auto"].concat(fs.map(()=>nw));if(N>1)widths.push(nw,13);if(N>=3)widths.push(12);csIdx.forEach(()=>widths.push(14));
    return {flat,widths,fs:N>=4?6.6:7.2,
      rows:rows.map(r=>r.kind==="g"||r.kind==="h"?{kind:"h",label:r.label}:{kind:r.kind==="tot"?"tot":r.kind==="sub"?"subt":"item",label:(r.flag?"* ":"")+(r.ind?"   ":"")+r.label,
        vals:r.v.concat(N>1?[r.chg,r.chgP==null?"–":(r.chgP>=0?"+":"-")+Math.abs(r.chgP*100).toFixed(1)+"%"]:[]).concat(N>=3?[r.cagr==null?"–":pctS(r.cagr).replace("−","-")]:[]).concat(csIdx.map(i=>r.cs[i]==null?"–":(r.cs[i]*100).toFixed(1)+"%"))}),
      foot:N>1?"* Moved by 25% or more from "+fyLabel(fs[1].Y)+", and by at least 2% of "+(t==="pl"?"revenue":"total assets")+".":""};};
  m.blocks.push({t:"grid",title:"Comparative Statement of Profit and Loss",m:comp("pl")});
  m.blocks.push({t:"grid",title:"Comparative Balance Sheet",m:comp("bs")});
  const groups=[...new Set(RATIOS.map(r=>r.g))];const rr=[];
  const showF=N<=3;
  for(const g of groups){rr.push({kind:"h",label:g});for(const r of RATIOS.filter(x=>x.g===g)){const vs=fs.map(f=>RV(r.k,f,finY(f.Y-1)));
    rr.push({kind:"item",label:r.n,vals:(showF?[r.f]:[]).concat(vs.map(v=>fmtU(r.u,v).replace("₹","Rs. ")),[N>1?chgU(r.u,vs[0],vs[1]).t:"–"])});}}
  const BM=layout.bench||{},hasBM=Object.keys(BM).length>0;
  if(hasBM){let i=0;for(const g of groups){i++;for(const r of RATIOS.filter(x=>x.g===g)){const b=BM[r.k];rr[i].vals.push(b==null||b===""||r.u==="amt"?"–":fmtU(r.u,+b).replace("₹","Rs. "));i++;}}}
  m.blocks.push({t:"grid",title:"Ratios",m:{flat:["Ratio"].concat(showF?["How it is worked out"]:[],fs.map(f=>fyLabel(f.Y)),[N>1?"Change vs "+fyShort(fs[1].Y):"Change"],hasBM?["Benchmark"]:[]),
    align:["l"].concat(showF?["l"]:[],fs.map(()=>"r"),["r"],hasBM?["r"]:[]),widths:[showF?36:"auto"].concat(showF?["auto"]:[],fs.map(()=>showF?19:20),[19],hasBM?[18]:[]),fs:showF?7.2:6.8,rows:rr,
    foot:(hasBM?"Benchmark: "+(layout.benchSrc||"source not stated")+". ":"")+(c.an.price?"Valuation uses a value per share of Rs. "+c.an.price+(c.an.vbasis?" ("+c.an.vbasis+")":"")+".":"")}});
  m.blocks.push({t:"grid",title:"Schedule III ratio disclosure",m:s3Model()});
  const D=dupont(c,P),D0=P?dupont(P,pp):null;
  if(D)m.blocks.push({t:"grid",title:"Return on equity (DuPont, 3-step and 5-step)",m:{flat:["Component",cy,py],align:["l","r","r"],widths:["auto",30,30],rows:[["3-step: net profit margin","npm","%"],["Asset turnover","at","x"],["Equity multiplier","em","x"],["5-step: tax burden (PAT ÷ PBT)","tb","x"],["Interest burden (PBT ÷ EBIT)","ib","x"],["EBIT margin","om","%"],["Return on equity","roe","%"]].map(([l,k,u])=>({kind:k==="roe"?"tot":"item",label:l,vals:[u==="%"?pctS(D[k]==null?null:D[k]*100):fmtU("x",D[k]),D0?(u==="%"?pctS(D0[k]==null?null:D0[k]*100):fmtU("x",D0[k])):"–"]}))}});
  const cf=cashFlow(c,P);
  if(cf)m.blocks.push({t:"grid",title:"Cash flow (derived, indirect method)",m:{flat:["Particulars",cy],widths:["auto",30],rows:cf.rows.map(r=>r.kind==="h"?{kind:"h",label:r.label}:{kind:r.kind==="tot"?"tot":r.kind==="sub"?"subt":"item",label:r.label,vals:[r.kind==="diff"&&Math.abs(r.v)<0.5?"Nil":r.v]}),
    foot:"Analytical statement worked out from the balance sheets; not the AS 3 cash flow statement."+(cf.why.length?" "+cf.why.join(" "):"")}});
  if(yrs.length>=3){const n=yrs[yrs.length-1].Y-yrs[0].Y;
    m.blocks.push({t:"grid",title:yrs.length+"-year view",m:{flat:["Measure"].concat(yrs.map(f=>fyLabel(f.Y)),["CAGR"]),widths:["auto"].concat(yrs.map(()=>20),[16]),
      rows:TREND.map(([k,l,u])=>{const vs=yrs.map(f=>trendVal(k,f));const cg=u==="amt"&&["rev","ebitda","pat","nw","ta"].includes(k)?cagr(vs[0],vs[vs.length-1],n):null;
        return {kind:"item",label:l,vals:vs.map(v=>u==="amt"?(v==null?null:v):fmtU(u,v)).concat([cg==null?"–":pctS(cg)])};})}});}
  return m;
}
function pdfMulti(doc,m,y){
  for(const b of m.blocks){
    if(b.t==="para"){y=ensure(doc,y+2,18);doc.setFont("times","bold");doc.setFontSize(10.5);doc.setTextColor(...PC.green);doc.text(pt(b.title),PM,y+4);y+=8;
      doc.setFont("times","normal");doc.setFontSize(9.2);doc.setTextColor(...PC.ink);
      for(const l of b.lines){if(!l.trim()){y+=2;continue;}const ls=doc.splitTextToSize(pt(l),PW-2*PM-4);for(let i=0;i<ls.length;i++){y=ensure(doc,y,5);if(i===0&&b.title==="Key observations")doc.text("•",PM,y+3);doc.text(ls[i],PM+4,y+3);y+=4.4;}y+=1;}
      y+=2;continue;}
    if(b.t==="bars"){y=ensure(doc,y+2,72);y=pdfBars(doc,b,y);continue;}
    if(b.t==="grid"){y=ensure(doc,y+2,30);doc.setFont("times","bold");doc.setFontSize(10.5);doc.setTextColor(...PC.green);doc.text(pt(b.title),PM,y+4);y+=7;y=pdfGridTable(doc,Object.assign({fs:7.4},b.m),y);y+=3;}
  }
  return y;
}
function pdfBars(doc,b,y){
  const cols=[[42,120,214],[235,104,52],[27,175,122]],S3=[["rev","Revenue"],["ebitda","EBITDA"],["pat","Profit after tax"]];
  doc.setFont("times","bold");doc.setFontSize(10.5);doc.setTextColor(...PC.green);doc.text(pt(b.title),PM,y+4);y+=8;
  let lx=PM;doc.setFont("times","normal");doc.setFontSize(8);S3.forEach(([k,l],j)=>{doc.setFillColor(...cols[j]);doc.rect(lx,y-2.4,3,3,"F");doc.setTextColor(...PC.ink);doc.text(l,lx+4.5,y);lx+=doc.getTextWidth(l)+12;});y+=4;
  const H=50,L=PM+16,W=PW-PM-L,vals=b.yrs.flatMap(f=>S3.map(s=>f[s[0]]));const t=niceTicks(Math.min(0,...vals),Math.max(0,...vals),4),lo=t[0],hi=t[t.length-1];const Y=v=>y+(hi-v)/(hi-lo)*H;
  doc.setFontSize(7);for(const v of t){doc.setDrawColor(...(v===0?PC.ink:PC.rule));doc.setLineWidth(v===0?0.25:0.1);doc.line(L,Y(v),L+W,Y(v));doc.setTextColor(...PC.muted);doc.text(pt(shortAmt(v)),L-2,Y(v)+1,{align:"right"});}
  const band=W/b.yrs.length,gw=Math.min(band*0.7,36),bw=(gw-1)/3;
  b.yrs.forEach((f,i)=>{const x0=L+band*i+(band-gw)/2;S3.forEach(([k],j)=>{const v=f[k];const y0=Y(0),y1=Y(v);doc.setFillColor(...cols[j]);doc.rect(x0+j*(bw+0.5),Math.min(y0,y1),bw,Math.max(0.2,Math.abs(y1-y0)),"F");});
    doc.setTextColor(...PC.ink);doc.setFontSize(7.5);doc.text(fyLabel(f.Y),L+band*i+band/2,y+H+5,{align:"center"});});
  return y+H+10;
}

/* ---------- events ---------- */
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]");if(!b)return;tab=b.dataset.tab;if(tab!=="assets")form=null;delConfirm=null;render();});
$("#fySel").addEventListener("change",e=>{flushAll();sel=+e.target.value;showFin=false;try{localStorage.setItem("trufin.fy",sel);}catch(_){}render();});
$("#unitSel").addEventListener("change",e=>{unit=+e.target.value;try{localStorage.setItem("trufin.unit",unit);}catch(_){}render();});
$("#dlBtn").addEventListener("click",openExport);
onG(document,"click",e=>{if(fyPop&&!e.target.closest(".fyset")){fyPop=false;render();}});
onG(document,"keydown",e=>{if(e.key==="Escape"&&fyPop){fyPop=false;render();}});
$("#scrim").addEventListener("click",closeExport);
onG(document,"keydown",e=>{if(e.key==="Escape"&&exp.open)closeExport();
  if(e.key==="Tab"&&exp.open){const f=[...$("#exp").querySelectorAll("button:not([disabled]),input:not([disabled]),select")];if(!f.length)return;const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}});
$("#exp").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.x!==undefined){closeExport();return;}
  if(b.dataset.fmtpick){exp.fmt=b.dataset.fmtpick;exp.msg="";renderExport();return;}
  if(b.dataset.all!==undefined){downloadAll();return;}
  if(b.dataset.dl){downloadSection(b.dataset.dl,b.dataset.fmt);return;}
  if(b.dataset.gosign!==undefined){exp.open=false;closeExport();tab="settings";render();const c=$("#signcard");if(c)c.scrollIntoView({block:"start"});return;}});
$("#exp").addEventListener("change",e=>{const el=e.target;
  if(el.dataset.inc){exp.inc[el.dataset.inc]=el.checked?1:0;renderExport();return;}
  if(el.dataset.opt){exp[el.dataset.opt]=el.checked;return;}
  if(el.id==="expUnit"){unit=+el.value;try{localStorage.setItem("trufin.unit",unit);}catch(_){}render();}});
$("#finBtn").addEventListener("click",()=>{showFin=!showFin;if(["assets","docs","settings"].includes(tab))tab="pl";render();window.scrollTo({top:0});});

/* chart tooltips: any element with data-tip */
const tipEl=$("#tip");
function tipShow(el){tipEl.textContent="";String(el.dataset.tip).split("\n").forEach((l,i)=>{const s=document.createElement(i?"span":"b");s.textContent=l;tipEl.appendChild(s);});tipEl.hidden=false;}
function tipPlace(x,y){const w=tipEl.offsetWidth,h=tipEl.offsetHeight;let a=x+14,b=y+14;if(a+w>innerWidth-8)a=x-w-14;if(b+h>innerHeight-8)b=y-h-14;tipEl.style.left=Math.max(8,a)+"px";tipEl.style.top=Math.max(8,b)+"px";}
onG(document,"pointermove",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(!el){if(!tipEl.hidden)tipEl.hidden=true;return;}tipShow(el);tipPlace(e.clientX,e.clientY);});
onG(document,"focusin",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(!el){tipEl.hidden=true;return;}tipShow(el);const r=el.getBoundingClientRect();tipPlace(r.left+r.width/2,r.top);});
onG(document,"scroll",()=>{tipEl.hidden=true;},true);
const main=$("#main");
main.addEventListener("input",e=>{
  const el=e.target;
  if(el.dataset.annum){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null)return;queue(fyId(sel),{an:{[el.dataset.annum]:v}});return;}
  if(el.dataset.antext){queue(fyId(sel),{an:{[el.dataset.antext]:el.value}});return;}
  if(el.dataset.anbench){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null)return;layout.bench=Object.assign({},layout.bench);if(v==null)delete layout.bench[el.dataset.anbench];else layout.bench[el.dataset.anbench]=v;saveLayout(700);return;}
  if(el.dataset.anbsrc!==undefined){layout.benchSrc=el.value;saveLayout(700);return;}
  if(el.dataset.anwhy){queue(fyId(sel),{an:{why:{[el.dataset.anwhy]:el.value}}});return;}
  if(el.dataset.ancomment!==undefined){queue(fyId(sel),{an:{comment:el.value}});return;}
  if(el.dataset.path){const v=parseNum(el.value);const [grp,k]=el.dataset.path.split(".");
    if(el.value.trim()!==""&&v==null)return;
    queue(fyId(sel),{[grp]:{[k]:v==null?null:r2(v*unit)}});return;}
  if(el.dataset.f&&form){const k=el.dataset.f;form[k]=el.value;
    if(k==="rate"&&form.method==="SLM"){const r=parseNum(el.value);if(r>0){form.life=String(+(100/r).toFixed(2));const l=$("#f-life");if(l)l.value=form.life;}}
    if(k==="life"){const l=parseNum(el.value);if(l>0){form.rate=String(+(100/l).toFixed(4));const r=$("#f-rate");if(r)r.value=form.rate;}}
    const p=$("#preview");if(p)p.innerHTML=previewInner();return;}
  if(el.dataset.s){const k=el.dataset.s;setForm[k]=(k==="from"||k==="to")?(el.value===""?null:+el.value):el.value;if(el.tagName==="SELECT"&&k!=="from"&&k!=="to")render();return;}
  if(el.dataset.rp){const R=rpt();if(el.dataset.rp==="date"){if(el.value)R.dates[fyId(sel)]=el.value;else delete R.dates[fyId(sel)];}else R[el.dataset.rp]=el.value;layout.report=R;saveLayout(700);return;}
  if(el.dataset.pe&&periodEdit){periodEdit[el.dataset.pe]=el.value===""?null:+el.value;return;}
  if(el.dataset.d&&docForm){docForm[el.dataset.d]=el.value;if(el.dataset.d==="type")render();return;}
  if(el.dataset.lbl){const k=el.dataset.lbl,v=el.value;
    if(layout.custom[k]){if(!v.trim())return;layout.custom[k].label=v;}else{if(v.trim())layout.labels[k]=v;else delete layout.labels[k];}
    saveLayout(700);render();return;}
  if(el.dataset.noteId&&el.dataset.nf==="rowval"){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null)return;
    const id=el.dataset.noteId,rw=el.dataset.row;editNotes(ns=>{const n=ns.find(x=>x.id===id);const r=n&&(n.rows||[]).find(x=>x.id===rw);if(r)r.v=v==null?null:r2(v*unit);});return;}
  if(el.dataset.noteId&&el.dataset.nf==="rowlabel"){const id=el.dataset.noteId,rw=el.dataset.row,v=el.value;editNotes(ns=>{const n=ns.find(x=>x.id===id);const r=n&&(n.rows||[]).find(x=>x.id===rw);if(r)r.label=v;});return;}
  if(el.dataset.noteId&&el.dataset.nf!=="link"){const id=el.dataset.noteId,f=el.dataset.nf,v=el.value;editNotes(ns=>{const n=ns.find(x=>x.id===id);if(n){n[f]=v;n.tpl=false;}});}
});
main.addEventListener("change",e=>{
  const el=e.target;
  if(el.id==="mySel"){myAsset=el.value;render();return;}
  if(el.id==="d-file"){pickFile(el.files&&el.files[0]);return;}
  if(el.dataset.f&&form&&(el.tagName==="SELECT"||el.type==="date")){form[el.dataset.f]=el.value;render();return;}
  if(el.dataset.noteId&&el.dataset.nf==="link"){const id=el.dataset.noteId,v=el.value;editNotes(ns=>{const n=ns.find(x=>x.id===id);if(n)n.link=v;});}
});
main.addEventListener("dragover",e=>{const d=e.target.closest&&e.target.closest("#drop");if(d){e.preventDefault();d.classList.add("over");}});
main.addEventListener("dragleave",e=>{const d=e.target.closest&&e.target.closest("#drop");if(d)d.classList.remove("over");});
main.addEventListener("drop",e=>{const d=e.target.closest&&e.target.closest("#drop");if(!d)return;e.preventDefault();pickFile(e.dataTransfer.files&&e.dataTransfer.files[0]);});
main.addEventListener("focusout",e=>{const el=e.target;if(el.dataset&&(el.dataset.path||el.dataset.nf==="rowval")){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null){toast("Enter a number, e.g. 1,25,000.50 or (4,500) for a negative.");}setTimeout(()=>{const a=document.activeElement;if(!main.contains(a)||!(a.dataset&&(a.dataset.path||a.dataset.nf==="rowval")))render();},0);}});
main.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  const act=b.dataset.act;
  if(b.dataset.note){tab="notes";flashNote=b.dataset.note;render();return;}
  if(b.dataset.anv){anView=b.dataset.anv;try{localStorage.setItem("trufin.an",anView);}catch(_){}render();return;}
  if(b.dataset.anyrs){anYears=+b.dataset.anyrs;try{localStorage.setItem("trufin.anyrs",String(anYears));}catch(_){}render();return;}
  if(b.dataset.ancs){anCS=b.dataset.ancs==="1";render();return;}
  if(b.dataset.andu){anDu=+b.dataset.andu;render();return;}
  if(b.dataset.depview){depView=b.dataset.depview;render();return;}
  if(b.dataset.metric){myMetric=b.dataset.metric;render();return;}
  if(b.dataset.dl){downloadSection(b.dataset.dl,b.dataset.fmt);return;}
  if(b.dataset.fypop!==undefined){fyPop=!fyPop;render();return;}
  if(b.dataset.fyall){quickAll(b.dataset.fyall);return;}
  if(b.dataset.fyopts!==undefined){fyPop=false;render();openExport();return;}
  if(b.dataset.docf){docFilter=b.dataset.docf;render();return;}
  if(b.dataset.addline){jumpToAdd(b.dataset.addline,b.dataset.sec);return;}
  if(b.dataset.manage){tab="settings";periodEdit=null;render();const c=$("#lay-"+b.dataset.manage);if(c)c.scrollIntoView({block:"start"});return;}
  if(b.dataset.period){const k=b.dataset.period,p=layout.period[k]||{};
    if(periodEdit&&periodEdit.k===k&&!!periodEdit.rm===!!b.dataset.rm){periodEdit=null;render();return;}
    periodEdit={k,from:p.hidden?null:(p.from!=null?p.from:null),to:p.hidden?null:(p.to!=null?p.to:null),rm:!!b.dataset.rm};render();return;}
  if(b.dataset.addrow){if(tab==="notes"){jumpToAdd("notes",b.dataset.addrow);}return;}
  if(b.dataset.openAsset){tab="dep";depView="my";myAsset=b.dataset.openAsset;form=null;render();window.scrollTo({top:0});return;}
  if(b.dataset.edit){const a=assets.find(x=>x.id===b.dataset.edit);if(!a)return;
    form={id:a.id,name:a.name||"",tag:a.tag||"",cat:a.cat||"Laboratory equipment",loc:a.loc||"",put:a.put||"",cost:String(a.cost||""),method:a.method||"SLM",rate:String(a.rate||""),life:a.rate?String(+(100/a.rate).toFixed(2)):"",resid:String(a.resid||0),basis:a.basis||"full",years:String(a.years||10),disp:a.disp||"",proceeds:a.proceeds?String(a.proceeds):""};
    render();window.scrollTo({top:0});return;}
  if(b.dataset.askdel){delConfirm=b.dataset.askdel;render();return;}
  if(b.dataset.del){deleteAsset(b.dataset.del);return;}
  if(b.dataset.askdelnote){delConfirm="note:"+b.dataset.askdelnote;render();return;}
  if(b.dataset.delnote){const id=b.dataset.delnote;delConfirm=null;editNotes(ns=>{const i=ns.findIndex(x=>x.id===id);if(i>=0)ns.splice(i,1);});return;}
  if(b.dataset.askdelrow){delConfirm="row:"+b.dataset.askdelrow;render();return;}
  if(b.dataset.delrow){const id=b.dataset.noteId,rw=b.dataset.delrow;delConfirm=null;editNotes(ns=>{const n=ns.find(x=>x.id===id);if(n)n.rows=(n.rows||[]).filter(r=>r.id!==rw);});return;}
  if(b.dataset.move){const id=b.dataset.move,dir=+b.dataset.dir;editNotes(ns=>{const i=ns.findIndex(x=>x.id===id),j=i+dir;if(i>=0&&j>=0&&j<ns.length){const t=ns[i];ns[i]=ns[j];ns[j]=t;}});return;}
  if(b.dataset.ord){const [t,sid]=b.dataset.ts.split(":");const sec=SECS[t].find(s=>s.id===sid);const items=secItems(t,sec);const i=items.indexOf(b.dataset.ord),j=i+ +b.dataset.dir;
    if(i>=0&&j>=0&&j<items.length){const x=items[i];items[i]=items[j];items[j]=x;layout.order[b.dataset.ts]=items;saveLayout();render();}return;}
  if(b.dataset.askdelline){const k=b.dataset.askdelline;const t=layout.custom[k]&&layout.custom[k].tab;const ys=valuesExist(t,k);
    if(ys.length){toast("“"+lineLabel(k)+"” has amounts in "+ys.join(", ")+". Clear them before removing the line.");return;}
    delConfirm="line:"+k;render();return;}
  if(b.dataset.delline){const k=b.dataset.delline;delete layout.custom[k];delete layout.labels[k];for(const o in layout.order)layout.order[o]=layout.order[o].filter(x=>x!==k);delConfirm=null;saveLayout();toast("Line removed");render();return;}
  if(b.dataset.delcat){const i=+b.dataset.delcat;const c=layout.cats[i];if(c&&!assets.some(a=>a.cat===c.n)){layout.cats.splice(i,1);saveLayout();render();}return;}
  if(b.dataset.delloc){layout.locs.splice(+b.dataset.delloc,1);saveLayout();render();return;}
  if(b.dataset.opendoc){openLocalDoc(b.dataset.opendoc,false);return;}
  if(b.dataset.dldoc){downloadDocFile(b.dataset.dldoc);return;}
  if(b.dataset.askdeldoc){delConfirm="doc:"+b.dataset.askdeldoc;render();return;}
  if(b.dataset.deldoc){deleteDoc(b.dataset.deldoc);return;}
  if(b.dataset.csv){csv(b.dataset.csv,b.dataset.name);return;}
  switch(act){
    case "newasset":form=blankForm();render();break;
    case "cancelasset":form=null;render();break;
    case "saveasset":saveAsset();break;
    case "canceldel":delConfirm=null;render();break;
    case "clearex":(async()=>{const ex=assets.filter(a=>a.example);assets=assets.filter(a=>!a.example);render();if(db)for(const a of ex){try{await db.doc("assets/"+a.id).delete();}catch(_){}}toast("Example assets removed");})();break;
    case "anbe":anBE=!anBE;render();break;
    case "anaddnote":{const d=yearData(sel,true);if((d.notes||[]).some(n=>n.kind==="ratios"))break;
      editNotes(ns=>ns.push({id:rid("n"),title:"Additional regulatory information: ratios",link:"",body:"",kind:"ratios",tpl:false,rows:[]}));toast("Added as note "+(d.notes.length+1)+" to the financial statements");break;}
    case "addnote":editNotes(ns=>ns.push({id:rid("n"),title:"New note",link:"",body:"",kind:"",tpl:false,rows:[]}));setTimeout(()=>{const l=ROOT.querySelectorAll(".note");if(l.length)l[l.length-1].scrollIntoView({block:"center"});},50);break;
    case "setadd":addFromSettings();break;
    case "saveperiod":{const pe=periodEdit;if(!pe)break;
      if(pe.from!=null&&pe.to!=null&&pe.from>pe.to){toast("“Until” is earlier than “From”.");break;}
      if(pe.from==null&&pe.to==null)delete layout.period[pe.k];else layout.period[pe.k]={from:pe.from,to:pe.to};
      periodEdit=null;saveLayout();toast("“"+lineLabel(pe.k)+"” · "+fmtPeriod(pe.k));render();break;}
    case "cancelperiod":periodEdit=null;render();break;
    case "endafter":{const pe=periodEdit;if(!pe)break;const p=layout.period[pe.k]||{};
      layout.period[pe.k]={from:p.hidden?null:(p.from!=null?p.from:null),to:+b.dataset.y};periodEdit=null;saveLayout();toast("“"+lineLabel(pe.k)+"” · "+fmtPeriod(pe.k));render();break;}
    case "hideall":{const pe=periodEdit;if(!pe)break;layout.period[pe.k]={hidden:true};periodEdit=null;saveLayout();toast("“"+lineLabel(pe.k)+"” hidden. Use its Hidden button to show it again.");render();break;}
    case "purgeline":if(periodEdit)purgeLine(periodEdit.k);break;
    case "alldocs":downloadAllDocs();break;
    case "newdoc":docForm=blankDoc();render();break;
    case "canceldoc":docForm=null;render();break;
    case "savedoc":saveDoc();break;
    case "finalise":doFinalise();break;
    case "reopen":doReopen();break;
    case "closefin":showFin=false;render();break;
  }
});
main.addEventListener("submit",e=>e.preventDefault());
main.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="s-label"){e.preventDefault();addFromSettings();}});

/* ---- sundry creditors / debtors events ---- */
function partyInput(el){
  const k=el.dataset.pk,id=el.dataset.pid,f=el.dataset.pf;
  if(f==="adv"){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null)return;editParties(k,a=>{const r=a.find(x=>x.id===id);if(r){r.adv=v==null?null:r2(Math.abs(v));if(!r.advT)r.advT=ADV_T[k][0][0];}},true);return;}
  if(/^a\d+$/.test(f)){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null)return;const j=+f.slice(1);
    editParties(k,a=>{const r=a.find(x=>x.id===id);if(!r)return;r.a=Array.isArray(r.a)?r.a:[];while(r.a.length<j)r.a.push(null);r.a[j]=v==null?null:r2(v);},true);
    const r=partyRows(sel,k).find(x=>x.id===id);const t=$("#pt-"+id);if(r&&t){const s=pTot(r);t.textContent=rsx(s);t.className=s<0?"neg":"";}return;}
  const v=el.type==="checkbox"?el.checked:el.value;
  editParties(k,a=>{const r=a.find(x=>x.id===id);if(r)r[f]=f==="gstin"?String(v).toUpperCase():v;},el.type==="text");
}
main.addEventListener("input",e=>{const el=e.target;
  if(el.dataset.pk&&el.dataset.pid&&el.type==="text")partyInput(el);
  else if(el.dataset.pk&&el.dataset.pid&&el.inputMode==="decimal")partyInput(el);
  else if(el.dataset.pq){pq[el.dataset.pq]=el.value;render();}
  else if(el.dataset.pprov){const v=parseNum(el.value);if(el.value.trim()!==""&&v==null)return;queue(fyId(sel),{sdProv:v==null?null:r2(v)});}
});
main.addEventListener("change",e=>{const el=e.target;
  if(el.dataset.pk&&el.dataset.pid&&(el.tagName==="SELECT"||el.type==="checkbox"))partyInput(el);
  else if(el.dataset.psort){psort[el.dataset.psort]=el.value;render();}
  else if(el.dataset.pimp){const k=el.dataset.pimp,f=el.files&&el.files[0];el.value="";if(!f)return;
    if(f.size>5*1048576){pImp={k,err:true,msg:"That file is over 5 MB. Export only the party balances."};render();return;}
    const rd=new FileReader();rd.onload=()=>{pImp=Object.assign({k},importParties(k,rd.result));render();};rd.readAsText(f);}
});
main.addEventListener("focusout",e=>{const el=e.target;if(!el.dataset||!el.dataset.pk||!el.dataset.pid||el.tagName==="SELECT"||el.type==="checkbox")return;
  if(el.inputMode==="decimal"&&el.value.trim()!==""&&parseNum(el.value)==null)toast("Enter a number, e.g. 1,25,000.50 or (4,500) for a debit balance.");
  setTimeout(()=>{const a=document.activeElement;if(!(a&&a.dataset&&a.dataset.pk&&a.dataset.pid&&(a.type==="text"||a.inputMode==="decimal")))render();},0);});
main.addEventListener("click",e=>{const b=e.target.closest("button[data-pact]");if(!b)return;
  const k=b.dataset.pk,act=b.dataset.pact;
  switch(act){
    case "add":{const r=blankParty(k);editParties(k,a=>a.push(r));pq[k]="";setTimeout(()=>{const i=byId("p-"+r.id+"-name");if(i){i.scrollIntoView({block:"center"});i.focus();}},40);break;}
    case "askdel":delConfirm="party:"+b.dataset.pid;render();break;
    case "mvadv":{let n=0;editParties(k,a=>{for(const r of a){const t=pTot(r);if(t<0){r.adv=r2((+r.adv||0)-t);r.a=[];if(!r.advT)r.advT=ADV_T[k][0][0];n++;}}});toast("Moved "+n+" "+(n===1?"balance":"balances")+" to the Advance column");break;}
    case "del":delConfirm=null;editParties(k,a=>{const i=a.findIndex(x=>x.id===b.dataset.pid);if(i>=0)a.splice(i,1);});break;
    case "askclear":delConfirm="pclear:"+k;render();break;
    case "clear":delConfirm=null;editParties(k,a=>a.splice(0,a.length));toast(PK[k].title+" cleared for "+fyLabel(sel));break;
    case "imp":{const f=byId("pimp-"+k);if(f)f.click();break;}
    case "impclose":pImp=null;render();break;
    case "tpl":partyTemplate(k);break;
    case "fwd":{let n=0;editParties(k,a=>{const have=new Set(a.map(pMatchKey).concat(a.map(r=>"n:"+normName(r.name))));
      for(const p of partyRows(sel-1,k)){if(have.has(pMatchKey(p))||have.has("n:"+normName(p.name)))continue;
        const r=blankParty(k);for(const f of ["name","gstin","msme","nat","cat","loc"])if(p[f]!=null&&f in r)r[f]=p[f];a.push(r);n++;}});
      toast(n?"Brought forward "+n+" "+(n===1?"party":"parties")+" from "+fyLabel(sel-1)+" with blank amounts":"Every party from "+fyLabel(sel-1)+" is already in the list");break;}
    case "post":{const R=partyRecon(k,statement(sel,true));if(!R)break;const upd={};for(const l of R.L)upd[l.key]=l.reg;queue(fyId(sel),{bs:upd});
      toast(R.L.map(l=>l.lab+" set to "+fmtRs(l.reg)).join(" · "));break;}
  }
});

/* ---------- boot ---------- */
function subscribe(){
  setSave("Loading…");
  const saved=()=>Object.keys(pend).length||layoutDirty?"Saving…":("Saved");
  db.collection("years").onSnapshot(s=>{raw={};for(const doc of s.docs)raw[doc.id]=doc.data();resolveNames();setSave(saved());render();},()=>toast("Couldn’t load statements."));
  db.collection("assets").onSnapshot(s=>{assets=s.docs.map(x=>Object.assign({},x.data(),{id:x.id}));render();},()=>toast("Couldn’t load the asset register."));
  db.collection("config").onSnapshot(s=>{if(layoutDirty)return;const d=s.docs.find(x=>x.id==="layout");layout=normLayout(d?d.data():null);render();},()=>toast("Couldn’t load settings."));
  db.collection("docs").onSnapshot(s=>{docs=s.docs.map(x=>Object.assign({},x.data(),{id:x.id}));render();},()=>toast("Couldn’t load documents."));
}
render();
(async()=>{
  isLocal=true;uid=HOST.uid||null;canWrite=!!HOST.canWrite;canAdmin=!!HOST.canAdmin;
  setSave("Loading…");
  try{db=await HOST.openDB();}catch(e){db=null;toast("Couldn’t load the accounts. "+(e&&e.message||""));}
  if(DEAD)return;
  dbReady=true;
  if(!db){render();return;}
  $("#bkBtn").hidden=false;$("#rsBtn").hidden=!canWrite;
  subscribe();
})();
async function resolveNames(){
  if(!user||!user.profiles)return;
  const ids=[...new Set(Object.values(raw).map(d=>d&&d.finalisedBy).filter(Boolean))].filter(id=>!(id in names));
  if(!ids.length)return;
  try{const ps=await user.profiles(ids);for(const id of ids)names[id]=(ps[id]&&ps[id].name)||"";render();}catch(_){}
}

/* ---- host API ---- */
return {
  setTab(t){if(DEAD)return;const b=ROOT.querySelector('#tabs button[data-tab="'+t+'"]');if(b&&t!==tab)b.click();},
  destroy(){DEAD=true;CLEAN.forEach(f=>{try{f();}catch(_){}});CLEAN.length=0;try{if(typeof viewUrl!=="undefined"&&viewUrl)URL.revokeObjectURL(viewUrl);}catch(_){}document.body.style.overflow="";ROOT.innerHTML="";}
};
}
