#!/usr/bin/env node
/*
 * Re-ports a TruFin reference page into the app.
 *
 *   node scripts/trufin-convert.js accounts    "<path to trufin-accounts.html>"
 *   node scripts/trufin-convert.js secretarial "<path to trufin-secretarial.html>"
 *
 * Writes src/modules/trufin/<module>/engine.js (the page's own script, wrapped so
 * it renders into a host element, takes its tab from the sidebar route and stores
 * data and files on the TrustComply server) and <module>.css (the page's styles,
 * scoped under .tf-acc / .tf-cs). Fails loudly if an expected pattern is missing,
 * so a changed reference page never ports half-way.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "modules", "trufin");

function scopeCss(css, scope) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const scopeSel = (sel) =>
    sel
      .split(",")
      .map((s) => {
        s = s.trim();
        if (!s) return s;
        if (s.startsWith(":root")) return scope + s.slice(5);
        if (s === "body") return scope;
        if (s === "*") return scope + "," + scope + " *";
        return scope + " " + s;
      })
      .join(",");
  function block(src) {
    let res = "",
      j = 0;
    while (j < src.length) {
      const open = src.indexOf("{", j);
      if (open < 0) break;
      const head = src.slice(j, open).trim();
      let depth = 1,
        k = open + 1;
      while (k < src.length && depth) {
        if (src[k] === "{") depth++;
        else if (src[k] === "}") depth--;
        k++;
      }
      const body = src.slice(open + 1, k - 1);
      if (head.startsWith("@media")) {
        // dark theme dropped: the host app is light-only
        if (!/prefers-color-scheme:\s*dark/.test(head)) res += head + "{" + block(body) + "}\n";
      } else if (head.startsWith("@keyframes")) {
        res += head.replace("spin", "tf-spin") + "{" + body + "}\n";
      } else if (!/data-theme="dark"/.test(head)) {
        res += scopeSel(head) + "{" + body.replace(/animation:spin/g, "animation:tf-spin") + "}\n";
      }
      j = k;
    }
    return res;
  }
  return block(css);
}

const HOST_CSS = (scope) => `
/* ---- host integration (TrustComply shell) ---- */
${scope}{min-height:calc(100vh - 60px);font-size:14px;line-height:1.5}
${scope} .wrap{padding-inline:16px}
${scope} header.top{top:60px;z-index:20}
${scope} nav.tabs{display:none}
${scope} .scrim{z-index:1300}
${scope} .drawer{z-index:1301}
${scope} .viewer{z-index:1302}
${scope} .toast{z-index:1400}
${scope} .tip{z-index:1450}
${scope} h1,${scope} h2,${scope} h3,${scope} h4,${scope} p{letter-spacing:normal}
`;

const BOOT_NEW = (what, admin) => `isLocal=true;uid=HOST.uid||null;canWrite=!!HOST.canWrite;${admin ? "canAdmin=!!HOST.canAdmin;" : ""}
  setSave("Loading…");
  try{db=await HOST.openDB();}catch(e){db=null;toast("Couldn’t load the ${what}. "+(e&&e.message||""));}
  if(DEAD)return;
  dbReady=true;
  if(!db){render();return;}
  $("#bkBtn").hidden=false;$("#rsBtn").hidden=!canWrite;
  subscribe();`;

const COMMON = [
  ["const $=s=>document.querySelector(s);", "const $=s=>ROOT.querySelector(s);"],
  ["document.getElementById(", "byId("],
  ["document.querySelectorAll(", "ROOT.querySelectorAll("],
  ["document.addEventListener(", "onG(document,"],
  ['function setSave(s){$("#saveState")', 'function setSave(s){if(DEAD)return;$("#saveState")'],
  ['function toast(msg){const t=$("#toast")', 'function toast(msg){if(DEAD)return;const t=$("#toast")'],
  ['"Any format, up to 50 MB · kept in this browser"', '"Any format, up to 50 MB · stored on the TrustComply server"'],
  ["The file isn’t in this browser. Restore it from a backup.", "The file couldn’t be found on the server."],
];

const CONFIG = {
  accounts: {
    scope: ".tf-acc",
    fn: "Accounts",
    title: "TruFin Accounts (Taxation — Compliance module)",
    reps: [
      [/try\{const t=localStorage\.getItem\("trufin\.tab"\);if\(t\)tab=t;\}catch\(e\)\{\}\n/, ""],
      [/if\(\/\^#\([a-z|]+\)\$\/\.test\(location\.hash\)\)tab=location\.hash\.slice\(1\);\n/, ""],
      ['let tab="pl";', 'let tab=HOST.tab||"pl";let lastTab=tab;'],
      ['try{localStorage.setItem("trufin.tab",tab);}catch(_){}', ""],
      ["function render(){\n  memo={};", "function render(){\n  if(DEAD)return;\n  memo={};"],
      ["  restoreFocus(c);\n  renderExport();", "  restoreFocus(c);\n  renderExport();\n  if(tab!==lastTab){lastTab=tab;if(HOST.onTab)HOST.onTab(tab);}"],
      ['addEventListener("pagehide",flushAll);', 'onG(window,"pagehide",flushAll);'],
      ['isLocal?"Saved in this browser":"Saved"', '"Saved"'],
      ["Changes you make in this view aren’t saved. Open the page signed in to claude.ai to keep your figures.", "Couldn’t reach the TrustComply server, so changes you make here aren’t saved. Reload the page to try again."],
      ["document file(s) weren’t found in this browser and aren’t in the backup.", "document file(s) couldn’t be read from the server and aren’t in the backup."],
      ["for(const k in pend)delete pend[k];db.importAll(s);", 'for(const k in pend)delete pend[k];try{await db.importAll(s);}catch(err){toast("Couldn’t save the restored data to the server. "+(err&&err.message||""));e.target.value="";return;}'],
      ["finalisedAt:new Date().toISOString(),finalisedBy:uid||null,", 'finalisedAt:new Date().toISOString(),finalisedBy:uid||null,finalisedByName:HOST.userName||"",'],
      ["finalisedAt:null,finalisedBy:null}", "finalisedAt:null,finalisedBy:null,finalisedByName:null}"],
      ['const who=d.finalisedBy&&names[d.finalisedBy]?" by "+esc(names[d.finalisedBy]):"";', 'const who=d.finalisedByName?" by "+esc(d.finalisedByName):(d.finalisedBy&&names[d.finalisedBy]?" by "+esc(names[d.finalisedBy]):"");'],
      ['const idbPut=(k,v)=>idbOp("readwrite",s=>s.put(v,k));', "const idbPut=(k,v)=>HOST.files.put(k,v);"],
      ['const idbGet=k=>idbOp("readonly",s=>s.get(k));', "const idbGet=k=>HOST.files.get(k);"],
      ['const idbDel=k=>idbOp("readwrite",s=>s.delete(k));', "const idbDel=k=>HOST.files.del(k);"],
      [
        `  const C=window.claude;
  if(!C||!C.use){isLocal=true;db=localDB();dbReady=true;$("#bkBtn").hidden=false;$("#rsBtn").hidden=false;subscribe();return;}
  const [d,u,dl,as]=await Promise.all(["db","user","downloads","assets"].map(n=>C.use(n).catch(()=>null)));
  db=d;user=u;downloads=dl;fileCap=as;dbReady=true;
  if(user){try{uid=await user.id();}catch(_){}
    try{const w=await user.can("data.write");if(w===false)canWrite=false;}catch(_){}
    try{const a=await user.canEdit();if(a===false)canAdmin=false;}catch(_){}}
  if(!db){render();return;}
  subscribe();`,
        "  " + BOOT_NEW("accounts", true),
      ],
    ],
  },
  secretarial: {
    scope: ".tf-cs",
    fn: "Secretarial",
    title: "TruFin Secretarial (Secretarial & Corporate Compliance module)",
    reps: [
      [/try\{const t=localStorage\.getItem\("trufin\.cs\.tab"\);if\(t\)tab=t;\}catch\(e\)\{\}\n/, ""],
      [/if\(\/\^#\([a-z|]+\)\$\/\.test\(location\.hash\)\)tab=location\.hash\.slice\(1\);\n/, ""],
      ['let tab="overview";', 'let tab=HOST.tab||"overview";let lastTab=tab;'],
      ['try{localStorage.setItem("trufin.cs.tab",tab);}catch(_){}', ""],
      ["function render(){\n  renderHeader();", "function render(){\n  if(DEAD)return;\n  renderHeader();"],
      ["  restoreFocus(c);renderExport();\n}", "  restoreFocus(c);renderExport();\n  if(tab!==lastTab){lastTab=tab;if(HOST.onTab)HOST.onTab(tab);}\n}"],
      ['const b=$("#tabs [data-tab=overview] .count");if(b){b.textContent=n||"";b.hidden=!n;}', 'const b=$("#tabs [data-tab=overview] .count");if(b){b.textContent=n||"";b.hidden=!n;}if(HOST.onCount)HOST.onCount(n);'],
      ['function renderExport(){const el=$("#exp")', 'function renderExport(){if(DEAD)return;const el=$("#exp")'],
      ['const savedTxt=()=>isLocal?"Saved in this browser":"Saved";', 'const savedTxt=()=>"Saved";'],
      ["Changes you make in this view aren’t saved. Open the page signed in to claude.ai to keep your records.", "Couldn’t reach the TrustComply server, so changes you make here aren’t saved. Reload the page to try again."],
      ['db.importAll(s);toast("Restored your secretarial records");', 'try{await db.importAll(s);}catch(err){toast("Couldn’t save the restored records to the server. "+(err&&err.message||""));e.target.value="";return;}toast("Restored your secretarial records");'],
      ['const idbPut=(k,v)=>idbOp("readwrite",s=>s.put(v,k)),idbGet=k=>idbOp("readonly",s=>s.get(k)),idbDel=k=>idbOp("readwrite",s=>s.delete(k));', "const idbPut=(k,v)=>HOST.files.put(k,v),idbGet=k=>HOST.files.get(k),idbDel=k=>HOST.files.del(k);"],
      [
        `(async()=>{const C=window.claude;
  if(!C||!C.use){isLocal=true;db=localDB();dbReady=true;$("#bkBtn").hidden=false;$("#rsBtn").hidden=false;subscribe();return;}
  const [d,u,dl,as]=await Promise.all(["db","user","downloads","assets"].map(n=>C.use(n).catch(()=>null)));db=d;user=u;downloads=dl;fileCap=as;dbReady=true;
  if(user){try{uid=await user.id();}catch(_){}try{if(await user.can("data.write")===false)canWrite=false;}catch(_){}}
  if(!db){render();return;}subscribe();})();`,
        "(async()=>{" + BOOT_NEW("secretarial records") + "})();",
      ],
    ],
  },
};

function convert(name, file) {
  const cfg = CONFIG[name];
  if (!cfg) throw new Error("Unknown module " + name + " (use accounts or secretarial)");
  const html = fs.readFileSync(file, "utf8").split("\r\n").join("\n");

  // The page's own stylesheet is the <style> block that defines its tokens.
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  const main = styles.find((m) => m[1].includes("--f-display"));
  if (!main) throw new Error(name + ": page stylesheet not found");
  const scriptStart = html.indexOf("<script>");
  let markup = html.slice(main.index + main[0].length, scriptStart);
  markup = markup.slice(markup.indexOf('<div class="wrap">')).trim();
  let js = html.slice(scriptStart + 8, html.lastIndexOf("</script>")).trim();

  if (!js.startsWith("(function(){")) throw new Error(name + ": unexpected script start");
  js = js.slice("(function(){".length, js.lastIndexOf("})();")).replace(/^\s*"use strict";/, "");

  for (const [a, b] of COMMON.concat(cfg.reps)) {
    if (a instanceof RegExp) {
      if (!a.test(js)) throw new Error(name + ": missing pattern " + a);
      js = js.replace(a, b);
    } else {
      if (!js.includes(a)) throw new Error(name + ": missing pattern: " + a.slice(0, 90));
      js = js.split(a).join(b);
    }
  }

  const src = `/* eslint-disable */
// ${cfg.title}, ported from the TruFin reference page (${path.basename(file)})
// by scripts/trufin-convert.js. Do not edit by hand: re-run the script instead.
// The page's own logic is kept as-is; only the host hooks differ: it renders into
// ROOT, takes its tab from the sidebar route, and stores data and files on the
// TrustComply server (HOST.openDB / HOST.files) instead of the browser.
const MARKUP=${JSON.stringify(markup)};

export function mount${cfg.fn}(ROOT,HOST){
"use strict";
/* ---- host integration ---- */
let DEAD=false;const CLEAN=[];
const onG=(t,ev,fn,o)=>{t.addEventListener(ev,fn,o);CLEAN.push(()=>t.removeEventListener(ev,fn,o));};
const byId=id=>{const el=document.getElementById(id);return el&&ROOT.contains(el)?el:null;};
ROOT.innerHTML=MARKUP;
${js}
/* ---- host API ---- */
return {
  setTab(t){if(DEAD)return;const b=ROOT.querySelector('#tabs button[data-tab="'+t+'"]');if(b&&t!==tab)b.click();},
  destroy(){DEAD=true;CLEAN.forEach(f=>{try{f();}catch(_){}});CLEAN.length=0;try{if(typeof viewUrl!=="undefined"&&viewUrl)URL.revokeObjectURL(viewUrl);}catch(_){}document.body.style.overflow="";ROOT.innerHTML="";}
};
}
`;
  fs.mkdirSync(path.join(OUT, name), { recursive: true });
  fs.writeFileSync(path.join(OUT, name, "engine.js"), src);
  fs.writeFileSync(path.join(OUT, name, name + ".css"), "/* Scoped from the TruFin reference page by scripts/trufin-convert.js. */\n" + scopeCss(main[1], cfg.scope) + HOST_CSS(cfg.scope));
  const tabs = [...markup.matchAll(/data-tab="([a-z]+)"/g)].map((m) => m[1]);
  console.log(`${name}: ok · ${Math.round(src.length / 1024)} KB · tabs: ${tabs.join(", ")}`);
}

const [, , name, file] = process.argv;
if (!name || !file) {
  console.error("Usage: node scripts/trufin-convert.js <accounts|secretarial> <reference.html>");
  process.exit(1);
}
convert(name, file);
