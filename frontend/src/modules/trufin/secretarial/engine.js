/* eslint-disable */
// TruFin Secretarial (Secretarial & corporate compliance module) — ported from the TruFin reference page (trufin-secretarial.html).
// The page's own logic is kept as-is; only the host hooks differ: it renders into
// ROOT, takes its tab from the sidebar route, and stores data and files on the
// TrustComply server (HOST.openDB / HOST.files) instead of the browser.
const MARKUP="<div class=\"wrap\">\n<header class=\"top\">\n  <div class=\"bar\">\n    <div class=\"entity\">\n      <div class=\"mark\" aria-hidden=\"true\">T</div>\n      <div style=\"min-width:0\"><h1 id=\"coName\">TrustLab Diagnostics Private Limited</h1><div class=\"cin\" id=\"coCin\">Secretarial &amp; corporate compliance</div></div>\n    </div>\n    <div class=\"controls\">\n      <div class=\"ctl\"><label for=\"fySel\">Compliance year</label><select id=\"fySel\"></select></div>\n      <button id=\"dlBtn\" class=\"btn dlbtn\" type=\"button\" aria-haspopup=\"dialog\"><svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path d=\"M8 2v8m0 0-3.2-3.2M8 10l3.2-3.2M3 13h10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>Download</button>\n      <button id=\"bkBtn\" class=\"btn small\" type=\"button\" hidden>Backup</button>\n      <button id=\"rsBtn\" class=\"btn small\" type=\"button\" hidden>Restore</button>\n      <input type=\"file\" id=\"rsFile\" accept=\".json,application/json\" hidden>\n      <span id=\"saveState\" class=\"save\" aria-live=\"polite\"></span>\n    </div>\n  </div>\n  <nav class=\"tabs\" role=\"tablist\" id=\"tabs\">\n    <button role=\"tab\" data-tab=\"overview\">Calendar<span class=\"count\" hidden></span></button>\n    <button role=\"tab\" data-tab=\"meetings\">Meetings</button>\n    <button role=\"tab\" data-tab=\"resolutions\">Resolutions</button>\n    <button role=\"tab\" data-tab=\"directors\">Directors &amp; KMP</button>\n    <button role=\"tab\" data-tab=\"shareholders\">Shareholders</button>\n    <button role=\"tab\" data-tab=\"events\">Events &amp; charges</button>\n    <button role=\"tab\" data-tab=\"registers\">Registers</button>\n    <button role=\"tab\" data-tab=\"docs\">Documents</button>\n    <span class=\"sep\" aria-hidden=\"true\"></span>\n    <button role=\"tab\" data-tab=\"settings\">Settings</button>\n  </nav>\n</header>\n<main id=\"main\"></main>\n</div>\n<div id=\"scrim\" class=\"scrim\" hidden></div>\n<div id=\"viewer\" class=\"viewer\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Document\" hidden></div>\n<aside id=\"exp\" class=\"drawer\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"expTitle\" hidden></aside>\n<div id=\"toast\" class=\"toast\" hidden></div>";

export function mountSecretarial(ROOT,HOST){

"use strict";
/* ---- host integration ---- */
let DEAD=false;const CLEAN=[];
const onG=(t,ev,fn,o)=>{t.addEventListener(ev,fn,o);CLEAN.push(()=>t.removeEventListener(ev,fn,o));};
const byId=id=>{const el=document.getElementById(id);return el&&ROOT.contains(el)?el:null;};
ROOT.innerHTML=MARKUP;

/* ================= TruFin Secretarial: corporate compliance for a private limited company ================= */
const CO_DEFAULT={name:"TrustLab Diagnostics Private Limited",cin:"U85100TG2020PTC143059",inc:"",ro:"#31, Street No. 5, Prakash Nagar, Begumpet, Hyderabad – 500016",email:"admin@mytrustlab.com",authCap:"",paidCap:"",
  small:false,msme:true,dpt3:true,csr:false,fla:false,holding:false,
  audFirm:"",audFrn:"",audFrom:"",audTermEnd:"",
  trackFrom:"",demat9b:true,dematFrom:"2025-06-30",signName:"Venkata Cherukuri",signDes:"Chairman & Managing Director",signDin:"",place:"Hyderabad",custom:[]};
const SHORT="TrustLab";
const FIRST_FY=2020, DAY=86400000;

/* ---------- helpers ---------- */
const $=s=>ROOT.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const isObj=o=>o&&typeof o==="object"&&!Array.isArray(o);
const rid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const D=(y,m,d)=>Date.UTC(y,m-1,d);
function pd(s){if(!s||typeof s!=="string")return null;const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null;}
const iso=t=>new Date(t).toISOString().slice(0,10);
const fyId=Y=>Y+"-"+String((Y+1)%100).padStart(2,"0");
const fyLabel=Y=>"FY "+fyId(Y);
const fyS=Y=>D(Y,4,1), fyE=Y=>D(Y+1,3,31);
function fyOfT(t){const d=new Date(t);const y=d.getUTCFullYear();return d.getUTCMonth()>=3?y:y-1;}
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONL=["January","February","March","April","May","June","July","August","September","October","November","December"];
function fmtD(t){if(t==null||isNaN(t))return "–";const d=new Date(t);return d.getUTCDate()+" "+MON[d.getUTCMonth()]+" "+d.getUTCFullYear();}
function fmtDL(t){if(t==null||isNaN(t))return "__________";const d=new Date(t);return d.getUTCDate()+" "+MONL[d.getUTCMonth()]+" "+d.getUTCFullYear();}
const fmtRs=v=>"₹"+(+v||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const fmtSize=b=>b>=1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
function parseNum(s){if(s==null)return null;s=String(s).replace(/[₹,\s]/g,"");if(!s)return null;const v=parseFloat(s);return isNaN(v)?null:v;}
function toast(msg){if(DEAD)return;const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,3600);}
const nowD=new Date();const TODAY=D(nowD.getFullYear(),nowD.getMonth()+1,nowD.getDate());
const CUR_FY=fyOfT(TODAY);
const ordinal=n=>{const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};

/* ---------- reference data ---------- */
const EVT={
 allot:{n:"Allotment of shares",form:"PAS-3",days:15,law:"Sec 39(4), 42, 62"},
 capital:{n:"Increase or alteration of authorised capital",form:"SH-7",days:30,law:"Sec 64"},
 charge:{n:"Creation of charge",form:"CHG-1",days:30,law:"Sec 77",charge:true},
 chargemod:{n:"Modification of charge",form:"CHG-1",days:30,law:"Sec 79",charge:true},
 chargesat:{n:"Satisfaction of charge",form:"CHG-4",days:30,law:"Sec 82",charge:true},
 dirapp:{n:"Appointment of director or KMP",form:"DIR-12",days:30,law:"Sec 152, 170"},
 dirchg:{n:"Change in designation of director or KMP",form:"DIR-12",days:30,law:"Sec 170"},
 dircease:{n:"Resignation or cessation of director or KMP",form:"DIR-12",days:30,law:"Sec 168"},
 kycchg:{n:"Change in a director’s mobile, email or address",form:"DIR-3 KYC Web",days:30,law:"Rule 12A"},
 ro:{n:"Shifting of registered office",form:"INC-22",days:30,law:"Sec 12"},
 moa:{n:"Alteration of MOA or AOA",form:"MGT-14",days:30,law:"Sec 13, 14, 117"},
 sbo:{n:"Significant beneficial ownership declaration received (BEN-1)",form:"BEN-2",days:30,law:"Sec 90"},
 audres:{n:"Resignation of auditor / casual vacancy",form:"ADT-3 · ADT-1",days:30,law:"Sec 139(8), 140"},
 transfer:{n:"Transfer or transmission of shares",form:"Register & certificate",days:30,law:"Sec 56"},
 other:{n:"Other event",form:"",days:null,law:""}
};
const CATS={mca:"MCA forms",meet:"Meetings & minutes",dir:"Directors",event:"Event-based",custom:"Your items",other:"Other laws"};
const DOC_CATS=[{k:"mca",n:"MCA forms, challans & SRN acknowledgements"},{k:"minbm",n:"Board & committee minutes (signed)"},{k:"mingm",n:"General meeting minutes (signed)"},{k:"notice",n:"Notices, agenda & attendance"},{k:"res",n:"Resolutions & certified copies"},{k:"dirdocs",n:"Director declarations & KYC (DIR-2, DIR-8, MBP-1)"},{k:"charge",n:"Charge documents"},{k:"capital",n:"Share capital: allotment and transfer papers"},{k:"sharecert",n:"Share certificates (scanned)"},{k:"sh4",n:"Transfer deeds (SH-4)"},{k:"demat",n:"Demat: DRF, CML, holding statements, corporate actions"},{k:"regs",n:"Statutory registers"},{k:"incorp",n:"Incorporation: COI, MOA, AOA"},{k:"auditor",n:"Auditor: consent, eligibility, appointment"},{k:"roc",n:"ROC / MCA notices & replies"},{k:"other",n:"Other"}];
const docCatName=k=>(DOC_CATS.find(c=>c.k===k)||{n:k}).n;
const REGS=[
 {k:"mgt1",n:"Register of members",f:"MGT-1 · Sec 88"},
 {k:"dirkmp",n:"Register of directors and KMP and their shareholding",f:"Sec 170 · Rule 17"},
 {k:"chg7",n:"Register of charges",f:"CHG-7 · Sec 85"},
 {k:"mbp4",n:"Register of contracts with related parties and interested directors",f:"MBP-4 · Sec 189"},
 {k:"mbp2",n:"Register of loans, guarantees, security and acquisitions",f:"MBP-2 · Sec 186"},
 {k:"mbp3",n:"Register of investments not held in the company’s name",f:"MBP-3 · Sec 187"},
 {k:"ben3",n:"Register of significant beneficial owners",f:"BEN-3 · Sec 90"},
 {k:"sh2",n:"Register of renewed and duplicate share certificates",f:"SH-2 · Sec 46"},
 {k:"sh6",n:"Register of employee stock options",f:"SH-6 · Sec 62"},
 {k:"dep",n:"Register of deposits",f:"Rule 14, Deposit Rules"},
 {k:"minb",n:"Minutes book: Board and committee meetings",f:"Sec 118 · SS-1"},
 {k:"ming",n:"Minutes book: General meetings",f:"Sec 118 · SS-2"},
 {k:"att",n:"Attendance register: Board and committee meetings",f:"SS-1"}
];
const MEET_T={board:"Board meeting",committee:"Committee meeting",agm:"Annual General Meeting",egm:"Extraordinary General Meeting"};
const RES_BODY={board:"Board (at meeting)",circ:"Board (by circulation)",members:"Members"};
/* resolution library — review and edit before use */
const TPL=[
 {k:"fs",b:"board",t:"Approval of audited financial statements and Board’s report",x:"RESOLVED THAT the audited financial statements of the Company for the financial year ended 31 March [year], comprising the Balance Sheet, the Statement of Profit and Loss, the Cash Flow Statement and the notes thereto, together with the Auditor’s Report thereon, be and are hereby approved.\n\nRESOLVED FURTHER THAT the Board’s report for the said financial year be and is hereby approved, and that [Director 1] and [Director 2], Directors, be and are hereby authorised to sign the financial statements and the Board’s report on behalf of the Board."},
 {k:"agm",b:"board",t:"Convening the Annual General Meeting",x:"RESOLVED THAT the [n]th Annual General Meeting of the members of the Company be held on [date] at [time] at [venue / through video conferencing] to transact the business set out in the draft notice placed before the Board, which is hereby approved.\n\nRESOLVED FURTHER THAT [name], Director, be and is hereby authorised to sign and issue the notice to the members, the auditors and the directors, and to do all acts necessary to give effect to this resolution."},
 {k:"bank",b:"board",t:"Opening of bank account and authorised signatories",x:"RESOLVED THAT a [current] account be opened in the name of the Company with [bank name], [branch], and that the said bank be and is hereby authorised to honour cheques, instructions and other instruments signed by [names / designations], [singly / jointly].\n\nRESOLVED FURTHER THAT a copy of this resolution certified by any Director be furnished to the bank."},
 {k:"adddir",b:"board",t:"Appointment of additional director",x:"RESOLVED THAT pursuant to Section 161 of the Companies Act, 2013 and the Articles of Association of the Company, [name] (DIN [DIN]), who has given consent in Form DIR-2 and declared that he/she is not disqualified in Form DIR-8, be and is hereby appointed as an Additional Director of the Company with effect from [date], to hold office up to the date of the next Annual General Meeting.\n\nRESOLVED FURTHER THAT any Director be and is hereby authorised to file Form DIR-12 with the Registrar of Companies and to update the statutory registers."},
 {k:"resig",b:"board",t:"Taking note of resignation of director",x:"RESOLVED THAT the resignation of [name] (DIN [DIN]) from the office of Director of the Company, tendered by letter dated [date], be and is hereby noted with effect from [date], and the Board places on record its appreciation of the services rendered by him/her.\n\nRESOLVED FURTHER THAT any Director be and is hereby authorised to file Form DIR-12 with the Registrar of Companies within the prescribed time."},
 {k:"borrow",b:"board",t:"Availing credit facility and creation of charge",x:"RESOLVED THAT consent of the Board be and is hereby accorded to avail a [term loan / working capital facility] of up to ₹[amount] from [lender] on the terms and conditions set out in the sanction letter dated [date], and to create a charge on [assets] in favour of the lender as security.\n\nRESOLVED FURTHER THAT [name], Director, be and is hereby authorised to execute the loan documents and to file Form CHG-1 with the Registrar of Companies within 30 days of creation of the charge."},
 {k:"allot",b:"board",t:"Allotment of equity shares",x:"RESOLVED THAT pursuant to Sections 42 and 62 of the Companies Act, 2013 and the approvals obtained, [number] equity shares of ₹[face value] each at a premium of ₹[premium] per share be and are hereby allotted to the persons listed in the annexure, against the consideration received in the Company’s bank account.\n\nRESOLVED FURTHER THAT any Director be and is hereby authorised to issue share certificates, update the register of members and file Form PAS-3 within 15 days of allotment."},
 {k:"ro",b:"board",t:"Shifting of registered office within the same city",x:"RESOLVED THAT the registered office of the Company be shifted from [present address] to [new address] with effect from [date], being within the local limits of the same city.\n\nRESOLVED FURTHER THAT any Director be and is hereby authorised to file Form INC-22 with the Registrar of Companies within 30 days."},
 {k:"mbp",b:"board",t:"Noting of directors’ disclosures (MBP-1 and DIR-8)",x:"RESOLVED THAT the disclosures of interest in Form MBP-1 under Section 184(1) and the declarations of non-disqualification in Form DIR-8 under Section 164(2) received from all the Directors for the financial year [year] be and are hereby taken on record."},
 {k:"rpt",b:"board",t:"Approval of related party transaction",x:"RESOLVED THAT pursuant to Section 188 of the Companies Act, 2013, the approval of the Board be and is hereby accorded to the Company entering into [nature of contract] with [related party], a related party, for [value / duration], on terms which are in the ordinary course of business and on an arm’s length basis.\n\nRESOLVED FURTHER THAT the transaction be entered in the register maintained in Form MBP-4."},
 {k:"auth",b:"board",t:"Authority for statutory filings",x:"RESOLVED THAT [name], [designation], be and is hereby authorised to sign, certify and file forms, returns and documents with the Ministry of Corporate Affairs, the Registrar of Companies and other authorities on behalf of the Company, and to do all acts incidental thereto."},
 {k:"afs",b:"members",kind:"ordinary",t:"Adoption of audited financial statements",x:"RESOLVED THAT the audited financial statements of the Company for the financial year ended 31 March [year], together with the reports of the Board of Directors and the Auditors thereon, as laid before this meeting, be and are hereby received, considered and adopted."},
 {k:"aud",b:"members",kind:"ordinary",t:"Appointment of statutory auditor",x:"RESOLVED THAT pursuant to Section 139 of the Companies Act, 2013 and the rules made thereunder, [firm name], Chartered Accountants (Firm Registration No. [FRN]), be and are hereby appointed as the Statutory Auditors of the Company to hold office from the conclusion of this Annual General Meeting until the conclusion of the [sixth] Annual General Meeting held thereafter, at such remuneration as may be fixed by the Board of Directors."},
 {k:"regdir",b:"members",kind:"ordinary",t:"Regularisation of additional director",x:"RESOLVED THAT [name] (DIN [DIN]), who was appointed as an Additional Director with effect from [date] and holds office up to the date of this meeting, be and is hereby appointed as a Director of the Company, liable to retire by rotation."},
 {k:"cap",b:"members",kind:"ordinary",t:"Increase in authorised share capital and alteration of MOA",x:"RESOLVED THAT pursuant to Sections 13 and 61 of the Companies Act, 2013, the authorised share capital of the Company be and is hereby increased from ₹[present] divided into [number] equity shares of ₹[face value] each to ₹[new] divided into [number] equity shares of ₹[face value] each, and Clause V of the Memorandum of Association be substituted accordingly.\n\nRESOLVED FURTHER THAT any Director be and is hereby authorised to file Form SH-7 with the Registrar of Companies."},
 {k:"aoa",b:"members",kind:"special",t:"Alteration of Articles of Association",x:"RESOLVED THAT pursuant to Section 14 of the Companies Act, 2013, the Articles of Association of the Company be and are hereby altered by [substituting / inserting] Article [number] as follows: [text].\n\nRESOLVED FURTHER THAT any Director be and is hereby authorised to file Form MGT-14 with the Registrar of Companies within 30 days."},
 {k:"blank",b:"board",t:"Blank resolution",x:"RESOLVED THAT "}
];

/* ---------- state ---------- */
let sel=CUR_FY;
try{const s=localStorage.getItem("trufin.cs.fy");if(s&&+s>=FIRST_FY&&+s<=CUR_FY+1)sel=+s;}catch(e){}
let tab=HOST.tab||"overview";let lastTab=tab;
let cfg=clone(CO_DEFAULT),regs={},dirs=[],meets=[],ress=[],evs=[],fils={},docs=[];
let db=null,user=null,downloads=null,fileCap=null,uid=null,canWrite=true,dbReady=false,isLocal=false;
let edit=null,openItem=null,itemForm=null,delConfirm=null,catF="all",stF="open",monthF=null,meetF="all",resF="all",docFilter="sel",docForm=null,uploading=false;
let cfgDirty=false,cfgTimer=null,regDirty=false,regTimer=null,chain=Promise.resolve();
const co=()=>Object.assign({},CO_DEFAULT,cfg);

/* ---------- compliance engine ---------- */
function agmFor(fy){return meets.find(m=>m.type==="agm"&&+m.forFy===fy&&m.date);}
function boardMeets(from,to){return meets.filter(m=>m.type==="board"&&m.date&&pd(m.date)>=from&&pd(m.date)<=to).sort((a,b)=>pd(a.date)-pd(b.date));}
const isDirector=d=>d.kind!=="kmp";
function activeDirs(at){return dirs.filter(d=>isDirector(d)&&(!d.appointed||pd(d.appointed)<=at)&&(!d.ceased||pd(d.ceased)>at));}
function autoBM(Y){
  const c=co(),bms=boardMeets(fyS(Y),fyE(Y));const n=bms.length;
  const prev=boardMeets(fyS(Y)-400*DAY,fyS(Y)-DAY).pop();
  const pts=(prev?[pd(prev.date)]:[]).concat(bms.map(m=>pd(m.date)));
  let gap=0;for(let i=1;i<pts.length;i++)gap=Math.max(gap,Math.round((pts[i]-pts[i-1])/DAY));
  const sinceLast=pts.length?Math.round((Math.min(TODAY,fyE(Y))-pts[pts.length-1])/DAY):null;
  if(c.small){
    const h1=bms.some(m=>pd(m.date)<=D(Y,9,30)),h2=bms.some(m=>pd(m.date)>=D(Y,10,1));
    const ok=h1&&h2;return {done:ok,note:(h1?"First half ✓":"First half pending")+" · "+(h2?"second half ✓":"second half pending")};}
  const bad=gap>120||(sinceLast!=null&&sinceLast>120&&TODAY<=fyE(Y)+DAY);
  return {done:n>=4&&!bad&&gap<=120,bad,note:n+" of 4 held"+(pts.length>1?" · longest gap "+gap+" days":"")+(sinceLast!=null&&sinceLast>120&&TODAY<=fyE(Y)?" · "+sinceLast+" days since the last meeting":"")};
}
function autoMBP(Y){const at=Math.min(fyE(Y),Math.max(fyS(Y),TODAY));const ds=activeDirs(at);const k=fyId(Y);
  const m=ds.filter(d=>d.mbp1&&d.mbp1[k]).length,e=ds.filter(d=>d.dir8&&d.dir8[k]).length;
  return {done:ds.length>0&&m===ds.length&&e===ds.length,note:"MBP-1 "+m+"/"+ds.length+" · DIR-8 "+e+"/"+ds.length+" directors"};}
function autoFS(Y){const m=meets.find(x=>x.type==="board"&&x.fsFor&&+x.fsFor===Y-1&&x.date);return m?{done:true,date:pd(m.date),note:"Approved at "+(m.no||"board meeting")+" on "+fmtD(pd(m.date))}:null;}
function stepDates(cu,Y){
  const out=[];const d=+cu.day||1;
  const mk=(mm,yy)=>{const last=new Date(Date.UTC(yy,mm,0)).getUTCDate();return D(yy,mm,Math.min(d,last));};
  if(cu.freq==="once"){const t=pd(cu.date);if(t!=null&&t>=fyS(Y)&&t<=fyE(Y))out.push(t);return out;}
  const step={annual:12,half:6,quarter:3,monthly:1}[cu.freq]||12;const m0=+cu.month||1;
  for(let j=0;j<12/step;j++){const mm=((m0-1+step*j)%12)+1;out.push(mk(mm,mm>=4?Y:Y+1));}
  return out.sort((a,b)=>a-b);
}
const FREQ={annual:"Every year",half:"Every six months",quarter:"Every quarter",monthly:"Every month",once:"One time"};
function itemsFor(Y){
  const c=co(),L=[],W0=fyS(Y),W1=fyE(Y);
  const add=o=>{if(o.due>=W0&&o.due<=W1)L.push(Object.assign({cat:"mca",fy:Y},o));};
  const agm=agmFor(Y-1),agmD=agm?pd(agm.date):null,prevAgm=agmFor(Y-2);
  let agmDue=D(Y,9,30),agmBasis="Within six months of the year end (by 30 September)";
  if(prevAgm){const p=new Date(pd(prevAgm.date));const lim=Date.UTC(p.getUTCFullYear(),p.getUTCMonth()+15,p.getUTCDate());if(lim<agmDue){agmDue=lim;agmBasis="Within 15 months of the previous AGM on "+fmtD(pd(prevAgm.date));}}
  if(c.msme)add({key:`msme1:${Y-1}H2`,form:"MSME-1",title:"Half-yearly return of amounts due to micro and small enterprises",period:"Oct "+(Y-1)+" – Mar "+Y,due:D(Y,4,30),basis:"By 30 April",law:"Sec 405 · MSME Order, 2019"});
  if(c.dpt3)add({key:`dpt3:${Y-1}`,form:"DPT-3",title:"Return of deposits and outstanding loans as on 31 March "+Y,period:fyLabel(Y-1),due:D(Y,6,30),basis:"By 30 June",law:"Rule 16, Deposit Rules"});
  if(c.fla)add({key:`fla:${Y-1}`,cat:"other",form:"FLA",title:"Annual return on foreign liabilities and assets (RBI)",period:fyLabel(Y-1),due:D(Y,7,15),basis:"By 15 July",law:"FEMA"});
  const agmIt={key:`agm:${Y-1}`,cat:"meet",form:"AGM",title:"Annual General Meeting for "+fyLabel(Y-1),period:fyLabel(Y-1),due:agmDue,basis:agmBasis,law:"Sec 96",auto:agm?{done:true,date:agmD,note:"Held on "+fmtD(agmD)}:null,fy:Y};
  add(agmIt);
  /* if the AGM is not yet held, AOC-4 and MGT-7 run from the last date it may be held, including any extension */
  const agmBase=agmD||(()=>{const st=statusOf(agmIt);return st.due;})();const agmExt=!agmD&&agmBase!==D(Y,9,30);
  add({key:`bmfs:${Y-1}`,cat:"meet",form:"Board",title:"Board meeting to approve financial statements, Board’s report and AGM notice",period:fyLabel(Y-1),due:agmBase-22*DAY,basis:"In time to give 21 clear days’ notice of the AGM"+(agmExt?" (as extended to "+fmtD(agmBase)+")":""),law:"Sec 134 · Sec 101",auto:autoFS(Y)});
  const aocDue=agmBase+30*DAY;
  add({key:`aoc4:${Y-1}`,form:c.holding?"AOC-4 · AOC-4 CFS":"AOC-4",title:"Filing of financial statements with the Registrar",period:fyLabel(Y-1),due:aocDue,basis:agmD?"30 days from the AGM on "+fmtD(agmD):"30 days from the AGM (assumes the AGM on "+fmtD(agmBase)+(agmExt?", as extended":"")+")",law:"Sec 137"});
  add({key:`mgt7:${Y-1}`,form:c.small?"MGT-7A":"MGT-7",title:"Annual return",period:fyLabel(Y-1),due:agmBase+60*DAY,basis:agmD?"60 days from the AGM on "+fmtD(agmD):"60 days from the AGM (assumes the AGM on "+fmtD(agmBase)+(agmExt?", as extended":"")+")",law:"Sec 92"});
  if(c.csr)add({key:`csr2:${Y-1}`,form:"CSR-2",title:"Report on corporate social responsibility",period:fyLabel(Y-1),due:aocDue,basis:"Filed after AOC-4; confirm the current due date",law:"Sec 135"});
  if(c.audTermEnd&&+c.audTermEnd===Y-1)add({key:`adt1:${Y-1}`,form:"ADT-1",title:"Appointment of statutory auditor ("+(c.audFirm||"current auditor")+"’s term ends at this AGM)",period:fyLabel(Y-1),due:agmBase+15*DAY,basis:"15 days from the AGM",law:"Sec 139"});
  if(c.msme)add({key:`msme1:${Y}H1`,form:"MSME-1",title:"Half-yearly return of amounts due to micro and small enterprises",period:"Apr – Sep "+Y,due:D(Y,10,31),basis:"By 31 October",law:"Sec 405 · MSME Order, 2019"});
  add({key:`bm:${Y}`,cat:"meet",form:"Board",title:c.small?"Board meetings: at least one in each half of the year, 90 or more days apart":"Board meetings: at least four, with no gap over 120 days",period:fyLabel(Y),due:W1,basis:"Across the year",law:"Sec 173",auto:autoBM(Y)});
  const first=boardMeets(W0,W1)[0];
  add({key:`mbp1:${Y}`,cat:"dir",form:"MBP-1 · DIR-8",title:"Directors’ disclosures of interest and declarations of non-disqualification",period:fyLabel(Y),due:first?pd(first.date):D(Y,6,30),basis:first?"At the first board meeting of the year ("+fmtD(pd(first.date))+")":"At the first board meeting of the year",law:"Sec 184(1) · Sec 164(2)",auto:autoMBP(Y)});
  for(const d of dirs)if(isDirector(d)&&d.din&&!d.ceased&&d.kycNext){const t=pd(d.kycNext);if(t!=null)add({key:`kyc:${d.id}:${d.kycNext}`,cat:"dir",form:"DIR-3 KYC",title:"Director KYC · "+d.name+" (DIN "+d.din+")",period:"Three-year cycle",due:t,basis:"By 30 June of the year after every third financial year",law:"Rule 12A"});}
  for(const m of meets)if(m.date){const t=pd(m.date);const lbl=(m.no?m.no+" · ":"")+MEET_T[m.type]+" on "+fmtD(t);
    add({key:`mind:${m.id}`,cat:"meet",form:"Minutes",title:"Draft minutes circulated · "+lbl,period:fmtD(t),due:t+15*DAY,basis:"15 days from the meeting",law:m.type==="board"||m.type==="committee"?"SS-1":"SS-2",auto:m.minDraft?{done:true,date:pd(m.minDraft),note:"Circulated "+fmtD(pd(m.minDraft))}:null});
    add({key:`mins:${m.id}`,cat:"meet",form:"Minutes",title:"Minutes signed and entered in the minutes book · "+lbl,period:fmtD(t),due:t+30*DAY,basis:"30 days from the meeting",law:"Sec 118",auto:m.minSigned?{done:true,date:pd(m.minSigned),note:"Signed "+fmtD(pd(m.minSigned))}:null});}
  for(const r of ress)if(r.mgt14&&r.date){const t=pd(r.date);add({key:`mgt14:${r.id}`,form:"MGT-14",title:"Filing of resolution · "+(r.subject||""),period:r.no||fmtD(t),due:t+30*DAY,basis:"30 days from passing on "+fmtD(t),law:"Sec 117"});}
  for(const e of evs)if(e.date){const t=pd(e.date);const T=EVT[e.type]||EVT.other;const days=T.days!=null?T.days:(+e.days||30);
    add({key:`ev:${e.id}`,cat:"event",form:e.type==="other"?(e.form||"Other"):T.form,title:T.n+(e.details?" · "+e.details:""),period:fmtD(t),due:t+days*DAY,basis:days+" days from "+fmtD(t),law:T.law||""});}
  for(const cu of (c.custom||[]))stepDates(cu,Y).forEach((t,i)=>add({key:`cu:${cu.id}:${Y}:${i}`,cat:"custom",form:cu.form||"Custom",title:cu.name,period:FREQ[cu.freq]||"",due:t,basis:FREQ[cu.freq]+(cu.freq==="once"?"":" · day "+(cu.day||1)),law:cu.law||""}));
  shareItems(Y,add);
  return L.sort((a,b)=>a.due-b.due);
}
/* Government extensions are recorded per compliance year and apply only to that year's items */
let exts=[],showExt=false;
function extDate(e,orig){if(pd(e.newDate)!=null)return pd(e.newDate);if(+e.addDays)return orig+(+e.addDays)*DAY;return null;}
function extMatches(e,it){
  if(it.fy==null||+e.fy!==+it.fy||e.form!==it.form)return false;
  if(e.scope==="window"){const a=pd(e.from),b=pd(e.to);return (a==null||it.due>=a)&&(b==null||it.due<=b);}
  return (e.keys||[]).includes(it.key);
}
function extFor(it){let best=null;for(const e of exts){if(!extMatches(e,it))continue;const d=extDate(e,it.due);if(d!=null&&d>it.due&&(!best||d>best.date))best={date:d,e};}return best;}
function statusOf(it){
  const f=fils[it.key]||{};const own=pd(f.ext);const circ=own?null:extFor(it);const due=own||(circ&&circ.date)||it.due;
  const X={orig:it.due,own:own&&own!==it.due?own:null,circ};
  if(f.status==="na")return {s:"na",label:"Not applicable"+(f.remarks?" · "+f.remarks:""),due,X};
  if(it.auto&&it.auto.done){const late=it.auto.date&&it.auto.date>due;return {s:late?"late":"done",label:(late?"Late · ":"")+it.auto.note,due,X};}
  if(f.status==="filed"){const fd=pd(f.filedDate);const late=fd&&fd>due;return {s:late?"late":"done",label:(late?"Filed late":"Filed")+(fd?" on "+fmtD(fd):"")+(f.srn?" · SRN "+f.srn:"")+(!late&&fd&&fd>it.due?" · within the extension":""),due,X};}
  const days=Math.round((due-TODAY)/DAY);
  const pre=it.auto&&it.auto.note?it.auto.note+" · ":"";
  if(it.auto&&it.auto.bad)return {s:"over",label:pre.replace(/ · $/,""),due,X};
  if(days<0)return {s:"over",label:pre+"Overdue by "+(-days)+" day"+(-days===1?"":"s"),due,X};
  if(days<=30)return {s:"soon",label:pre+(days===0?"Due today":"Due in "+days+" day"+(days===1?"":"s")),due,X};
  return {s:"up",label:pre+"Upcoming",due,X};
}
function calendar(Y){
  const cur=itemsFor(Y).map(it=>Object.assign(it,{st:statusOf(it)})).sort((a,b)=>a.st.due-b.st.due);
  const tf=+(co().trackFrom||CUR_FY);const carried=Y>FIRST_FY&&Y-1>=tf?itemsFor(Y-1).map(it=>Object.assign(it,{st:statusOf(it),carried:true})).filter(it=>it.st.s==="over"):[];
  return {cur,carried};
}

/* ---------- persistence ---------- */
function setSave(s){if(DEAD)return;$("#saveState").textContent=s;}
const savedTxt=()=>"Saved";
async function put(col,id,data){
  const lists={directors:"dirs",meetings:"meets",resolutions:"ress",events:"evs",docs:"docs",members:"members",sharetx:"stx",extensions:"exts"};
  if(col==="filings")fils[id]=data;
  else{const arr={dirs,meets,ress,evs,docs,members,stx,exts}[lists[col]];const i=arr.findIndex(x=>x.id===id);const rec=Object.assign({},data,{id});if(i>=0)arr[i]=rec;else arr.push(rec);}
  render();
  if(!db)return;setSave("Saving…");
  chain=chain.then(async()=>{try{await db.doc(col+"/"+id).set(data);setSave(savedTxt());}catch(e){setSave("Not saved");toast(e&&e.code==="invalid_argument"?"You can view this register but not change it.":"Couldn’t save. "+(e&&e.message||""));}});
  return chain;
}
async function remove(col,id){
  const lists={directors:"dirs",meetings:"meets",resolutions:"ress",events:"evs",docs:"docs",members:"members",sharetx:"stx",extensions:"exts"};
  if(col==="filings")delete fils[id];else{const k=lists[col];const arr={dirs,meets,ress,evs,docs,members,stx,exts}[k];const i=arr.findIndex(x=>x.id===id);if(i>=0)arr.splice(i,1);}
  render();if(!db)return;
  chain=chain.then(async()=>{try{await db.doc(col+"/"+id).delete();}catch(e){toast("Couldn’t delete. "+(e&&e.message||""));}});return chain;
}
function saveCfg(delay){cfgDirty=true;clearTimeout(cfgTimer);setSave("Saving…");cfgTimer=setTimeout(()=>{if(!db){cfgDirty=false;return;}const body=clone(cfg);
  chain=chain.then(async()=>{try{await db.doc("config/settings").set(body);setSave(savedTxt());}catch(e){toast("Couldn’t save settings.");}cfgDirty=false;});},delay||0);}
function saveRegs(delay){regDirty=true;clearTimeout(regTimer);setSave("Saving…");regTimer=setTimeout(()=>{if(!db){regDirty=false;return;}const body=clone(regs);
  chain=chain.then(async()=>{try{await db.doc("config/registers").set(body);setSave(savedTxt());}catch(e){toast("Couldn’t save registers.");}regDirty=false;});},delay||0);}

/* ---------- rendering ---------- */
function captureFocus(){const a=document.activeElement;if(!a||!a.id||!$("#main").contains(a)||a.type==="file")return null;let ss=null,se=null;try{ss=a.selectionStart;se=a.selectionEnd;}catch(e){}return {id:a.id,v:a.value,ss,se};}
function restoreFocus(c){if(!c)return;const el=byId(c.id);if(!el)return;if("value" in el&&el.tagName!=="SELECT"&&el.type!=="checkbox")el.value=c.v;el.focus({preventScroll:true});try{if(c.ss!=null)el.setSelectionRange(c.ss,c.se);}catch(e){}}
function render(){
  if(DEAD)return;
  renderHeader();const c=captureFocus();
  const V={overview:vOverview,meetings:vMeetings,resolutions:vResolutions,directors:vDirectors,shareholders:vShareholders,events:vEvents,registers:vRegisters,docs:vDocs,settings:vSettings}[tab]||vOverview;
  $("#main").innerHTML=(db===null&&dbReady?`<div class="banner warn">Couldn’t reach the TrustComply server, so changes you make here aren’t saved. Reload the page to try again.</div>`:"")+V();
  restoreFocus(c);renderExport();
  if(tab!==lastTab){lastTab=tab;if(HOST.onTab)HOST.onTab(tab);}
}
function renderHeader(){
  const fs=$("#fySel");if(!fs.options.length){for(let Y=CUR_FY+1;Y>=FIRST_FY;Y--){const o=document.createElement("option");o.value=Y;o.textContent=fyLabel(Y);fs.appendChild(o);}}
  fs.value=sel;const C=co();$("#coName").textContent=C.name;$("#coCin").textContent="CIN "+C.cin+" · Secretarial & corporate compliance";
  for(const t of ROOT.querySelectorAll("#tabs button"))t.setAttribute("aria-selected",t.dataset.tab===tab?"true":"false");
  const {cur,carried}=calendar(sel);const n=cur.concat(carried).filter(i=>i.st.s==="over").length;
  const b=$("#tabs [data-tab=overview] .count");if(b){b.textContent=n||"";b.hidden=!n;}if(HOST.onCount)HOST.onCount(n);
}
const pillCls={over:"bad",soon:"warn",up:"",done:"ok",late:"warn",na:"gray"};
const pillTxt={over:"Overdue",soon:"Due soon",up:"Upcoming",done:"Done",late:"Done late",na:"N/A"};
const dateBlock=t=>{const d=new Date(t);return `<div class="dblock"><b>${d.getUTCDate()}</b><span>${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}</span></div>`;};
const fld=(id,label,val,opts)=>{opts=opts||{};const t=opts.type||"text";
  if(t==="select")return `<div class="fld${opts.wide?" wide":""}"><label for="${id}">${label}</label><select id="${id}" ${opts.attr||""}>${opts.options.map(o=>`<option value="${esc(o[0])}" ${String(val)===String(o[0])?"selected":""}>${esc(o[1])}</option>`).join("")}</select>${opts.hint?`<span class="hint">${opts.hint}</span>`:""}</div>`;
  if(t==="textarea")return `<div class="fld wide2"><label for="${id}">${label}</label><textarea id="${id}" ${opts.attr||""} rows="${opts.rows||5}" placeholder="${esc(opts.ph||"")}">${esc(val||"")}</textarea>${opts.hint?`<span class="hint">${opts.hint}</span>`:""}</div>`;
  return `<div class="fld${opts.wide?" wide":""}"><label for="${id}">${label}</label><input type="${t==="date"?"date":"text"}" id="${id}" ${opts.attr||""} value="${esc(val||"")}" placeholder="${esc(opts.ph||"")}" ${t==="num"?'inputmode="decimal"':""}>${opts.hint?`<span class="hint">${opts.hint}</span>`:""}</div>`;};
const E=(k,label,opts)=>fld("e-"+k,label,edit.data[k],Object.assign({},opts,{attr:`data-e="${k}" ${(opts&&opts.attr)||""}`}));

/* ---------- Overview: the compliance calendar ---------- */
function vOverview(){
  const {cur,carried}=calendar(sel);const all=cur.concat(carried);
  const cnt=s=>all.filter(i=>i.st.s===s).length;
  const soon=all.filter(i=>i.st.s==="soon").length,over=cnt("over"),done=cur.filter(i=>i.st.s==="done"||i.st.s==="late").length,applicable=cur.filter(i=>i.st.s!=="na").length;
  const agm=cur.find(i=>i.key.startsWith("agm:"));const bm=cur.find(i=>i.key.startsWith("bm:"));
  const tiles=`<div class="tiles">
   <div class="tile ${over?"t-bad":""}"><span>Overdue</span><b>${over}</b><em>${over?"Needs action now":"Nothing overdue"}</em></div>
   <div class="tile ${soon?"t-warn":""}"><span>Due in 30 days</span><b>${soon}</b><em>${soon?"Coming up":"Nothing due soon"}</em></div>
   <div class="tile"><span>Completed</span><b>${done}<small>/${applicable}</small></b><em>${fyLabel(sel)} items</em></div>
   <div class="tile"><span>Board meetings</span><b>${boardMeets(fyS(sel),fyE(sel)).length}<small>/${co().small?2:4}</small></b><em>${bm&&bm.auto?esc(bm.auto.note.replace(/^\d+ of 4 held( · )?/,"")||(co().small?"One in each half-year":"Four needed, 120 days apart at most")):""}</em></div>
   <div class="tile"><span>AGM (${agm?esc(agm.period):""})</span><b class="sm">${agm?(agm.st.s==="done"||agm.st.s==="late"?"Held":fmtD(agm.st.due)):"–"}</b><em>${agm?(agm.st.s==="done"||agm.st.s==="late"?esc(agm.st.label):agm.st.s==="over"?"Overdue":(d=>d===0?"Due today":d+" days left")(Math.round((agm.st.due-TODAY)/DAY))):""}</em></div>
  </div>`;
  const months=[];for(let i=0;i<12;i++){const m=(3+i)%12,y=m>=3?sel:sel+1;months.push({m,y,items:cur.filter(it=>{const d=new Date(it.st.due);return d.getUTCMonth()===m&&d.getUTCFullYear()===y;})});}
  const rank={over:4,soon:3,up:2,late:1,done:1,na:0};
  const strip=`<div class="mstrip" role="group" aria-label="Filter by month">${months.map(M=>{const worst=M.items.reduce((w,i)=>rank[i.st.s]>rank[w]?i.st.s:w,"na");const key=M.y+"-"+M.m;
    return `<button class="mcell m-${M.items.length?worst:"none"}" data-month="${key}" aria-pressed="${monthF===key}"><span>${MON[M.m]}</span><b>${M.items.length||"·"}</b></button>`;}).join("")}</div>`;
  const chips=`<div class="toolbar"><div class="seg" role="group" aria-label="Status">${[["open","Open"],["all","All"],["done","Done"]].map(([k,l])=>`<button data-stf="${k}" aria-pressed="${stF===k}">${l}</button>`).join("")}</div>
    <div class="chips2">${[["all","All"]].concat(Object.entries(CATS)).map(([k,l])=>`<button data-catf="${k}" aria-pressed="${catF===k}">${l}</button>`).join("")}</div>
    ${monthF?`<button class="btn small" data-month="${monthF}">Clear month</button>`:""}<span style="margin-left:auto">${dlBar("cal","Compliance calendar")}</span></div>`;
  const pass=it=>(catF==="all"||it.cat===catF)&&(stF==="all"||(stF==="open"?["over","soon","up"].includes(it.st.s):["done","late","na"].includes(it.st.s)))&&(!monthF||(()=>{const d=new Date(it.st.due);return monthF===d.getUTCFullYear()+"-"+d.getUTCMonth();})());
  const list=cur.filter(pass);const car=carried.filter(pass);
  let body="";
  if(car.length)body+=`<h3 class="grp-h bad">Carried over from ${fyLabel(sel-1)} · still open</h3>`+car.map(itemRow).join("");
  let lastM=null;
  for(const it of list){const d=new Date(it.st.due);const mk=MONL[d.getUTCMonth()]+" "+d.getUTCFullYear();if(mk!==lastM){body+=`<h3 class="grp-h">${mk}</h3>`;lastM=mk;}body+=itemRow(it);}
  if(!body)body=`<div class="empty">Nothing ${stF==="open"?"open":"here"} for these filters.</div>`;
  return `<div class="pagehead"><div><h2>Compliance calendar</h2><p class="sub">Everything falling due between 1 April ${sel} and 31 March ${sel+1}, worked out from your meetings, resolutions, directors and events. Mark items filed as you go.</p></div><div class="toolbar"><button class="btn" data-act="toggleext" aria-expanded="${showExt}">Due-date extensions · ${fyLabel(sel)}${(n=>n?` <span class=\"count\" style=\"background:var(--brand)\">${n}</span>`:"")(exts.filter(e=>+e.fy===sel).length)}</button></div></div>`+(showExt||(edit&&edit.col==="extensions")?extPanel():"")+tiles+strip+chips+`<div class="items">${body}</div>`;
}
function extNote(st){const X=st.X||{};
  if(X.own)return ` · <span class="extn">extended to <b>${fmtD(X.own)}</b> for this company · was ${fmtD(X.orig)}</span>`;
  if(X.circ)return ` · <span class="extn">extended to <b>${fmtD(X.circ.date)}</b> by ${esc(X.circ.e.circ||"circular")}${X.circ.e.noFee?" without additional fee":""} · was <s>${fmtD(X.orig)}</s></span>`;return "";}
function extPanel(){
  const list=exts.filter(e=>+e.fy===sel).sort((a,b)=>(pd(a.newDate)||0)-(pd(b.newDate)||0));
  const all=itemsFor(sel);
  const rows=list.map(e=>{const hits=all.filter(it=>extMatches(e,it));const conf=delConfirm==="ext:"+e.id;
    return `<tr><td><span class="form">${esc(e.form)}</span></td>
     <td>${e.scope==="window"?"Items originally due "+(pd(e.from)?fmtD(pd(e.from)):"any time")+" – "+(pd(e.to)?fmtD(pd(e.to)):"any time"):esc(hits.map(h=>h.period).join(", ")||"—")}<span class="hint">${hits.length} item${hits.length===1?"":"s"} in ${fyLabel(sel)}</span></td>
     <td>${pd(e.newDate)?"<b>"+fmtD(pd(e.newDate))+"</b>":"+"+esc(e.addDays)+" days"}${hits.length&&pd(e.newDate)?`<span class="hint">was ${[...new Set(hits.map(h=>fmtD(h.due)))].join(", ")}</span>`:""}</td>
     <td>${esc(e.circ||"–")}${e.circDate?`<span class="hint">dated ${fmtD(pd(e.circDate))}</span>`:""}</td><td>${e.noFee?"Waived":"Payable"}</td>
     <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="extensions" data-id="${e.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:canWrite?`<button class="btn small" data-editext="${e.id}">Edit</button><button class="btn small" data-askdel="ext:${e.id}" aria-label="Delete">✕</button>`:""}</div></td></tr>`;}).join("");
  const form=edit&&edit.col==="extensions"?extForm():"";
  return `<section class="sheet ext-panel"><div class="sheet-head" style="margin-bottom:8px"><div><h3 style="margin:0">Due-date extensions · ${fyLabel(sel)}</h3><p class="sub" style="margin:4px 0 0;max-width:72ch">When MCA or another authority extends a due date by circular, record it here. It applies to that form’s items in ${fyLabel(sel)} only; other years keep their normal dates.</p></div>
    <div class="toolbar">${canWrite&&!form?`<button class="btn primary" data-new="extensions">Record an extension</button>`:""}<button class="btn" data-act="toggleext">Close</button></div></div>
    ${form}
    ${rows?`<div class="scroll"><table class="reg"><thead><tr><th>Form</th><th>Applies to</th><th>Extended to</th><th>Circular</th><th>Additional fee</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:form?"":`<p class="sub">No extensions recorded for ${fyLabel(sel)}.</p>`}</section>`;
}
function extForm(){
  const e=edit.data;const all=itemsFor(sel);const here=new Set(all.map(i=>i.form));
  const every=new Set([...here,...Object.values(EVT).map(v=>v.form).filter(Boolean),"PAS-3","SH-7","SH-11","PAS-6","BEN-2","MGT-14","Certificate","DIR-3 KYC","AOC-4","MGT-7","MGT-7A","DPT-3","MSME-1","ADT-1","CSR-2","FLA",...(co().custom||[]).map(c=>c.form||"Custom")]);
  const forms=[...(e.scope==="window"?every:here)].sort();
  if(!e.form&&forms.length)e.form=forms[0];
  const its=all.filter(i=>i.form===e.form);
  const pick=e.scope==="window"?E("from","Originally due from",{type:"date"})+E("to","Originally due to",{type:"date",hint:"Covers event-based filings that fall due in this window, including ones recorded later"})
    :`<div class="fld wide2"><label>Items in ${fyLabel(sel)}</label><div class="checks col">${its.length?its.map(i=>`<label class="chk"><input type="checkbox" data-earr="keys" value="${esc(i.key)}" ${(e.keys||[]).includes(i.key)?"checked":""}> <b>${fmtD(i.due)}</b> · ${esc(i.title)} <span class="sub">${esc(i.period)}</span></label>`).join(""):`<span class="sub">No ${esc(e.form)} items in this year.</span>`}</div></div>`;
  return `<div class="ext-form"><form class="af" autocomplete="off">
    ${E("form","Form",{type:"select",options:forms.map(f=>[f,f+(here.has(f)?"":" · none yet this year")])})}
    ${E("scope","Applies to",{type:"select",options:[["items","Selected items"],["window","All items originally due in a date range"]]})}
    ${pick}
    ${E("newDate","Extended due date",{type:"date"})}${E("addDays","or extend each by (days)",{type:"num",hint:"Use this when the circular gives extra days rather than a date"})}
    ${E("circ","Circular / notification no.",{ph:"e.g. General Circular No. 02/2026"})}${E("circDate","Dated",{type:"date"})}
    <div class="fld"><label>&nbsp;</label><label class="chk"><input type="checkbox" data-ebool="noFee" ${e.noFee?"checked":""}> Without additional fee</label></div>
    ${E("notes","Notes",{wide:true,ph:"e.g. Relief after the MCA data-centre outage"})}
   </form><div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save extension":"Record extension"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></div>`;
}
function itemRow(it){
  const st=it.st,f=fils[it.key]||{},open=openItem===it.key;
  const dd=docs.filter(x=>x.linkKey===it.key);
  return `<article class="item s-${st.s}${open?" open":""}" id="it-${esc(it.key)}">
   <button class="item-main" data-item="${esc(it.key)}" aria-expanded="${open}">
     ${dateBlock(st.due)}
     <div class="item-body"><div class="item-t"><span class="form">${esc(it.form)}</span><strong>${esc(it.title)}</strong></div>
       <div class="item-m">${esc(it.period)} · ${esc(it.basis)}${extNote(st)}${it.law?` · <span class="law">${esc(it.law)}</span>`:""}${dd.length?` · 📎 ${dd.length}`:""}</div></div>
     <div class="item-s"><span class="pill2 ${pillCls[st.s]}">${pillTxt[st.s]}</span><span class="item-l">${esc(st.label)}</span></div>
   </button>
   ${open?itemEditor(it):""}</article>`;
}
function itemEditor(it){
  const F=itemForm||{};const ce=extFor(it);const autoIt=!!it.auto||/^(bm|mbp1|agm|bmfs|mind|mins):/.test(it.key);
  const dd=docs.filter(x=>x.linkKey===it.key);const ro=!canWrite;
  const hint={agm:"Record the AGM under Meetings and this marks itself done.",bm:"Add board meetings under Meetings; the count and gaps update automatically.",mbp1:"Tick MBP-1 and DIR-8 for each director under Directors & KMP.",bmfs:"Tick “Approves financial statements” on the board meeting.",mind:"Enter the draft-circulated date on the meeting.",mins:"Enter the minutes-signed date on the meeting."}[it.key.split(":")[0]];
  return `<div class="item-ed">
   ${ce?`<div class="banner ok" style="margin:0 0 10px"><span>Due date extended from ${fmtD(it.due)} to <b>${fmtD(ce.date)}</b> by ${esc(ce.e.circ||"circular")}${ce.e.circDate?" dated "+fmtD(pd(ce.e.circDate)):""}${ce.e.noFee?", without additional fee":""}. Applies to ${fyLabel(it.fy)} only.</span><button class="btn small" data-editext="${ce.e.id}">View extension</button></div>`:""}
   ${autoIt?`<p class="sub" style="margin:0 0 10px">${esc(hint||"This item updates from your records.")} You can still mark it not applicable.</p>`:""}
   <div class="af">
    ${fld("if-status","Status",F.status||"pending",{type:"select",options:autoIt?[["pending","Tracked automatically"],["na","Not applicable"]]:[["pending","Pending"],["filed","Filed / done"],["na","Not applicable"]],attr:`data-if="status" ${ro?"disabled":""}`})}
    ${autoIt?"":fld("if-filedDate","Filed on",F.filedDate,{type:"date",attr:`data-if="filedDate" ${ro?"disabled":""}`})+fld("if-srn","SRN / acknowledgement no.",F.srn,{attr:`data-if="srn" ${ro?"disabled":""}`,ph:"e.g. AB1234567"})+
      fld("if-fee","Normal fee (₹)",F.fee,{type:"num",attr:`data-if="fee" ${ro?"disabled":""}`})+fld("if-addl","Additional fee (₹)",F.addl,{type:"num",attr:`data-if="addl" ${ro?"disabled":""}`})}
    ${fld("if-ext","Company-specific extension",F.ext,{type:"date",attr:`data-if="ext" ${ro?"disabled":""}`,hint:"Only for this company, e.g. ROC approval to extend the AGM (Sec 96). Government-wide extensions go in Due-date extensions."})}
    ${fld("if-extRef","Approval reference",F.extRef,{attr:`data-if="extRef" ${ro?"disabled":""}`,ph:"e.g. ROC order no."})}
    ${fld("if-by","Handled by",F.by,{attr:`data-if="by" ${ro?"disabled":""}`,ph:"Name or firm"})}
    ${fld("if-remarks","Remarks",F.remarks,{wide:true,attr:`data-if="remarks" ${ro?"disabled":""}`})}
   </div>
   <div class="attach"><span class="sub">Documents:</span> ${dd.length?dd.map(x=>`<span class="att">${esc(x.title||x.fileName)} <button class="btn link" data-view="${esc(x.id)}">View</button><button class="btn link" data-dldoc="${esc(x.id)}">Download</button></span>`).join(""):`<span class="sub">none attached</span>`}
     ${canWrite?`<button class="btn small" data-attach="${esc(it.key)}">Upload & attach</button>`:""}</div>
   <div class="formfoot">${canWrite?`<button class="btn primary" data-act="saveitem" data-key="${esc(it.key)}">Save</button>`:""}<button class="btn" data-item="${esc(it.key)}">Close</button>
     ${fils[it.key]&&canWrite?`<button class="btn link" data-act="resetitem" data-key="${esc(it.key)}">Clear this record</button>`:""}</div>
  </div>`;
}

/* ---------- Meetings ---------- */
function meetNoSuggest(type,date,forFy){
  const t=pd(date);const Y=t!=null?fyOfT(t):sel;
  if(type==="board"){const n=meets.filter(m=>m.type==="board"&&m.date&&fyOfT(pd(m.date))===Y&&(!edit||m.id!==edit.id)).length+1;return "BM "+n+"/"+fyId(Y);}
  if(type==="agm"){const n=meets.filter(m=>m.type==="agm"&&(!edit||m.id!==edit.id)).length+1;return ordinal(n)+" AGM";}
  if(type==="egm"){const n=meets.filter(m=>m.type==="egm"&&m.date&&fyOfT(pd(m.date))===Y&&(!edit||m.id!==edit.id)).length+1;return "EGM "+n+"/"+fyId(Y);}
  return "";
}
function noticeCheck(m){
  const t=pd(m.date),n=pd(m.notice);if(t==null||n==null)return {ok:null,txt:"Notice date not entered"};
  const days=Math.round((t-n)/DAY);
  if(m.type==="agm"||m.type==="egm"){const clear=days-1;if(clear>=21)return {ok:true,txt:clear+" clear days"};return {ok:!!m.shorter,txt:clear+" clear days"+(m.shorter?" · shorter-notice consent":" · 21 needed")};}
  if(days>=7)return {ok:true,txt:days+" days"};return {ok:!!m.shorter,txt:days+" days"+(m.shorter?" · shorter notice":" · 7 needed")};
}
function quorumCheck(m){
  if(m.type==="agm"||m.type==="egm"){const n=+m.members||0;return {ok:n>=2,txt:n+" members present"+(n<2?" · 2 needed":"")};}
  const t=pd(m.date);if(t==null)return {ok:null,txt:""};const total=activeDirs(t).length;const need=Math.max(2,Math.ceil(total/3));const p=(m.present||[]).length;
  if(m.type==="committee")return {ok:p>=2,txt:p+" present"};
  return {ok:p>=need,txt:p+" of "+total+" present"+(p<need?" · "+need+" needed":"")};
}
function gapChart(Y){
  const W0=fyS(Y),W1=fyE(Y),span=W1-W0;const bms=boardMeets(W0,W1);const prev=boardMeets(W0-400*DAY,W0-DAY).pop();
  const pts=bms.map(m=>pd(m.date));const x=t=>Math.max(0,Math.min(100,(t-W0)/span*100));
  let segs="";let last=prev?pd(prev.date):null;
  for(const t of pts.concat([Math.min(TODAY,W1)])){if(last!=null){const g=Math.round((t-last)/DAY);const bad=g>120;const a=x(Math.max(last,W0)),b=x(t);if(b>a)segs+=`<span class="gseg ${bad?"bad":""}" style="left:${a}%;width:${b-a}%" title="${g} days"></span>`;}last=t;}
  const ticks=Array.from({length:12},(_,i)=>{const m=(3+i)%12;return `<span style="left:${i/12*100}%">${MON[m]}</span>`;}).join("");
  const dots=bms.map(m=>`<span class="gdot" style="left:${x(pd(m.date))}%" title="${esc(m.no||"")} · ${fmtD(pd(m.date))}"></span>`).join("");
  const today=TODAY>=W0&&TODAY<=W1?`<span class="gtoday" style="left:${x(TODAY)}%" title="Today"></span>`:"";
  return `<div class="gapchart" aria-label="Board meetings across ${fyLabel(Y)}"><div class="gtrack">${segs}${dots}${today}</div><div class="gticks">${ticks}</div></div>`;
}
function vMeetings(){
  const list=meets.filter(m=>(meetF==="all"||(meetF==="gm"?(m.type==="agm"||m.type==="egm"):m.type===meetF))&&(!m.date||fyOfT(pd(m.date))===sel)).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  const bm=autoBM(sel);
  const head=`<div class="pagehead"><div><h2>Meetings</h2><p class="sub">Board, committee and general meetings held in ${fyLabel(sel)}, with notice, quorum and minutes checks.</p></div>
    <div class="toolbar">${canWrite?`<button class="btn primary" data-new="meetings">Record a meeting</button>`:""}</div></div>`;
  const chart=`<section class="sheet"><div class="sheet-head" style="margin-bottom:6px"><h3 style="margin:0">Board meetings across ${fyLabel(sel)}</h3><span class="sub">${esc(bm.note)} · red marks a gap over 120 days</span></div>${gapChart(sel)}</section>`;
  const seg=`<div class="toolbar"><div class="seg" role="group" aria-label="Meeting type">${[["all","All"],["board","Board"],["committee","Committee"],["gm","General"]].map(([k,l])=>`<button data-meetf="${k}" aria-pressed="${meetF===k}">${l}</button>`).join("")}</div><span style="margin-left:auto">${dlBar("meet","Meetings register")}</span></div>`;
  const form=edit&&edit.col==="meetings"?meetForm():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No meetings recorded for ${fyLabel(sel)}. Record each board meeting with its notice date, attendance and agenda; the calendar tracks the minutes and the 120-day gap for you.</div>`;
  else tbl=`<section class="sheet"><div class="scroll"><table class="reg"><thead><tr><th>No.</th><th>Meeting</th><th>Date</th><th>Notice</th><th>Quorum</th><th>Minutes</th><th>Resolutions</th><th></th></tr></thead><tbody>
   ${list.map(m=>{const n=noticeCheck(m),q=quorumCheck(m),t=pd(m.date);const rs=ress.filter(r=>r.meetingId===m.id).length;
     const minTxt=m.minSigned?`<span class="ok-t">Signed ${fmtD(pd(m.minSigned))}</span>`:m.minDraft?`Draft ${fmtD(pd(m.minDraft))}`:(t&&TODAY-t>30*DAY?`<span class="bad-t">Not signed</span>`:"Pending");
     const conf=delConfirm==="meet:"+m.id;
     return `<tr><td class="tag">${esc(m.no||"–")}</td><td><strong>${esc(m.type==="committee"?(m.committee||"Committee"):MEET_T[m.type])}</strong><span class="hint">${esc(m.mode||"")}${m.venue?" · "+esc(m.venue):""}${m.fsFor?" · approves FS "+fyLabel(+m.fsFor):""}${m.type==="agm"&&m.forFy?" · for "+fyLabel(+m.forFy):""}</span></td>
      <td style="white-space:nowrap">${fmtD(t)}${m.time?`<span class="hint">${esc(m.time)}</span>`:""}</td>
      <td class="${n.ok===false?"bad-t":n.ok?"ok-t":""}">${esc(n.txt)}</td><td class="${q.ok===false?"bad-t":q.ok?"ok-t":""}">${esc(q.txt)}</td><td>${minTxt}</td><td>${rs||"–"}</td>
      <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="meetings" data-id="${m.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
        `${(downloads||isLocal)?`<button class="btn small" data-notice="${m.id}" title="Notice and agenda as PDF">Notice PDF</button>`:""}${canWrite?`<button class="btn small" data-edit="meetings" data-id="${m.id}">Edit</button><button class="btn small" data-askdel="meet:${m.id}" aria-label="Delete">✕</button>`:""}`}</div></td></tr>`;}).join("")}
   </tbody></table></div></section>`;
  return head+chart+form+seg+tbl;
}
function meetForm(){
  const m=edit.data;const t=pd(m.date);const ds=t!=null?activeDirs(t):dirs.filter(isDirector);
  const gm=m.type==="agm"||m.type==="egm";
  const dirChecks=(k,label)=>`<div class="fld wide2"><label>${label}</label><div class="checks">${ds.length?ds.map(d=>`<label class="chk"><input type="checkbox" data-earr="${k}" value="${d.id}" ${(m[k]||[]).includes(d.id)?"checked":""}> ${esc(d.name)}${d.din?` <span class="sub">DIN ${esc(d.din)}</span>`:""}</label>`).join(""):`<span class="sub">Add directors under Directors & KMP first.</span>`}</div></div>`;
  const n=noticeCheck(m),q=quorumCheck(m);
  return `<section class="sheet"><h3>${edit.id?"Edit meeting":"Record a meeting"}</h3><form class="af" autocomplete="off">
    ${E("type","Meeting",{type:"select",options:Object.entries(MEET_T)})}
    ${m.type==="committee"?E("committee","Committee",{ph:"e.g. Audit Committee"}):""}
    ${m.type==="agm"?E("forFy","AGM for the year",{type:"select",options:Array.from({length:CUR_FY-FIRST_FY+1},(_,i)=>[String(CUR_FY-i),fyLabel(CUR_FY-i)])}):""}
    ${E("date","Date",{type:"date"})}${E("time","Time",{ph:"e.g. 11:00 AM"})}
    ${E("no","Number",{ph:meetNoSuggest(m.type,m.date,m.forFy),hint:"Leave blank to use "+esc(meetNoSuggest(m.type,m.date,m.forFy)||"—")})}
    ${E("mode","Mode",{type:"select",options:[["In person","In person"],["Video conference","Video conference"],["Hybrid","Hybrid"]]})}
    ${E("venue","Venue",{wide:true,ph:co().ro})}
    ${E("notice","Notice sent on",{type:"date",hint:esc(n.txt)})}
    <div class="fld"><label>&nbsp;</label><label class="chk"><input type="checkbox" data-ebool="shorter" ${m.shorter?"checked":""}> ${gm?"Held at shorter notice with members’ consent":"Held at shorter notice"}</label></div>
    ${m.type==="board"||m.type==="committee"?dirChecks("present","Directors present")+dirChecks("leave","Leave of absence granted to"):E("members","Members present in person",{type:"num",hint:esc(q.txt)})}
    ${m.type!=="agm"&&m.type!=="egm"?E("chair","Chairperson",{type:"select",options:[["",""]].concat(ds.map(d=>[d.id,d.name]))}):E("chair","Chairperson",{type:"select",options:[["",""]].concat(ds.map(d=>[d.id,d.name]))})}
    ${m.type==="board"?E("fsFor","Approves financial statements for",{type:"select",options:[["","— not at this meeting —"]].concat(Array.from({length:CUR_FY-FIRST_FY+1},(_,i)=>[String(CUR_FY-i),fyLabel(CUR_FY-i)]))}):""}
    ${E("agenda","Agenda items",{type:"textarea",rows:6,ph:"One item per line, e.g.\nTo confirm the minutes of the previous meeting\nTo note the disclosures in MBP-1 and DIR-8\nTo approve the unaudited results for the quarter"})}
    ${E("minDraft","Draft minutes circulated on",{type:"date",hint:"Within 15 days of the meeting"})}${E("minSigned","Minutes signed on",{type:"date",hint:"Within 30 days of the meeting"})}
    ${E("remarks","Remarks",{wide:true})}
   </form>
   ${m.type==="board"&&t!=null?`<p class="sub" style="margin:10px 0 0">Quorum: ${esc(q.txt)} (one third of the directors or two, whichever is higher).</p>`:""}
   <div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save meeting":"Add meeting"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}

/* ---------- Resolutions ---------- */
function resNoSuggest(r){const t=pd(r.date);const Y=t!=null?fyOfT(t):sel;const pre=r.body==="members"?(r.kind==="special"?"SR":"OR"):r.body==="circ"?"CR":"BR";
  const n=ress.filter(x=>(x.no||"").startsWith(pre+"/"+fyId(Y))&&(!edit||x.id!==edit.id)).length+1;return pre+"/"+fyId(Y)+"/"+String(n).padStart(2,"0");}
function vResolutions(){
  const list=ress.filter(r=>(resF==="all"||r.body===resF)&&(!r.date||fyOfT(pd(r.date))===sel)).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  const head=`<div class="pagehead"><div><h2>Resolutions</h2><p class="sub">Board, circular and members’ resolutions for ${fyLabel(sel)}. Start from the library, then download a certified true copy of any resolution.</p></div>
    <div class="toolbar">${canWrite?`<button class="btn primary" data-new="resolutions">Draft a resolution</button>`:""}</div></div>`;
  const seg=`<div class="toolbar"><div class="seg" role="group" aria-label="Passed by">${[["all","All"],["board","Board"],["circ","By circulation"],["members","Members"]].map(([k,l])=>`<button data-resf="${k}" aria-pressed="${resF===k}">${l}</button>`).join("")}</div><span style="margin-left:auto">${dlBar("res","Resolutions register")}</span></div>`;
  const form=edit&&edit.col==="resolutions"?resForm():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No resolutions recorded for ${fyLabel(sel)}. Draft one from the library; special resolutions automatically add an MGT-14 filing to the calendar.</div>`;
  else tbl=`<section class="sheet"><div class="scroll"><table class="reg"><thead><tr><th>No.</th><th>Date</th><th>Subject</th><th>Passed by</th><th>Meeting</th><th>MGT-14</th><th></th></tr></thead><tbody>
    ${list.map(r=>{const m=meets.find(x=>x.id===r.meetingId);const conf=delConfirm==="res:"+r.id;
      let mg="Not required";if(r.mgt14){const it={key:"mgt14:"+r.id,form:"MGT-14",due:pd(r.date)+30*DAY};it.fy=fyOfT(it.due);const st=statusOf(it);mg=`<span class="pill2 ${pillCls[st.s]}">${pillTxt[st.s]}</span>`;}
      return `<tr><td class="tag">${esc(r.no||"–")}</td><td style="white-space:nowrap">${fmtD(pd(r.date))}</td><td><strong>${esc(r.subject||"")}</strong></td>
       <td>${esc(RES_BODY[r.body]||"")}${r.body==="members"?`<span class="hint">${r.kind==="special"?"Special":"Ordinary"} resolution</span>`:""}</td><td>${m?esc(m.no||MEET_T[m.type]):"–"}</td><td>${mg}</td>
       <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="resolutions" data-id="${r.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
        `${(downloads||isLocal)?`<button class="btn small" data-ctc="${r.id}" title="Certified true copy as PDF">Certified copy</button>`:""}${canWrite?`<button class="btn small" data-edit="resolutions" data-id="${r.id}">Edit</button><button class="btn small" data-askdel="res:${r.id}" aria-label="Delete">✕</button>`:""}`}</div></td></tr>`;}).join("")}
    </tbody></table></div></section>`;
  return head+form+seg+tbl;
}
function resForm(){
  const r=edit.data;const Y=pd(r.date)!=null?fyOfT(pd(r.date)):sel;
  const mt=meets.filter(m=>m.date&&fyOfT(pd(m.date))===Y&&(r.body==="members"?(m.type==="agm"||m.type==="egm"):(m.type==="board"||m.type==="committee")));
  return `<section class="sheet"><h3>${edit.id?"Edit resolution":"Draft a resolution"}</h3>
   ${edit.id?"":`<div class="tpls"><span class="sub">Start from the library:</span>${TPL.map(t=>`<button class="tplb${r.tpl===t.k?" on":""}" data-tpl="${t.k}"><span>${esc(RES_BODY[t.b].split(" (")[0])}${t.kind?" · "+t.kind:""}</span>${esc(t.t)}</button>`).join("")}</div>`}
   <form class="af" autocomplete="off">
    ${E("body","Passed by",{type:"select",options:Object.entries(RES_BODY)})}
    ${r.body==="members"?E("kind","Type",{type:"select",options:[["ordinary","Ordinary resolution"],["special","Special resolution"]]}):""}
    ${E("date","Date passed",{type:"date"})}
    ${r.body!=="circ"?E("meetingId","At meeting",{type:"select",options:[["","—"]].concat(mt.map(m=>[m.id,(m.no||MEET_T[m.type])+" · "+fmtD(pd(m.date))])),hint:mt.length?"":"Record the meeting first to link it"}):""}
    ${E("no","Resolution no.",{ph:resNoSuggest(r),hint:"Leave blank to use "+esc(resNoSuggest(r))})}
    ${E("subject","Subject",{wide:true})}
    ${E("text","Resolution text",{type:"textarea",rows:10,hint:"Replace every [bracketed] placeholder before passing. The library text is a starting draft; have it reviewed by your company secretary."})}
    <div class="fld wide2"><label class="chk"><input type="checkbox" data-ebool="mgt14" ${r.mgt14?"checked":""}> File MGT-14 with the Registrar (adds a 30-day item to the calendar)</label><span class="hint">Needed for special resolutions and certain other resolutions. Private companies are exempt for Board resolutions under Section 179(3).</span></div>
    ${E("remarks","Remarks",{wide:true})}
   </form>
   <div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save resolution":"Add resolution"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}

/* ---------- Directors & KMP ---------- */
function vDirectors(){
  const k=fyId(sel);const list=dirs.slice().sort((a,b)=>(!!a.ceased-!!b.ceased)||(isDirector(b)-isDirector(a))||String(a.name).localeCompare(b.name));
  const head=`<div class="pagehead"><div><h2>Directors & KMP</h2><p class="sub">DINs, appointments, three-yearly KYC and the annual MBP-1 and DIR-8 declarations for ${fyLabel(sel)}.</p></div>
    <div class="toolbar">${canWrite?`<button class="btn primary" data-new="directors">Add director or KMP</button>`:""}</div></div>`;
  const form=edit&&edit.col==="directors"?dirForm():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No directors recorded yet. Add each director with their DIN and date of appointment.</div>`;
  else tbl=`<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Register of directors and KMP</h3>${dlBar("dir","Directors register")}</div><div class="scroll"><table class="reg"><thead><tr><th>Name</th><th>DIN</th><th>Designation</th><th>Appointed</th><th>Next KYC</th><th>MBP-1 ${k}</th><th>DIR-8 ${k}</th><th></th></tr></thead><tbody>
    ${list.map(d=>{const kyc=pd(d.kycNext);const kd=kyc!=null?Math.round((kyc-TODAY)/DAY):null;const conf=delConfirm==="dir:"+d.id;
      const tick=(f)=>isDirector(d)&&!d.ceased?`<label class="chk"><input type="checkbox" data-dirflag="${f}" data-id="${d.id}" ${d[f]&&d[f][k]?"checked":""} ${canWrite?"":"disabled"}> ${d[f]&&d[f][k]?fmtD(pd(d[f][k])):"Received"}</label>`:"–";
      return `<tr class="${d.ceased?"ceased":""}"><td><strong>${esc(d.name)}</strong><span class="hint">${esc(d.category||"")}${d.ceased?" · ceased "+fmtD(pd(d.ceased)):""}${d.example?` <span class="chip">Example</span>`:""}</span></td>
       <td class="tag">${esc(d.din||"–")}</td><td>${esc(d.designation||"")}</td><td style="white-space:nowrap">${fmtD(pd(d.appointed))}</td>
       <td class="${kd!=null&&kd<0?"bad-t":kd!=null&&kd<=60?"warn-t":""}" style="white-space:nowrap">${isDirector(d)&&d.din?fmtD(kyc):"–"}</td><td>${tick("mbp1")}</td><td>${tick("dir8")}</td>
       <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="directors" data-id="${d.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
        canWrite?`<button class="btn small" data-edit="directors" data-id="${d.id}">Edit</button><button class="btn small" data-askdel="dir:${d.id}" aria-label="Delete">✕</button>`:""}</div></td></tr>`;}).join("")}
    </tbody></table></div><p class="sub" style="margin:10px 0 0">DIR-3 KYC is now due once every three financial years, by 30 June of the following year, and within 30 days of any change in mobile, email or address. Enter each director’s next due date as confirmed on the MCA portal.</p></section>`;
  return head+form+tbl;
}
function dirForm(){
  const d=edit.data;const isNew=!edit.id;
  return `<section class="sheet"><h3>${isNew?"Add director or KMP":"Edit "+esc(d.name||"")}</h3><form class="af" autocomplete="off">
   ${E("kind","Role",{type:"select",options:[["director","Director"],["kmp","KMP only (CFO, CS, Manager)"]]})}
   ${E("name","Full name",{wide:true})}${d.kind!=="kmp"?E("din","DIN",{ph:"8 digits"}):E("pan","PAN / membership no.",{})}
   ${E("designation","Designation",{ph:d.kind==="kmp"?"e.g. Company Secretary":"e.g. Managing Director"})}
   ${d.kind!=="kmp"?E("category","Category",{type:"select",options:[["Executive","Executive"],["Non-executive","Non-executive"],["Independent","Independent"],["Nominee","Nominee"]]}):""}
   ${E("appointed","Date of appointment",{type:"date"})}${E("ceased","Date of cessation",{type:"date",hint:"Leave blank while in office"})}
   ${d.kind!=="kmp"?E("kycNext","Next DIR-3 KYC due",{type:"date",hint:"30 June after every third financial year"}):""}
   ${E("email","Email",{})}${E("shares","Shares held",{type:"num"})}
   ${E("interests","Interests disclosed (MBP-1)",{type:"textarea",rows:3,ph:"Companies, firms and bodies in which the director is interested"})}
   ${isNew?`<div class="fld wide2"><label class="chk"><input type="checkbox" data-ebool="mkEvent" ${d.mkEvent!==false?"checked":""}> Add a DIR-12 filing for this appointment (30 days)</label></div>`:
     (!d._wasCeased&&d.ceased?`<div class="fld wide2"><label class="chk"><input type="checkbox" data-ebool="mkCease" ${d.mkCease!==false?"checked":""}> Add a DIR-12 filing for this cessation (30 days)</label></div>`:"")}
  </form><div class="formfoot"><button class="btn primary" data-act="save">${isNew?"Add":"Save"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}

/* ---------- Events & charges ---------- */
function vEvents(){
  const list=evs.filter(e=>!e.date||fyOfT(pd(e.date))===sel).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  const head=`<div class="pagehead"><div><h2>Events & charges</h2><p class="sub">Allotments, charges, appointments, office shifts and other events that start an MCA filing clock.</p></div>
    <div class="toolbar">${canWrite?`<button class="btn primary" data-new="events">Record an event</button>`:""}</div></div>`;
  const form=edit&&edit.col==="events"?evForm():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No events in ${fyLabel(sel)}. Record one and the filing it triggers lands in the calendar with its due date.</div>`;
  else tbl=`<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">${fyLabel(sel)}</h3>${dlBar("ev","Events register")}</div><div class="scroll"><table class="reg"><thead><tr><th>Date</th><th>Event</th><th>Form</th><th>Due</th><th>Status</th><th class="n">Amount</th><th></th></tr></thead><tbody>
    ${list.map(e=>{const T=EVT[e.type]||EVT.other;const days=T.days!=null?T.days:(+e.days||30);const t=pd(e.date);const st=statusOf({key:"ev:"+e.id,form:e.type==="other"?(e.form||"Other"):T.form,due:t+days*DAY,fy:fyOfT(t+days*DAY)});const conf=delConfirm==="ev:"+e.id;
      return `<tr><td style="white-space:nowrap">${fmtD(t)}</td><td><strong>${esc(T.n)}</strong><span class="hint">${esc(e.details||"")}${e.holder?" · "+esc(e.holder):""}${e.chargeId?" · Charge ID "+esc(e.chargeId):""}</span></td>
       <td class="tag">${esc(e.type==="other"?(e.form||""):T.form)}</td><td style="white-space:nowrap">${fmtD(st.due)}</td><td><span class="pill2 ${pillCls[st.s]}">${pillTxt[st.s]}</span></td>
       <td class="n">${e.amount?fmtRs(e.amount):"–"}</td><td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="events" data-id="${e.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
        `<button class="btn small" data-goitem="ev:${e.id}">Filing</button>${canWrite?`<button class="btn small" data-edit="events" data-id="${e.id}">Edit</button><button class="btn small" data-askdel="ev:${e.id}" aria-label="Delete">✕</button>`:""}`}</div></td></tr>`;}).join("")}
    </tbody></table></div></section>`;
  const charges=evs.filter(e=>(EVT[e.type]||{}).charge).sort((a,b)=>(pd(a.date)||0)-(pd(b.date)||0));
  const byId={};for(const e of charges){const k=e.chargeId||e.id;(byId[k]=byId[k]||[]).push(e);}
  const chRows=Object.entries(byId).map(([k,a])=>{const c=a.find(x=>x.type==="charge")||a[0];const sat=a.find(x=>x.type==="chargesat");const mods=a.filter(x=>x.type==="chargemod").length;
    return `<tr><td class="tag">${esc(c.chargeId||"–")}</td><td>${esc(c.holder||"–")}</td><td>${esc(c.details||"")}</td><td class="n">${c.amount?fmtRs(c.amount):"–"}</td><td>${fmtD(pd(c.date))}</td><td>${mods||"–"}</td><td>${sat?`<span class="ok-t">Satisfied ${fmtD(pd(sat.date))}</span>`:"Open"}</td></tr>`;}).join("");
  const chTbl=`<section class="sheet"><h3>Register of charges · all years</h3>${chRows?`<div class="scroll"><table class="reg"><thead><tr><th>Charge ID</th><th>Charge holder</th><th>Particulars</th><th class="n">Amount</th><th>Created</th><th>Modifications</th><th>Status</th></tr></thead><tbody>${chRows}</tbody></table></div>`:`<p class="sub">No charges recorded. Record “Creation of charge” events to build this register.</p>`}</section>`;
  return head+form+tbl+chTbl;
}
function evForm(){
  const e=edit.data;const T=EVT[e.type]||EVT.other;const ch=!!T.charge;
  return `<section class="sheet"><h3>${edit.id?"Edit event":"Record an event"}</h3><form class="af" autocomplete="off">
   ${E("type","Event",{type:"select",wide:true,options:Object.entries(EVT).filter(([k])=>!["allot","transfer"].includes(k)||e.type===k).map(([k,v])=>[k,v.n+(v.form?" → "+v.form:"")+(v.days?" · "+v.days+" days":"")])})}<p class="sub fld wide2" style="margin:0">Allotments, transfers, buy-backs and splits go in <button class="btn link" data-goshare>Shareholders → Share ledger</button>, which files PAS-3, SH-7 and SH-11 for you.</p>
   ${E("date","Date of event",{type:"date",hint:e.type==="allot"?"Date of allotment":ch?"Date of creation, modification or satisfaction":""})}
   ${e.type==="other"?E("form","Form",{ph:"e.g. INC-28"})+E("days","Days to file",{type:"num",ph:"30"}):""}
   ${E("details","Particulars",{wide:true,ph:e.type==="allot"?"e.g. 50,000 equity shares of ₹10 at ₹40 premium to …":ch?"e.g. Hypothecation of laboratory equipment":""})}
   ${ch?E("holder","Charge holder",{ph:"e.g. HDFC Bank Ltd"})+E("chargeId","Charge ID",{hint:"From the MCA acknowledgement; links modifications and satisfaction"}):""}
   ${E("amount","Amount (₹)",{type:"num"})}${E("remarks","Remarks",{wide:true})}
  </form><div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save event":"Add event"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}

/* ---------- Registers ---------- */
function vRegisters(){
  const C=co();
  const rows=REGS.map(r=>{const v=regs[r.k]||{};return `<tr><td><strong>${esc(r.n)}</strong><span class="hint">${esc(r.f)}</span></td>
    <td><select id="rg-${r.k}-st" data-rg="${r.k}" data-rf="st" ${canWrite?"":"disabled"}>${[["","—"],["yes","Maintained"],["no","Not maintained"],["na","Not applicable"]].map(([a,b])=>`<option value="${a}" ${v.st===a?"selected":""}>${b}</option>`).join("")}</select></td>
    <td><input type="date" id="rg-${r.k}-upd" data-rg="${r.k}" data-rf="upd" value="${esc(v.upd||"")}" ${canWrite?"":"disabled"}></td>
    <td><input type="text" id="rg-${r.k}-at" data-rg="${r.k}" data-rf="at" value="${esc(v.at||"")}" placeholder="Registered office" ${canWrite?"":"disabled"}></td>
    <td><input type="text" id="rg-${r.k}-by" data-rg="${r.k}" data-rf="by" value="${esc(v.by||"")}" placeholder="Custodian" ${canWrite?"":"disabled"}></td></tr>`;}).join("");
  const done=REGS.filter(r=>regs[r.k]&&(regs[r.k].st==="yes"||regs[r.k].st==="na")).length;
  const at=Math.min(TODAY,fyE(sel)),HR=holdingRows(at),S=HR.S,tot=HR.tot,authV=cap().classes.reduce((a,c)=>a+(S.auth[c.id]||0)*(S.fv[c.id]||0),0);
  return `<div class="pagehead"><div><h2>Statutory registers</h2><p class="sub">Registers the Companies Act requires you to keep at the registered office. ${done} of ${REGS.length} confirmed.</p></div>${dlBar("reg","Statutory registers")}</div>
   <section class="sheet"><div class="scroll"><table class="reg regs"><thead><tr><th>Register</th><th>Status</th><th>Last updated</th><th>Kept at</th><th>Custodian</th></tr></thead><tbody>${rows}</tbody></table></div></section>
   <section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Share capital · as on ${fmtD(at)}</h3><button class="btn small" data-tabgo="shareholders">Open Shareholders</button></div><div class="kv"><span>Authorised capital</span><b>${authV?fmtRs(authV):"–"}</b><span>Issued, subscribed and paid-up</span><b>${fmtRs(tot)}</b><span>Securities premium</span><b>${fmtRs(Object.values(S.prem).reduce((a,v)=>a+v,0))}</b><span>Members</span><b>${HR.rows.length}</b></div>
    <p class="sub" style="margin:10px 0 0">The register of members (MGT-1) and the share ledger are kept under Shareholders and download from there.</p></section>`;
}

/* ---------- Documents ---------- */
const ASSET_TYPES={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",csv:"text/csv",txt:"text/plain",json:"application/json",md:"text/markdown"};
const extOf=n=>(String(n).split(".").pop()||"").toLowerCase();
function vDocs(){
  const canUp=canWrite&&(isLocal||!!fileCap);
  const list=docs.filter(x=>docFilter==="all"||x.fy===String(sel)).sort((a,b)=>(+b.fy-+a.fy)||DOC_CATS.findIndex(c=>c.k===a.cat)-DOC_CATS.findIndex(c=>c.k===b.cat)||String(b.date||"").localeCompare(String(a.date||"")));
  const top=`<div class="pagehead"><div><h2>Documents</h2><p class="sub">Filed forms and challans, signed minutes, notices, certified copies, declarations and registers.</p></div>
    <div class="toolbar"><div class="seg" role="group" aria-label="Which years"><button data-docf="sel" aria-pressed="${docFilter==="sel"}">${fyLabel(sel)}</button><button data-docf="all" aria-pressed="${docFilter==="all"}">All years</button></div>
    ${list.length&&(downloads||isLocal)?`<button class="btn dlbtn" data-act="alldocs" ${exp.busy?"disabled":""}>${exp.busy==="docs"?`<span class="spin"></span>Packing…`:DLICON+"Download all · ZIP ("+list.length+")"}</button>`:""}
    ${canUp?`<button class="btn primary" data-act="newdoc">Upload document</button>`:""}</div></div>`;
  const frm=docForm?docFormView():"";
  let tbl;
  if(!list.length)tbl=`<div class="empty">No documents ${docFilter==="all"?"yet":"for "+fyLabel(sel)}. Upload SRN acknowledgements, challans, signed minutes and declarations; attach them to calendar items from the calendar too.</div>`;
  else{let last=null;tbl=`<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">${docFilter==="all"?"All years":fyLabel(sel)}</h3>${dlMenu("docs","Documents index","Index")}</div><div class="scroll"><table class="reg"><thead><tr><th>Document</th><th>Reference</th><th>Date</th><th>File</th><th></th></tr></thead><tbody>`+
    list.map(x=>{let h="";const g=(docFilter==="all"?fyLabel(+x.fy)+" · ":"")+docCatName(x.cat);if(g!==last){last=g;h=`<tr><td colspan="5" style="background:var(--sunk);font-weight:600">${esc(g)}</td></tr>`;}
      const conf=delConfirm==="doc:"+x.id;
      const open=`<button class="btn small" data-view="${esc(x.id)}">View</button>`+((downloads||isLocal)?`<button class="btn small" data-dldoc="${esc(x.id)}">Download</button>`:"");
      return h+`<tr><td><strong>${esc(x.title||x.fileName)}</strong>${x.linkKey?`<span class="hint">Attached to a calendar item</span>`:""}${x.shareTx||x.shareMem?`<span class="hint">Share record${x.shareMem?" · "+esc(memName(x.shareMem)):""}</span>`:""}</td><td class="tag">${esc(x.ref||"–")}</td><td style="white-space:nowrap">${fmtD(pd(x.date))}</td>
       <td><span class="fname">${esc(x.fileName)}</span><span class="hint">${fmtSize(+x.size||0)}</span></td>
       <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-deldoc="${esc(x.id)}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:open+(canUp?`<button class="btn small" data-askdel="doc:${esc(x.id)}" aria-label="Delete">✕</button>`:"")}</div></td></tr>`;}).join("")+`</tbody></table></div></section>`;}
  return top+frm+tbl;
}
function docFormView(){
  const f=docForm;const fys=[];for(let Y=CUR_FY+1;Y>=FIRST_FY;Y--)fys.push([String(Y),fyLabel(Y)]);
  const items=calendar(+f.fy).cur;
  return `<section class="sheet"><h3>Upload document</h3><form class="af" autocomplete="off">
   <div class="fld wide2"><label>File</label><label class="drop" id="drop" for="d-file">${f.file?`<b>${esc(f.file.name)}</b> · ${fmtSize(f.file.size)} · choose another`:`<b>Choose a file</b> or drop it here`}<span class="hint">${isLocal?"Any format, up to 50 MB · stored on the TrustComply server":"PDF, image, CSV or text, up to 20 MB"}</span></label><input type="file" id="d-file" hidden></div>
   ${fld("d-fy","Financial year",f.fy,{type:"select",options:fys,attr:'data-d="fy"'})}
   ${fld("d-cat","Category",f.cat,{type:"select",options:DOC_CATS.map(c=>[c.k,c.n]),attr:'data-d="cat"'})}
   ${fld("d-title","Title",f.title,{wide:true,attr:'data-d="title"',ph:"e.g. AOC-4 challan and SRN acknowledgement"})}
   ${fld("d-ref","Reference / SRN",f.ref,{attr:'data-d="ref"'})}${fld("d-date","Date",f.date,{type:"date",attr:'data-d="date"'})}
   ${f.shareTx||f.shareMem?`<div class="fld wide2"><label>Attached to</label><div class="sub">${f.shareTx?esc(txLabel(stx.find(t=>t.id===f.shareTx)||{type:""}))+" of "+fmtD(pd((stx.find(t=>t.id===f.shareTx)||{}).date))+" · ":""}${f.shareMem?esc(memName(f.shareMem)):""}</div></div>`:""}${fld("d-link","Attach to calendar item",f.linkKey,{type:"select",wide:true,options:[["","— none —"]].concat(items.map(i=>[i.key,fmtD(i.due)+" · "+i.form+" · "+i.title])),attr:'data-d="linkKey"'})}
  </form><div class="formfoot"><button class="btn primary" data-act="savedoc" ${uploading?"disabled":""}>${uploading?"Uploading…":"Upload"}</button><button class="btn" data-act="canceldoc">Cancel</button><span class="sub" id="docErr"></span></div></section>`;
}
function pickFile(file){if(!file||!docForm)return;docForm.file=file;if(!docForm.title)docForm.title=file.name.replace(/\.[^.]+$/,"").replace(/_+/g," ");render();}
async function saveDoc(){
  const f=docForm,err=$("#docErr");if(!f.file){err.textContent="Choose a file to upload.";return;}
  const max=isLocal?50*1048576:20*1048576;if(f.file.size>max){err.textContent="That file is "+fmtSize(f.file.size)+"; the limit is "+fmtSize(max)+".";return;}
  let mime=f.file.type||"application/octet-stream";if(!isLocal){const t=ASSET_TYPES[extOf(f.file.name)];if(!t){err.textContent="This format can’t be stored here. Save it as PDF and upload that.";return;}mime=t;}
  uploading=true;render();
  try{let blob;if(isLocal){blob=rid("f");await idbPut(blob,{blob:f.file,name:f.file.name,type:mime});}else{const r=await fileCap.upload(f.file,{type:mime});blob=r.id;}
    const id=rid("d");const meta={fy:f.fy,cat:f.cat,title:f.title.trim()||f.file.name,ref:f.ref.trim(),date:f.date||"",linkKey:f.linkKey||"",shareTx:f.shareTx||"",shareMem:f.shareMem||"",fileName:f.file.name,size:f.file.size,mime,blob,uploadedAt:new Date().toISOString(),uploadedBy:uid||null};
    uploading=false;docForm=null;await put("docs",id,meta);toast("Uploaded "+meta.title);if(f.back===true){tab="overview";openItem=f.linkKey;render();}else if(f.back){tab="shareholders";shView=f.back;openTx=f.shareTx||openTx;render();}
  }catch(e){uploading=false;render();const el=$("#docErr");if(el)el.textContent=({too_large:"The file is too large for this page.",unsupported_type:"This format can’t be stored here. Save it as PDF.",quota_or_state:"This page’s storage is full."})[e&&e.code]||("Upload failed. "+(e&&e.message||""));}
}
async function deleteDoc(id){const x=docs.find(d=>d.id===id);delConfirm=null;if(!x)return;try{if(isLocal)await idbDel(x.blob);else if(fileCap)await fileCap.delete(x.blob);}catch(_){}await remove("docs",id);toast("Document deleted");}
async function fileBlob(x){if(isLocal){const rec=await idbGet(x.blob);return rec?rec.blob:null;}const r=await fetch("/_blob/"+x.blob);if(!r.ok)throw new Error(r.status);return r.blob();}
async function openLocalDoc(id){const x=docs.find(d=>d.id===id);if(!x)return;try{const b=await fileBlob(x);if(!b){toast("The file couldn’t be found on the server.");return;}const u=URL.createObjectURL(b);if(!window.open(u,"_blank")){const a=document.createElement("a");a.href=u;a.target="_blank";a.click();}setTimeout(()=>URL.revokeObjectURL(u),60000);}catch(_){toast("Couldn’t open the file.");}}
async function downloadDocFile(id){const x=docs.find(d=>d.id===id);if(!x)return;try{const b=await fileBlob(x);if(!b){toast("The file couldn’t be found on the server.");return;}if(await saveBlob(x.fileName||"document",b))toast("Downloaded "+(x.title||x.fileName));}catch(_){toast("Couldn’t fetch that file.");}}
let idbP=null;
function idb(){if(!idbP)idbP=new Promise((res,rej)=>{const r=indexedDB.open("trufin-cs-files",1);r.onupgradeneeded=()=>r.result.createObjectStore("files");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});return idbP;}
async function idbOp(mode,fn){const d=await idb();return new Promise((res,rej)=>{const tx=d.transaction("files",mode);const rq=fn(tx.objectStore("files"));tx.oncomplete=()=>res(rq?rq.result:undefined);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);});}
const idbPut=(k,v)=>HOST.files.put(k,v),idbGet=k=>HOST.files.get(k),idbDel=k=>HOST.files.del(k);

/* ---------- Settings ---------- */
function vSettings(){
  const C=co();const dis=canWrite?"":"disabled";
  const S=(k,l,o)=>fld("cf-"+k,l,C[k],Object.assign({},o,{attr:`data-cf="${k}" ${dis}`}));
  const T=(k,l,h)=>`<label class="tog"><input type="checkbox" data-cfb="${k}" ${C[k]?"checked":""} ${dis}><span><strong>${l}</strong><span class="hint">${h}</span></span></label>`;
  const fyOpts=[["","—"]].concat(Array.from({length:CUR_FY+6-FIRST_FY},(_,i)=>[String(CUR_FY+5-i),fyLabel(CUR_FY+5-i)]));
  const cust=(C.custom||[]).map((c,i)=>`<tr><td><strong>${esc(c.name)}</strong><span class="hint">${esc(c.form||"")}${c.law?" · "+esc(c.law):""}</span></td><td>${esc(FREQ[c.freq]||"")}</td><td>${c.freq==="once"?fmtD(pd(c.date)):(c.freq==="monthly"?"Day "+c.day:"Day "+c.day+" of "+MON[(+c.month||1)-1])}</td><td>${canWrite?`<button class="btn small" data-delcust="${i}" aria-label="Remove">✕</button>`:""}</td></tr>`).join("");
  const cf=edit&&edit.col==="custom"?edit.data:null;
  return `<div class="pagehead"><div><h2>Settings</h2><p class="sub">Company details, which compliances apply, the auditor’s term, the signatory for certified copies, and your own recurring items.</p></div></div>
  <section class="sheet"><h3>Company</h3><form class="af" autocomplete="off">
   ${S("name","Company name",{wide:true})}${S("cin","CIN")}${S("inc","Date of incorporation",{type:"date"})}
   ${S("ro","Registered office",{wide:true})}${S("email","Email for notices")}
  </form></section>
  <section class="sheet"><h3>What applies</h3><form class="af" autocomplete="off" style="margin-bottom:12px">${fld("cf-trackFrom","Start tracking from",C.trackFrom||String(CUR_FY),{type:"select",options:Array.from({length:CUR_FY+2-FIRST_FY},(_,i)=>[String(CUR_FY+1-i),fyLabel(CUR_FY+1-i)]),attr:`data-cf="trackFrom" ${dis}`,hint:"Open items from earlier years are not carried into the calendar"})}</form><div class="togs">
   ${T("small","Small company","Board meetings: one in each half-year; annual return in MGT-7A")}
   ${T("msme","MSME-1 half-yearly returns","You have dues to micro or small suppliers outstanding over 45 days")}
   ${T("dpt3","DPT-3 return","You have deposits or outstanding loans and advances not treated as deposits")}
   ${T("holding","Holding company","Consolidated financial statements (AOC-4 CFS)")}
   ${T("csr","CSR applies","Net worth, turnover or profit crosses the Section 135 thresholds")}
   ${T("fla","Foreign investment","FLA return to RBI by 15 July")}
   ${T("demat9b","Shares must be in demat (Rule 9B)","Private companies that are not small companies; holding companies and subsidiaries always. Adds PAS-6 half-yearly")}
  </div></section>
  <section class="sheet"><h3>Dematerialisation</h3><form class="af" autocomplete="off">${fld("cf-dematFrom","Physical issues and transfers flagged from",C.dematFrom,{type:"date",attr:`data-cf="dematFrom" ${dis}`,hint:"The date Rule 9B took effect for the company"})}</form></section>
  <section class="sheet"><h3>Statutory auditor</h3><form class="af" autocomplete="off">
   ${S("audFirm","Audit firm",{wide:true})}${S("audFrn","Firm registration no.")}
   ${fld("cf-audFrom","Appointed at the AGM for",C.audFrom,{type:"select",options:fyOpts,attr:`data-cf="audFrom" ${dis}`})}
   ${fld("cf-audTermEnd","Term ends at the AGM for",C.audTermEnd,{type:"select",options:fyOpts,attr:`data-cf="audTermEnd" ${dis}`,hint:"Five-year term: an ADT-1 item appears for that AGM"})}
  </form></section>
  <section class="sheet"><h3>Signatory for certified copies and notices</h3><form class="af" autocomplete="off">
   ${S("signName","Name")}${S("signDes","Designation")}${S("signDin","DIN")}${S("place","Place")}
  </form></section>
  <section class="sheet"><h3>Your own recurring items</h3><p class="sub" style="margin:0 0 10px">Add anything else you track: shop and establishment renewals, trade licences, lab licences, insurance renewals, internal reviews.</p>
   ${cust?`<div class="scroll"><table class="reg"><thead><tr><th>Item</th><th>Repeats</th><th>Due</th><th></th></tr></thead><tbody>${cust}</tbody></table></div>`:""}
   ${cf?`<form class="af" autocomplete="off" style="margin-top:12px">
     ${E("name","Item",{wide:true,ph:"e.g. Biomedical waste authorisation renewal"})}${E("form","Form / reference",{})}${E("law","Law",{})}
     ${E("freq","Repeats",{type:"select",options:Object.entries(FREQ)})}
     ${cf.freq==="once"?E("date","Due on",{type:"date"}):(cf.freq!=="monthly"?E("month","Month",{type:"select",options:MONL.map((m,i)=>[String(i+1),m]),hint:cf.freq==="annual"?"":"First due month; repeats from there"}):"")+E("day","Day of month",{type:"num"})}
    </form><div class="formfoot"><button class="btn primary" data-act="save">Add item</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div>`
    :(canWrite?`<button class="btn" data-new="custom" style="margin-top:6px">Add an item</button>`:"")}
  </section>`;
}

/* ================= Shareholders: capital, members, ledger, certificates, demat ================= */
let members=[],stx=[],capital=null,capDirty=false,capTimer=null,shView="cap",asOnStr="",histMem="",openTx=null;
const CAP_DEFAULT={classes:[{id:"eq",name:"Equity shares",type:"equity",fv:10,auth:"",isin:""}],demat:{}};
const cap=()=>{const c=capital||clone(CAP_DEFAULT);c.demat=c.demat||{};return c;};
const clsOf=id=>cap().classes.find(c=>c.id===id)||{id,name:"Shares",fv:0};
const MEM_CAT=[["promoter","Promoter / promoter group"],["director","Directors and relatives"],["kmp","Key managerial personnel"],["body","Bodies corporate"],["individual","Other individuals"],["foreign","Foreign investors"],["employee","Employees (ESOP)"],["other","Others"]];
const MEM_TYPE=[["individual","Individual"],["company","Company"],["llp","LLP / firm"],["huf","HUF"],["trust","Trust"],["nri","NRI / foreign national"],["fcompany","Foreign company"]];
const catName=k=>(MEM_CAT.find(c=>c[0]===k)||[k,"Others"])[1];
const TX={
 subscribe:{n:"Subscription to MOA",to:true,prem:true,mode:true,newIssue:true},
 allot:{n:"Allotment",to:true,prem:true,mode:true,newIssue:true},
 bonus:{n:"Bonus issue",bonus:true},
 transfer:{n:"Transfer",from:true,to:true,consid:true,mode:true,lodge:true},
 transmission:{n:"Transmission",from:true,to:true,mode:true,lodge:true},
 demat:{n:"Dematerialisation",self:true,lodge:true},
 remat:{n:"Rematerialisation",self:true},
 buyback:{n:"Buy-back",from:true,consid:true,mode:true,lodge:true},
 forfeit:{n:"Forfeiture",from:true,mode:true,lodge:true},
 split:{n:"Sub-division / consolidation",split:true}
};
const ALLOT_T=["Rights issue","Private placement","Preferential allotment","ESOP","Sweat equity","Conversion of loan or securities","Bonus","Other"];
const DEPS=["NSDL","CDSL"];
const memName=id=>{const m=members.find(x=>x.id===id);return m?m.name:"–";};
const nIN=v=>(+v||0).toLocaleString("en-IN");
const endOf=Y=>"31 March "+(Y+1);
function acctOf(id){for(const m of members)for(const a of (m.accounts||[]))if(a.id===id)return {m,a};return null;}
const acctLabel=a=>a?(a.dep==="CDSL"?"CDSL · BO "+(a.dpId||"")+(a.clientId||""):"NSDL · "+(a.dpId||"")+" · "+(a.clientId||""))+(a.dpName?" ("+a.dpName+")":""):"–";
function sortedTx(){return stx.slice().sort((a,b)=>(pd(a.date)||0)-(pd(b.date)||0)||(a.seq||0)-(b.seq||0));}
/* replay the ledger: totals, physical vs electronic, per demat account */
function capState(at,skipId){
  const hold={},mode={},acct={},fv={},issued={},prem={},auth={};
  for(const c of cap().classes){fv[c.id]=+c.fv||0;issued[c.id]=0;prem[c.id]=0;auth[c.id]=+c.auth||0;}
  const mv=(m,c,q,md,ac)=>{if(!m)return;hold[m]=hold[m]||{};hold[m][c]=(hold[m][c]||0)+q;mode[m]=mode[m]||{};mode[m][c]=mode[m][c]||{p:0,d:0};mode[m][c][md==="demat"?"d":"p"]+=q;
    if(md==="demat"&&ac){acct[ac]=acct[ac]||{};acct[ac][c]=(acct[ac][c]||0)+q;}};
  for(const t of sortedTx()){const d=pd(t.date);if(d==null||(at!=null&&d>at)||t.id===skipId)continue;const q=+t.qty||0,c=t.classId;
    if(fv[c]==null){fv[c]=0;issued[c]=0;prem[c]=0;auth[c]=0;}
    const md=t.mode||"phys";
    if(t.type==="subscribe"||t.type==="allot"){mv(t.to,c,q,md,t.acct);issued[c]+=q;prem[c]+=q*(+t.premium||0);}
    else if(t.type==="transfer"||t.type==="transmission"){mv(t.from,c,-q,md,t.fromAcct);mv(t.to,c,q,md,t.acct);}
    else if(t.type==="buyback"||t.type==="forfeit"){mv(t.from,c,-q,md,t.fromAcct);issued[c]-=q;}
    else if(t.type==="demat"){mv(t.from,c,-q,"phys");mv(t.from,c,q,"demat",t.acct);}
    else if(t.type==="remat"){mv(t.from,c,-q,"demat",t.fromAcct);mv(t.from,c,q,"phys");}
    else if(t.type==="split"){const r=+t.ratio||1;const sc=v=>Math.round(v*r);
      for(const m in hold)if(hold[m][c]){hold[m][c]=sc(hold[m][c]);mode[m][c].p=sc(mode[m][c].p);mode[m][c].d=sc(mode[m][c].d);}
      for(const a in acct)if(acct[a][c])acct[a][c]=sc(acct[a][c]);
      issued[c]=sc(issued[c]);auth[c]=sc(auth[c]||0);fv[c]=t.newFv!==""&&t.newFv!=null?+t.newFv:fv[c]/r;}}
  return {hold,mode,acct,fv,issued,prem,auth};
}
const asOn=()=>pd(asOnStr)||Math.min(TODAY,fyE(sel));
function holdingRows(at){
  const S=capState(at);const tot=Object.keys(S.issued).reduce((s,c)=>s+S.issued[c]*(S.fv[c]||0),0);
  const rows=members.map(m=>{const h=S.hold[m.id]||{};const val=Object.keys(h).reduce((s,c)=>s+h[c]*(S.fv[c]||0),0);const sh=Object.values(h).reduce((s,v)=>s+v,0);
    const md=S.mode[m.id]||{};const p=Object.values(md).reduce((s,v)=>s+v.p,0),d=Object.values(md).reduce((s,v)=>s+v.d,0);return {m,h,sh,val,p,d,pct:tot?val/tot*100:0};}).filter(r=>r.sh>0).sort((a,b)=>b.val-a.val);
  return {S,rows,tot};
}
/* reconciliation of issued capital: physical vs NSDL vs CDSL (the PAS-6 basis) */
function recon(at){
  const S=capState(at);const out=cap().classes.map(c=>{const r={c,issued:S.issued[c.id]||0,p:0,NSDL:0,CDSL:0,unmapped:0};
    for(const m in S.mode)if(S.mode[m][c.id])r.p+=S.mode[m][c.id].p;
    let dsum=0;for(const m in S.mode)if(S.mode[m][c.id])dsum+=S.mode[m][c.id].d;
    for(const a in S.acct){const q=S.acct[a][c.id]||0;if(!q)continue;const x=acctOf(a);if(x&&DEPS.includes(x.a.dep))r[x.a.dep]+=q;else r.unmapped+=q;}
    r.unmapped+=dsum-(r.NSDL+r.CDSL+r.unmapped);r.diff=r.issued-(r.p+r.NSDL+r.CDSL+r.unmapped);r.pct=r.issued?(r.issued-r.p)/r.issued*100:0;return r;});
  return {S,rows:out};
}
const demat9b=()=>!!co().demat9b;
const dematFrom=()=>pd(co().dematFrom)||D(2025,6,30);
const SWATCH=["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--c6)","var(--c7)","var(--c8)"];
function saveCap(){capDirty=true;clearTimeout(capTimer);setSave("Saving…");capTimer=setTimeout(()=>{if(!db){capDirty=false;return;}const body=clone(cap());
  chain=chain.then(async()=>{try{await db.doc("config/capital").set(body);setSave(savedTxt());}catch(e){toast("Couldn’t save the capital structure.");}capDirty=false;});},0);}

/* ---------- certificates: every physical issue, and what later happened to it ---------- */
function certList(){
  const list=[];const byNo={};
  for(const t of sortedTx()){
    const physIssue=t.type==="remat"||((t.mode||"phys")==="phys"&&["subscribe","allot","transfer","transmission"].includes(t.type));
    if(t.certNo&&physIssue){const r={no:t.certNo,t,member:t.to||t.from,qty:+t.qty||0,date:t.date,status:"Active",note:""};list.push(r);byNo[t.certNo]=r;}
    if(t.certsSurr){for(const n of String(t.certsSurr).split(/[,\s]+/).filter(Boolean)){const r=byNo[n]||byNo[n.padStart(3,"0")];if(!r)continue;
      r.status={demat:"Surrendered for demat",transfer:"Lodged for transfer",transmission:"Lodged for transmission",buyback:"Cancelled on buy-back",forfeit:"Cancelled on forfeiture"}[t.type]||"Cancelled";
      r.note=fmtD(pd(t.date))+(t.drn?" · DRN "+t.drn:"");r.closedBy=t.id;}}}
  return list;
}
const docsFor=(k,v)=>docs.filter(x=>x[k]===v);

/* ---------- views ---------- */
function vShareholders(){
  const views=[["cap","Capital & shareholding"],["members","Members & demat accounts"],["ledger","Share ledger"],["certs","Certificates"],["history","History"]];
  const seg=`<div class="seg seg-wrap" role="group" aria-label="View">${views.map(([k,l])=>`<button data-shv="${k}" aria-pressed="${shView===k}">${l}</button>`).join("")}</div>`;
  const add=canWrite?({members:`<button class="btn primary" data-new="members">Add member</button>`,ledger:`<button class="btn primary" data-new="sharetx">Record a transaction</button>`,cap:`<button class="btn" data-new="shclass">Add share class</button><button class="btn" data-act="dematsetup">Demat setup</button>`}[shView]||""):"";
  const head=`<div class="pagehead"><div><h2>Shareholders</h2><p class="sub">Build the register from incorporation: every subscription, allotment, transfer, conversion to demat and buy-back, with holdings and certificates as on any date.</p></div><div class="toolbar">${add}</div></div>`;
  const key={cap:"pat",members:"mem",ledger:"led",certs:"cert",history:"led"}[shView];
  const bar=`<div class="toolbar">${seg}<span style="margin-left:auto">${dlBar(key,"Shareholders")}</span></div>`;
  const form=edit&&["members","sharetx","shclass","dematset"].includes(edit.col)?({members:memForm,sharetx:txForm,shclass:classForm,dematset:dematForm}[edit.col])():"";
  return head+form+bar+({cap:vCap,members:vMembers,ledger:vLedger,certs:vCerts,history:vHistory}[shView]||vCap)();
}
function dematCard(at){
  const c=cap(),dm=c.demat||{},R=recon(at),C=c.classes;
  const {rows}=holdingRows(at);
  const insiders=rows.filter(r=>["promoter","director","kmp"].includes(r.m.category)&&r.p>0);
  const phys=rows.filter(r=>r.p>0);
  const chk=[
    {ok:C.every(x=>x.isin),t:"ISIN for every class",d:C.map(x=>x.name+": "+(x.isin||"not recorded")).join(" · ")},
    {ok:!!dm.rta,t:"Registrar and share transfer agent appointed",d:dm.rta?dm.rta+(dm.rtaDate?" · since "+fmtD(pd(dm.rtaDate)):""):"Not recorded"},
    {ok:!!(dm.nsdl||dm.cdsl),t:"Tripartite agreement with a depository",d:[dm.nsdl?"NSDL "+fmtD(pd(dm.nsdl)):"",dm.cdsl?"CDSL "+fmtD(pd(dm.cdsl)):""].filter(Boolean).join(" · ")||"Not recorded"},
    {ok:!insiders.length,t:"Promoters, directors and KMP hold only in demat",d:insiders.length?insiders.map(r=>r.m.name+" "+nIN(r.p)+" physical").join(" · "):"All in demat"},
    {ok:!phys.length,t:"All members hold in demat",d:phys.length?phys.length+" member"+(phys.length===1?"":"s")+" still hold "+nIN(phys.reduce((s,r)=>s+r.p,0))+" physical shares":"Fully dematerialised",soft:true}];
  const rrows=R.rows.map(r=>`<tr><td><strong>${esc(r.c.name)}</strong><span class="hint">${r.c.isin?"ISIN "+esc(r.c.isin):"No ISIN"}</span></td><td class="n">${nIN(r.issued)}</td><td class="n">${nIN(r.p)}</td><td class="n">${nIN(r.NSDL)}</td><td class="n">${nIN(r.CDSL)}</td>${R.rows.some(x=>x.unmapped)?`<td class="n">${nIN(r.unmapped)}</td>`:""}<td class="n"><strong>${r.pct.toFixed(2)}%</strong></td><td class="n ${r.diff?"bad-t":"ok-t"}">${r.diff?nIN(r.diff):"Nil"}</td></tr>`).join("");
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Electronic shares (demat)</h3><span class="sub">${demat9b()?"Rule 9B applies · dematerialisation required":"Rule 9B does not apply (small company)"}</span></div>
    <div class="dchk">${chk.map(x=>`<div class="check"><b class="${x.ok?"chkok":x.soft?"warn-t":"chkbad"}">${x.ok?"✓":x.soft?"!":"✕"}</b><span><strong>${x.t}</strong> <span class="sub">${esc(x.d)}</span></span></div>`).join("")}</div>
    <h3 style="margin-top:14px">Reconciliation of issued capital · as on ${fmtD(at)}</h3>
    <div class="scroll"><table class="reg"><thead><tr><th>Class</th><th class="n">Issued</th><th class="n">Physical</th><th class="n">NSDL</th><th class="n">CDSL</th>${R.rows.some(x=>x.unmapped)?`<th class="n">Demat, no account</th>`:""}<th class="n">In demat</th><th class="n">Difference</th></tr></thead><tbody>${rrows}</tbody></table></div>
    <p class="sub" style="margin:8px 0 0">This is the basis for the half-yearly PAS-6 reconciliation. Check the NSDL and CDSL figures against the RTA’s beneficiary position before filing.</p></section>`;
}
function vCap(){
  const at=asOn();const {S,rows,tot}=holdingRows(at);const C=cap().classes;
  const capRows=C.map(c=>{const iss=S.issued[c.id]||0,fv=S.fv[c.id]||0,auth=S.auth[c.id]||0;const over=auth&&iss>auth;
    return `<tr><td><strong>${esc(c.name)}</strong><span class="hint">${c.type==="preference"?"Preference":"Equity"}${c.isin?" · ISIN "+esc(c.isin):""}</span></td>
     <td class="n">${fmtRs(fv)}</td><td class="n">${auth?nIN(auth):"–"}</td><td class="n">${auth?fmtRs(auth*fv):"–"}</td>
     <td class="n ${over?"bad-t":""}">${nIN(iss)}</td><td class="n">${fmtRs(iss*fv)}</td><td class="n">${S.prem[c.id]?fmtRs(S.prem[c.id]):"–"}</td>
     <td>${canWrite?`<button class="btn small" data-edit="shclass" data-id="${c.id}">Edit</button>`:""}</td></tr>`;}).join("");
  const warn=C.filter(c=>S.auth[c.id]&&(S.issued[c.id]||0)>S.auth[c.id]).map(c=>c.name);
  const segs=rows.slice(0,7).map((r,i)=>({l:r.m.name,p:r.pct,c:SWATCH[i]}));const rest=rows.slice(7).reduce((s,r)=>s+r.pct,0);if(rest>0)segs.push({l:"Others",p:rest,c:SWATCH[7]});
  const barH=rows.length?`<div class="own" role="img" aria-label="Ownership">${segs.map(s=>`<span style="width:${s.p}%;background:${s.c}" title="${esc(s.l)} · ${s.p.toFixed(2)}%"></span>`).join("")}</div>
    <div class="own-l">${segs.map(s=>`<span><i style="background:${s.c}"></i>${esc(s.l)} <b>${s.p.toFixed(2)}%</b></span>`).join("")}</div>`:"";
  const cats={};for(const r of rows){const k=r.m.category||"other";cats[k]=cats[k]||{sh:0,val:0,n:0};cats[k].sh+=r.sh;cats[k].val+=r.val;cats[k].n++;}
  const catRows=MEM_CAT.filter(([k])=>cats[k]).map(([k,l])=>`<tr><td>${l}</td><td class="n">${cats[k].n}</td><td class="n">${nIN(cats[k].sh)}</td><td class="n">${tot?(cats[k].val/tot*100).toFixed(2):"0.00"}%</td></tr>`).join("");
  const holdRows=rows.map((r,i)=>`<tr><td><span class="sw" style="background:${SWATCH[Math.min(i,7)]}"></span><strong>${esc(r.m.name)}</strong><span class="hint">${esc(r.m.folio||"")} · ${esc(catName(r.m.category))}</span></td>
    <td class="n">${nIN(r.sh)}</td><td class="n">${r.p?nIN(r.p):"–"}</td><td class="n">${r.d?nIN(r.d):"–"}</td><td class="n">${fmtRs(r.val)}</td><td class="n"><strong>${r.pct.toFixed(2)}%</strong></td></tr>`).join("");
  const T=rows.reduce((a,r)=>({sh:a.sh+r.sh,p:a.p+r.p,d:a.d+r.d}),{sh:0,p:0,d:0});
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Share capital</h3><div class="fld" style="flex-direction:row;align-items:center;gap:8px"><label for="asOn" style="margin:0">As on</label><input type="date" id="asOn" value="${iso(at)}"></div></div>
    <div class="scroll"><table class="reg"><thead><tr><th>Class</th><th class="n">Face value</th><th class="n">Authorised shares</th><th class="n">Authorised capital</th><th class="n">Issued & paid-up</th><th class="n">Paid-up capital</th><th class="n">Securities premium</th><th></th></tr></thead>
    <tbody>${capRows}<tr class="totrow"><td>Total</td><td></td><td></td><td class="n">${fmtRs(C.reduce((s,c)=>s+(S.auth[c.id]||0)*(S.fv[c.id]||0),0))}</td><td></td><td class="n">${fmtRs(tot)}</td><td class="n">${fmtRs(Object.values(S.prem).reduce((s,v)=>s+v,0))}</td><td></td></tr></tbody></table></div>
    ${warn.length?`<div class="banner bad" style="margin-top:10px"><span>Issued shares exceed the authorised limit for ${esc(warn.join(", "))}. Increase the authorised capital (SH-7) before allotting.</span></div>`:""}
    <p class="sub" style="margin:8px 0 0">Shares are treated as fully paid up. Enter authorised shares at the class’s original face value; a sub-division or consolidation in the ledger rescales them.</p></section>
   ${dematCard(at)}
   <section class="sheet"><h3>Shareholding · as on ${fmtD(at)}</h3>
    ${rows.length?barH+`<div class="scroll" style="margin-top:14px"><table class="reg"><thead><tr><th>Member</th><th class="n">Shares</th><th class="n">Physical</th><th class="n">Demat</th><th class="n">Nominal value</th><th class="n">Holding</th></tr></thead>
      <tbody>${holdRows}<tr class="totrow"><td>Total · ${rows.length} member${rows.length===1?"":"s"}</td><td class="n">${nIN(T.sh)}</td><td class="n">${nIN(T.p)}</td><td class="n">${nIN(T.d)}</td><td class="n">${fmtRs(tot)}</td><td class="n">100.00%</td></tr></tbody></table></div>
      <h3 style="margin-top:18px">Shareholding pattern by category</h3><div class="scroll"><table class="reg"><thead><tr><th>Category</th><th class="n">Members</th><th class="n">Shares</th><th class="n">Holding</th></tr></thead><tbody>${catRows}</tbody></table></div>`
    :`<div class="empty">No shareholding on ${fmtD(at)}. Add the members, then record the subscription to the MOA at incorporation and each change since in the share ledger.</div>`}</section>`;
}
function docChips(k,v,ctx){
  const dd=docsFor(k,v);
  return `${dd.map(x=>`<span class="att">${esc(x.title||x.fileName)}<button class="btn link" data-view="${esc(x.id)}">View</button></span>`).join("")}${canWrite&&(isLocal||fileCap)?`<button class="btn small" data-shupload="${esc(ctx)}" data-${k==="shareTx"?"tx":"mem"}="${esc(v)}">Upload</button>`:""}`;
}
function vMembers(){
  const at=asOn();const S=capState(at);
  const list=members.slice().sort((a,b)=>String(a.folio||"").localeCompare(String(b.folio||""),undefined,{numeric:true}));
  if(!list.length)return `<div class="empty">No members yet. Add each shareholder with their folio number and demat account, then record their shares in the share ledger.</div>`;
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Register of members (MGT-1)</h3><span class="sub">Holdings as on ${fmtD(at)}</span></div><div class="scroll"><table class="reg"><thead><tr><th>Folio</th><th>Member</th><th>Category</th><th class="n">Physical</th><th class="n">Demat</th><th>Demat accounts</th><th>Documents</th><th></th></tr></thead><tbody>
   ${list.map(m=>{const md=S.mode[m.id]||{};const p=Object.values(md).reduce((s,v)=>s+v.p,0),d=Object.values(md).reduce((s,v)=>s+v.d,0);const used=stx.some(t=>t.to===m.id||t.from===m.id);const conf=delConfirm==="mem:"+m.id;
     const accs=(m.accounts||[]).map(a=>`<span class="acct">${esc(acctLabel(a))}${S.acct[a.id]?" · "+nIN(Object.values(S.acct[a.id]).reduce((s,v)=>s+v,0)):""}</span>`).join("")||(m.dp?`<span class="acct">${esc(m.dp)}</span>`:`<span class="sub">None</span>`);
     return `<tr class="${m.ceased?"ceased":""}"><td class="tag">${esc(m.folio||"–")}</td><td><strong>${esc(m.name)}</strong><span class="hint">${esc((MEM_TYPE.find(x=>x[0]===m.type)||["",""])[1])}${m.pan?" · PAN "+esc(m.pan):""}${m.joint?" · jointly with "+esc(m.joint):""}${m.ceased?" · ceased "+fmtD(pd(m.ceased)):""}${m.sbo?" · BEN-1 "+fmtD(pd(m.sbo)):""}</span></td>
      <td>${esc(catName(m.category))}</td><td class="n ${p&&["promoter","director","kmp"].includes(m.category)&&demat9b()?"warn-t":""}">${p?nIN(p):"–"}</td><td class="n">${d?nIN(d):"–"}</td><td><div class="accts">${accs}</div></td>
      <td><div class="atts">${docChips("shareMem",m.id,"members")}</div></td>
      <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="members" data-id="${m.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
        `<button class="btn small" data-stmt="${m.id}">Statement</button>${canWrite?`<button class="btn small" data-edit="members" data-id="${m.id}">Edit</button>${used?"":`<button class="btn small" data-askdel="mem:${m.id}" aria-label="Delete">✕</button>`}`:""}`}</div></td></tr>`;}).join("")}
   </tbody></table></div><p class="sub" style="margin:10px 0 0">A member’s physical holding is highlighted when Rule 9B requires promoters, directors and KMP to hold only in demat. Members with ledger entries can’t be deleted; record a transfer out and a cessation date instead.</p></section>`;
}
function firstTx(mid){const t=sortedTx().find(x=>x.to===mid);return t?t.date:"";}
function txLabel(t){return t.type==="allot"?(t.allotType||"Allotment"):(TX[t.type]||{n:t.type}).n;}
function vLedger(){
  const list=sortedTx();
  if(!list.length)return `<div class="empty">No share transactions yet. Start at incorporation with the subscription to the MOA, then add every allotment, transfer, conversion to demat and buy-back in date order. Dates can go back to any year.</div>`;
  let run={};for(const c of cap().classes)run[c.id]=0;const bal={};
  for(const t of list){const q=+t.qty||0,c=t.classId;run[c]=run[c]||0;if(t.type==="subscribe"||t.type==="allot")run[c]+=q;else if(t.type==="buyback"||t.type==="forfeit")run[c]-=q;else if(t.type==="split")run[c]=Math.round(run[c]*(+t.ratio||1));bal[t.id]=run[c];}
  const rows=list.slice().reverse().filter(t=>{const d=pd(t.date);return d!=null&&fyOfT(d)<=sel;});
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Share ledger</h3><span class="sub">From incorporation to ${endOf(sel)}, newest first · ${rows.length} entries</span></div><div class="scroll"><table class="reg"><thead><tr><th>Date</th><th>Transaction</th><th>From</th><th>To</th><th class="n">Shares</th><th>Form</th><th>Certificate / account</th><th class="n">Issued after</th><th></th></tr></thead><tbody>
   ${rows.map(t=>{const conf=delConfirm==="tx:"+t.id;const c=clsOf(t.classId);const nd=docsFor("shareTx",t.id).length;const open=openTx===t.id;
     const md=t.type==="demat"?"Physical → demat":t.type==="remat"?"Demat → physical":t.type==="split"?"–":(t.mode==="demat"?"Demat":"Physical");
     const where=t.type==="demat"||t.mode==="demat"&&t.type!=="remat"?esc(acctLabel((acctOf(t.acct)||{}).a))+(t.drn?"<span class='hint'>DRN "+esc(t.drn)+"</span>":"")+(t.caRef?"<span class='hint'>Ref "+esc(t.caRef)+"</span>":""):(t.certNo?"Cert. "+esc(t.certNo)+(t.distFrom?"<span class='hint'>Dist. "+nIN(t.distFrom)+" – "+nIN(t.distTo)+"</span>":""):"–");
     const price=t.allotType==="Bonus"?0:t.type==="allot"||t.type==="subscribe"?(c.fv||0)+(+t.premium||0):(+t.consid||0);
     return `<tr class="${open?"sel":""}"><td style="white-space:nowrap">${fmtD(pd(t.date))}</td><td><strong>${esc(txLabel(t))}</strong><span class="hint">${esc(c.name)}${price?" · "+fmtRs(price)+"/share":""}${t.type==="split"?" · 1 : "+esc(t.ratio)+" · new face value ₹"+esc(t.newFv):""}${t.certsSurr?" · certs "+esc(t.certsSurr):""}</span></td>
      <td>${t.from?esc(memName(t.from)):"–"}</td><td>${t.to?esc(memName(t.to)):t.type==="demat"||t.type==="remat"?"(same member)":"–"}</td><td class="n">${t.type==="split"?"–":nIN(t.qty)}</td>
      <td><span class="pill2 ${t.mode==="demat"||t.type==="demat"?"ok":""}">${md}</span></td><td class="tag">${where}</td><td class="n">${nIN(bal[t.id])}</td>
      <td><div class="rowact">${conf?`<span class="sub">Delete?</span><button class="btn small danger" data-del="sharetx" data-id="${t.id}">Delete</button><button class="btn small" data-act="canceldel">Keep</button>`:
       `<button class="btn small" data-txdocs="${t.id}" aria-expanded="${open}">📎 ${nd||"Add"}</button>${t.certNo&&t.mode!=="demat"&&(downloads||isLocal)?`<button class="btn small" data-cert="${t.id}" title="Share certificate in Form SH-1">SH-1</button>`:""}${canWrite?`<button class="btn small" data-edit="sharetx" data-id="${t.id}">Edit</button><button class="btn small" data-askdel="tx:${t.id}" aria-label="Delete">✕</button>`:""}`}</div></td></tr>
      ${open?`<tr class="sub-row"><td colspan="9"><div class="atts"><span class="sub">Documents for this entry: board resolution, certificate scan, SH-4, DRF, corporate action confirmation.</span>${docChips("shareTx",t.id,"ledger")}</div></td></tr>`:""}`;}).join("")}
   </tbody></table></div></section>`;
}
function vCerts(){
  const L=certList().filter(r=>{const d=pd(r.date);return d!=null&&fyOfT(d)<=sel;});
  const active=L.filter(r=>r.status==="Active");
  if(!L.length)return `<div class="empty">No physical share certificates recorded. Enter the certificate number on physical subscriptions, allotments and transfers in the share ledger, then upload the scan here.</div>`;
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Register of share certificates</h3><span class="sub">${active.length} active · ${L.length-active.length} surrendered or cancelled</span></div><div class="scroll"><table class="reg"><thead><tr><th>Cert. no.</th><th>Issued</th><th>Holder</th><th class="n">Shares</th><th>Distinctive nos.</th><th>Status</th><th>Scan</th><th></th></tr></thead><tbody>
   ${L.map(r=>{const t=r.t;const scans=docsFor("shareTx",t.id);return `<tr class="${r.status==="Active"?"":"ceased"}"><td class="tag">${esc(r.no)}</td><td style="white-space:nowrap">${fmtD(pd(r.date))}<span class="hint">${esc(txLabel(t))}</span></td><td>${esc(memName(r.member))}<span class="hint">${esc((members.find(m=>m.id===r.member)||{}).folio||"")}</span></td>
     <td class="n">${nIN(r.qty)}</td><td class="tag">${t.distFrom?nIN(t.distFrom)+" – "+nIN(t.distTo):"–"}</td>
     <td>${r.status==="Active"?`<span class="pill2 ok">Active</span>`:`<span class="pill2">${esc(r.status)}</span><span class="hint">${esc(r.note)}</span>`}</td>
     <td><div class="atts">${scans.map(x=>`<button class="btn small" data-view="${esc(x.id)}">View</button>`).join("")||(canWrite&&(isLocal||fileCap)?`<button class="btn small" data-shupload="certs" data-tx="${t.id}">Upload scan</button>`:`<span class="sub">–</span>`)}</div></td>
     <td>${(downloads||isLocal)?`<button class="btn small" data-cert="${t.id}">SH-1</button>`:""}</td></tr>`;}).join("")}
   </tbody></table></div><p class="sub" style="margin:10px 0 0">When a certificate is surrendered for dematerialisation, lodged for transfer or cancelled, enter its number under “Certificates surrendered” on that ledger entry and it closes here.</p></section>`;
}
function capTimeline(){
  const ev=[];let run={},fvs={};for(const c of cap().classes){run[c.id]=0;fvs[c.id]=+c.fv||0;}
  for(const t of sortedTx()){const d=pd(t.date);if(d==null)continue;const q=+t.qty||0,c=t.classId;run[c]=run[c]||0;fvs[c]=fvs[c]||0;
    if(t.type==="subscribe"||t.type==="allot")run[c]+=q;else if(t.type==="buyback"||t.type==="forfeit")run[c]-=q;else if(t.type==="split"){run[c]=Math.round(run[c]*(+t.ratio||1));fvs[c]=t.newFv!==""&&t.newFv!=null?+t.newFv:fvs[c]/(+t.ratio||1);}else continue;
    const pu=Object.keys(run).reduce((s,k)=>s+run[k]*(fvs[k]||0),0);const last=ev[ev.length-1];
    if(last&&last.d===d){last.pu=pu;last.lbl.push(txLabel(t));last.q+=["buyback","forfeit"].includes(t.type)?-q:t.type==="split"?0:q;}else ev.push({d,pu,lbl:[txLabel(t)],q:["buyback","forfeit"].includes(t.type)?-q:t.type==="split"?0:q});}
  return ev;
}
function vHistory(){
  const ev=capTimeline();
  if(!ev.length)return `<div class="empty">No history yet. Record the ledger from incorporation and the capital build-up and each member’s statement appear here.</div>`;
  const W=900,H=220,P={l:70,r:20,t:16,b:34};const t0=ev[0].d,t1=Math.max(TODAY,ev[ev.length-1].d+DAY);const maxV=Math.max(...ev.map(e=>e.pu))*1.12||1;
  const x=t=>P.l+(t-t0)/(t1-t0)*(W-P.l-P.r),y=v=>H-P.b-(v/maxV)*(H-P.t-P.b);
  let path=`M${x(t0)},${y(0)}`;let prev=0;for(const e of ev){path+=` L${x(e.d)},${y(prev)} L${x(e.d)},${y(e.pu)}`;prev=e.pu;}path+=` L${x(t1)},${y(prev)}`;
  const area=path+` L${x(t1)},${y(0)} Z`;
  const yt=[0,.25,.5,.75,1].map(f=>maxV/1.12*f);
  const y0=new Date(t0).getUTCFullYear(),y1=new Date(t1).getUTCFullYear();const xt=[];for(let yy=y0;yy<=y1;yy++){const tt=D(yy,4,1);if(tt>=t0&&tt<=t1)xt.push(tt);}
  const svg=`<svg viewBox="0 0 ${W} ${H}" class="tl" role="img" aria-label="Paid-up capital over time">
    ${yt.map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${P.l-8}" y="${y(v)+4}" text-anchor="end" class="ax">${v>=1e7?(v/1e7).toFixed(1)+" Cr":v>=1e5?(v/1e5).toFixed(1)+" L":nIN(Math.round(v))}</text>`).join("")}
    ${xt.map(tt=>`<text x="${x(tt)}" y="${H-12}" text-anchor="middle" class="ax">${"FY "+String(new Date(tt).getUTCFullYear()).slice(2)}</text>`).join("")}
    <path d="${area}" class="ar"/><path d="${path}" class="ln"/>
    ${ev.map(e=>`<circle cx="${x(e.d)}" cy="${y(e.pu)}" r="4.5" class="pt"><title>${fmtD(e.d)} · ${e.lbl.join(", ")} · paid-up ${fmtRs(e.pu)}</title></circle>`).join("")}
  </svg>`;
  const mem=histMem&&members.find(m=>m.id===histMem)||members[0];
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:6px"><h3 style="margin:0">Paid-up capital since incorporation</h3><span class="sub">${ev.length} changes · now ${fmtRs(ev[ev.length-1].pu)}</span></div><div class="scroll">${svg}</div>
    <div class="scroll" style="margin-top:8px"><table class="reg"><thead><tr><th>Date</th><th>Change</th><th class="n">Shares issued (net)</th><th class="n">Paid-up capital after</th></tr></thead><tbody>${ev.map(e=>`<tr><td>${fmtD(e.d)}</td><td>${esc([...new Set(e.lbl)].join(", "))}</td><td class="n">${e.q?nIN(e.q):"–"}</td><td class="n">${fmtRs(e.pu)}</td></tr>`).join("")}</tbody></table></div></section>
   ${members.length?folioSection(mem):""}`;
}
function folioRows(mid){
  const out=[];const bal={};let p=0,d=0;
  for(const t of sortedTx()){if(t.to!==mid&&t.from!==mid)continue;const q=+t.qty||0;let dp=0,dd=0;const md=t.mode||"phys";
    if(t.type==="subscribe"||t.type==="allot"){md==="demat"?dd+=q:dp+=q;}
    else if(t.type==="transfer"||t.type==="transmission"){const s=t.to===mid?1:-1;md==="demat"?dd+=s*q:dp+=s*q;}
    else if(t.type==="buyback"||t.type==="forfeit"){md==="demat"?dd-=q:dp-=q;}
    else if(t.type==="demat"){dp-=q;dd+=q;}else if(t.type==="remat"){dd-=q;dp+=q;}
    p+=dp;d+=dd;out.push({t,dp,dd,p,d});}
  return out;
}
function folioSection(m){
  const R=folioRows(m.id);
  return `<section class="sheet"><div class="sheet-head" style="margin-bottom:8px"><h3 style="margin:0">Folio statement</h3><div class="toolbar"><select id="histMem" aria-label="Member">${members.map(x=>`<option value="${x.id}" ${x.id===m.id?"selected":""}>${esc((x.folio?x.folio+" · ":"")+x.name)}</option>`).join("")}</select>${(downloads||isLocal)?`<button class="btn small" data-folio="${m.id}">Download PDF</button>`:""}</div></div>
   ${R.length?`<div class="scroll"><table class="reg"><thead><tr><th>Date</th><th>Transaction</th><th>Counterparty</th><th class="n">Physical ±</th><th class="n">Demat ±</th><th class="n">Physical balance</th><th class="n">Demat balance</th><th class="n">Total</th></tr></thead><tbody>
    ${R.map(r=>{const t=r.t;const cp=t.type==="transfer"||t.type==="transmission"?(t.to===m.id?"from "+memName(t.from):"to "+memName(t.to)):"–";const f=v=>v?(v>0?"+":"−")+nIN(Math.abs(v)):"–";
      return `<tr><td>${fmtD(pd(t.date))}</td><td>${esc(txLabel(t))}${t.certNo?`<span class="hint">Cert. ${esc(t.certNo)}</span>`:""}</td><td>${esc(cp)}</td><td class="n">${f(r.dp)}</td><td class="n">${f(r.dd)}</td><td class="n">${nIN(r.p)}</td><td class="n">${nIN(r.d)}</td><td class="n"><strong>${nIN(r.p+r.d)}</strong></td></tr>`;}).join("")}</tbody></table></div>`:`<p class="sub">No ledger entries for ${esc(m.name)} yet.</p>`}</section>`;
}
function nextFolio(){let n=0;for(const m of members){const k=parseInt(String(m.folio||"").replace(/\D/g,""),10);if(k>n)n=k;}return "F-"+String(n+1).padStart(4,"0");}
function nextDist(cid,skip){let mx=0;for(const t of stx)if(t.classId===cid&&t.id!==skip&&(t.type==="allot"||t.type==="subscribe")&&+t.distTo>mx)mx=+t.distTo;return mx+1;}
function nextCert(skip){let n=0;for(const t of stx){if(t.id===skip)continue;const k=parseInt(String(t.certNo||"").replace(/\D/g,""),10);if(k>n)n=k;}return String(n+1).padStart(3,"0");}

/* ---------- forms ---------- */
function memForm(){
  const m=edit.data;const accs=m.accounts||[];
  return `<section class="sheet"><h3>${edit.id?"Edit member":"Add member"}</h3><form class="af" autocomplete="off">
   ${E("folio","Folio no.",{ph:nextFolio(),hint:"Leave blank to use "+nextFolio()})}${E("name","Name of member",{wide:true})}
   ${E("type","Type",{type:"select",options:MEM_TYPE})}${E("category","Category",{type:"select",options:MEM_CAT,hint:"Used for the shareholding pattern and the Rule 9B check"})}
   ${E("pan","PAN / CIN",{})}${E("relation","Father’s / spouse’s name",{})}${E("occupation","Occupation",{})}${E("nationality","Nationality",{ph:"Indian"})}
   ${E("address","Address",{wide:true})}${E("email","Email",{})}${E("joint","Joint holders",{ph:"Names, in order"})}${E("nominee","Nominee",{})}
   ${E("since","Date of becoming a member",{type:"date",hint:"Blank uses the first entry in the ledger"})}${E("ceased","Date of ceasing to be a member",{type:"date"})}
   ${E("sbo","BEN-1 received on",{type:"date",hint:"Significant beneficial owner; adds BEN-2 (30 days)"})}
   <div class="fld wide2"><label>Demat accounts</label>
    <div class="acc-ed">${accs.map((a,i)=>`<div class="acc-row">
      <select id="acc-${i}-dep" data-acc="${i}" data-af="dep" aria-label="Depository">${DEPS.map(d=>`<option ${a.dep===d?"selected":""}>${d}</option>`).join("")}</select>
      <input type="text" id="acc-${i}-dpName" data-acc="${i}" data-af="dpName" value="${esc(a.dpName||"")}" placeholder="Depository participant (broker / bank)">
      <input type="text" id="acc-${i}-dpId" data-acc="${i}" data-af="dpId" value="${esc(a.dpId||"")}" placeholder="${a.dep==="CDSL"?"DP ID (8 digits)":"DP ID (IN + 6 digits)"}">
      <input type="text" id="acc-${i}-clientId" data-acc="${i}" data-af="clientId" value="${esc(a.clientId||"")}" placeholder="Client ID (8 digits)">
      <button class="btn small" data-accdel="${i}" aria-label="Remove account">✕</button></div>`).join("")}
     <button class="btn small" data-accadd>Add demat account</button><span class="hint">NSDL: DP ID like IN300123 plus an 8-digit client ID. CDSL: the 16-digit BO ID, split into DP ID and client ID.</span></div></div>
   ${E("remarks","Remarks",{wide:true})}
  </form><div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save member":"Add member"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}
function classForm(){
  return `<section class="sheet"><h3>${edit.id?"Edit share class":"Add share class"}</h3><form class="af" autocomplete="off">
   ${E("name","Class",{wide:true,ph:"e.g. 8% Non-cumulative redeemable preference shares"})}${E("type","Kind",{type:"select",options:[["equity","Equity"],["preference","Preference"]]})}
   ${E("fv","Face value per share (₹)",{type:"num"})}${E("auth","Authorised shares",{type:"num",hint:"As per clause V of the MOA"})}${E("isin","ISIN",{hint:"Allotted by NSDL / CDSL, e.g. INE0XXX01011"})}
  </form><div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save class":"Add class"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}
function dematForm(){
  return `<section class="sheet"><h3>Demat setup</h3><p class="sub" style="margin:0 0 12px">The company’s connection to the depositories. Record the ISIN on each share class.</p><form class="af" autocomplete="off">
   ${E("rta","Registrar & share transfer agent",{wide:true,ph:"RTA name"})}${E("rtaReg","SEBI registration no.",{ph:"INR000…"})}${E("rtaDate","RTA appointed on",{type:"date"})}
   ${E("nsdl","Tripartite agreement with NSDL",{type:"date"})}${E("cdsl","Tripartite agreement with CDSL",{type:"date"})}${E("isinDate","ISIN allotted on",{type:"date"})}
   ${E("contact","RTA contact",{wide:true,ph:"Email / phone"})}
  </form><div class="formfoot"><button class="btn primary" data-act="save">Save</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}
function txForm(){
  const t=edit.data;const T=TX[t.type]||{};const C=cap().classes;const t0=pd(t.date);
  const S=t0!=null?capState(t0,edit.id):null;
  const inMode=(mid)=>S&&S.mode[mid]&&S.mode[mid][t.classId]?S.mode[mid][t.classId]:{p:0,d:0};
  const fromMode=t.type==="demat"?"phys":t.type==="remat"?"demat":(t.mode||"phys");
  const holders=S?members.filter(m=>inMode(m.id)[fromMode==="demat"?"d":"p"]>0):members;
  const memOpts=(list,md)=>[["",""]].concat(list.map(m=>{const x=inMode(m.id);const q=md?x[md==="demat"?"d":"p"]:x.p+x.d;return [m.id,(m.folio?m.folio+" · ":"")+m.name+(S&&q?" ("+nIN(q)+(md?(md==="demat"?" demat":" physical"):"")+")":"")];}));
  const accOpts=mid=>{const m=members.find(x=>x.id===mid);const a=(m&&m.accounts)||[];return [["",a.length?"— choose —":"No demat account on this member"]].concat(a.map(x=>[x.id,acctLabel(x)+(S&&S.acct[x.id]&&S.acct[x.id][t.classId]?" · holds "+nIN(S.acct[x.id][t.classId]):"")]));};
  const resOpts=[["","—"]].concat(ress.filter(r=>r.date).sort((a,b)=>pd(b.date)-pd(a.date)).slice(0,40).map(r=>[r.id,(r.no||"")+" · "+fmtD(pd(r.date))+" · "+r.subject]));
  let bonusPrev="";
  if(T.bonus&&S){const a=+t.bonA||0,b=+t.bonB||0;const all=members.filter(m=>(S.hold[m.id]||{})[t.classId]>0);if(a>0&&b>0){const g=all.map(m=>({m,q:Math.floor((S.hold[m.id][t.classId]||0)*a/b)})).filter(x=>x.q>0);
    bonusPrev=`<div class="fld wide2"><label>Bonus shares to be allotted</label><div class="sub">${g.length?g.map(x=>esc(x.m.name)+": <b>"+nIN(x.q)+"</b>"+((x.m.accounts||[]).length?" → demat":" → physical")).join(" · ")+" · total "+nIN(g.reduce((s,x)=>s+x.q,0)):"No holders on this date"}. Fractions are dropped. Holders with a demat account are credited there; others get a certificate.</div></div>`;}}
  const phys=(t.mode||"phys")==="phys";
  const warn=demat9b()&&t0!=null&&t0>=dematFrom()&&((T.newIssue||t.type==="transfer")&&phys&&t.type!=="subscribe")?`<div class="banner warn fld wide2" style="margin:0"><span>Rule 9B applies to this company: from ${fmtD(dematFrom())}, securities must be issued in demat, and a holder must dematerialise before transferring.</span></div>`:"";
  const suggestion=T.newIssue&&phys&&+t.qty?`${nIN(nextDist(t.classId,edit.id))} – ${nIN(nextDist(t.classId,edit.id)+(+t.qty)-1)}`:"";
  return `<section class="sheet"><h3>${edit.id?"Edit transaction":"Record a share transaction"}</h3><form class="af" autocomplete="off">
   ${E("type","Transaction",{type:"select",options:Object.entries(TX).map(([k,v])=>[k,v.n]).filter(o=>!edit.id||o[0]!=="bonus")})}
   ${E("date","Date",{type:"date",hint:{allot:"Date of allotment",subscribe:"Date of incorporation",transfer:"Date the transfer was registered",transmission:"Date the transmission was registered",buyback:"Date of completion",forfeit:"Date of forfeiture",split:"Effective date",bonus:"Date of allotment",demat:"Date the shares were credited to the demat account",remat:"Date the certificate was issued"}[t.type]||""})}
   ${E("classId","Class",{type:"select",options:C.map(c=>[c.id,c.name+" · ₹"+c.fv])})}
   ${T.mode?E("mode","Form of holding",{type:"select",options:[["phys","Physical (share certificate)"],["demat","Electronic (demat account)"]]}):""}
   ${warn}
   ${t.type==="allot"?E("allotType","Allotment type",{type:"select",options:ALLOT_T.map(x=>[x,x])}):""}
   ${T.from?E("from",t.type==="transmission"?"From (deceased / previous holder)":"From member",{type:"select",options:memOpts(holders,fromMode)}):""}
   ${T.self?E("from","Member",{type:"select",options:memOpts(holders,fromMode)}):""}
   ${T.from&&!phys?E("fromAcct","From demat account",{type:"select",options:accOpts(t.from)}):""}
   ${t.type==="remat"?E("fromAcct","From demat account",{type:"select",options:accOpts(t.from)}):""}
   ${T.to?E("to",t.type==="subscribe"?"Subscriber":"To member",{type:"select",options:memOpts(members),hint:members.length?"":"Add the member first"}):""}
   ${(T.to&&!phys)?E("acct","To demat account",{type:"select",options:accOpts(t.to)}):""}
   ${t.type==="demat"?E("acct","Credit to demat account",{type:"select",options:accOpts(t.from)}):""}
   ${!T.split&&!T.bonus?E("qty","Number of shares",{type:"num"}):""}
   ${T.prem?E("premium","Premium per share (₹)",{type:"num",ph:"0"}):""}${T.consid?E("consid",t.type==="buyback"?"Buy-back price per share (₹)":"Consideration per share (₹)",{type:"num"}):""}
   ${T.bonus?E("bonA","Bonus shares",{type:"num",ph:"1",hint:"Ratio: new shares"})+E("bonB","for every … held",{type:"num",ph:"1"})+bonusPrev:""}
   ${T.split?E("ratio","New shares for each existing share",{type:"num",ph:"10",hint:"10 for a split of ₹10 into ₹1; 0.1 to consolidate ten into one"})+E("newFv","New face value (₹)",{type:"num"}):""}
   ${(T.newIssue||t.type==="transfer"||t.type==="transmission"||t.type==="remat")&&phys?E("distFrom","Distinctive nos. from",{type:"num",ph:suggestion?suggestion.split(" – ")[0]:""})+E("distTo","Distinctive nos. to",{type:"num",ph:suggestion?suggestion.split(" – ")[1]:"",hint:suggestion?"Next free range: "+suggestion:""})+E("certNo",t.type==="transfer"||t.type==="transmission"?"Certificate no. issued / endorsed":"Share certificate no.",{ph:nextCert(edit.id)}):""}
   ${T.bonus?E("certNo","First certificate no. (physical holders)",{ph:nextCert(edit.id)}):""}
   ${T.lodge&&(t.type==="demat"||phys)?E("certsSurr",t.type==="demat"?"Certificates surrendered":"Certificates lodged / cancelled",{ph:"e.g. 001, 004",hint:"Closes them in the certificate register"}):""}
   ${t.type==="demat"?E("drn","Demat request no. (DRN)",{})+E("drf","DRF submitted on",{type:"date"}):""}
   ${(!phys&&(T.newIssue||t.type==="transfer"||t.type==="transmission"||t.type==="buyback"))||t.type==="remat"?E("caRef",T.newIssue?"Corporate action reference":t.type==="transfer"?"DIS / instruction no.":"Reference",{}):""}
   ${t.type==="transfer"&&phys?E("sh4","SH-4 executed on",{type:"date"})+E("stamp","Stamp duty paid (₹)",{type:"num"}):""}
   ${E("resId","Approving resolution",{type:"select",wide:true,options:resOpts})}
   ${E("remarks","Remarks",{wide:true})}
  </form><div class="formfoot"><button class="btn primary" data-act="save">${edit.id?"Save":"Record"}</button><button class="btn" data-act="cancel">Cancel</button><span class="sub" id="err"></span></div></section>`;
}
async function saveShare(){
  const {col,id,data}=edit;const err=$("#err");const d=clone(data);
  if(col==="dematset"){const c=cap();c.demat=Object.assign({},c.demat,d);capital=c;edit=null;saveCap();render();toast("Demat setup saved");return;}
  if(col==="shclass"){if(!d.name.trim())return err.textContent="Enter the class name.";if(!(+d.fv>0))return err.textContent="Enter the face value.";
    const c=cap();const rec={id:id||rid("c"),name:d.name.trim(),type:d.type,fv:+d.fv,auth:d.auth===""?"":+d.auth,isin:(d.isin||"").trim().toUpperCase()};
    const i=c.classes.findIndex(x=>x.id===rec.id);if(i>=0)c.classes[i]=rec;else c.classes.push(rec);capital=c;edit=null;saveCap();render();toast("Saved "+rec.name);return;}
  if(col==="members"){if(!d.name.trim())return err.textContent="Enter the member’s name.";if(!d.folio)d.folio=nextFolio();
    if(members.some(m=>m.folio===d.folio&&m.id!==id))return err.textContent="Folio "+d.folio+" is already used.";
    d.accounts=(d.accounts||[]).filter(a=>a.dpId||a.clientId).map(a=>Object.assign({},a,{id:a.id||rid("a"),dpId:(a.dpId||"").trim().toUpperCase(),clientId:(a.clientId||"").trim()}));
    for(const a of d.accounts){if(a.dep==="NSDL"&&a.dpId&&!/^IN\d{6}$/.test(a.dpId))return err.textContent="An NSDL DP ID looks like IN300123.";if(a.clientId&&!/^\d{8}$/.test(a.clientId))return err.textContent="A client ID has 8 digits.";if(a.dep==="CDSL"&&a.dpId&&!/^\d{8}$/.test(a.dpId))return err.textContent="A CDSL DP ID is the first 8 digits of the BO ID.";}
    delete d.id;edit=null;await put("members",id||rid("m"),d);toast("Saved "+d.name);return;}
  const T=TX[d.type];const t=pd(d.date);if(t==null)return err.textContent="Enter the date.";
  const S=capState(t,id);const q=+d.qty||0;
  if(d.type==="bonus"){const a=+d.bonA||0,b=+d.bonB||0;if(!(a>0&&b>0))return err.textContent="Enter the bonus ratio.";
    const holders=members.filter(m=>(S.hold[m.id]||{})[d.classId]>0);const batch=rid("b");let dist=nextDist(d.classId),cert=parseInt(String(d.certNo||nextCert()).replace(/\D/g,""),10)||0;let seq=Date.now();
    const gen=holders.map(m=>({m,q:Math.floor(S.hold[m.id][d.classId]*a/b)})).filter(x=>x.q>0);if(!gen.length)return err.textContent="No holders on this date.";
    edit=null;for(const g of gen){const acc=(g.m.accounts||[])[0];const rec={type:"allot",allotType:"Bonus",date:d.date,classId:d.classId,to:g.m.id,qty:g.q,premium:0,resId:d.resId||"",remarks:"Bonus "+a+":"+b,batch,seq:seq++};
      if(acc){rec.mode="demat";rec.acct=acc.id;}else{rec.mode="phys";rec.distFrom=dist;rec.distTo=dist+g.q-1;dist+=g.q;if(cert){rec.certNo=String(cert).padStart(3,"0");cert++;}}
      await put("sharetx",rid("t"),rec);}
    toast("Allotted bonus shares to "+gen.length+" member"+(gen.length===1?"":"s"));return;}
  if(!T.split&&!(q>0))return err.textContent="Enter the number of shares.";
  if(T.to&&!d.to)return err.textContent="Choose the member receiving the shares.";
  if((T.from||T.self)&&!d.from)return err.textContent="Choose the member.";
  if(T.from&&T.to&&d.from===d.to)return err.textContent="From and to are the same member.";
  const md=d.type==="demat"?"phys":d.type==="remat"?"demat":(d.mode||"phys");
  if(T.from||T.self){const x=(S.mode[d.from]||{})[d.classId]||{p:0,d:0};const have=md==="demat"?x.d:x.p;
    if(q>have)return err.textContent=memName(d.from)+" holds "+nIN(have)+(md==="demat"?" demat":" physical")+" shares of this class on that date.";
    if(md==="demat"&&d.fromAcct){const inAcc=(S.acct[d.fromAcct]||{})[d.classId]||0;if(q>inAcc)return err.textContent="That demat account holds "+nIN(inAcc)+" shares of this class on that date.";}}
  if(((T.to||d.type==="demat")&&(d.mode==="demat"||d.type==="demat"))&&!d.acct)return err.textContent="Choose the demat account to credit. Add one on the member if needed.";
  if(d.type==="remat"&&!d.fromAcct)return err.textContent="Choose the demat account to debit.";
  if(T.split&&!(+d.ratio>0))return err.textContent="Enter the ratio.";
  if(T.newIssue){const au=S.auth[d.classId]||0;if(au&&(S.issued[d.classId]||0)+q>au)return err.textContent="This takes issued shares to "+nIN((S.issued[d.classId]||0)+q)+", over the authorised "+nIN(au)+". Increase the authorised capital first.";
    if(md==="phys"&&!d.distFrom&&!d.distTo){d.distFrom=nextDist(d.classId,id);d.distTo=d.distFrom+q-1;}}
  if(d.distFrom&&!d.distTo)d.distTo=+d.distFrom+q-1;
  if(d.distFrom&&d.distTo&&+d.distTo-+d.distFrom+1!==q&&!T.split)return err.textContent="The distinctive range covers "+nIN(+d.distTo-+d.distFrom+1)+" shares, not "+nIN(q)+".";
  if(md==="demat"&&!["demat","remat"].includes(d.type)){delete d.certNo;delete d.distFrom;delete d.distTo;}
  for(const k of ["bonA","bonB"])delete d[k];if(!T.split){delete d.ratio;delete d.newFv;}if(T.self||T.split)delete d.to;if(T.self||T.split)delete d.mode;
  d.seq=d.seq||Date.now();delete d.id;edit=null;await put("sharetx",id||rid("t"),d);toast("Recorded "+txLabel(d).toLowerCase());
}
/* ---------- calendar items from the share records ---------- */
function shareItems(Y,add){
  const grp={};
  for(const t of stx){const d=pd(t.date);if(d==null)continue;
    if(t.type==="allot"){const k=t.date+":"+t.classId+":"+(t.batch||t.allotType||"");(grp[k]=grp[k]||{t,q:0,n:0}).q+=+t.qty||0;grp[k].n++;}
    else if((t.type==="transfer"||t.type==="transmission")&&(t.mode||"phys")==="phys")add({key:`shc:${t.id}`,cat:"event",form:"Certificate",title:"Deliver share certificate · "+TX[t.type].n+" of "+nIN(t.qty)+" shares to "+memName(t.to),period:fmtD(d),due:d+30*DAY,basis:"Within one month of lodgement",law:"Sec 56(4)"});
    else if(t.type==="buyback")add({key:`sh11:${t.id}`,form:"SH-11",title:"Return in respect of buy-back · "+nIN(t.qty)+" shares",period:fmtD(d),due:d+30*DAY,basis:"30 days from completion",law:"Sec 68(10)"});
    else if(t.type==="split")add({key:`sh7s:${t.id}`,form:"SH-7",title:"Notice of sub-division / consolidation of "+clsOf(t.classId).name,period:fmtD(d),due:d+30*DAY,basis:"30 days from the change",law:"Sec 64"});}
  for(const k in grp){const g=grp[k],d=pd(g.t.date);add({key:`pas3:${k}`,form:"PAS-3",title:"Return of allotment · "+nIN(g.q)+" "+clsOf(g.t.classId).name.toLowerCase()+" ("+(g.t.allotType||"allotment").toLowerCase()+(g.n>1?", "+g.n+" allottees":"")+")",period:fmtD(d),due:d+15*DAY,basis:"15 days from allotment",law:"Sec 39(4)"});}
  for(const m of members)if(m.sbo){const d=pd(m.sbo);if(d!=null)add({key:`ben2:${m.id}:${m.sbo}`,cat:"event",form:"BEN-2",title:"Return of significant beneficial owner · "+m.name,period:fmtD(d),due:d+30*DAY,basis:"30 days from receiving BEN-1",law:"Sec 90"});}
  if(demat9b()&&cap().classes.some(c=>c.isin)){
    add({key:`pas6:${Y-1}H2`,form:"PAS-6",title:"Reconciliation of share capital audit report (half-yearly)",period:"Oct "+(Y-1)+" – Mar "+Y,due:D(Y,5,30),basis:"60 days from the half-year end",law:"Rule 9B"});
    add({key:`pas6:${Y}H1`,form:"PAS-6",title:"Reconciliation of share capital audit report (half-yearly)",period:"Apr – Sep "+Y,due:D(Y,11,29),basis:"60 days from the half-year end",law:"Rule 9B"});}
}
/* ---------- downloads ---------- */
function mMem(){const at=Math.min(TODAY,fyE(sel));const S=capState(at);
  return {key:"mem",title:"Register of members",sub:"Form MGT-1 · holdings as on "+fmtD(at),flat:["Folio","Name","Address","PAN","Category","Member since","Physical","Demat","Demat accounts","Ceased"],widths:[14,28,"auto",18,22,16,15,15,34,14],align:["l","l","l","l","l","l","r","r","l","l"],
    rows:members.slice().sort((a,b)=>String(a.folio).localeCompare(String(b.folio),undefined,{numeric:true})).map(m=>{const md=S.mode[m.id]||{};const p=Object.values(md).reduce((s,v)=>s+v.p,0),d=Object.values(md).reduce((s,v)=>s+v.d,0);
      return {kind:"item",label:m.folio||"–",vals:[m.name+(m.joint?" (jointly with "+m.joint+")":""),m.address||"",m.pan||"",catName(m.category),(m.since||firstTx(m.id))?fmtD(pd(m.since||firstTx(m.id))):"–",p||null,d||null,(m.accounts||[]).map(acctLabel).join("; ")||"–",m.ceased?fmtD(pd(m.ceased)):"–"]};}),empty:"No members recorded."};}
function mPat(){const at=Math.min(TODAY,fyE(sel));const {rows,tot}=holdingRows(at);const out=[];
  for(const [k,l] of MEM_CAT){const rs=rows.filter(r=>(r.m.category||"other")===k);if(!rs.length)continue;out.push({kind:"h",label:l});
    rs.forEach(r=>out.push({kind:"item",label:r.m.name,vals:[r.m.folio||"",r.sh,r.p||null,r.d||null,r.pct.toFixed(2)+"%"]}));
    const sh=rs.reduce((s,r)=>s+r.sh,0),v=rs.reduce((s,r)=>s+r.val,0);out.push({kind:"subt",label:"Sub-total",vals:["",sh,rs.reduce((s,r)=>s+r.p,0)||null,rs.reduce((s,r)=>s+r.d,0)||null,(tot?v/tot*100:0).toFixed(2)+"%"]});}
  if(rows.length)out.push({kind:"tot",label:"Total",vals:["",rows.reduce((s,r)=>s+r.sh,0),rows.reduce((s,r)=>s+r.p,0)||null,rows.reduce((s,r)=>s+r.d,0)||null,"100.00%"]});
  return {key:"pat",title:"Shareholding pattern",sub:"As on "+fmtD(at)+" · paid-up capital "+fmtRs(tot).replace("₹","Rs. "),flat:["Member","Folio","Shares","Physical","Demat","Holding"],align:["l","l","r","r","r","r"],widths:["auto",18,24,24,24,18],rows:out,empty:"No shareholding on this date."};}
function mLed(){const list=sortedTx().filter(t=>{const d=pd(t.date);return d!=null&&fyOfT(d)<=sel;});
  return {key:"led",title:"Share ledger",sub:"From incorporation to "+endOf(sel),flat:["Date","Transaction","Class","From","To","Shares","Form","Certificate / account","Ref."],widths:[17,28,20,24,24,16,18,"auto",18],align:["l","l","l","l","l","r","l","l","l"],
    rows:list.map(t=>({kind:"item",label:fmtD(pd(t.date)),vals:[txLabel(t)+(t.type==="split"?" 1:"+t.ratio:""),clsOf(t.classId).name,t.from?memName(t.from):"–",t.to?memName(t.to):"–",t.type==="split"?"":+t.qty,t.type==="demat"?"Phys → demat":t.type==="remat"?"Demat → phys":t.type==="split"?"–":(t.mode==="demat"?"Demat":"Physical"),
      t.mode==="demat"||t.type==="demat"?acctLabel((acctOf(t.acct)||{}).a):(t.certNo?"Cert. "+t.certNo+(t.distFrom?" · "+nIN(t.distFrom)+"–"+nIN(t.distTo):""):"–"),t.drn||t.caRef||""]})),empty:"No share transactions recorded."};}
function mCert(){const L=certList().filter(r=>{const d=pd(r.date);return d!=null&&fyOfT(d)<=sel;});
  return {key:"cert",title:"Register of share certificates",sub:"All physical certificates to "+endOf(sel),flat:["Cert. no.","Issued","Holder","Folio","Shares","Distinctive nos.","Status"],widths:[16,17,"auto",15,16,28,44],align:["l","l","l","l","r","l","l"],
    rows:L.map(r=>({kind:"item",label:r.no,vals:[fmtD(pd(r.date)),memName(r.member),(members.find(m=>m.id===r.member)||{}).folio||"",r.qty,r.t.distFrom?nIN(r.t.distFrom)+" – "+nIN(r.t.distTo):"–",r.status+(r.note?" · "+r.note:"")]})),empty:"No physical certificates recorded."};}
function mRecon(){const at=Math.min(TODAY,fyE(sel));const R=recon(at);const dm=cap().demat||{};
  return {key:"recon",title:"Reconciliation of share capital",sub:"Physical and electronic holdings as on "+fmtD(at)+(dm.rta?" · RTA "+dm.rta:""),flat:["Class","ISIN","Issued","Physical","NSDL","CDSL","In demat","Difference"],align:["l","l","r","r","r","r","r","r"],widths:["auto",30,20,20,20,20,18,18],
    rows:R.rows.map(r=>({kind:"item",label:r.c.name,vals:[r.c.isin||"–",r.issued,r.p||null,r.NSDL||null,r.CDSL||null,r.pct.toFixed(2)+"%",r.diff?r.diff:"Nil"]}))};}
async function certPDF(t,docIn){
  const doc=docIn||await newDoc();if(docIn)doc.addPage();const C=co();const c=clsOf(t.classId);const m=members.find(x=>x.id===t.to)||members.find(x=>x.id===t.from)||{};const S=capState(pd(t.date));const fv=S.fv[t.classId]||c.fv||0;
  doc.setDrawColor(...PC.green);doc.setLineWidth(1.1);doc.rect(9,9,PW-18,PH-18);doc.setLineWidth(0.25);doc.rect(12,12,PW-24,PH-24);
  let y=26;doc.setFont("times","normal");doc.setFontSize(8.5);doc.setTextColor(...PC.muted);doc.text("FORM NO. SH-1",PW/2,y,{align:"center",charSpace:0.6});
  y+=4.5;doc.setFontSize(7.8);doc.text("[Pursuant to sub-section (3) of Section 46 of the Companies Act, 2013 and Rule 5(2) of the Companies (Share Capital and Debentures) Rules, 2014]",PW/2,y,{align:"center"});
  y+=12;doc.setFont("times","bold");doc.setFontSize(22);doc.setTextColor(...PC.green);doc.text("SHARE CERTIFICATE",PW/2,y,{align:"center",charSpace:1.2});
  y+=12;doc.setFontSize(15);doc.setTextColor(...PC.ink);doc.text(pt(C.name),PW/2,y,{align:"center"});
  y+=5.5;doc.setFont("times","normal");doc.setFontSize(8.5);doc.setTextColor(...PC.muted);doc.text("CIN "+C.cin,PW/2,y,{align:"center"});y+=4.3;doc.text(pt("Registered office: "+C.ro),PW/2,y,{align:"center"});
  y+=12;doc.setTextColor(...PC.ink);doc.setFontSize(10.5);doc.text("Certificate No.: "+pt(t.certNo||"—"),PM+6,y);doc.text("Folio No.: "+pt(m.folio||"—"),PW-PM-6,y,{align:"right"});
  y+=10;y=para(doc,"THIS IS TO CERTIFY that the person(s) named in this Certificate is/are the Registered Holder(s) of the within mentioned share(s) bearing the distinctive number(s) herein specified in the above named Company, subject to the Memorandum and Articles of Association of the Company, and that the amount endorsed herein has been paid up on each such share.",y,{sz:10.5,lh:5.4,ind:6});
  y+=4;doc.autoTable({startY:y,theme:"grid",margin:{left:PM+6,right:PM+6},head:[["Class of shares","Face value","No. of shares","Distinctive nos. from","Distinctive nos. to","Amount paid up per share"]],
    body:[[pt(c.name),"Rs. "+fv,nIN(t.qty),t.distFrom?nIN(t.distFrom):"—",t.distTo?nIN(t.distTo):"—","Rs. "+fv]],styles:{font:"times",fontSize:9.5,halign:"center",textColor:PC.ink,lineColor:PC.rule,lineWidth:0.2},headStyles:{fillColor:PC.band,fontStyle:"bold",textColor:PC.ink}});
  y=doc.lastAutoTable.finalY+10;doc.setFont("times","normal");doc.setFontSize(10.5);doc.text("Name(s) of holder(s):",PM+6,y);doc.setFont("times","bold");doc.text(pt(m.name||"—"),PM+48,y);
  if(m.joint){y+=6;doc.setFont("times","normal");doc.text("Joint holder(s):",PM+6,y);doc.text(pt(m.joint),PM+48,y);}
  y+=6;doc.setFont("times","normal");doc.text("In words:",PM+6,y);doc.text(pt(words(+t.qty)+" "+c.name.toLowerCase()+" only"),PM+48,y);
  y+=14;y=para(doc,"Given under the common seal of the Company (where adopted) / signed by the authorised signatories of the Company on "+fmtDL(pd(t.date))+".",y,{sz:10,i:true,ind:6});
  y+=22;const w=(PW-2*PM-12)/3;["Director","Director","Director / Company Secretary"].forEach((l,i)=>{const x=PM+6+i*w;doc.setDrawColor(...PC.ink);doc.line(x,y,x+w-8,y);doc.setFont("times","normal");doc.setFontSize(9.5);doc.text(l,x,y+5);});
  y+=18;doc.setFontSize(8.5);doc.setTextColor(...PC.muted);doc.text("Note: No transfer of the share(s) comprised in this certificate can be registered unless accompanied by this certificate.",PW/2,y,{align:"center"});
  y+=10;doc.setFont("times","bold");doc.setFontSize(9.5);doc.setTextColor(...PC.ink);doc.text("Memorandum of transfers",PM+6,y);
  doc.autoTable({startY:y+2,theme:"grid",margin:{left:PM+6,right:PM+6},head:[["Date of transfer","Transfer no.","Transferee","Folio","Authorised signatory"]],body:[["","","","",""],["","","","",""],["","","","",""]],
    styles:{font:"times",fontSize:8.5,minCellHeight:8,lineColor:PC.rule,lineWidth:0.2,textColor:PC.ink},headStyles:{fillColor:PC.band,fontStyle:"bold",textColor:PC.ink}});
  return doc;
}
async function folioPDF(mid){
  const m=members.find(x=>x.id===mid);if(!m)return;const doc=await newDoc();const R=folioRows(mid);
  let y=pdfTitle(doc,{title:"Folio statement · "+(m.folio||""),sub:m.name+" · as on "+fmtD(TODAY)});
  doc.setFont("times","normal");doc.setFontSize(9);doc.setTextColor(...PC.ink);
  const info=[["Category",catName(m.category)],["PAN",m.pan||"–"],["Address",m.address||"–"],["Demat accounts",(m.accounts||[]).map(acctLabel).join("; ")||"None"]];
  for(const [k,v] of info){doc.setTextColor(...PC.muted);doc.text(k,PM,y);doc.setTextColor(...PC.ink);doc.text(doc.splitTextToSize(pt(v),PW-2*PM-34),PM+34,y);y+=5;}
  const f=v=>v?(v>0?"+":"-")+nIN(Math.abs(v)):"";
  y=pdfGrid(doc,{key:"folio",flat:["Date","Transaction","Counterparty","Physical +/-","Demat +/-","Physical","Demat","Total"],align:["l","l","l","r","r","r","r","r"],widths:[18,32,"auto",18,18,18,18,18],
    rows:R.map(r=>{const t=r.t;return {kind:"item",label:fmtD(pd(t.date)),vals:[txLabel(t)+(t.certNo?" · cert "+t.certNo:""),t.type==="transfer"||t.type==="transmission"?(t.to===mid?"from "+memName(t.from):"to "+memName(t.to)):"",f(r.dp),f(r.dd),nIN(r.p),nIN(r.d),nIN(r.p+r.d)]};}),empty:"No entries."},y+2);
  pdfChrome(doc,[{from:1,to:doc.getNumberOfPages(),title:"Folio statement"}],false);
  await saveBlob(safe("Folio statement "+(m.folio||"")+" "+m.name)+".pdf",doc.output("blob"));
}
function words(n){n=Math.floor(n);if(!n)return "Zero";const o=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],t=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const two=x=>x<20?o[x]:t[Math.floor(x/10)]+(x%10?" "+o[x%10]:"");const three=x=>(x>=100?o[Math.floor(x/100)]+" Hundred"+(x%100?" ":""):"")+(x%100?two(x%100):"");
  const parts=[];const cr=Math.floor(n/1e7);n%=1e7;const la=Math.floor(n/1e5);n%=1e5;const th=Math.floor(n/1e3);n%=1e3;
  if(cr)parts.push(words(cr)+" Crore");if(la)parts.push(two(la)+" Lakh");if(th)parts.push(two(th)+" Thousand");if(n)parts.push(three(n));return parts.join(" ");}
async function oneCert(id){const t=stx.find(x=>x.id===id);if(!t||exp.busy)return;exp.busy="cert";try{const d=await certPDF(t);await saveBlob(safe("Share certificate "+t.certNo+" "+memName(t.to||t.from))+".pdf",d.output("blob"));}catch(e){toast(e.message||"Couldn’t build the certificate.");}exp.busy=false;}
/* ---------- document viewer ---------- */
let viewUrl=null;
async function viewDoc(id){
  const x=docs.find(d=>d.id===id);if(!x)return;const v=$("#viewer");
  let url;try{if(isLocal){const b=await fileBlob(x);if(!b){toast("The file couldn’t be found on the server.");return;}if(viewUrl)URL.revokeObjectURL(viewUrl);viewUrl=url=URL.createObjectURL(b);}else url="/_blob/"+x.blob;}catch(_){toast("Couldn’t open the file.");return;}
  const mime=x.mime||"";let body;
  if(mime.startsWith("image/"))body=`<img src="${url}" alt="${esc(x.title||x.fileName)}">`;
  else if(mime==="application/pdf")body=`<iframe src="${url}" title="${esc(x.title||x.fileName)}"></iframe>`;
  else if(mime.startsWith("text/")||mime==="application/json"){body=`<pre id="vtext">Loading…</pre>`;}
  else body=`<div class="empty">No preview for this file type. Use Download.</div>`;
  const tx=x.shareTx?stx.find(t=>t.id===x.shareTx):null;
  v.innerHTML=`<div class="v-head"><div style="min-width:0"><div class="eyebrow">${esc(docCatName(x.cat))}</div><h2>${esc(x.title||x.fileName)}</h2><div class="sub">${esc(x.fileName)} · ${fmtSize(+x.size||0)}${x.ref?" · "+esc(x.ref):""}${tx?" · "+esc(txLabel(tx))+" of "+fmtD(pd(tx.date)):""}${x.shareMem?" · "+esc(memName(x.shareMem)):""}</div></div>
    <div class="toolbar"><a class="btn small" href="${url}" target="_blank" rel="noopener">Open in new tab</a>${(downloads||isLocal)?`<button class="btn small" data-vdl="${esc(x.id)}">Download</button>`:""}<button class="x" data-vx aria-label="Close">✕</button></div></div><div class="v-body">${body}</div>
    ${mime==="application/pdf"?`<p class="sub v-foot">If the preview stays blank, use Open in new tab.</p>`:""}`;
  v.hidden=false;$("#scrim").hidden=false;document.body.style.overflow="hidden";
  if(body.includes("vtext")){try{const r=isLocal?await (await fileBlob(x)).text():await (await fetch(url)).text();$("#vtext").textContent=r.slice(0,200000);}catch(_){$("#vtext").textContent="Couldn’t read the file.";}}
  setTimeout(()=>{const b=v.querySelector("[data-vx]");if(b)b.focus();},30);
}
function closeViewer(){const v=$("#viewer");if(v.hidden)return;v.hidden=true;v.innerHTML="";if(!exp.open){$("#scrim").hidden=true;document.body.style.overflow="";}if(viewUrl){setTimeout(()=>{URL.revokeObjectURL(viewUrl);viewUrl=null;},500);}}

/* ---------- editing ---------- */
const BLANK={
  meetings:()=>({type:"board",date:"",time:"",no:"",mode:"In person",venue:"",notice:"",shorter:false,present:[],leave:[],members:"",chair:"",fsFor:"",forFy:String(sel-1),agenda:"",minDraft:"",minSigned:"",remarks:"",committee:""}),
  resolutions:()=>({tpl:"",body:"board",kind:"ordinary",date:"",meetingId:"",no:"",subject:"",text:"",mgt14:false,remarks:""}),
  directors:()=>({kind:"director",name:"",din:"",designation:"",category:"Executive",appointed:"",ceased:"",kycNext:"",email:"",shares:"",interests:"",mbp1:{},dir8:{},mkEvent:true}),
  extensions:()=>({fy:String(sel),form:"",scope:"items",keys:[],from:"",to:"",newDate:"",addDays:"",circ:"",circDate:"",noFee:true,notes:""}),
  events:()=>({type:"charge",date:"",details:"",holder:"",chargeId:"",amount:"",form:"",days:"",remarks:""}),
  custom:()=>({name:"",form:"",law:"",freq:"annual",month:"4",day:"30",date:""}),
  members:()=>({folio:"",name:"",type:"individual",category:"promoter",pan:"",relation:"",occupation:"",nationality:"Indian",address:"",email:"",joint:"",nominee:"",accounts:[],since:"",ceased:"",sbo:"",remarks:""}),
  dematset:()=>Object.assign({rta:"",rtaReg:"",rtaDate:"",nsdl:"",cdsl:"",isinDate:"",contact:""},cap().demat||{}),
  sharetx:()=>({type:"allot",allotType:"Rights issue",mode:demat9b()?"demat":"phys",acct:"",fromAcct:"",caRef:"",drn:"",drf:"",certsSurr:"",date:"",classId:(cap().classes[0]||{}).id||"eq",from:"",to:"",qty:"",premium:"",consid:"",distFrom:"",distTo:"",certNo:"",bonA:"",bonB:"",ratio:"",newFv:"",sh4:"",stamp:"",resId:"",remarks:""}),
  shclass:()=>({name:"",type:"equity",fv:"10",auth:"",isin:""})
};
function startEdit(col,id){
  const src={extensions:exts,meetings:meets,resolutions:ress,directors:dirs,events:evs,members,sharetx:stx,shclass:cap().classes}[col];
  const data=id&&src?Object.assign(BLANK[col](),clone(src.find(x=>x.id===id))):BLANK[col]();
  if(col==="directors"&&id)data._wasCeased=!!data.ceased;
  edit={col,id:id||null,data};delConfirm=null;render();
  setTimeout(()=>{const f=$("#main .sheet form");if(f)f.closest(".sheet").scrollIntoView({block:"start",behavior:"smooth"});},20);
}
async function saveEdit(){
  const {col,id,data}=edit;const err=$("#err");const d=clone(data);
  if(["members","sharetx","shclass","dematset"].includes(col))return saveShare();
  if(col==="custom"){if(!d.name.trim())return err.textContent="Enter the item name.";if(d.freq==="once"&&!pd(d.date))return err.textContent="Enter the due date.";
    cfg.custom=(cfg.custom||[]).concat([{id:rid("u"),name:d.name.trim(),form:d.form.trim(),law:d.law.trim(),freq:d.freq,month:+d.month||1,day:Math.min(31,Math.max(1,+d.day||1)),date:d.date}]);edit=null;saveCfg();toast("Added to the calendar");render();return;}
  if(!pd(d.date)&&col!=="directors"&&col!=="extensions")return err.textContent="Enter the date.";
  if(col==="meetings"){if(!d.no)d.no=meetNoSuggest(d.type,d.date,d.forFy);}
  if(col==="resolutions"){if(!d.subject.trim())return err.textContent="Enter the subject.";if(!d.no)d.no=resNoSuggest(d);if(d.body==="circ")d.meetingId="";delete d.tpl;}
  if(col==="directors"){if(!d.name.trim())return err.textContent="Enter the name.";if(d.kind!=="kmp"&&d.din&&!/^\d{8}$/.test(d.din.trim()))return err.textContent="A DIN has 8 digits.";
    const newId=id||rid("p");
    if(!id&&d.mkEvent!==false&&pd(d.appointed))await put("events",rid("e"),{type:"dirapp",date:d.appointed,details:d.name+(d.designation?", "+d.designation:""),amount:"",remarks:"Added with the director"});
    if(id&&!d._wasCeased&&d.ceased&&d.mkCease!==false)await put("events",rid("e"),{type:"dircease",date:d.ceased,details:d.name,amount:"",remarks:"Added with the cessation"});
    delete d.mkEvent;delete d.mkCease;delete d._wasCeased;delete d.id;edit=null;await put("directors",newId,d);toast("Saved "+d.name);return;}
  if(col==="extensions"){if(!d.form)return err.textContent="Choose the form.";if(d.scope==="items"&&!(d.keys||[]).length)return err.textContent="Tick at least one item.";
    if(pd(d.newDate)==null&&!(+d.addDays>0))return err.textContent="Enter the extended date or the number of extra days.";
    if(pd(d.newDate)!=null){const its=itemsFor(+d.fy).filter(i=>extMatches(d,i));if(its.length&&its.every(i=>pd(d.newDate)<=i.due))return err.textContent="The extended date is not after the original due date.";}
    delete d.id;edit=null;showExt=true;await put("extensions",id||rid("x"),d);toast("Extension recorded for "+fyLabel(+d.fy));return;}
  if(col==="events"&&d.type==="other"&&!d.form)return err.textContent="Enter the form for this event.";
  delete d.id;const newId=id||rid(col[0]);edit=null;await put(col,newId,d);toast("Saved");
}

/* ================= downloads ================= */
const LIBSRC={jspdf:["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"],autotable:["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js","https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"],xlsx:["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js","https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"],jszip:["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"]};
const libDone={};
function loadOne(u){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=u;s.onload=res;s.onerror=()=>{s.remove();rej(new Error("load"));};document.head.appendChild(s);});}
async function needLib(n){if(libDone[n])return;for(const u of LIBSRC[n]){try{await loadOne(u);libDone[n]=true;return;}catch(_){}}throw new Error("Couldn’t load the "+(n==="xlsx"?"Excel":n==="jszip"?"ZIP":"PDF")+" builder. Check your internet connection and try again.");}
/* section models */
function mCal(){const {cur,carried}=calendar(sel);const rows=[];
  const r=it=>({kind:"item",label:fmtD(it.st.due),vals:[it.form,it.title+(it.carried?" (carried over)":"")+(it.st.X&&it.st.X.circ?" · extended from "+fmtD(it.st.X.orig)+" by "+(it.st.X.circ.e.circ||"circular"):it.st.X&&it.st.X.own?" · extended from "+fmtD(it.st.X.orig)+" (company-specific)":""),it.period,(["done","late"].includes(it.st.s)&&!/^Filed/.test(it.st.label)?pillTxt[it.st.s]+" · ":"")+it.st.label,(fils[it.key]||{}).srn||"",(+(fils[it.key]||{}).fee||0)+(+(fils[it.key]||{}).addl||0)||null],s:it.st.s});
  if(carried.length){rows.push({kind:"h",label:"Carried over from "+fyLabel(sel-1)});carried.forEach(i=>rows.push(r(i)));}
  let last=null;for(const it of cur){const d=new Date(it.st.due);const mk=MONL[d.getUTCMonth()]+" "+d.getUTCFullYear();if(mk!==last){rows.push({kind:"h",label:mk});last=mk;}rows.push(r(it));}
  return {key:"cal",title:"Compliance status report",sub:"Items falling due 1 April "+sel+" – 31 March "+(sel+1)+" · as on "+fmtD(TODAY),flat:["Due","Form","Compliance","Period","Status","SRN","Fees (Rs.)"],align:["l","l","l","l","l","l","r"],widths:[17,19,"auto",22,40,19,15],rows,empty:"Nothing falls due in this year."};}
function mMeet(){const list=meets.filter(m=>m.date&&fyOfT(pd(m.date))===sel).sort((a,b)=>pd(a.date)-pd(b.date));
  return {key:"meet",title:"Register of meetings",sub:fyLabel(sel),flat:["No.","Meeting","Date","Mode","Notice","Quorum","Draft minutes","Minutes signed","Resolutions"],widths:[20,"auto",17,19,24,26,17,17,14],
    rows:list.map(m=>{const n=noticeCheck(m),q=quorumCheck(m);return {kind:"item",label:m.no||"–",vals:[m.type==="committee"?(m.committee||"Committee"):MEET_T[m.type],fmtD(pd(m.date)),m.mode||"",n.txt,q.txt,m.minDraft?fmtD(pd(m.minDraft)):"–",m.minSigned?fmtD(pd(m.minSigned)):"–",String(ress.filter(r=>r.meetingId===m.id).length||"–")]};}),empty:"No meetings recorded."};}
function mRes(){const list=ress.filter(r=>r.date&&fyOfT(pd(r.date))===sel).sort((a,b)=>pd(a.date)-pd(b.date));
  return {key:"res",title:"Register of resolutions",sub:fyLabel(sel),flat:["No.","Date","Subject","Passed by","Type","Meeting","MGT-14"],widths:[26,17,"auto",26,16,22,22],
    rows:list.map(r=>{const m=meets.find(x=>x.id===r.meetingId);let mg="Not required";if(r.mgt14){const st=statusOf({key:"mgt14:"+r.id,form:"MGT-14",due:pd(r.date)+30*DAY,fy:fyOfT(pd(r.date)+30*DAY)});mg=pillTxt[st.s]+((fils["mgt14:"+r.id]||{}).srn?" · "+fils["mgt14:"+r.id].srn:"");}
      return {kind:"item",label:r.no||"–",vals:[fmtD(pd(r.date)),r.subject||"",RES_BODY[r.body]||"",r.body==="members"?(r.kind==="special"?"Special":"Ordinary"):"Board",m?(m.no||MEET_T[m.type]):"–",mg]};}),empty:"No resolutions recorded."};}
function mDir(){const k=fyId(sel);return {key:"dir",title:"Register of directors and key managerial personnel",sub:"As on "+fmtD(Math.min(TODAY,fyE(sel))),flat:["Name","DIN / ID","Designation","Category","Appointed","Ceased","Next KYC","MBP-1 "+k,"DIR-8 "+k],widths:["auto",18,28,19,17,17,17,17,17],
  rows:dirs.slice().sort((a,b)=>(!!a.ceased-!!b.ceased)||String(a.name).localeCompare(b.name)).map(d=>({kind:"item",label:d.name,vals:[d.din||d.pan||"–",d.designation||"",isDirector(d)?(d.category||""):"KMP",fmtD(pd(d.appointed)),d.ceased?fmtD(pd(d.ceased)):"–",isDirector(d)&&d.din?fmtD(pd(d.kycNext)):"–",d.mbp1&&d.mbp1[k]?fmtD(pd(d.mbp1[k])):"–",d.dir8&&d.dir8[k]?fmtD(pd(d.dir8[k])):"–"]})),empty:"No directors recorded."};}
function mEv(){const list=evs.filter(e=>e.date&&fyOfT(pd(e.date))===sel).sort((a,b)=>pd(a.date)-pd(b.date));
  return {key:"ev",title:"Corporate events and event-based filings",sub:fyLabel(sel),flat:["Date","Event","Particulars","Form","Due","Status","SRN","Amount (Rs.)"],widths:[17,40,"auto",18,17,20,20,20],align:["l","l","l","l","l","l","l","r"],
    rows:list.map(e=>{const T=EVT[e.type]||EVT.other;const days=T.days!=null?T.days:(+e.days||30);const t=pd(e.date);const st=statusOf({key:"ev:"+e.id,due:t+days*DAY});
      return {kind:"item",label:fmtD(t),vals:[T.n,[e.details,e.holder,e.chargeId?"Charge ID "+e.chargeId:""].filter(Boolean).join(" · "),e.type==="other"?(e.form||""):T.form,fmtD(st.due),pillTxt[st.s],(fils["ev:"+e.id]||{}).srn||"",e.amount?+e.amount:null]};}),empty:"No events recorded."};}
function mReg(){const st={yes:"Maintained",no:"Not maintained",na:"Not applicable","":"Not confirmed"};
  return {key:"reg",title:"Statutory registers",sub:"Status as on "+fmtD(TODAY),flat:["Register","Form / section","Status","Last updated","Kept at","Custodian"],widths:["auto",30,24,19,30,24],
    rows:REGS.map(r=>{const v=regs[r.k]||{};return {kind:"item",label:r.n,vals:[r.f,st[v.st||""],v.upd?fmtD(pd(v.upd)):"–",v.at||"–",v.by||"–"]};})};}
function mDocs(){const list=docs.filter(x=>x.fy===String(sel)).sort((a,b)=>DOC_CATS.findIndex(c=>c.k===a.cat)-DOC_CATS.findIndex(c=>c.k===b.cat));
  return {key:"docs",title:"Documents index",sub:fyLabel(sel),flat:["Category","Title","Reference / SRN","Date","File"],widths:[46,"auto",28,17,38],rows:list.map(x=>({kind:"item",label:docCatName(x.cat),vals:[x.title||x.fileName,x.ref||"–",x.date?fmtD(pd(x.date)):"–",x.fileName]})),empty:"No documents uploaded."};}
const SECTIONS=[
  {k:"cal",n:"Compliance status report",d:()=>{const {cur}=calendar(sel);return cur.length+" items · "+cur.filter(i=>i.st.s==="over").length+" overdue";},m:mCal},
  {k:"meet",n:"Register of meetings",d:()=>meets.filter(m=>m.date&&fyOfT(pd(m.date))===sel).length+" meetings",m:mMeet},
  {k:"res",n:"Register of resolutions",d:()=>ress.filter(r=>r.date&&fyOfT(pd(r.date))===sel).length+" resolutions",m:mRes},
  {k:"dir",n:"Directors and KMP",d:()=>dirs.filter(d=>!d.ceased).length+" in office",m:mDir},
  {k:"mem",n:"Register of members",d:()=>members.length+" members",m:mMem},
  {k:"pat",n:"Shareholding pattern",d:()=>"As on "+fmtD(Math.min(TODAY,fyE(sel))),m:mPat},
  {k:"led",n:"Share ledger",d:()=>stx.length+" transactions",m:mLed},
  {k:"cert",n:"Register of share certificates",d:()=>certList().length+" certificates",m:mCert},
  {k:"recon",n:"Reconciliation of share capital",d:()=>"Physical, NSDL and CDSL",m:mRecon},
  {k:"ev",n:"Events and event-based filings",d:()=>evs.filter(e=>e.date&&fyOfT(pd(e.date))===sel).length+" events",m:mEv},
  {k:"reg",n:"Statutory registers",d:()=>REGS.filter(r=>regs[r.k]&&regs[r.k].st).length+" of "+REGS.length+" confirmed",m:mReg},
  {k:"docs",n:"Documents index",d:()=>docs.filter(x=>x.fy===String(sel)).length+" documents",m:mDocs}
];
/* PDF */
const PC={green:[28,106,59],ink:[22,33,26],muted:[96,110,100],rule:[196,206,197],band:[233,240,232],gold:[169,127,0],red:[179,38,30]};
const PW=210,PH=297,PM=16;
function pt(s){return String(s==null?"":s).replace(/−/g,"-").replace(/₹/g,"Rs. ").replace(/[✓✕○📎⇄→]/g,"").replace(/[^\x00-\xFF–—‘’“”•…]/g,"");}
function ensure(doc,y,need){if(y+need>PH-20){doc.addPage();return 24;}return y;}
const pnum=v=>v==null||v===""?"":(typeof v==="number"?(v?(+v).toLocaleString("en-IN",{maximumFractionDigits:2}):"–"):pt(v));
function pdfTitle(doc,m){
  const C=co();let y=24;
  doc.setFont("times","bold");doc.setFontSize(12.5);doc.setTextColor(...PC.ink);doc.text(pt(C.name),PW/2,y,{align:"center"});
  y+=4.6;doc.setFont("times","normal");doc.setFontSize(8.3);doc.setTextColor(...PC.muted);doc.text("CIN "+C.cin,PW/2,y,{align:"center"});
  y+=8.5;doc.setFont("times","bold");doc.setFontSize(13);doc.setTextColor(...PC.green);doc.text(pt(m.title),PW/2,y,{align:"center"});
  if(m.sub){y+=5;doc.setFont("times","italic");doc.setFontSize(9.5);doc.setTextColor(...PC.ink);doc.text(pt(m.sub),PW/2,y,{align:"center"});}
  return y+6;
}
function pdfGrid(doc,m,y){
  if(!m.rows.length){doc.setFont("times","italic");doc.setFontSize(9.5);doc.setTextColor(...PC.muted);doc.text(pt(m.empty||"Nothing to show."),PM,y+6);return y+10;}
  const n=m.flat.length;const cs={};
  for(let j=0;j<n;j++){const al=m.align?m.align[j]:"l";cs[j]={halign:al==="r"?"right":al==="c"?"center":"left"};if(m.widths&&m.widths[j]!=null)cs[j].cellWidth=m.widths[j];}
  doc.autoTable({startY:y,theme:"plain",margin:{left:PM,right:PM,top:22,bottom:20},head:[m.flat.map(pt)],
    body:m.rows.map(r=>r.kind==="h"?[{content:pt(r.label),colSpan:n}]:[pt(r.label)].concat(r.vals.map(pnum))),columnStyles:cs,
    styles:{font:"times",fontSize:m.fs||7.6,textColor:PC.ink,cellPadding:{top:1.1,bottom:1.1,left:1.2,right:1.2},valign:"top",lineColor:PC.rule,lineWidth:{bottom:0.1},overflow:"linebreak"},
    headStyles:{fillColor:PC.band,fontStyle:"bold",valign:"middle",lineWidth:{bottom:0.25},lineColor:PC.ink},
    didParseCell:c=>{if(c.section!=="body")return;const r=m.rows[c.row.index];if(r.kind==="h"){c.cell.styles.fontStyle="bold";c.cell.styles.fillColor=PC.band;}if(r.kind==="subt"||r.kind==="tot")c.cell.styles.fontStyle="bold";if(r.kind==="tot"){c.cell.styles.lineWidth={top:0.3,bottom:0.5};c.cell.styles.lineColor=PC.ink;}
      if(m.key==="cal"&&c.column.index===4&&r.s){c.cell.styles.textColor=r.s==="over"?PC.red:r.s==="soon"||r.s==="late"?PC.gold:r.s==="done"?PC.green:PC.muted;c.cell.styles.fontStyle=r.s==="over"?"bold":"normal";}}});
  return doc.lastAutoTable.finalY+4;
}
function pdfChrome(doc,spans,cover){
  const n=doc.getNumberOfPages();const C=co();
  for(let i=1;i<=n;i++){doc.setPage(i);if(cover&&i===1)continue;const sp=spans.find(s=>i>=s.from&&i<=s.to);
    doc.setFont("times","normal");doc.setFontSize(7.8);doc.setTextColor(...PC.muted);doc.text(pt(C.name),PM,11);if(sp)doc.text(pt(sp.title),PW-PM,11,{align:"right"});
    doc.setDrawColor(...PC.green);doc.setLineWidth(0.3);doc.line(PM,13,PW-PM,13);doc.setDrawColor(...PC.rule);doc.setLineWidth(0.2);doc.line(PM,PH-14,PW-PM,PH-14);
    doc.text("Secretarial records · "+fyLabel(sel),PM,PH-9.5);doc.text("Page "+i+" of "+n,PW-PM,PH-9.5,{align:"right"});}
}
function pdfCover(doc){
  const C=co();const {cur,carried}=calendar(sel);const all=cur.concat(carried);const c=s=>all.filter(i=>i.st.s===s).length;
  doc.setFillColor(...PC.green);doc.rect(PM,34,22,1.3,"F");
  doc.setFont("times","normal");doc.setFontSize(9);doc.setTextColor(...PC.muted);doc.text("SECRETARIAL COMPLIANCE · "+fyLabel(sel).toUpperCase(),PM,44,{charSpace:0.5});
  doc.setFont("times","bold");doc.setFontSize(24);doc.setTextColor(...PC.ink);doc.text(doc.splitTextToSize(pt(C.name),PW-2*PM),PM,58);
  doc.setFont("times","italic");doc.setFontSize(13);doc.text("Compliance records for 1 April "+sel+" – 31 March "+(sel+1),PM,80);
  doc.setFont("times","normal");doc.setFontSize(9);doc.setTextColor(...PC.muted);doc.text("CIN "+C.cin,PM,92);doc.text(pt("Registered office: "+C.ro),PM,97);doc.text("Prepared under the Companies Act, 2013 and the Secretarial Standards",PM,102);
  const bx=[["Overdue",c("over"),PC.red],["Due within 30 days",c("soon"),PC.gold],["Upcoming",c("up"),PC.muted],["Done",c("done")+c("late"),PC.green]];
  const w=(PW-2*PM-9)/4;bx.forEach(([l,v,col],i)=>{const x=PM+i*(w+3);doc.setDrawColor(...PC.rule);doc.setLineWidth(0.3);doc.roundedRect(x,112,w,20,1.5,1.5,"S");doc.setFont("times","bold");doc.setFontSize(16);doc.setTextColor(...col);doc.text(String(v),x+4,123);doc.setFont("times","normal");doc.setFontSize(8);doc.setTextColor(...PC.muted);doc.text(l,x+4,129);});
  doc.setFont("times","bold");doc.setFontSize(11);doc.setTextColor(...PC.ink);doc.text("Contents",PM,148);doc.setDrawColor(...PC.rule);doc.setLineWidth(0.2);doc.line(PM,151,PW-PM,151);
  doc.setFont("times","normal");doc.setFontSize(8);doc.setTextColor(...PC.muted);doc.text("Status as on "+fmtD(TODAY)+" · generated from TruFin Secretarial",PM,PH-22);
}
function pdfToc(doc,toc){let y=158;doc.setFontSize(10);for(const e of toc){doc.setFont("times","normal");doc.setTextColor(...PC.ink);const l=pt(e.title);doc.text(l,PM,y);const pg=String(e.page);doc.text(pg,PW-PM,y,{align:"right"});
  const x1=PM+doc.getTextWidth(l)+2,x2=PW-PM-doc.getTextWidth(pg)-2;doc.setTextColor(...PC.rule);let dots="";while(doc.getTextWidth(dots+" .")<x2-x1)dots+=" .";doc.text(dots,x2,y,{align:"right"});y+=7;}}
async function newDoc(){await needLib("jspdf");await needLib("autotable");return new window.jspdf.jsPDF({unit:"mm",format:"a4",orientation:"portrait",compress:true});}
async function buildPDF(keys,cover){
  const doc=await newDoc();doc.setProperties({title:SHORT+" "+fyLabel(sel)+" secretarial records",author:co().name});
  const spans=[],toc=[];let first=true;if(cover){pdfCover(doc);first=false;}
  for(const k of keys){const m=SECTIONS.find(s=>s.k===k).m();if(!first)doc.addPage();first=false;const from=doc.getNumberOfPages();let y=pdfTitle(doc,m);y=pdfGrid(doc,m,y);spans.push({from,to:doc.getNumberOfPages(),title:m.title});toc.push({title:m.title,page:from});}
  if(cover){doc.setPage(1);pdfToc(doc,toc);}pdfChrome(doc,spans,cover);return doc.output("blob");
}
function letterhead(doc){const C=co();doc.setFillColor(...PC.green);doc.rect(0,0,PW,3,"F");
  doc.setFont("times","bold");doc.setFontSize(15);doc.setTextColor(...PC.ink);doc.text(pt(C.name),PW/2,20,{align:"center"});
  doc.setFont("times","normal");doc.setFontSize(8.3);doc.setTextColor(...PC.muted);doc.text(pt("CIN "+C.cin+" · Registered office: "+C.ro),PW/2,25.5,{align:"center"});if(C.email)doc.text(pt(C.email),PW/2,29.5,{align:"center"});
  doc.setDrawColor(...PC.rule);doc.setLineWidth(0.3);doc.line(PM,33,PW-PM,33);return 44;}
function para(doc,text,y,opt){opt=opt||{};doc.setFont("times",opt.b?"bold":opt.i?"italic":"normal");doc.setFontSize(opt.sz||10.5);doc.setTextColor(...PC.ink);
  for(const p of String(text||"").split(/\n/)){if(!p.trim()){y+=2.2;continue;}for(const ln of doc.splitTextToSize(pt(p),PW-2*PM-(opt.ind||0))){y=ensure(doc,y,6);doc.text(ln,PM+(opt.ind||0),y,opt.center?{align:"center"}:undefined);y+=(opt.lh||5.1);}}return y;}
function signBlock(doc,y,forTxt){const C=co();y=ensure(doc,y+6,40);
  doc.setFont("times","normal");doc.setFontSize(10);doc.setTextColor(...PC.ink);doc.text(pt(forTxt||("For "+C.name)),PM,y);y+=18;
  doc.setDrawColor(...PC.ink);doc.setLineWidth(0.2);doc.line(PM,y-4,PM+60,y-4);
  doc.setFont("times","bold");doc.text(pt(C.signName||"__________________"),PM,y);doc.setFont("times","normal");y+=5;doc.text(pt(C.signDes||"Director"),PM,y);y+=5;if(C.signDin){doc.text("DIN "+C.signDin,PM,y);y+=5;}
  y+=3;doc.text(pt("Place: "+(C.place||"")),PM,y);doc.text("Date: "+fmtD(TODAY),PM,y+5);return y+10;}
async function ctcPDF(r,docIn){
  const doc=docIn||await newDoc();if(docIn)doc.addPage();const C=co();let y=letterhead(doc);
  const m=meets.find(x=>x.id===r.meetingId);const t=pd(r.date);
  let head;
  if(r.body==="circ")head="CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF "+C.name.toUpperCase()+" BY CIRCULATION ON "+fmtDL(t).toUpperCase();
  else if(r.body==="members")head="CERTIFIED TRUE COPY OF THE "+(r.kind==="special"?"SPECIAL":"ORDINARY")+" RESOLUTION PASSED BY THE MEMBERS OF "+C.name.toUpperCase()+(m?" AT THE "+(m.type==="agm"?(m.no||"ANNUAL GENERAL MEETING").toUpperCase().replace(/ AGM$/," ANNUAL GENERAL MEETING"):"EXTRAORDINARY GENERAL MEETING")+" HELD ON "+fmtDL(pd(m.date)).toUpperCase()+(m.venue?" AT "+m.venue.toUpperCase():""):" ON "+fmtDL(t).toUpperCase());
  else head="CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF "+C.name.toUpperCase()+" AT "+(m?"ITS MEETING ("+(m.no||"").toUpperCase()+") HELD ON "+fmtDL(pd(m.date)).toUpperCase()+(m.time?" AT "+m.time.toUpperCase():"")+(m.mode==="Video conference"?" THROUGH VIDEO CONFERENCING":m.venue?" AT "+m.venue.toUpperCase():""):"ITS MEETING HELD ON "+fmtDL(t).toUpperCase());
  y=para(doc,head,y,{b:true,sz:10.5,lh:5.4});y+=3;
  if(r.no){doc.setFont("times","normal");doc.setFontSize(9);doc.setTextColor(...PC.muted);doc.text("Resolution no. "+pt(r.no),PM,y);y+=6;}
  y=para(doc,(r.subject||"").toUpperCase(),y,{b:true,sz:10.5});y+=2;
  y=para(doc,r.text||"",y,{sz:10.5,lh:5.3});
  y+=2;y=para(doc,"Certified to be true",y,{i:true,sz:10});
  y=signBlock(doc,y);
  return doc;
}
async function noticePDF(m,docIn){
  const doc=docIn||await newDoc();if(docIn)doc.addPage();const C=co();let y=letterhead(doc);const t=pd(m.date);const gm=m.type==="agm"||m.type==="egm";
  doc.setFont("times","bold");doc.setFontSize(13);doc.setTextColor(...PC.green);doc.text("NOTICE",PW/2,y,{align:"center"});y+=5.5;
  doc.setFont("times","italic");doc.setFontSize(9.5);doc.setTextColor(...PC.ink);doc.text(pt((m.no?m.no+" · ":"")+(m.type==="committee"?(m.committee||"Committee meeting"):MEET_T[m.type])),PW/2,y,{align:"center"});y+=10;
  const where=m.mode==="Video conference"?"through video conferencing":(m.venue?"at "+m.venue:"at the registered office of the Company at "+C.ro);
  const whom=gm?"the members of "+C.name:(m.type==="committee"?"the "+(m.committee||"committee")+" of the Board of Directors of "+C.name:"the Board of Directors of "+C.name);
  const opener=gm?"NOTICE is hereby given that the "+(m.type==="agm"?(m.no||"Annual General Meeting").replace(/ AGM$/," Annual General Meeting"):"Extraordinary General Meeting")+" of the members of "+C.name+" will be held on "+fmtDL(t)+(m.time?" at "+m.time:"")+" "+where+", to transact the following business:"
    :"Notice is hereby given that a meeting of "+whom+" will be held on "+fmtDL(t)+(m.time?" at "+m.time:"")+" "+where+", to transact the business set out in the agenda below.";
  y=para(doc,opener,y,{sz:10.5,lh:5.3});y+=3;
  doc.setFont("times","bold");doc.setFontSize(10.5);doc.text(gm?"Business":"Agenda",PM,y);y+=6;
  const items=String(m.agenda||"").split(/\n/).map(s=>s.trim()).filter(Boolean);
  if(!items.length)y=para(doc,"[Agenda to be added]",y,{i:true});
  items.forEach((it,i)=>{y=ensure(doc,y,7);doc.setFont("times","normal");doc.setFontSize(10.5);doc.text((i+1)+".",PM+2,y);const ls=doc.splitTextToSize(pt(it),PW-2*PM-10);ls.forEach((l,j)=>{if(j)y=ensure(doc,y+5.1,6)-5.1;doc.text(l,PM+10,y+(j?5.1:0));if(j)y+=5.1;});y+=6;});
  if(gm){y+=2;y=para(doc,"Note: A member entitled to attend and vote at the meeting is entitled to appoint a proxy to attend and vote instead of himself or herself, and the proxy need not be a member. Proxies, to be effective, must reach the registered office not less than 48 hours before the meeting.",y,{sz:9,i:true,lh:4.6});}
  y=signBlock(doc,y+2,"By order of the Board\nFor "+C.name);
  return doc;
}
/* Excel, CSV */
function flat(m){return {head:m.flat,rows:m.rows.map(r=>r.kind==="h"?[r.label]:[r.label].concat(r.vals.map(v=>v==null?"":v)))};}
async function buildXLSX(keys){await needLib("xlsx");const X=window.XLSX;const wb=X.utils.book_new();const C=co();
  const cover=[[C.name],["CIN "+C.cin],["Secretarial records for "+fyLabel(sel)],["Status as on "+fmtD(TODAY)],[],["Sheet","Contents"]];const sheets=[];
  for(const k of keys){const s=SECTIONS.find(x=>x.k===k);const m=s.m();const f=flat(m);const ws=X.utils.aoa_to_sheet([[C.name],[m.title+" — "+m.sub],[],f.head].concat(f.rows));
    ws["!cols"]=f.head.map((h,i)=>({wch:Math.max(10,Math.min(60,Math.max(String(h).length,...f.rows.map(r=>String(r[i]==null?"":r[i]).length))+2))}));
    const nm=s.n.slice(0,31);sheets.push([nm,ws]);cover.push([nm,m.title]);}
  const cws=X.utils.aoa_to_sheet(cover);cws["!cols"]=[{wch:34},{wch:60}];X.utils.book_append_sheet(wb,cws,"Cover");for(const [n,ws] of sheets)X.utils.book_append_sheet(wb,ws,n);
  return new Blob([X.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});}
function buildCSV(k){const m=SECTIONS.find(s=>s.k===k).m();const f=flat(m);const q=v=>{v=String(v==null?"":v).replace(/\s+/g," ").trim();return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  return new Blob(["﻿"+[q(co().name),q(m.title+" — "+m.sub),"",f.head.map(q).join(",")].concat(f.rows.map(r=>r.map(q).join(","))).join("\n")],{type:"text/csv;charset=utf-8"});}
const safe=s=>String(s||"").replace(/[\\\/:*?"<>|]/g,"-").slice(0,90);
async function buildZIP(keys,opts){await needLib("jszip");const zip=new window.JSZip();const base=SHORT+" "+fyLabel(sel);
  exp.step="Compliance report";renderExport();zip.file(base+" - Secretarial Records.pdf",await buildPDF(keys,true));
  exp.step="Workbook";renderExport();zip.file(base+" - Secretarial Workbook.xlsx",await buildXLSX(keys));
  const sf=zip.folder("Sections");let i=1;for(const k of keys){const s=SECTIONS.find(x=>x.k===k);exp.step=s.n;renderExport();sf.file(String(i++).padStart(2,"0")+" "+s.n+".pdf",await buildPDF([k],false));}
  if(opts.ctc){const rs=ress.filter(r=>r.date&&fyOfT(pd(r.date))===sel);if(rs.length){const f=zip.folder("Resolutions - certified copies");for(const r of rs){exp.step="Certified copy "+(r.no||"");renderExport();f.file(safe((r.no||"").replace(/\//g,"-")+" "+r.subject)+".pdf",(await ctcPDF(r)).output("blob"));}}}
  if(opts.certs){const ts=stx.filter(t=>t.certNo&&(t.mode||"phys")==="phys"&&t.date&&fyOfT(pd(t.date))===sel);if(ts.length){const f=zip.folder("Share certificates");for(const t of ts){exp.step="Certificate "+t.certNo;renderExport();f.file(safe("SH-1 "+t.certNo+" "+memName(t.to))+".pdf",(await certPDF(t)).output("blob"));}}}
  if(opts.notices){const ms=meets.filter(m=>m.date&&fyOfT(pd(m.date))===sel);if(ms.length){const f=zip.folder("Meeting notices");for(const m of ms){exp.step="Notice "+(m.no||"");renderExport();f.file(safe((m.no||MEET_T[m.type]).replace(/\//g,"-")+" "+fmtD(pd(m.date)))+".pdf",(await noticePDF(m)).output("blob"));}}}
  if(opts.files){const list=docs.filter(x=>x.fy===String(sel));if(list.length){const f=zip.folder("Documents");const miss=[],seen={};
    for(const x of list){exp.step="Documents · "+(x.title||x.fileName);renderExport();try{const b=await fileBlob(x);if(!b){miss.push(x.fileName);continue;}const fo=safe(docCatName(x.cat));let nm=safe(x.fileName||"file");if(seen[fo+nm])nm=nm.replace(/(\.[^.]+)?$/,"-"+x.id.slice(-4)+"$1");seen[fo+nm]=1;f.folder(fo).file(nm,b);}catch(_){miss.push(x.fileName);}}
    if(miss.length)f.file("_not included.txt","These files couldn’t be read when the pack was built:\r\n"+miss.join("\r\n"));}}
  exp.step="Compressing";renderExport();return zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});}
async function saveBlob(filename,blob){
  if(downloads){try{await downloads.save({filename,data:blob});return true;}catch(e){if(e&&e.code==="declined")return false;toast(e&&e.code==="rejected_extension"?"That file type can’t be downloaded here.":"Download unavailable here.");return false;}}
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return true;}
const fname=(what,ext)=>safe(SHORT+" "+fyLabel(sel)+" - "+what)+"."+ext;
async function downloadSection(k,f){if(exp.busy)return;const s=SECTIONS.find(x=>x.k===k);exp.busy=k+":"+f;render();
  try{const blob=f==="pdf"?await buildPDF([k],false):f==="xlsx"?await buildXLSX([k]):buildCSV(k);if(await saveBlob(fname(s.n,f),blob))toast("Downloaded "+s.n);}catch(e){toast(e.message||"Couldn’t build the file.");}
  exp.busy=false;render();}
async function downloadAll(){const keys=SECTIONS.map(s=>s.k).filter(k=>exp.inc[k]);if(!keys.length){exp.msg="Choose at least one section.";renderExport();return;}
  exp.busy="all";exp.msg="";exp.step="";render();
  try{let blob,ext;if(exp.fmt==="pdf"){blob=await buildPDF(keys,true);ext="pdf";}else if(exp.fmt==="xlsx"){blob=await buildXLSX(keys);ext="xlsx";}else{blob=await buildZIP(keys,exp);ext="zip";}
    const what={pdf:"Secretarial Records",xlsx:"Secretarial Workbook",zip:"Secretarial Pack"}[exp.fmt];if(await saveBlob(fname(what,ext),blob))exp.msg="Downloaded "+fname(what,ext)+" · "+fmtSize(blob.size);}
  catch(e){exp.msg=e.message||"Couldn’t build the download.";}exp.busy=false;exp.step="";render();if(!exp.open&&exp.msg)toast(exp.msg);}
async function downloadAllDocs(){const list=docs.filter(x=>docFilter==="all"||x.fy===String(sel));if(!list.length||exp.busy)return;exp.busy="docs";render();
  try{await needLib("jszip");const zip=new window.JSZip();const seen={},miss=[];const q=v=>{v=String(v==null?"":v).replace(/\s+/g," ").trim();return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
    const idx=[["Financial year","Category","Title","Reference","Date","File in this ZIP"].join(",")];
    for(const x of list){const fo=(docFilter==="all"?fyLabel(+x.fy)+"/":"")+safe(docCatName(x.cat));let nm=safe(x.fileName||"file");if(seen[fo+nm])nm=nm.replace(/(\.[^.]+)?$/,"-"+x.id.slice(-4)+"$1");seen[fo+nm]=1;
      let ok=true;try{const b=await fileBlob(x);if(b)zip.file(fo+"/"+nm,b);else ok=false;}catch(_){ok=false;}if(!ok)miss.push(x.fileName);
      idx.push([fyLabel(+x.fy),docCatName(x.cat),x.title,x.ref,x.date,ok?fo+"/"+nm:"(not included)"].map(q).join(","));}
    zip.file("Documents index.csv","﻿"+idx.join("\r\n"));const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});
    if(await saveBlob(docFilter==="all"?SHORT+" - All secretarial documents.zip":fname("Secretarial documents","zip"),blob))toast("Downloaded "+(list.length-miss.length)+" of "+list.length+" documents");}
  catch(e){toast(e.message||"Couldn’t build the ZIP.");}exp.busy=false;render();}
async function oneCTC(id){const r=ress.find(x=>x.id===id);if(!r||exp.busy)return;exp.busy="ctc";try{const d=await ctcPDF(r);await saveBlob(safe("CTC "+(r.no||"").replace(/\//g,"-")+" "+r.subject)+".pdf",d.output("blob"));}catch(e){toast(e.message||"Couldn’t build the PDF.");}exp.busy=false;}
async function oneNotice(id){const m=meets.find(x=>x.id===id);if(!m||exp.busy)return;exp.busy="notice";try{const d=await noticePDF(m);await saveBlob(safe("Notice "+(m.no||MEET_T[m.type]).replace(/\//g,"-")+" "+fmtD(pd(m.date)))+".pdf",d.output("blob"));}catch(e){toast(e.message||"Couldn’t build the PDF.");}exp.busy=false;}

/* download UI */
let exp={open:false,fmt:"pdf",inc:{cal:1,meet:1,res:1,dir:1,mem:1,pat:1,led:1,cert:1,recon:1,ev:1,reg:1,docs:1},ctc:true,certs:true,notices:true,files:true,busy:false,msg:"",step:""};
const DLICON=`<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 2v8m0 0-3.2-3.2M8 10l3.2-3.2M3 13h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const dlMenu=(k,label,lead)=>(downloads||isLocal)?`<div class="dl" role="group" aria-label="Download ${esc(label||"")}"><span class="dl-l">${DLICON}${esc(lead||"This section")}</span>${["pdf","xlsx","csv"].map(f=>`<button data-dl="${k}" data-fmt="${f}" ${exp.busy?"disabled":""} class="${exp.busy===k+":"+f?"busy":""}">${{pdf:"PDF",xlsx:"Excel",csv:"CSV"}[f]}</button>`).join("")}</div>`:"";
let fyPop=false;
function fyMenu(){if(!(downloads||isLocal))return "";const busy=exp.busy==="all";const nd=docs.filter(x=>x.fy===String(sel)).length;
  return `<div class="fyset"><button class="btn small fyset-b" data-fypop aria-haspopup="menu" aria-expanded="${fyPop}" ${exp.busy&&!busy?"disabled":""}>${busy?`<span class="spin"></span>Building ${fyLabel(sel)} set…`:`${DLICON}Full ${fyLabel(sel)} set<span class="caret">▾</span>`}</button>
   ${fyPop&&!busy?`<div class="fyset-m" role="menu"><button role="menuitem" data-fyall="pdf"><strong>Secretarial records</strong><span>Status report and every register in one PDF</span><em>PDF</em></button>
     <button role="menuitem" data-fyall="xlsx"><strong>Workbook</strong><span>One sheet per register</span><em>Excel</em></button>
     <button role="menuitem" data-fyall="zip"><strong>Complete pack</strong><span>Records, workbook, certified copies, notices${nd?" and "+nd+" document"+(nd===1?"":"s"):""}</span><em>ZIP</em></button>
     <button role="menuitem" data-fyopts class="more">Choose sections and options…</button></div>`:""}</div>`;}
const dlBar=(k,label)=>`<div class="toolbar dlbar">${dlMenu(k,label)}${fyMenu()}</div>`;
function openExport(){exp.open=true;exp.msg="";$("#exp").hidden=false;$("#scrim").hidden=false;document.body.style.overflow="hidden";renderExport();setTimeout(()=>{const f=$("#exp .x");if(f)f.focus();},30);}
function closeExport(){if(exp.busy==="all")return;exp.open=false;$("#exp").hidden=true;$("#scrim").hidden=true;document.body.style.overflow="";$("#dlBtn").focus();}
function renderExport(){if(DEAD)return;const el=$("#exp");if(!el||!exp.open)return;
  const nr=ress.filter(r=>r.date&&fyOfT(pd(r.date))===sel).length,nm=meets.filter(m=>m.date&&fyOfT(pd(m.date))===sel).length,nd=docs.filter(x=>x.fy===String(sel)).length;
  const F=[{k:"pdf",t:"Secretarial records",e:"PDF",d:"A cover with the status summary, then the compliance report and every register, paginated and print-ready."},
    {k:"xlsx",t:"Workbook",e:"Excel",d:"A cover sheet plus one sheet per register, ready to filter and share."},
    {k:"zip",t:"Complete pack",e:"ZIP",d:"The records PDF and workbook, each register as its own PDF, certified copies of resolutions, meeting notices"+(nd?" and "+nd+" uploaded document"+(nd===1?"":"s"):"")+"."}];
  const busyAll=exp.busy==="all";
  el.innerHTML=`<div class="exp-head"><div><div class="eyebrow">Download</div><h2 id="expTitle">${fyLabel(sel)} secretarial records</h2><div class="exp-meta"><span>1 April ${sel} – 31 March ${sel+1}</span></div></div><button class="x" data-x aria-label="Close">✕</button></div>
   <div class="exp-body"><section class="exp-block"><h3>The whole year, as one download</h3>
    <div class="fmts" role="radiogroup" aria-label="Format">${F.map(f=>`<button class="fmt" role="radio" aria-checked="${exp.fmt===f.k}" data-fmtpick="${f.k}"><span class="fmt-top"><strong>${f.t}</strong><span class="ext">${f.e}</span></span><span class="fmt-d">${f.d}</span></button>`).join("")}</div>
    <h4>Include</h4><div class="incs">${SECTIONS.map(s=>`<label class="inc"><input type="checkbox" data-inc="${s.k}" ${exp.inc[s.k]?"checked":""}><span><strong>${esc(s.n)}</strong><span class="hint">${esc(s.d())}</span></span></label>`).join("")}</div>
    ${exp.fmt==="zip"?`<h4>Also in the ZIP</h4><div class="opts"><label class="tog"><input type="checkbox" data-opt="ctc" ${exp.ctc?"checked":""}><span>Certified true copies of ${nr} resolution${nr===1?"":"s"}</span></label>${(n=>n?`<label class="tog"><input type="checkbox" data-opt="certs" ${exp.certs?"checked":""}><span>Share certificates issued this year (${n})</span></label>`:"")(stx.filter(t=>t.certNo&&(t.mode||"phys")==="phys"&&t.date&&fyOfT(pd(t.date))===sel).length)}<label class="tog"><input type="checkbox" data-opt="notices" ${exp.notices?"checked":""}><span>Notices of ${nm} meeting${nm===1?"":"s"}</span></label><label class="tog"><input type="checkbox" data-opt="files" ${exp.files?"checked":""} ${nd?"":"disabled"}><span>Uploaded documents (${nd})</span></label></div>`:""}
    <button class="btn primary big" data-all ${exp.busy?"disabled":""}>${busyAll?`<span class="spin"></span>Building${exp.step?" · "+esc(exp.step):"…"}`:{pdf:"Download secretarial records",xlsx:"Download workbook",zip:"Download complete pack"}[exp.fmt]}</button>
    <p class="exp-msg" aria-live="polite">${esc(exp.msg)}</p></section>
    <section class="exp-block"><h3>One register at a time</h3><ul class="secs">${SECTIONS.map(s=>`<li><div><strong>${esc(s.n)}</strong><span class="hint">${esc(s.d())}</span></div><div class="dl compact">${["pdf","xlsx","csv"].map(f=>`<button data-dl="${s.k}" data-fmt="${f}" ${exp.busy?"disabled":""}>${{pdf:"PDF",xlsx:"Excel",csv:"CSV"}[f]}</button>`).join("")}</div></li>`).join("")}</ul>
     <p class="sub">Certified copies of single resolutions, meeting notices and share certificates are on the Resolutions, Meetings and Shareholders tabs.</p></section></div>`;}

/* ---------- standalone storage ---------- */
const LKEY="trufin.secretarial.v1";const COLS=["config","directors","meetings","resolutions","events","filings","docs","members","sharetx","extensions"];
function localDB(){
  let store=null;try{store=JSON.parse(localStorage.getItem(LKEY)||"null");}catch(e){}
  if(!isObj(store)){store={};store.directors={"p-vc":{kind:"director",name:"Venkata Cherukuri",din:"",designation:"Chairman & Managing Director",category:"Executive",appointed:"",ceased:"",kycNext:"",mbp1:{},dir8:{}}};}
  for(const c of COLS)store[c]=isObj(store[c])?store[c]:{};const subs={};
  const persist=()=>{try{localStorage.setItem(LKEY,JSON.stringify(store));}catch(e){toast("This browser is blocking storage, so changes won’t be kept. Use Backup to save a file.");}};
  const snap=c=>{store[c]=store[c]||{};const d=Object.keys(store[c]).sort().map(id=>({id,exists:true,data:()=>clone(store[c][id])}));return {docs:d,size:d.length,empty:!d.length};};
  const emit=c=>(subs[c]||[]).forEach(f=>f(snap(c)));
  return {exportAll:()=>clone(store),importAll:s=>{store={};for(const c of COLS)store[c]=isObj(s[c])?s[c]:{};persist();for(const c of COLS)emit(c);},
    doc(p){const [c,id]=p.split("/");store[c]=store[c]||{};return {get:async()=>({id,exists:!!store[c][id],data:()=>clone(store[c][id])}),set:async d=>{store[c][id]=clone(d);persist();emit(c);},update:async d=>{store[c][id]=Object.assign(store[c][id]||{},d);persist();emit(c);},delete:async()=>{delete store[c][id];persist();emit(c);}};},
    collection(c){return {onSnapshot(f){(subs[c]=subs[c]||[]).push(f);setTimeout(()=>f(snap(c)),0);return ()=>{};}};}};
}
const blobToDataURL=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
$("#bkBtn").addEventListener("click",()=>{chain.then(async()=>{if(!db||!db.exportAll)return;const data=db.exportAll();const files={};
  for(const id in data.docs){const x=data.docs[id];try{const rec=await idbGet(x.blob);if(rec)files[x.blob]={name:rec.name,type:rec.type,data:await blobToDataURL(rec.blob)};}catch(_){}}
  const d=new Date();await saveBlob("TruFin secretarial backup "+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+".json",new Blob([JSON.stringify(Object.assign({app:"TruFin Secretarial",savedAt:d.toISOString()},data,{files}))],{type:"application/json"}));});});
$("#rsBtn").addEventListener("click",()=>$("#rsFile").click());
$("#rsFile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const s=JSON.parse(r.result);if(!isObj(s)||s.app!=="TruFin Secretarial")throw 0;
  if(isObj(s.files))for(const k in s.files){const x=s.files[k];try{await idbPut(k,{blob:await (await fetch(x.data)).blob(),name:x.name,type:x.type});}catch(_){}}
  try{await db.importAll(s);}catch(err){toast("Couldn’t save the restored records to the server. "+(err&&err.message||""));e.target.value="";return;}toast("Restored your secretarial records");}catch(_){toast("That file isn’t a TruFin Secretarial backup.");}e.target.value="";};r.readAsText(f);});

/* ---------- events ---------- */
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]");if(!b)return;tab=b.dataset.tab;edit=null;delConfirm=null;fyPop=false;render();window.scrollTo({top:0});});
$("#fySel").addEventListener("change",e=>{sel=+e.target.value;openItem=null;monthF=null;try{localStorage.setItem("trufin.cs.fy",sel);}catch(_){}render();});
$("#dlBtn").addEventListener("click",openExport);$("#scrim").addEventListener("click",()=>{if(!$("#viewer").hidden)closeViewer();else closeExport();});
$("#viewer").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.vx!==undefined)closeViewer();if(b.dataset.vdl)downloadDocFile(b.dataset.vdl);});
onG(document,"keydown",e=>{if(e.key==="Escape"){if(!$("#viewer").hidden)closeViewer();else if(exp.open)closeExport();else if(fyPop){fyPop=false;render();}}});
onG(document,"click",e=>{if(fyPop&&!e.target.closest(".fyset")){fyPop=false;render();}});
$("#exp").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.x!==undefined)return closeExport();if(b.dataset.fmtpick){exp.fmt=b.dataset.fmtpick;exp.msg="";return renderExport();}
  if(b.dataset.all!==undefined)return downloadAll();if(b.dataset.dl)return downloadSection(b.dataset.dl,b.dataset.fmt);});
$("#exp").addEventListener("change",e=>{const el=e.target;if(el.dataset.inc){exp.inc[el.dataset.inc]=el.checked?1:0;renderExport();}if(el.dataset.opt)exp[el.dataset.opt]=el.checked;});
const main=$("#main");
main.addEventListener("input",e=>{const el=e.target;
  if(el.dataset.acc!=null&&edit){const a=edit.data.accounts[+el.dataset.acc];if(a){a[el.dataset.af]=el.value;if(el.tagName==="SELECT")render();}return;}
  if(el.dataset.e&&edit){if(edit.col==="extensions"&&el.dataset.e==="form")edit.data.keys=[];edit.data[el.dataset.e]=el.value;if(el.tagName==="SELECT"||el.type==="date")render();return;}
  if(el.dataset.if&&itemForm){itemForm[el.dataset.if]=el.value;return;}
  if(el.dataset.cf){cfg[el.dataset.cf]=el.value;saveCfg(700);if(el.tagName==="SELECT")render();else renderHeader();return;}
  if(el.dataset.rg){const k=el.dataset.rg;regs[k]=Object.assign({},regs[k],{[el.dataset.rf]:el.value});saveRegs(700);return;}
  if(el.dataset.d&&docForm){docForm[el.dataset.d]=el.value;if(el.dataset.d==="fy")render();return;}});
main.addEventListener("change",e=>{const el=e.target;
  if(el.dataset.earr&&edit){const k=el.dataset.earr;const a=new Set(edit.data[k]||[]);el.checked?a.add(el.value):a.delete(el.value);edit.data[k]=[...a];if(el.checked&&(k==="present"||k==="leave")){const o=k==="present"?"leave":"present";edit.data[o]=(edit.data[o]||[]).filter(x=>x!==el.value);}render();return;}
  if(el.dataset.ebool&&edit){edit.data[el.dataset.ebool]=el.checked;render();return;}
  if(el.dataset.cfb){cfg[el.dataset.cfb]=el.checked;saveCfg();render();return;}
  if(el.dataset.dirflag){const d=dirs.find(x=>x.id===el.dataset.id);if(!d)return;const f=el.dataset.dirflag,k=fyId(sel);const rec=clone(d);delete rec.id;rec[f]=Object.assign({},rec[f]);if(el.checked)rec[f][k]=iso(Math.min(TODAY,fyE(sel)));else delete rec[f][k];put("directors",d.id,rec);return;}
  if(el.id==="d-file"){pickFile(el.files&&el.files[0]);return;}
  if(el.id==="asOn"){asOnStr=el.value;render();return;}
  if(el.id==="histMem"){histMem=el.value;render();return;}});
main.addEventListener("dragover",e=>{const d=e.target.closest&&e.target.closest("#drop");if(d){e.preventDefault();d.classList.add("over");}});
main.addEventListener("drop",e=>{const d=e.target.closest&&e.target.closest("#drop");if(!d)return;e.preventDefault();pickFile(e.dataTransfer.files&&e.dataTransfer.files[0]);});
main.addEventListener("submit",e=>e.preventDefault());
main.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const ds=b.dataset;
  if(ds.item){if(openItem===ds.item){openItem=null;itemForm=null;}else{openItem=ds.item;itemForm=Object.assign({status:"pending"},clone(fils[ds.item]||{}));}render();return;}
  if(ds.stf){stF=ds.stf;render();return;}if(ds.catf){catF=ds.catf;render();return;}if(ds.month){monthF=monthF===ds.month?null:ds.month;render();return;}
  if(ds.meetf){meetF=ds.meetf;render();return;}if(ds.resf){resF=ds.resf;render();return;}if(ds.docf){docFilter=ds.docf;render();return;}
  if(ds.new){startEdit(ds.new);return;}if(ds.edit){startEdit(ds.edit,ds.id);return;}
  if(ds.askdel){delConfirm=ds.askdel;render();return;}if(ds.del){delConfirm=null;remove(ds.del,ds.id);toast("Deleted");return;}
  if(ds.tpl&&edit){const t=TPL.find(x=>x.k===ds.tpl);Object.assign(edit.data,{tpl:t.k,body:t.b,kind:t.kind||"ordinary",subject:t.k==="blank"?"":t.t,text:t.x,mgt14:t.kind==="special"||t.k==="aoa"});render();return;}
  if(ds.dl){downloadSection(ds.dl,ds.fmt);return;}if(ds.fypop!==undefined){fyPop=!fyPop;render();return;}
  if(ds.fyall){fyPop=false;exp.fmt=ds.fyall;for(const s of SECTIONS)exp.inc[s.k]=1;exp.ctc=exp.notices=exp.files=true;downloadAll();return;}
  if(ds.fyopts!==undefined){fyPop=false;render();openExport();return;}
  if(ds.tabgo){tab=ds.tabgo;edit=null;render();window.scrollTo({top:0});return;}
  if(ds.editext){showExt=true;tab="overview";startEdit("extensions",ds.editext);return;}
  if(ds.shv){shView=ds.shv;edit=null;openTx=null;render();return;}
  if(ds.view){viewDoc(ds.view);return;}
  if(ds.txdocs){openTx=openTx===ds.txdocs?null:ds.txdocs;render();return;}
  if(ds.stmt){histMem=ds.stmt;shView="history";edit=null;render();setTimeout(()=>{const s=$("#histMem");if(s)s.closest(".sheet").scrollIntoView({block:"start"});},30);return;}
  if(ds.folio){folioPDF(ds.folio).catch(e=>toast(e.message||"Couldn’t build the statement."));return;}
  if(ds.shupload){const t=ds.tx?stx.find(x=>x.id===ds.tx):null;const mid=ds.mem||(t?(t.to||t.from):"");
    const cat=t?((t.mode==="demat"||t.type==="demat"||t.type==="remat")?"demat":t.type==="transfer"?"sh4":t.certNo?"sharecert":"capital"):"capital";
    docForm={fy:String(t&&pd(t.date)!=null?fyOfT(pd(t.date)):sel),cat,title:t?(t.certNo&&t.mode!=="demat"?"Share certificate "+t.certNo+" · "+memName(t.to||t.from):txLabel(t)+" · "+memName(t.to||t.from)):"KYC / documents · "+memName(mid),ref:t?(t.certNo||t.drn||t.caRef||""):"",date:t?t.date:"",linkKey:"",shareTx:t?t.id:"",shareMem:mid,file:null,back:ds.shupload};
    tab="docs";render();window.scrollTo({top:0});return;}
  if(ds.accadd!==undefined&&edit){edit.data.accounts=(edit.data.accounts||[]).concat([{id:rid("a"),dep:"NSDL",dpName:"",dpId:"",clientId:""}]);render();return;}
  if(ds.accdel!==undefined&&edit){edit.data.accounts.splice(+ds.accdel,1);render();return;}if(ds.cert){oneCert(ds.cert);return;}if(ds.goshare!==undefined){tab="shareholders";shView="ledger";edit=null;render();window.scrollTo({top:0});return;}
  if(ds.ctc){oneCTC(ds.ctc);return;}if(ds.notice){oneNotice(ds.notice);return;}
  if(ds.opendoc){openLocalDoc(ds.opendoc);return;}if(ds.dldoc){downloadDocFile(ds.dldoc);return;}if(ds.deldoc){deleteDoc(ds.deldoc);return;}
  if(ds.attach){const it=calendar(sel).cur.concat(calendar(sel).carried).find(i=>i.key===ds.attach);docForm={fy:String(it?it.fy:sel),cat:"mca",title:it?it.form+" · "+it.title:"",ref:(fils[ds.attach]||{}).srn||"",date:(fils[ds.attach]||{}).filedDate||"",linkKey:ds.attach,file:null,back:true};tab="docs";render();window.scrollTo({top:0});return;}
  if(ds.goitem){tab="overview";stF="all";catF="all";monthF=null;openItem=ds.goitem;itemForm=Object.assign({status:"pending"},clone(fils[ds.goitem]||{}));render();const el=byId("it-"+ds.goitem);if(el)el.scrollIntoView({block:"center"});return;}
  if(ds.delcust){cfg.custom=(cfg.custom||[]).filter((_,i)=>i!==+ds.delcust);saveCfg();render();return;}
  switch(ds.act){
    case "dematsetup":startEdit("dematset");break;
    case "toggleext":showExt=!showExt;if(!showExt&&edit&&edit.col==="extensions")edit=null;render();break;
    case "save":saveEdit();break;case "cancel":edit=null;render();break;case "canceldel":delConfirm=null;render();break;
    case "saveitem":{const f=clone(itemForm);if(f.status==="filed"&&!pd(f.filedDate)){toast("Enter the date it was filed.");break;}const k=ds.key;openItem=null;itemForm=null;put("filings",k,f);toast("Saved");break;}
    case "resetitem":{const k=ds.key;openItem=null;itemForm=null;remove("filings",k);break;}
    case "newdoc":docForm={fy:String(sel),cat:"mca",title:"",ref:"",date:"",linkKey:"",file:null};render();break;
    case "canceldoc":{const back=docForm&&docForm.back,k=docForm&&docForm.linkKey;docForm=null;if(back===true){tab="overview";openItem=k;}else if(back){tab="shareholders";shView=back;}render();break;}
    case "savedoc":saveDoc();break;case "alldocs":downloadAllDocs();break;
  }});

/* ---------- boot ---------- */
function subscribe(){
  setSave("Loading…");
  const L=(col,fn)=>db.collection(col).onSnapshot(s=>{fn(s.docs.map(x=>Object.assign({},x.data(),{id:x.id})));setSave(savedTxt());render();},()=>toast("Couldn’t load "+col+"."));
  L("config",a=>{const cp=a.find(x=>x.id==="capital");if(!capDirty&&cp&&Array.isArray(cp.classes)&&cp.classes.length)capital={classes:cp.classes};const s=a.find(x=>x.id==="settings");const r=a.find(x=>x.id==="registers");if(!cfgDirty&&s){const c=clone(s);delete c.id;cfg=Object.assign(clone(CO_DEFAULT),c);}if(!regDirty&&r){const c=clone(r);delete c.id;regs=c;}});
  L("extensions",a=>exts=a);L("directors",a=>dirs=a);L("members",a=>members=a);L("sharetx",a=>stx=a);L("meetings",a=>meets=a);L("resolutions",a=>ress=a);L("events",a=>evs=a);L("docs",a=>docs=a);
  L("filings",a=>{fils={};for(const x of a){const k=x.id;const c=Object.assign({},x);delete c.id;fils[k]=c;}});
}
render();
(async()=>{isLocal=true;uid=HOST.uid||null;canWrite=!!HOST.canWrite;setSave("Loading…");
  try{db=await HOST.openDB();}catch(e){db=null;toast("Couldn’t load the secretarial records. "+(e&&e.message||""));}
  if(DEAD)return;dbReady=true;
  if(!db){render();return;}
  $("#bkBtn").hidden=false;$("#rsBtn").hidden=!canWrite;subscribe();})();


/* ---- host API ---- */
return {
  setTab(t){if(DEAD)return;const b=ROOT.querySelector('#tabs button[data-tab="'+t+'"]');if(b&&t!==tab)b.click();},
  destroy(){DEAD=true;CLEAN.forEach(f=>{try{f();}catch(_){}});CLEAN.length=0;try{if(typeof viewUrl!=="undefined"&&viewUrl)URL.revokeObjectURL(viewUrl);}catch(_){}document.body.style.overflow="";ROOT.innerHTML="";}
};
}
