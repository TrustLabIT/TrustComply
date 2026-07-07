import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import FilingTable from "../components/common/FilingTable";
import { useRows, useScope } from "../store/hooks";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };

export default function CsBoard() {
  const list = useRows().filter((r) => r.module === "CS" && r.cat === "Board & AGM");
  const { fy } = useScope();
  const sy = parseInt(fy.slice(0, 4), 10);

  const plan = [
    { meeting: "BM-1", window: `Apr–Jun ${sy}`, agenda: "MBP-1 disclosures · adopt annual operating plan · DPT-3 sign-off · note MSME-1 (H2)" },
    { meeting: "BM-2", window: `Aug–Sep ${sy}`, agenda: "Approve audited financials & Board Report · convene AGM · related-party register review" },
    { meeting: "AGM", window: `By 30 Sep ${sy}`, agenda: "Adopt accounts · auditor matters · dividend (if any)" },
    { meeting: "BM-3", window: `Oct–Dec ${sy}`, agenda: "H1 review · MGT-7 sign-off · MSME-1 (H1) · investment-process resolutions as needed" },
    { meeting: "BM-4", window: `Jan–Mar ${sy + 1}`, agenda: `Budget FY ${sy + 1}-${String(sy + 2).slice(2)} · advance tax Q4 review · ESOP grants / PAS-3 pipeline` },
  ];

  return (
    <Box>
      <PageHead
        title="Board & AGM governance"
        sub="Section 173 requires a minimum of four board meetings a year with no more than 120 days between two meetings; Section 96 requires the AGM within six months of FY end. Minutes must be finalised within 30 days under SS-1/SS-2."
      />

      <SectionCard title={`FY ${fy} meeting plan`}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                {["Meeting", "Target window", "Key agenda anchors"].map((h) => (
                  <TableCell key={h} sx={th}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.map((p) => (
                <TableRow key={p.meeting}>
                  <TableCell sx={{ ...td, ...mono, fontWeight: 700, whiteSpace: "nowrap" }}>{p.meeting}</TableCell>
                  <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{p.window}</TableCell>
                  <TableCell sx={td}>{p.agenda}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 1 }}>
          Gap check: schedule so no two consecutive meetings exceed 120 days apart — a 15 Jun meeting
          followed later than 13 Oct is a breach even if four meetings occur in the year.
        </Typography>
      </SectionCard>

      <SectionCard title="Tracked items">
        <FilingTable rows={list} />
      </SectionCard>
    </Box>
  );
}
