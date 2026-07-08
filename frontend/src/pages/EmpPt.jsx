import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, CircularProgress, Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import KpiCard from "../components/common/KpiCard";
import Pill from "../components/common/Pill";
import { useScope, useCurrentUser } from "../store/hooks";
import { useToast } from "../context/ToastContext";
import { canCreate } from "../data/access";
import { getPayrollSyncApi } from "../api/payroll";
import { listEmpFilingsApi, upsertEmpFilingApi } from "../api/empFilings";
import { listBranchConfigsApi, upsertBranchConfigApi } from "../api/branchConfigs";
import { readFiles, MAX_DOC_MB } from "../utils/docs";
import { fmt, daysTo, inr, dext } from "../data/helpers";
import { MN, STATUS_LABEL, nextStatus, advLabel } from "../data/constants";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const thR = { ...th, textAlign: "right" };
const td = { py: 1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", fontSize: "12px", verticalAlign: "top" };
const tdR = { ...td, ...mono, textAlign: "right", whiteSpace: "nowrap" };

const SLOTS = [["challan", "Challan"], ["account", "A/c"], ["receipt", "Receipt"]];
const periodLabel = (p) => { const [y, m] = p.split("-"); return `${MN[+m - 1]} ${y}`; };
// PT due = configured due-day of the following month (clamped to month length).
const dueOf = (yr, mo1, dueDay) => {
  const y = mo1 === 12 ? yr + 1 : yr;
  const nm = mo1 === 12 ? 1 : mo1 + 1; // 1-indexed next month
  const dim = new Date(y, nm, 0).getDate();
  const day = Math.min(Math.max(parseInt(dueDay, 10) || 10, 1), dim);
  return `${y}-${String(nm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
const isOverdue = (o, due) => !["fd", "ak", "na"].includes(o.status) && daysTo(due) < 0;

export default function EmpPt() {
  const { fy } = useScope();
  const toast = useToast();
  const canEdit = canCreate(useCurrentUser());
  const [state, setState] = useState({ months: [], loading: true, error: null });
  const [configs, setConfigs] = useState({});
  const [overlays, setOverlays] = useState({});
  const [drafts, setDrafts] = useState({});
  const [cfgDraft, setCfgDraft] = useState({});
  const [sel, setSel] = useState(null);
  const fileRef = useRef(null);
  const pending = useRef(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([getPayrollSyncApi(fy, "branch"), listBranchConfigsApi(), listEmpFilingsApi(fy, "PT")])
      .then(([pace, cfgs, ovl]) => {
        const cmap = {}; (cfgs || []).forEach((c) => { cmap[c.branch] = c; });
        const omap = {}; (ovl || []).forEach((o) => { omap[`${o.period}|${o.branch}`] = { status: o.status, ref: o.ref, slots: o.slots || {} }; });
        setConfigs(cmap); setOverlays(omap); setDrafts({}); setCfgDraft({});
        setState({ months: pace.months || [], loading: false, error: pace.reachable ? null : "PACE unreachable" });
      })
      .catch((e) => setState({ months: [], loading: false, error: e.message || "Failed to load" }));
  }, [fy]);
  useEffect(() => { load(); }, [load]);

  const perBranch = useMemo(() => {
    const out = {};
    state.months.forEach((m) => (m.branches || []).forEach((b) => {
      (out[b.branch] = out[b.branch] || []).push({ period: m.period, year: m.year, month: m.month, employees: b.employees || 0, pt: (b.statutory && b.statutory.pt) || 0 });
    }));
    return out;
  }, [state.months]);
  const branches = useMemo(() => Object.keys(perBranch).sort(), [perBranch]);
  useEffect(() => { if (branches.length && (!sel || !branches.includes(sel))) setSel(branches[0]); }, [branches, sel]);

  const k = (p, b) => `${p}|${b}`;
  const ov = (p, b) => overlays[k(p, b)] || { status: "ns", ref: "", slots: {} };
  const cfg = (b) => configs[b] || { ptRegn: "", state: "", ptDueDay: 10 };
  const rowDue = (r, b) => dueOf(r.year, r.month, cfg(b).ptDueDay);

  const persist = async (period, branch, patch) => {
    try {
      const row = await upsertEmpFilingApi({ fy, sub: "PT", period, branch, ...patch });
      setOverlays((m) => ({ ...m, [k(period, branch)]: { status: row.status, ref: row.ref, slots: row.slots || {} } }));
      return row;
    } catch (e) { toast(e.message || "Save failed", "error"); }
  };
  const saveRef = async (p, b) => { await persist(p, b, { ref: drafts[k(p, b)] ?? ov(p, b).ref }); toast(`PT ${periodLabel(p)} saved`, "success"); };
  const advance = async (p, b) => {
    const nx = nextStatus(ov(p, b).status); if (!nx) return;
    const patch = { status: nx }; if (nx === "fd") patch.filed = new Date().toISOString().slice(0, 10);
    await persist(p, b, patch); toast(`PT ${periodLabel(p)} → ${STATUS_LABEL[nx]}`, "success");
  };
  const pickSlot = (p, b, key) => { pending.current = { p, b, key }; fileRef.current?.click(); };
  const onFile = (e) => {
    const pd = pending.current; if (!pd || !e.target.files.length) return;
    readFiles(e.target.files, (n) => toast(`Skipped ${n} — over ${MAX_DOC_MB} MB.`, "warning")).then(async (docs) => {
      if (docs[0]) { await persist(pd.p, pd.b, { slots: { ...ov(pd.p, pd.b).slots, [pd.key]: docs[0] } }); toast("Attached", "success"); }
      e.target.value = "";
    });
  };
  const removeSlot = async (p, b, key) => { const s = { ...ov(p, b).slots }; delete s[key]; await persist(p, b, { slots: s }); };

  const saveCfg = async (b) => {
    const d = cfgDraft[b] || {}; const c = cfg(b);
    try {
      const row = await upsertBranchConfigApi({ branch: b, ptRegn: d.ptRegn ?? c.ptRegn, state: d.state ?? c.state, ptDueDay: d.ptDueDay ?? c.ptDueDay });
      setConfigs((m) => ({ ...m, [b]: row })); toast(`${b} saved`, "success");
    } catch (e) { toast(e.message || "Save failed", "error"); }
  };

  const allRows = branches.flatMap((b) => perBranch[b].map((r) => ({ ...r, branch: b, due: rowDue(r, b) })));
  const totalFY = allRows.reduce((s, r) => s + (r.pt || 0), 0);
  const filed = allRows.filter((r) => ["fd", "ak"].includes(ov(r.period, r.branch).status)).length;
  const overdue = allRows.filter((r) => isOverdue(ov(r.period, r.branch), r.due)).length;
  const attached = allRows.reduce((s, r) => s + Object.keys(ov(r.period, r.branch).slots || {}).length, 0);
  const selRows = sel ? perBranch[sel] || [] : [];

  return (
    <Box>
      <PageHead
        title="Professional Tax"
        sub="State legislation, paid location-wise — slabs, forms and due dates differ per state. Amounts sync per branch from PACE; map each branch to its PT registration, state and due-day, key the challan reference and attach the documents."
        statute="State Professions Tax Acts · Art. 276 (₹2,500/yr ceiling)"
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={state.loading} sx={{ color: "brand.tealDark" }}>Refresh</Button>
      </Box>
      <input ref={fileRef} type="file" hidden onChange={onFile} />

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6} sm={3}><KpiCard value={inr(totalFY)} label={`Remitted FY ${fy} · all branches`} small /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={`${filed}/${allRows.length}`} label="Location-months filed" tone={allRows.length && filed === allRows.length ? "good" : "default"} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={overdue} label="Overdue" tone={overdue ? "bad" : "good"} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={`${attached}/${allRows.length * 3}`} label="Attachments (3 each)" tone={allRows.length && attached >= allRows.length * 3 ? "good" : "default"} /></Grid>
      </Grid>

      {state.loading ? (
        <SectionCard><Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box></SectionCard>
      ) : state.error ? (
        <SectionCard><Box sx={{ py: 2.5, textAlign: "center", color: "brand.red", fontSize: 13 }}>Couldn’t reach PACE — {state.error}. Refresh.</Box></SectionCard>
      ) : branches.length === 0 ? (
        <SectionCard><Box sx={{ py: 3, textAlign: "center", color: "text.secondary", fontSize: 13 }}>No branch payroll in PACE for FY {fy} yet.</Box></SectionCard>
      ) : (
        <>
          <SectionCard title="By branch" chip="Registration & due-day mapped here">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 960 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={th}>Branch</TableCell>
                    <TableCell sx={th}>State</TableCell>
                    <TableCell sx={th}>PT registration</TableCell>
                    <TableCell sx={th}>Due day</TableCell>
                    <TableCell sx={thR}>Remitted FY</TableCell>
                    <TableCell sx={th}>Filed</TableCell>
                    <TableCell sx={th}>Overdue</TableCell>
                    <TableCell sx={th}>Attach.</TableCell>
                    {canEdit && <TableCell sx={th}></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches.map((b) => {
                    const lr = perBranch[b];
                    const t = lr.reduce((x, r) => x + (r.pt || 0), 0);
                    const f = lr.filter((r) => ["fd", "ak"].includes(ov(r.period, b).status)).length;
                    const o = lr.filter((r) => isOverdue(ov(r.period, b), rowDue(r, b))).length;
                    const at = lr.reduce((x, r) => x + Object.keys(ov(r.period, b).slots || {}).length, 0);
                    const c = cfg(b); const cd = cfgDraft[b] || {};
                    return (
                      <TableRow key={b} sx={b === sel ? { bgcolor: "brand.tealTint" } : {}}>
                        <TableCell sx={td}><Box component="button" onClick={() => setSel(b)} sx={{ border: "none", background: "none", color: "brand.tealDark", fontWeight: 700, cursor: "pointer", fontSize: 12.5, textAlign: "left", p: 0 }}>{b}</Box></TableCell>
                        <TableCell sx={td}>{canEdit ? <TextField size="small" variant="standard" value={cd.state ?? c.state} onChange={(e) => setCfgDraft((x) => ({ ...x, [b]: { ...x[b], state: e.target.value } }))} placeholder="State" sx={{ width: 96, "& input": { fontSize: 12 } }} /> : (c.state || "—")}</TableCell>
                        <TableCell sx={td}>{canEdit ? <TextField size="small" variant="standard" value={cd.ptRegn ?? c.ptRegn} onChange={(e) => setCfgDraft((x) => ({ ...x, [b]: { ...x[b], ptRegn: e.target.value } }))} placeholder="PTIN / PTRC" sx={{ width: 150, "& input": { ...mono, fontSize: 11 } }} /> : (c.ptRegn || "—")}</TableCell>
                        <TableCell sx={td}>{canEdit ? <TextField size="small" variant="standard" value={cd.ptDueDay ?? c.ptDueDay} onChange={(e) => setCfgDraft((x) => ({ ...x, [b]: { ...x[b], ptDueDay: e.target.value } }))} sx={{ width: 44, "& input": { ...mono, fontSize: 11, textAlign: "center" } }} /> : (c.ptDueDay || 10)}</TableCell>
                        <TableCell sx={{ ...tdR, fontWeight: 700 }}>{inr(t)}</TableCell>
                        <TableCell sx={{ ...td, ...mono, fontSize: 11.5 }}>{f}/{lr.length}</TableCell>
                        <TableCell sx={{ ...td, ...mono, fontSize: 11.5, color: o ? "brand.red" : "text.secondary", fontWeight: o ? 700 : 400 }}>{o}</TableCell>
                        <TableCell sx={{ ...td, ...mono, fontSize: 11.5 }}>{at}/{lr.length * 3}</TableCell>
                        {canEdit && <TableCell sx={td}><Button size="small" variant="outlined" onClick={() => saveCfg(b)} sx={{ fontSize: 10.5, py: "2px", px: 1, borderColor: "brand.line", color: "text.primary" }}>Save</Button></TableCell>}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            {branches.map((b) => (
              <Box component="button" key={b} onClick={() => setSel(b)} sx={{ border: "1px solid", borderColor: b === sel ? "brand.green" : "brand.line", bgcolor: b === sel ? "brand.green" : "#fff", color: b === sel ? "#fff" : "text.secondary", borderRadius: "20px", px: 1.75, py: 0.75, fontSize: 12.5, fontWeight: b === sel ? 700 : 500, cursor: "pointer" }}>{b}</Box>
            ))}
          </Box>

          <SectionCard title={sel} chip={cfg(sel).ptRegn || "registration pending"}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={th}>Month</TableCell>
                    <TableCell sx={th}>Due</TableCell>
                    <TableCell sx={thR}>Employees</TableCell>
                    <TableCell sx={thR}>PT deducted</TableCell>
                    <TableCell sx={th}>CTD ref / challan</TableCell>
                    <TableCell sx={th}>Attachments</TableCell>
                    <TableCell sx={th}>Status</TableCell>
                    <TableCell sx={th}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selRows.map((r) => {
                    const o = ov(r.period, sel);
                    const due = rowDue(r, sel);
                    const late = isOverdue(o, due);
                    return (
                      <TableRow key={r.period} sx={late ? { bgcolor: "brand.redTint" } : {}}>
                        <TableCell sx={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{periodLabel(r.period)}</TableCell>
                        <TableCell sx={{ ...td, ...mono, fontSize: 11, whiteSpace: "nowrap", color: late ? "brand.red" : "text.secondary" }}>{fmt(due)}</TableCell>
                        <TableCell sx={tdR}>{r.employees}</TableCell>
                        <TableCell sx={{ ...tdR, fontWeight: 700 }}>{inr(r.pt || 0)}</TableCell>
                        <TableCell sx={td}>
                          <TextField size="small" variant="standard" placeholder="CTD ref"
                            value={drafts[k(r.period, sel)] ?? o.ref} disabled={!canEdit}
                            onChange={(e) => setDrafts((d) => ({ ...d, [k(r.period, sel)]: e.target.value }))}
                            sx={{ width: 120, "& input": { ...mono, fontSize: 11 } }} />
                        </TableCell>
                        <TableCell sx={td}>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                            {SLOTS.map(([key, label]) => {
                              const doc = o.slots[key];
                              return doc ? (
                                <Box key={key} sx={{ ...mono, fontSize: 10, display: "inline-flex", alignItems: "center", gap: 0.5, border: "1px solid", borderColor: "brand.tealDark", bgcolor: "#DFF5EF", borderRadius: "6px", px: 0.75, py: "2px", whiteSpace: "nowrap" }} title={doc.name}>
                                  <Box component="a" href={doc.data} download={doc.name} sx={{ color: "brand.tealDark", textDecoration: "none" }}>↓ {label} ({dext(doc.name)})</Box>
                                  {canEdit && <Box component="button" onClick={() => removeSlot(r.period, sel, key)} sx={{ border: "none", background: "none", color: "brand.red", cursor: "pointer", p: 0, fontSize: 11 }}>✕</Box>}
                                </Box>
                              ) : canEdit ? (
                                <Box component="button" key={key} onClick={() => pickSlot(r.period, sel, key)} sx={{ ...mono, fontSize: 10, border: "1px dashed", borderColor: "brand.teal", color: "brand.tealDark", bgcolor: "brand.tealTint", borderRadius: "6px", px: 0.75, py: "2px", cursor: "pointer", whiteSpace: "nowrap", "&:hover": { bgcolor: "#D3F1EA" } }}>+ {label}</Box>
                              ) : (
                                <Box key={key} sx={{ ...mono, fontSize: 10, color: "text.secondary" }}>— {label}</Box>
                              );
                            })}
                          </Box>
                        </TableCell>
                        <TableCell sx={td}><Pill kind={o.status}>{STATUS_LABEL[o.status]}</Pill></TableCell>
                        <TableCell sx={td}>
                          {canEdit && (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                              <Button size="small" variant="outlined" onClick={() => saveRef(r.period, sel)} sx={{ fontSize: 10.5, py: "2px", px: 1, borderColor: "brand.line", color: "text.primary" }}>Save</Button>
                              {nextStatus(o.status) && <Button size="small" variant="contained" onClick={() => advance(r.period, sel)} sx={{ fontSize: 10.5, py: "2px", px: 1, bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>{advLabel(o.status)}</Button>}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1.5 }}>
              PT is state legislation — slabs and due dates differ per state (set the due-day per branch above). Amounts read-only (source: PACE); registration, challan reference and documents are entered here. Company enrolment PT (Form II) is a separate annual payment.
            </Typography>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
