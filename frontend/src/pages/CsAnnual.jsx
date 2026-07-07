import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import ServerFilingList from "../components/ServerFilingList";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };

const SEQUENCE = [
  { step: "1", what: "Close & audit books; auditor report signed", rule: "Before AGM notice" },
  { step: "2", what: "Board meeting approves financials + Board Report", rule: "21 clear days before AGM" },
  { step: "3", what: "Hold AGM (adopt accounts, auditor matters)", rule: "By 30 Sep — within 6 months of FY end" },
  { step: "4", what: "ADT-1 if auditor appointed/reappointed", rule: "Within 15 days of AGM" },
  { step: "5", what: "AOC-4 with signed financials & annexures", rule: "Within 30 days of AGM" },
  { step: "6", what: "MGT-7 annual return (+ geotagged office photo)", rule: "Within 60 days of AGM" },
];

export default function CsAnnual() {
  return (
    <Box>
      <PageHead
        title="Annual MCA filings"
        sub="The yearly ROC cycle under the Companies Act 2013 for a private limited company: DPT-3 → MSME-1 → AGM → ADT-1 → AOC-4 → MGT-7, plus director KYC. AOC-4 is due 30 days after the AGM and MGT-7 sixty days after; both carry ₹100/day additional fees with no cap and three consecutive years of default disqualifies directors u/s 164(2)."
        statute="Companies Act 2013 · MCA V3 portal · Sec 92, 96, 137, 139, 405"
      />

      <ServerFilingList cat="Annual filing" module="CS" />

      <SectionCard title="Filing sequence cheat-sheet">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                {["Step", "What", "Rule"].map((h) => (
                  <TableCell key={h} sx={th}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {SEQUENCE.map((s) => (
                <TableRow key={s.step}>
                  <TableCell sx={{ ...td, ...mono, fontWeight: 700, whiteSpace: "nowrap" }}>{s.step}</TableCell>
                  <TableCell sx={td}>{s.what}</TableCell>
                  <TableCell sx={{ ...td, ...mono, fontSize: "12px" }}>{s.rule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 1 }}>
          Portal congestion peaks in the final week — target filing at least two weeks early. An AGM held
          earlier than 30 Sep pulls both AOC-4 and MGT-7 deadlines forward correspondingly.
        </Typography>
      </SectionCard>
    </Box>
  );
}
