import React, { useEffect, useState } from "react";
import {
  Box, Button, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, MenuItem, Pagination, CircularProgress,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import KpiCard from "../components/common/KpiCard";
import Pill from "../components/common/Pill";
import { updateUser } from "../store/complianceSlice";
import { useCurrentUser } from "../store/hooks";
import { useToast } from "../context/ToastContext";
import { useDrawers } from "../context/DrawerContext";
import { getUsersPageApi } from "../api/users";
import { fmt } from "../data/helpers";
import { consultantExpiring } from "../data/access";
import { ROLE_DEF } from "../data/constants";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };
const smallBtn = { fontSize: "11px", py: 0.25, px: 1, minWidth: 0, whiteSpace: "nowrap" };
const LIMIT = 20;

const ROLE_STYLE = {
  admin: { bg: "brand.green", fg: "brand.gold" },
  cs: { bg: "brand.tealTint", fg: "brand.tealDark" },
  ca: { bg: "brand.goldTint", fg: "brand.amber" },
  view: { bg: "#EEF1F0", fg: "brand.muted" },
};
function RolePill({ role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.view;
  return (
    <Box component="span" sx={{ display: "inline-block", borderRadius: "20px", px: 1.25, py: "2px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", bgcolor: s.bg, color: s.fg }}>
      {(ROLE_DEF[role] || ROLE_DEF.view).label}
    </Box>
  );
}
const STATUS_MAP = { active: { kind: "ak", label: "Active" }, invited: { kind: "ip", label: "Invited" }, disabled: { kind: "od", label: "Disabled" } };

const MATRIX = [
  ["Dashboard & calendar", "✓", "✓", "✓", "✓"],
  ["CS Desk — view", "✓", "✓", "✓", "✓"],
  ["CS Desk — create / edit / upload", "✓", "✓", "✗", "✗"],
  ["CA Desk — view", "✓", "✓", "✓", "✓"],
  ["CA Desk — create / edit / upload", "✓", "✗", "✓", "✗"],
  ["SRN / ARN archive & documents", "✓", "✓", "✓", "✓"],
  ["Export / import register (JSON)", "✓", "✗", "✗", "✗"],
  ["Settings — user & consultant setup", "✓", "✗", "✗", "✗"],
];

export default function Settings() {
  const current = useCurrentUser();
  const dispatch = useDispatch();
  const toast = useToast();
  const { openUser } = useDrawers();
  const usersVersion = useSelector((s) => s.compliance.usersVersion);

  const [f, setF] = useState({ search: "", kind: "", role: "", status: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1, stats: { total: 0, active: 0, invited: 0, expiring: 0 }, loading: true });

  const setFilter = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setPage(1); };

  useEffect(() => {
    let active = true;
    setData((d) => ({ ...d, loading: true }));
    const t = setTimeout(() => {
      getUsersPageApi({ page, limit: LIMIT, ...f })
        .then((res) => { if (active) setData({ items: res.items, total: res.total, pages: res.pages, stats: res.stats, loading: false }); })
        .catch(() => { if (active) setData((d) => ({ ...d, loading: false })); });
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [page, f, usersVersion]);

  const { stats } = data;

  const toggle = async (u) => {
    const next = u.status === "disabled" ? "active" : "disabled";
    try {
      await dispatch(updateUser({ uid: u.uid, status: next })).unwrap();
      toast(`${u.name} — ${next === "disabled" ? "disabled" : "re-enabled"}`);
    } catch (e) { toast(e.message || "Update failed", "error"); }
  };

  return (
    <Box>
      <PageHead
        title="Settings & access"
        sub="Who can enter TrustComply and what they can touch. Internal employees and external consultants (practising CA / CS firms) are set up separately — consultants carry an engagement expiry and firm identity. Use the “Signed in” switcher in the top bar to test any account’s view."
      />

      <Grid container spacing={2} sx={{ mb: 2.25 }}>
        <Grid item xs={6} sm={3}><KpiCard value={stats.total} label="Total accounts" /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={stats.active} label="Active" tone="good" /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={stats.invited} label="Invites pending" tone={stats.invited ? "warn" : "default"} /></Grid>
        <Grid item xs={6} sm={3}><KpiCard value={stats.expiring} label="Engagements expiring ≤ 90d" tone={stats.expiring ? "bad" : "default"} /></Grid>
      </Grid>

      <SectionCard
        title="User accounts"
        action={
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" onClick={() => openUser("employee")} sx={{ bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>+ Employee</Button>
            <Button size="small" variant="outlined" onClick={() => openUser("consultant")} sx={{ borderColor: "brand.line", color: "text.primary" }}>+ Consultant</Button>
          </Stack>
        }
      >
        {/* Filter bar */}
        <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", mb: 1.75 }}>
          <TextField size="small" type="search" placeholder="Search name / email / firm…" value={f.search} onChange={setFilter("search")} sx={{ width: { xs: "100%", sm: 240 }, bgcolor: "#fff" }} />
          <TextField size="small" select value={f.kind} onChange={setFilter("kind")} SelectProps={{ displayEmpty: true }} sx={{ minWidth: 140, bgcolor: "#fff" }}>
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="employee">Employees</MenuItem>
            <MenuItem value="consultant">Consultants</MenuItem>
          </TextField>
          <TextField size="small" select value={f.role} onChange={setFilter("role")} SelectProps={{ displayEmpty: true }} sx={{ minWidth: 130, bgcolor: "#fff" }}>
            <MenuItem value="">All roles</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="cs">Secretarial editor</MenuItem>
            <MenuItem value="ca">Tax editor</MenuItem>
            <MenuItem value="view">Viewer</MenuItem>
          </TextField>
          <TextField size="small" select value={f.status} onChange={setFilter("status")} SelectProps={{ displayEmpty: true }} sx={{ minWidth: 130, bgcolor: "#fff" }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="invited">Invited</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </TextField>
        </Box>

        {data.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box>
        ) : data.items.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center", color: "text.secondary", fontSize: "13px" }}>No accounts match.</Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  {["Type", "Name & details", "Contact", "Role", "Status", "Last active", ""].map((h, i) => (
                    <TableCell key={i} sx={th}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((u) => {
                  const self = u.uid === current.uid;
                  const st = STATUS_MAP[u.status] || STATUS_MAP.active;
                  const cons = u.kind === "consultant";
                  const expiring = cons && consultantExpiring(u);
                  return (
                    <TableRow key={u.uid}>
                      <TableCell sx={td}>
                        <Box component="span" sx={{ ...mono, fontSize: "10px", px: 0.75, py: "1px", borderRadius: "5px", bgcolor: cons ? "brand.goldTint" : "brand.tealTint", color: cons ? "#8a6410" : "brand.tealDark" }}>
                          {cons ? "EXT" : "EMP"}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...td, minWidth: 200 }}>
                        <b>{u.name}</b>{self && <Box component="span" sx={{ color: "brand.tealDark", fontWeight: 700, fontSize: "11px", ml: 0.6 }}>(you)</Box>}
                        <Box sx={{ ...mono, fontSize: "10.5px", color: expiring ? "brand.red" : "text.secondary", mt: 0.3 }}>
                          {cons ? `${u.firm || ""}${u.memno ? " · " + u.memno : ""}${u.valid ? " · till " + fmt(u.valid) : ""}${expiring ? " · expiring" : ""}` : (u.desig || "—")}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...td, ...mono, fontSize: "11px", whiteSpace: "nowrap" }}>{u.email}<br />{u.mobile}</TableCell>
                      <TableCell sx={td}><RolePill role={u.role} /></TableCell>
                      <TableCell sx={td}><Pill kind={st.kind}>{st.label}</Pill></TableCell>
                      <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{u.last ? fmt(u.last) : "—"}</TableCell>
                      <TableCell sx={{ ...td, whiteSpace: "nowrap" }}>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                          {u.status === "invited" && <Button size="small" variant="text" sx={smallBtn} onClick={() => toast(`Invite re-sent to ${u.email} (simulated).`, "info")}>Resend</Button>}
                          <Button size="small" variant="text" sx={smallBtn} onClick={() => openUser(u)}>Edit</Button>
                          {!self && <Button size="small" variant="text" sx={{ ...smallBtn, color: u.status === "disabled" ? "brand.tealDark" : "brand.red" }} onClick={() => toggle(u)}>{u.status === "disabled" ? "Re-enable" : "Disable"}</Button>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {data.total > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Typography sx={{ ...mono, fontSize: "11px", color: "text.secondary" }}>{data.total} account{data.total === 1 ? "" : "s"} · page {page} of {data.pages}</Typography>
            {data.pages > 1 && <Pagination count={data.pages} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />}
          </Box>
        )}
      </SectionCard>

      <SectionCard title="Role permission matrix">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                {["Capability", "Administrator", "Secretarial editor (CS)", "Tax editor (CA)", "Viewer"].map((h, i) => (
                  <TableCell key={h} sx={{ ...th, textAlign: i === 0 ? "left" : "center" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {MATRIX.map((row) => (
                <TableRow key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? <TableCell key={i} sx={td}>{cell}</TableCell>
                      : <TableCell key={i} sx={{ ...td, textAlign: "center", fontWeight: 700, color: cell === "✓" ? "brand.tealDark" : "text.secondary" }}>{cell}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard title="Security policy — production notes">
        <Typography sx={{ color: "text.secondary", fontSize: "13px", lineHeight: 1.6 }}>
          This build enforces access in the browser only. Production deployment (Digital Nexus) requires: server-side role enforcement and audit log of every edit/upload with user identity; mandatory 2FA for all accounts and IP-allowlisting for consultant logins; DSC tokens never uploaded here — physical custody register stays with CMD Office; auto-disable on engagement expiry; and quarterly access review tabled at MRM.
        </Typography>
      </SectionCard>
    </Box>
  );
}
