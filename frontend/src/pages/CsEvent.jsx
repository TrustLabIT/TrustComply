import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import ServerFilingList from "../components/ServerFilingList";
import { EVENT_FORMS } from "../data/reference";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };

export default function CsEvent() {
  return (
    <Box>
      <PageHead
        title="Event-based filings"
        sub="Filings triggered by corporate events rather than the calendar. Log the event here the day it happens — most windows are 30 days and the ₹100/day meter starts immediately after. During the fundraising / secondary-sale process, expect PAS-3, MGT-14, SH-7 and BEN-2 activity."
      />

      <ServerFilingList cat="Event-based filing" module="CS" title="Live event filings" />

      <SectionCard title="Trigger reference" chip="Companies Act 2013">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                {["Form", "Trigger event", "Window", "Ref"].map((h) => (
                  <TableCell key={h} sx={th}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {EVENT_FORMS.map((e) => (
                <TableRow key={e.form}>
                  <TableCell sx={{ ...td, ...mono, fontWeight: 700, whiteSpace: "nowrap" }}>{e.form}</TableCell>
                  <TableCell sx={td}>{e.trigger}</TableCell>
                  <TableCell sx={{ ...td, ...mono, fontSize: "12px" }}>{e.window}</TableCell>
                  <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{e.ref}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 1 }}>
          To log an occurrence: “+ New filing” → module CS → category “Event-based filing”, set the due
          date to event date + window.
        </Typography>
      </SectionCard>
    </Box>
  );
}
