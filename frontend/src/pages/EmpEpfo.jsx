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
import { useScope } from "../store/hooks";
import { useToast } from "../context/ToastContext";
import { getPayrollSyncApi } from "../api/payroll";
import { listEmpFilingsApi, upsertEmpFilingApi } from "../api/empFilings";
import { readFiles, MAX_DOC_MB } from "../utils/docs";
import { fmt, daysTo, inr, dext } from "../data/helpers";
import { MN, STATUS_LABEL, nextStatus, advLabel } from "../data/constants";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const thR = { ...th, textAlign: "right" };
const td = { py: 1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", fontSize: "12px", verticalAlign: "top" };
const tdR = { ...td, ...mono, textAlign: "right", whiteSpace: "nowrap" };

// PACE PF line-items → the EPFO challan columns (read-only, from PACE).
const PF_FIELDS = [
  ["employee", "Employee 12%"],
  ["employer", "Employer 3.67%"],
  ["eps", "EPS 8.33%"],
  ["edli", "EDLI 0.5%"],
  ["admin", "Admin 0.5%"],
];
const SLOTS = [["challan", "Challan"], ["account", "A/c"], ["receipt", "Receipt"]];
const STATUS_KIND = { ns: "ns", ip: "ip", ps: "ps", fd: "fd", ak: "ak", na: "na" };

const periodLabel = (p) => { const [y, m] = p.split("-"); return `${MN[+m - 1]} ${y}`; };
// EPFO due = 15th of the month following the payroll period.
const dueOf = (m) => `${m.month === 12 ? m.year + 1 : m.year}-${String(m.month === 12 ? 1 : m.month + 1).padStart(2, "0")}-15`;
const isOverdue = (o, due) => !["fd", "ak", "na"].includes(o.status) && daysTo(due) < 0;

export default function EmpEpfo() {
  const { fy } = useScope();
  const toast = useToast();
  const [state, setState] = useState({ months: [], loading: true, error: null });
  const [overlays, setOverlays] = useState({}); // period -> {status, ref, slots}
  const [drafts, setDrafts] = useState({}); // period -> ref draft
  const fileRef = useRef(null);
  const pending = useRef(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([getPayrollSyncApi(fy), listEmpFilingsApi(fy, "EPFO")])
      .then(([pace, ovl]) => {
        const map = {};
        (ovl || []).forEach((o) => { map[o.period] = { status: o.status, ref: o.ref, slots: o.slots || {} }; });
        setOverlays(map);
        setDrafts({});
        setState({ months: pace.months || [], loading: false, error: pace.reachable ? null : "PACE unreachable" });
      })
      .catch((e) => setState({ months: [], loading: false, error: e.message || "Failed to load" }));
  }, [fy]);

  useEffect(() => { load(); }, [load]);

  const ov = (p) => overlays[p] || { status: "ns", ref: "", slots: {} };

  const persist = async (period, patch) => {
    try {
      const row = await upsertEmpFilingApi({ fy, sub: "EPFO", period, ...patch });
      setOverlays((m) => ({ ...m, [period]: { status: row.status, ref: row.ref, slots: row.slots || {} } }));
      return row;
    } catch (e) {
      toast(e.message || "Save failed", "error");
    }
  };

  const saveRef = async (period) => {
    await persist(period, { ref: drafts[period] ?? ov(period).ref });
    toast(`EPFO ${periodLabel(period)} saved`, "success");
  };
  const advance = async (period) => {
    const cur = ov(period);
    const nx = nextStatus(cur.status);
    if (!nx) return;
    const patch = { status: nx };
    if (nx === "fd") patch.filed = new Date().toISOString().slice(0, 10);
    await persist(period, patch);
    toast(`EPFO ${periodLabel(period)} → ${STATUS_LABEL[nx]}`, "success");
  };
  const pickSlot = (period, key) => { pending.current = { period, key }; fileRef.current?.click(); };
  const onFile = (e) => {
    const p = pending.current; if (!p || !e.target.files.length) return;
    readFiles(e.target.files, (n) => toast(`Skipped ${n} — over ${MAX_DOC_MB} MB.`, "warning")).then(async (docs) => {
      if (docs[0]) {
        const slots = { ...ov(p.period).slots, [p.key]: docs[0] };
        await persist(p.period, { slots });
        toast(`${SLOTS.find((s) => s[0] === p.key)[1]} attached`, "success");
      }
      e.target.value = "";
    });
  };
  const removeSlot = async (period, key) => {
    const slots = { ...ov(period).slots }; delete slots[key];
    await persist(period, { slots });
  };

  const rows = useMemo(
    () => state.months.map((m) => ({ ...m, due: dueOf(m), pf: (m.statutory && m.statutory.pf) || {} })),
    [state.months]
  );

  const totalFY = rows.reduce((s, r) => s + (r.pf.total || 0), 0);
  const filed = rows.filter((r) => ["fd", "ak"].includes(ov(r.period).status)).length;
  const overdue = rows.filter((r) => isOverdue(ov(r.period), r.due)).length;
  const attached = rows.reduce((s, r) => s + Object.keys(ov(r.period).slots || {}).length, 0);

  return (
    <Box>
      <PageHead
        title="EPFO — Provident Fund"
        sub="Consolidated remittance — one ECR + challan under the single establishment code covers every branch, by the 15th of the following month. Amounts are pulled live from PACE; key the TRRN/CRN after payment and attach the challan, account details and receipt."
        statute="EPF & MP Act 1952 · Para 38, EPF Scheme"
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={state.loading} sx={{ color: "brand.tealDark" }}>Refresh</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6} sm={3}><KpiCard value={inr(totalFY)} label={`Remitted FY ${fy}`} small /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={`${filed}/${rows.length}`} label="Months filed" tone={rows.length && filed === rows.length ? "good" : "default"} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={overdue} label="Overdue" tone={overdue ? "bad" : "good"} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={`${attached}/${rows.length * 3}`} label="Attachments (3 each)" tone={rows.length && attached >= rows.length * 3 ? "good" : "default"} /></Grid>
      </Grid>

      <SectionCard title="EPFO ledger" chip="Amounts synced from PACE">
        <input ref={fileRef} type="file" hidden onChange={onFile} />
        {state.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box>
        ) : state.error ? (
          <Box sx={{ py: 2.5, textAlign: "center", color: "brand.red", fontSize: 13 }}>Couldn’t reach PACE — {state.error}. Refresh.</Box>
        ) : rows.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center", color: "text.secondary", fontSize: 13 }}>No payroll runs in PACE for FY {fy} yet.</Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 1040 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={th}>Month</TableCell>
                  <TableCell sx={th}>Due</TableCell>
                  {PF_FIELDS.map(([, l]) => <TableCell key={l} sx={thR}>{l}</TableCell>)}
                  <TableCell sx={thR}>Total</TableCell>
                  <TableCell sx={th}>TRRN / CRN</TableCell>
                  <TableCell sx={th}>Attachments</TableCell>
                  <TableCell sx={th}>Status</TableCell>
                  <TableCell sx={th}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const o = ov(r.period);
                  const late = isOverdue(o, r.due);
                  return (
                    <TableRow key={r.period} sx={late ? { bgcolor: "brand.redTint" } : {}}>
                      <TableCell sx={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{periodLabel(r.period)}</TableCell>
                      <TableCell sx={{ ...td, ...mono, fontSize: 11, whiteSpace: "nowrap", color: late ? "brand.red" : "text.secondary" }}>{fmt(r.due)}</TableCell>
                      {PF_FIELDS.map(([k]) => <TableCell key={k} sx={tdR}>{inr(r.pf[k] || 0)}</TableCell>)}
                      <TableCell sx={{ ...tdR, fontWeight: 700 }}>{inr(r.pf.total || 0)}</TableCell>
                      <TableCell sx={td}>
                        <TextField size="small" variant="standard" placeholder="TRRN"
                          value={drafts[r.period] ?? o.ref}
                          onChange={(e) => setDrafts((d) => ({ ...d, [r.period]: e.target.value }))}
                          sx={{ width: 110, "& input": { ...mono, fontSize: 11 } }} />
                      </TableCell>
                      <TableCell sx={td}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                          {SLOTS.map(([key, label]) => {
                            const doc = o.slots[key];
                            return doc ? (
                              <Box key={key} sx={{ ...mono, fontSize: 10, display: "inline-flex", alignItems: "center", gap: 0.5, border: "1px solid", borderColor: "brand.tealDark", bgcolor: "#DFF5EF", borderRadius: "6px", px: 0.75, py: "2px", whiteSpace: "nowrap" }} title={doc.name}>
                                <Box component="a" href={doc.data} download={doc.name} sx={{ color: "brand.tealDark", textDecoration: "none" }}>↓ {label} ({dext(doc.name)})</Box>
                                <Box component="button" onClick={() => removeSlot(r.period, key)} sx={{ border: "none", background: "none", color: "brand.red", cursor: "pointer", p: 0, fontSize: 11 }}>✕</Box>
                              </Box>
                            ) : (
                              <Box component="button" key={key} onClick={() => pickSlot(r.period, key)} sx={{ ...mono, fontSize: 10, border: "1px dashed", borderColor: "brand.teal", color: "brand.tealDark", bgcolor: "brand.tealTint", borderRadius: "6px", px: 0.75, py: "2px", cursor: "pointer", whiteSpace: "nowrap", "&:hover": { bgcolor: "#D3F1EA" } }}>+ {label}</Box>
                            );
                          })}
                        </Box>
                      </TableCell>
                      <TableCell sx={td}><Pill kind={STATUS_KIND[o.status]}>{STATUS_LABEL[o.status]}</Pill></TableCell>
                      <TableCell sx={td}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          <Button size="small" variant="outlined" onClick={() => saveRef(r.period)} sx={{ fontSize: 10.5, py: "2px", px: 1, borderColor: "brand.line", color: "text.primary" }}>Save</Button>
                          {nextStatus(o.status) && <Button size="small" variant="contained" onClick={() => advance(r.period)} sx={{ fontSize: 10.5, py: "2px", px: 1, bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>{advLabel(o.status)}</Button>}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1.5 }}>
          One consolidated ECR under the single establishment code covers every branch. Delay attracts interest u/s 7Q (12% p.a.) and damages u/s 14B. Amounts are read-only (source: PACE); only the reference and documents are entered here.
        </Typography>
      </SectionCard>
    </Box>
  );
}
