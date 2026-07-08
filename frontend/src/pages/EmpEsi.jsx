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

const ESI_FIELDS = [["employee", "Employee 0.75%"], ["employer", "Employer 3.25%"]];
const SLOTS = [["challan", "Challan"], ["account", "A/c"], ["receipt", "Receipt"]];
const periodLabel = (p) => { const [y, m] = p.split("-"); return `${MN[+m - 1]} ${y}`; };
const dueOf = (m) => `${m.month === 12 ? m.year + 1 : m.year}-${String(m.month === 12 ? 1 : m.month + 1).padStart(2, "0")}-15`;
const isOverdue = (o, due) => !["fd", "ak", "na"].includes(o.status) && daysTo(due) < 0;

export default function EmpEsi() {
  const { fy } = useScope();
  const toast = useToast();
  const canEdit = canCreate(useCurrentUser());
  const [state, setState] = useState({ months: [], loading: true, error: null });
  const [configs, setConfigs] = useState({}); // branch -> config
  const [overlays, setOverlays] = useState({}); // "period|branch" -> {status,ref,slots}
  const [drafts, setDrafts] = useState({}); // "period|branch" -> ref draft
  const [cfgDraft, setCfgDraft] = useState({}); // branch -> {esiCode, state}
  const [sel, setSel] = useState(null);
  const fileRef = useRef(null);
  const pending = useRef(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([getPayrollSyncApi(fy, "branch"), listBranchConfigsApi(), listEmpFilingsApi(fy, "ESI")])
      .then(([pace, cfgs, ovl]) => {
        const cmap = {}; (cfgs || []).forEach((c) => { cmap[c.branch] = c; });
        const omap = {}; (ovl || []).forEach((o) => { omap[`${o.period}|${o.branch}`] = { status: o.status, ref: o.ref, slots: o.slots || {} }; });
        setConfigs(cmap); setOverlays(omap); setDrafts({}); setCfgDraft({});
        setState({ months: pace.months || [], loading: false, error: pace.reachable ? null : "PACE unreachable" });
      })
      .catch((e) => setState({ months: [], loading: false, error: e.message || "Failed to load" }));
  }, [fy]);
  useEffect(() => { load(); }, [load]);

  // period+branch → ESI amounts, keyed per branch.
  const perBranch = useMemo(() => {
    const out = {};
    state.months.forEach((m) => (m.branches || []).forEach((b) => {
      (out[b.branch] = out[b.branch] || []).push({ period: m.period, due: dueOf(m), esi: (b.statutory && b.statutory.esi) || {} });
    }));
    return out;
  }, [state.months]);
  const branches = useMemo(() => Object.keys(perBranch).sort(), [perBranch]);

  useEffect(() => { if (branches.length && (!sel || !branches.includes(sel))) setSel(branches[0]); }, [branches, sel]);

  const k = (p, b) => `${p}|${b}`;
  const ov = (p, b) => overlays[k(p, b)] || { status: "ns", ref: "", slots: {} };
  const cfg = (b) => configs[b] || { esiCode: "", state: "" };

  const persist = async (period, branch, patch) => {
    try {
      const row = await upsertEmpFilingApi({ fy, sub: "ESI", period, branch, ...patch });
      setOverlays((m) => ({ ...m, [k(period, branch)]: { status: row.status, ref: row.ref, slots: row.slots || {} } }));
      return row;
    } catch (e) { toast(e.message || "Save failed", "error"); }
  };
  const saveRef = async (p, b) => { await persist(p, b, { ref: drafts[k(p, b)] ?? ov(p, b).ref }); toast(`ESI ${periodLabel(p)} saved`, "success"); };
  const advance = async (p, b) => {
    const nx = nextStatus(ov(p, b).status); if (!nx) return;
    const patch = { status: nx }; if (nx === "fd") patch.filed = new Date().toISOString().slice(0, 10);
    await persist(p, b, patch); toast(`ESI ${periodLabel(p)} → ${STATUS_LABEL[nx]}`, "success");
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
    const d = cfgDraft[b] || {};
    try {
      const row = await upsertBranchConfigApi({ branch: b, esiCode: d.esiCode ?? cfg(b).esiCode, state: d.state ?? cfg(b).state });
      setConfigs((m) => ({ ...m, [b]: row })); toast(`${b} saved`, "success");
    } catch (e) { toast(e.message || "Save failed", "error"); }
  };

  // FY-wide KPIs
  const allRows = branches.flatMap((b) => perBranch[b].map((r) => ({ ...r, branch: b })));
  const totalFY = allRows.reduce((s, r) => s + (r.esi.total || 0), 0);
  const filed = allRows.filter((r) => ["fd", "ak"].includes(ov(r.period, r.branch).status)).length;
  const overdue = allRows.filter((r) => isOverdue(ov(r.period, r.branch), r.due)).length;
  const attached = allRows.reduce((s, r) => s + Object.keys(ov(r.period, r.branch).slots || {}).length, 0);

  const selRows = sel ? perBranch[sel] || [] : [];

  return (
    <Box>
      <PageHead
        title="ESI — Employees’ State Insurance"
        sub="Paid location-wise against each branch sub-code, by the 15th of the following month. Amounts sync per branch from PACE; map each branch to its ESI sub-code, key the challan number after payment, and attach the three documents."
        statute="ESI Act 1948 · Reg. 31"
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
          {/* By-branch summary + sub-code mapping */}
          <SectionCard title="By branch" chip="Sub-codes mapped here">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={th}>Branch</TableCell>
                    <TableCell sx={th}>State</TableCell>
                    <TableCell sx={th}>ESI sub-code</TableCell>
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
                    const t = lr.reduce((x, r) => x + (r.esi.total || 0), 0);
                    const f = lr.filter((r) => ["fd", "ak"].includes(ov(r.period, b).status)).length;
                    const o = lr.filter((r) => isOverdue(ov(r.period, b), r.due)).length;
                    const at = lr.reduce((x, r) => x + Object.keys(ov(r.period, b).slots || {}).length, 0);
                    const c = cfg(b); const cd = cfgDraft[b] || {};
                    return (
                      <TableRow key={b} sx={b === sel ? { bgcolor: "brand.tealTint" } : {}}>
                        <TableCell sx={{ ...td }}>
                          <Box component="button" onClick={() => setSel(b)} sx={{ border: "none", background: "none", color: "brand.tealDark", fontWeight: 700, cursor: "pointer", fontSize: 12.5, textAlign: "left", p: 0 }}>{b}</Box>
                        </TableCell>
                        <TableCell sx={td}>
                          {canEdit ? <TextField size="small" variant="standard" value={cd.state ?? c.state} onChange={(e) => setCfgDraft((x) => ({ ...x, [b]: { ...x[b], state: e.target.value } }))} placeholder="State" sx={{ width: 96, "& input": { fontSize: 12 } }} /> : (c.state || "—")}
                        </TableCell>
                        <TableCell sx={td}>
                          {canEdit ? <TextField size="small" variant="standard" value={cd.esiCode ?? c.esiCode} onChange={(e) => setCfgDraft((x) => ({ ...x, [b]: { ...x[b], esiCode: e.target.value } }))} placeholder="52-00-…" sx={{ width: 150, "& input": { ...mono, fontSize: 11 } }} /> : (c.esiCode || "—")}
                        </TableCell>
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

          {/* Branch chips */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            {branches.map((b) => (
              <Box component="button" key={b} onClick={() => setSel(b)} sx={{ border: "1px solid", borderColor: b === sel ? "brand.green" : "brand.line", bgcolor: b === sel ? "brand.green" : "#fff", color: b === sel ? "#fff" : "text.secondary", borderRadius: "20px", px: 1.75, py: 0.75, fontSize: 12.5, fontWeight: b === sel ? 700 : 500, cursor: "pointer" }}>{b}</Box>
            ))}
          </Box>

          {/* Selected branch ledger */}
          <SectionCard title={sel} chip={cfg(sel).esiCode || "sub-code pending"}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 880 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={th}>Month</TableCell>
                    <TableCell sx={th}>Due</TableCell>
                    {ESI_FIELDS.map(([, l]) => <TableCell key={l} sx={thR}>{l}</TableCell>)}
                    <TableCell sx={thR}>Total</TableCell>
                    <TableCell sx={th}>Challan no.</TableCell>
                    <TableCell sx={th}>Attachments</TableCell>
                    <TableCell sx={th}>Status</TableCell>
                    <TableCell sx={th}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selRows.map((r) => {
                    const o = ov(r.period, sel);
                    const late = isOverdue(o, r.due);
                    return (
                      <TableRow key={r.period} sx={late ? { bgcolor: "brand.redTint" } : {}}>
                        <TableCell sx={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{periodLabel(r.period)}</TableCell>
                        <TableCell sx={{ ...td, ...mono, fontSize: 11, whiteSpace: "nowrap", color: late ? "brand.red" : "text.secondary" }}>{fmt(r.due)}</TableCell>
                        {ESI_FIELDS.map(([f]) => <TableCell key={f} sx={tdR}>{inr(r.esi[f] || 0)}</TableCell>)}
                        <TableCell sx={{ ...tdR, fontWeight: 700 }}>{inr(r.esi.total || 0)}</TableCell>
                        <TableCell sx={td}>
                          <TextField size="small" variant="standard" placeholder="challan"
                            value={drafts[k(r.period, sel)] ?? o.ref} disabled={!canEdit}
                            onChange={(e) => setDrafts((d) => ({ ...d, [k(r.period, sel)]: e.target.value }))}
                            sx={{ width: 110, "& input": { ...mono, fontSize: 11 } }} />
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
              Employee 0.75% + employer 3.25% of ESI wages at this unit. Amounts read-only (source: PACE); sub-code, challan reference and documents are entered here. Simple interest 12% p.a. on delayed payment.
            </Typography>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
