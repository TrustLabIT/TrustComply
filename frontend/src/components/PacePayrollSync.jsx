import React, { useCallback, useEffect, useState } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SectionCard from "./common/SectionCard";
import Pill from "./common/Pill";
import { useScope } from "../store/hooks";
import { getPayrollSyncApi } from "../api/payroll";
import { inr } from "../data/helpers";
import { MN } from "../data/constants";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 2 };
const thNum = { ...th, textAlign: "right" };
const td = { py: 1, px: 2, borderBottom: "1px solid", borderColor: "brand.line", fontSize: "12.5px", whiteSpace: "nowrap" };
const num = { ...td, ...mono, textAlign: "right" };

const STATUS_PILL = { draft: "ns", computed: "ip", locked: "ps", paid: "ak" };
const label = (period) => {
  const [y, m] = period.split("-");
  return `${MN[parseInt(m, 10) - 1]} ${y}`;
};

// Read-only payroll statutory figures pulled live from PACE (trust-people).
export default function PacePayrollSync() {
  const { fy } = useScope();
  const [state, setState] = useState({ loading: true, error: null, reachable: true, months: [] });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    getPayrollSyncApi(fy)
      .then((res) => setState({ loading: false, error: null, reachable: res.reachable, months: res.months || [] }))
      .catch((e) => setState({ loading: false, error: e.message || "Failed to reach PACE", reachable: false, months: [] }));
  }, [fy]);

  useEffect(() => { load(); }, [load]);

  const refreshBtn = (
    <Button size="small" startIcon={<RefreshIcon />} onClick={load} disabled={state.loading}
      sx={{ fontSize: "12px", color: "brand.tealDark" }}>
      Refresh
    </Button>
  );

  return (
    <SectionCard title="Payroll figures" chip="Synced from PACE" action={refreshBtn}>
      <Box sx={{ fontSize: "12.5px", color: "text.secondary", mb: 1.5 }}>
        Amounts are computed in PACE (trust-people) and shown here read-only. Mark the actual PF/ESI/PT
        filing status in the tracker above.
      </Box>

      {state.loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box>
      ) : state.error || !state.reachable ? (
        <Box sx={{ py: 2.5, textAlign: "center", color: "brand.red", fontSize: "13px" }}>
          Couldn’t reach PACE{state.error ? ` — ${state.error}` : ""}. Check the PACE server / API key and Refresh.
        </Box>
      ) : state.months.length === 0 ? (
        <Box sx={{ py: 2.5, textAlign: "center", color: "text.secondary", fontSize: "13px" }}>
          No payroll runs in PACE for FY {fy} yet.
        </Box>
      ) : (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={th}>Month</TableCell>
                <TableCell sx={thNum}>Emp.</TableCell>
                <TableCell sx={thNum}>Gross</TableCell>
                <TableCell sx={thNum}>PF (total)</TableCell>
                <TableCell sx={thNum}>ESI (total)</TableCell>
                <TableCell sx={thNum}>PT</TableCell>
                <TableCell sx={thNum}>TDS</TableCell>
                <TableCell sx={thNum}>LWF</TableCell>
                <TableCell sx={th}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.months.map((m) => (
                <TableRow key={m.period} hover>
                  <TableCell sx={{ ...td, fontWeight: 700 }}>{label(m.period)}</TableCell>
                  <TableCell sx={num}>{m.employees}</TableCell>
                  <TableCell sx={num}>{inr(m.gross)}</TableCell>
                  <TableCell sx={num}>{inr(m.statutory.pf.total)}</TableCell>
                  <TableCell sx={num}>{inr(m.statutory.esi.total)}</TableCell>
                  <TableCell sx={num}>{inr(m.statutory.pt)}</TableCell>
                  <TableCell sx={num}>{inr(m.statutory.tds)}</TableCell>
                  <TableCell sx={num}>{inr(m.statutory.lwf)}</TableCell>
                  <TableCell sx={td}><Pill kind={STATUS_PILL[m.status] || "ns"}>{m.status}</Pill></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SectionCard>
  );
}
