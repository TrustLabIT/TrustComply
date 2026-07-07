import React, { useRef } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Typography, useMediaQuery, Stack, Paper,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { updateFiling } from "../../store/complianceSlice";
import { useCurrentUser, useScope } from "../../store/hooks";
import { canEditRec } from "../../data/access";
import { fmt, daysTo, isOpen, penaltyEstimate, inr } from "../../data/helpers";
import { nextStatus, advLabel } from "../../data/constants";
import { readFiles, MAX_DOC_MB } from "../../utils/docs";
import { useToast } from "../../context/ToastContext";
import { useDrawers } from "../../context/DrawerContext";
import StatusPill from "./StatusPill";
import Tag from "./Tag";
import DocChip from "./DocChip";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };

function sortRows(list) {
  return [...list].sort((a, b) => isOpen(b) - isOpen(a) || new Date(a.due) - new Date(b.due));
}

function DueCell({ r }) {
  const d = daysTo(r.due);
  let color, hint = "";
  if (isOpen(r)) {
    if (d < 0) { color = "brand.red"; hint = ` (${-d}d late)`; }
    else if (d <= 10) { color = "brand.amber"; hint = ` (in ${d}d)`; }
  }
  return (
    <Box component="span" sx={{ ...mono, fontSize: "12px", whiteSpace: "nowrap", color: color || "inherit", fontWeight: color ? 700 : 400 }}>
      {fmt(r.due)}{hint}
    </Box>
  );
}

export default function FilingTable({ rows, emptyHint }) {
  const dispatch = useDispatch();
  const user = useCurrentUser();
  const scope = useScope();
  const toast = useToast();
  const { openFiling } = useDrawers();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const uploadRef = useRef(null);
  const targetRec = useRef(null);

  const list = sortRows(rows);

  const advance = async (r) => {
    const nx = nextStatus(r.status);
    if (!nx) return;
    const patch = { status: nx };
    if (nx === "fd" && !r.filed) {
      patch.filed = new Date().toISOString().slice(0, 10);
      const ref = window.prompt("SRN / ARN / Acknowledgement number (optional):", "");
      if (ref) patch.ref = ref;
    }
    try {
      await dispatch(updateFiling({ id: r.id, ...patch })).unwrap();
      toast(`${r.form} → advanced`, "success");
    } catch (e) {
      toast(e.message || "Update failed", "error");
    }
  };

  const quickAttach = (r) => { targetRec.current = r; uploadRef.current?.click(); };
  const onUpload = (e) => {
    const r = targetRec.current;
    if (!e.target.files.length || !r) return;
    readFiles(e.target.files, (name) => toast(`Skipped ${name} — over ${MAX_DOC_MB} MB.`, "warning")).then(async (docs) => {
      if (docs.length) {
        try {
          await dispatch(updateFiling({ id: r.id, docs: (r.docs || []).concat(docs) })).unwrap();
          toast(`${docs.length} document${docs.length === 1 ? "" : "s"} attached`, "success");
        } catch (err) {
          toast(err.message || "Upload failed", "error");
        }
      }
      e.target.value = "";
    });
  };

  if (!list.length) {
    return (
      <Box sx={{ p: 3.25, textAlign: "center", color: "text.secondary", fontSize: "13px" }}>
        {emptyHint || `Nothing here for ${scope.entity} · FY ${scope.fy}. Use “+ New filing” to add, or generate the full FY skeleton from the dashboard.`}
      </Box>
    );
  }

  const hiddenInput = <input ref={uploadRef} type="file" multiple hidden onChange={onUpload} />;

  const actionButtons = (r) => {
    const editable = canEditRec(user, r);
    return (
      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
        {editable && isOpen(r) && r.status !== "na" && (
          <Button size="small" variant="contained" onClick={() => advance(r)}
            sx={{ py: "3px", px: 1.1, fontSize: "11.5px", bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>
            {advLabel(r.status)}
          </Button>
        )}
        {editable ? (
          <>
            <Button size="small" variant="outlined" onClick={() => quickAttach(r)} title="Upload documents"
              sx={{ py: "3px", px: 1.1, fontSize: "11.5px", borderColor: "brand.line", color: "text.primary", "&:hover": { borderColor: "brand.teal", color: "brand.tealDark" } }}>
              📎 Upload
            </Button>
            <Button size="small" variant="outlined" onClick={() => openFiling(r)}
              sx={{ py: "3px", px: 1.1, fontSize: "11.5px", borderColor: "brand.line", color: "text.primary", "&:hover": { borderColor: "brand.teal", color: "brand.tealDark" } }}>
              Edit
            </Button>
          </>
        ) : (
          <Box component="span" sx={{ ...mono, fontSize: "10px", color: "text.secondary" }}>read-only</Box>
        )}
      </Stack>
    );
  };

  // ---- Mobile: stacked cards ----
  if (mobile) {
    return (
      <Stack spacing={1.25}>
        {hiddenInput}
        {list.map((r) => {
          const pen = penaltyEstimate(r);
          return (
            <Paper key={r.id} variant="outlined" sx={{ p: 1.5, borderColor: "brand.line", borderRadius: "10px" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Box component="span" sx={{ ...mono, fontWeight: 700, fontSize: "12.5px" }}>{r.form}</Box>{" "}
                  <Tag kind={r.module.toLowerCase()}>{r.module}</Tag>
                </Box>
                <StatusPill record={r} />
              </Box>
              <Typography sx={{ fontSize: "13px", mb: 0.5 }}>{r.title}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 0.75, ...mono, fontSize: "11.5px", color: "text.secondary" }}>
                <span>Due: <DueCell r={r} /></span>
                <span>{r.period}</span>
                <span>{r.owner}</span>
                {pen > 0 && <Box component="span" sx={{ color: "brand.red", fontWeight: 700 }}>{inr(pen)}</Box>}
              </Box>
              <Box sx={{ mb: 0.5 }}><DocChip record={r} /></Box>
              {actionButtons(r)}
            </Paper>
          );
        })}
      </Stack>
    );
  }

  // ---- Desktop: full table ----
  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      {hiddenInput}
      <Table sx={{ borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            {["Form", "Filing", "Period", "Due", "Owner", "Status", "Ref / SRN", "Exposure", ""].map((h, i) => (
              <TableCell key={i} sx={th}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map((r) => {
            const pen = penaltyEstimate(r);
            return (
              <TableRow key={r.id} hover sx={{ "&:hover": { bgcolor: "brand.bg" } }}>
                <TableCell sx={td}>
                  <Box component="span" sx={{ ...mono, fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap" }}>{r.form}</Box>
                  <br /><Tag kind={r.module.toLowerCase()}>{r.module}</Tag>
                </TableCell>
                <TableCell sx={td}>
                  {r.title}
                  <br /><Box component="span" sx={{ ...mono, fontSize: "10px", color: "text.secondary" }}>{r.statute || ""}</Box>
                </TableCell>
                <TableCell sx={{ ...td, ...mono, fontSize: "11.5px", whiteSpace: "nowrap" }}>{r.period}</TableCell>
                <TableCell sx={td}><DueCell r={r} /></TableCell>
                <TableCell sx={{ ...td, whiteSpace: "nowrap" }}>{r.owner}</TableCell>
                <TableCell sx={td}><StatusPill record={r} /></TableCell>
                <TableCell sx={{ ...td, ...mono, fontSize: "11px" }}>
                  {r.ref || "—"}{r.filed ? <><br />{fmt(r.filed)}</> : null}
                  <br /><DocChip record={r} />
                </TableCell>
                <TableCell sx={td}>
                  {pen > 0 ? <Box component="span" sx={{ ...mono, color: "brand.red", fontWeight: 700, fontSize: "12px" }}>{inr(pen)}</Box> : "—"}
                </TableCell>
                <TableCell sx={td}>{actionButtons(r)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
