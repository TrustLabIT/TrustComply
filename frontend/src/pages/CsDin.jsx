import React, { useEffect, useState } from "react";
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, TextField, Pagination, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import FilingTable from "../components/common/FilingTable";
import Pill from "../components/common/Pill";
import DirectorDialog from "../components/drawers/DirectorDialog";
import { useRows, useCurrentUser } from "../store/hooks";
import { getDirectorsPageApi } from "../api/directors";
import { canCreate, canSeeModule } from "../data/access";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };
const LIMIT = 15;

export default function CsDin() {
  const user = useCurrentUser();
  const kycItems = useRows().filter((r) => r.cat === "Director KYC / DSC");
  const directorsVersion = useSelector((s) => s.compliance.directorsVersion);
  const [dialog, setDialog] = useState({ open: false, director: null });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1, loading: true });

  const canEdit = canCreate(user) && canSeeModule(user, "CS");

  useEffect(() => { setPage(1); }, [search]);

  // Load the DIN register from the backend (searched + paginated).
  useEffect(() => {
    let active = true;
    setData((d) => ({ ...d, loading: true }));
    const t = setTimeout(() => {
      getDirectorsPageApi({ page, limit: LIMIT, search })
        .then((res) => { if (active) setData({ items: res.items, total: res.total, pages: res.pages, loading: false }); })
        .catch(() => { if (active) setData((d) => ({ ...d, loading: false })); });
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [page, search, directorsVersion]);

  const directors = data.items;
  const cols = ["Director", "DIN", "Role", "KYC cycle", "DSC expiry", "Status", ...(canEdit ? [""] : [])];

  return (
    <Box>
      <PageHead
        title="Directors — DIN & DSC"
        sub="A deactivated DIN halts every filing that director must sign. Routine DIR-3 KYC is now once every three years, but changes to mobile, email or address must be reported within 30 days via KYC-Web. Class 3 DSCs typically run two years — renew before MCA-season, not during it."
      />

      <SectionCard
        title="DIN register"
        action={canEdit ? (
          <Button size="small" variant="contained" onClick={() => setDialog({ open: true, director: null })} sx={{ bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>
            + Add director
          </Button>
        ) : null}
      >
        <TextField
          size="small"
          type="search"
          placeholder="Search name / DIN / role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 280 }, bgcolor: "#fff", mb: 1.75 }}
        />

        {data.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={26} sx={{ color: "brand.teal" }} /></Box>
        ) : (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                {cols.map((h, i) => (
                  <TableCell key={i} sx={th}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {directors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={cols.length} sx={{ ...td, textAlign: "center", color: "text.secondary", py: 3 }}>
                    {search ? "No directors match your search." : `No directors added yet.${canEdit ? " Use “+ Add director” to add one." : ""}`}
                  </TableCell>
                </TableRow>
              ) : (
                directors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell sx={{ ...td, fontWeight: 700 }}>{d.name}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{d.din || "—"}</TableCell>
                    <TableCell sx={td}>{d.role}</TableCell>
                    <TableCell sx={td}>{d.kycCycle}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{d.dscExpiry || "—"}</TableCell>
                    <TableCell sx={td}>
                      <Pill kind={d.status === "Active" ? "ak" : "ip"}>{d.status}</Pill>
                    </TableCell>
                    {canEdit && (
                      <TableCell sx={{ ...td, whiteSpace: "nowrap" }}>
                        <Button size="small" variant="outlined" onClick={() => setDialog({ open: true, director: d })}
                          sx={{ fontSize: "11.5px", py: "3px", px: 1.1, borderColor: "brand.line", color: "text.primary", "&:hover": { borderColor: "brand.teal", color: "brand.tealDark" } }}>
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        )}

        {data.total > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Typography sx={{ ...mono, fontSize: "11px", color: "text.secondary" }}>{data.total} director{data.total === 1 ? "" : "s"} · page {page} of {data.pages}</Typography>
            {data.pages > 1 && <Pagination count={data.pages} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />}
          </Box>
        )}
        <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 1 }}>
          Keep this register current when directors change; pair every change with a DIR-12 event filing.
        </Typography>
      </SectionCard>

      <SectionCard title="Tracked KYC items">
        <FilingTable rows={kycItems} />
      </SectionCard>

      <DirectorDialog open={dialog.open} director={dialog.director} onClose={() => setDialog({ open: false, director: null })} />
    </Box>
  );
}
