import React, { useEffect, useMemo } from "react";
import {
  Box, Grid, Paper, Typography, Chip, Button, TextField, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useDispatch, useSelector } from "react-redux";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import Pill from "../components/common/Pill";
import { fetchLicenceSummary, fetchLicenceList, setLicenceFilter } from "../store/medicalSlice";
import { fmt } from "../data/helpers";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", fontSize: "12.5px", verticalAlign: "top" };

const TYPE_OPTIONS = ["DHMO", "BMW", "Pollution", "PC_PNDT"];
const bucketLabel = (k) => `≤${k.replace(/[^0-9]/g, "")}d`;

// One summary card per licence type.
function LicenceCard({ type, d }) {
  const buckets = d.buckets || {};
  const nearing = Object.values(buckets).some((v) => v > 0);
  const tone = d.overdue > 0 ? "bad" : nearing ? "warn" : "good";
  const bar = { bad: "brand.red", warn: "brand.gold", good: "brand.teal" }[tone];

  return (
    <Paper variant="outlined" sx={{ position: "relative", overflow: "hidden", border: "1px solid", borderColor: "brand.line", borderRadius: "10px", p: 2, height: "100%", "&::after": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: bar } }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Typography sx={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "brand.green", letterSpacing: "0.04em" }}>{type}</Typography>
        {d.overdue > 0 && <Chip size="small" label={`${d.overdue} overdue`} sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: "brand.redTint", color: "brand.red" }} />}
      </Box>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
        <Typography sx={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, lineHeight: 1, color: "brand.tealDark" }}>{d.compliant}</Typography>
        <Typography sx={{ ...mono, fontSize: 12, color: "text.secondary" }}>/ {d.total} in compliance</Typography>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mt: 1.25 }}>
        {Object.entries(buckets).map(([k, v]) => (
          <Chip key={k} size="small" label={`${bucketLabel(k)} · ${v}`}
            sx={{ height: 20, fontSize: 10.5, ...mono, bgcolor: v > 0 ? "brand.amberTint" : "#EEF1F0", color: v > 0 ? "brand.amber" : "text.secondary", fontWeight: v > 0 ? 700 : 400 }} />
        ))}
      </Box>
    </Paper>
  );
}

export default function MedicalLicence() {
  const dispatch = useDispatch();
  const { summary, summaryAt, listAt, list, filters, loadingSummary, loadingList, error } = useSelector((s) => s.medical);

  // Full licence list, fetched once. TAMS's list endpoint has a server-side bug
  // when filtering by ?location=, so the table is filtered client-side instead.
  useEffect(() => { dispatch(fetchLicenceList({})); }, [dispatch]);
  // Summary supports server-side location filtering (that TAMS endpoint works).
  useEffect(() => { dispatch(fetchLicenceSummary(filters.location || undefined)); }, [dispatch, filters.location]);

  // Location dropdown options + client-side filtering, both derived from the full list.
  const locOptions = useMemo(() => {
    const seen = new Map();
    list.forEach((r) => { if (r.location_id != null) seen.set(String(r.location_id), r.location); });
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [list]);

  const filteredList = useMemo(
    () => list.filter((r) =>
      (!filters.license_type || r.license_type === filters.license_type) &&
      (!filters.location || String(r.location_id) === String(filters.location))
    ),
    [list, filters.license_type, filters.location]
  );

  const refresh = () => {
    dispatch(fetchLicenceList({}));
    dispatch(fetchLicenceSummary(filters.location || undefined));
  };
  const setFilter = (k) => (e) => dispatch(setLicenceFilter({ [k]: e.target.value }));

  const rowTone = (r) => {
    const d = r.days_to_expiry;
    if (r.status === "overdue" || (typeof d === "number" && d < 0)) return { bgcolor: "brand.redTint" };
    if (typeof d === "number" && d >= 0 && d <= 30) return { bgcolor: "brand.amberTint" };
    return {};
  };
  const daysColor = (d) => (typeof d !== "number" ? "text.secondary" : d < 0 ? "brand.red" : d <= 30 ? "brand.amber" : "text.primary");
  const STATUS_KIND = { active: "ak", overdue: "od" };

  return (
    <Box>
      <PageHead
        title="Medical licence compliance"
        sub="Statutory licences for the diagnostics network — DHMO, Bio-Medical Waste (BMW), Pollution and PC-PNDT — synced read-only from TAMS. Renewal windows and overdue licences are flagged so nothing lapses."
        statute="Clinical Establishments Act · BMW Rules 2016 · Pollution Control Board · PC-PNDT Act"
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ ...mono, fontSize: 11, color: "text.secondary" }}>
          {(summaryAt || listAt) ? `Last synced ${fmt((summaryAt || listAt).slice(0, 10))}` : "Syncing from TAMS…"}
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={refresh} disabled={loadingSummary || loadingList} sx={{ color: "brand.tealDark" }}>
          Refresh
        </Button>
      </Box>

      {error && (
        <SectionCard sx={{ borderColor: "brand.red" }}>
          <Typography sx={{ color: "brand.red", fontSize: 13 }}>Couldn’t reach TAMS — {error}. Check the TAMS server / API key and Refresh.</Typography>
        </SectionCard>
      )}

      {/* Summary cards */}
      {loadingSummary && !summary ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box>
      ) : summary ? (
        <Grid container spacing={2} sx={{ mb: 1 }}>
          {Object.entries(summary).map(([type, d]) => (
            <Grid item xs={12} sm={6} md={4} key={type}><LicenceCard type={type} d={d} /></Grid>
          ))}
        </Grid>
      ) : null}

      {/* Detailed table */}
      <SectionCard title="Licence register" chip="Synced from TAMS">
        <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", mb: 1.75 }}>
          <TextField size="small" select value={filters.license_type} onChange={setFilter("license_type")} SelectProps={{ displayEmpty: true }} sx={{ minWidth: 150, bgcolor: "#fff" }}>
            <MenuItem value="">All types</MenuItem>
            {TYPE_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField size="small" select value={filters.location} onChange={setFilter("location")} SelectProps={{ displayEmpty: true }} sx={{ minWidth: 180, bgcolor: "#fff" }}>
            <MenuItem value="">All locations</MenuItem>
            {locOptions.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>
        </Box>

        {loadingList ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box>
        ) : filteredList.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center", color: "text.secondary", fontSize: 13 }}>No licences match.</Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  {["Lab / Location", "Type", "Provider", "Contact", "Expiry", "Days left", "Status"].map((h) => (
                    <TableCell key={h} sx={th}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredList.map((r) => (
                  <TableRow key={r.id} sx={rowTone(r)}>
                    <TableCell sx={{ ...td, fontWeight: 700 }}>{r.location || `Location ${r.location_id}`}</TableCell>
                    <TableCell sx={td}><Box component="span" sx={{ ...mono, fontSize: 11, px: 0.75, py: "1px", borderRadius: "5px", bgcolor: "brand.tealTint", color: "brand.tealDark" }}>{r.license_type}</Box></TableCell>
                    <TableCell sx={td}>{r.provider || "—"}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: 11 }}>
                      {r.contact_person || "—"}{r.mobile ? <><br />{r.mobile}</> : null}{r.email ? <><br />{r.email}</> : null}
                    </TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: 12, whiteSpace: "nowrap" }}>{fmt(r.expiry_date)}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: 12, fontWeight: 700, color: daysColor(r.days_to_expiry) }}>
                      {typeof r.days_to_expiry !== "number" ? "—" : r.days_to_expiry < 0 ? `${-r.days_to_expiry}d late` : `${r.days_to_expiry}d`}
                    </TableCell>
                    <TableCell sx={td}><Pill kind={STATUS_KIND[r.status] || "ns"}>{r.status}</Pill></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </Box>
  );
}
