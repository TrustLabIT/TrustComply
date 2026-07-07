import React from "react";
import { Box, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import ServerFilingList from "../components/ServerFilingList";

function RegCard({ title, children }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "brand.line",
        borderRadius: "10px",
        p: 1.6,
        mb: 1.5,
        "&:last-of-type": { mb: 0 },
      }}
    >
      <Typography component="h4" sx={{ fontWeight: 700, color: "brand.green", fontSize: "14.5px" }}>
        {title}
      </Typography>
      <Typography sx={{ color: "text.secondary", fontSize: "12.5px", mt: 0.4 }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function CaGst() {
  return (
    <Box>
      <PageHead
        title="GST"
        sub="GSTR-1 by the 11th, GSTR-3B (with payment) by the 20th of the following month; annual GSTR-9/9C by 31 December. Interest runs at 18% p.a. from day one on unpaid liability. Since Jan 2026, two consecutive missed GSTR-3B filings auto-suspend the GSTIN — no e-way bills, and buyers lose visibility of ITC."
        statute="CGST Act 2017 · Sec 37, 39, 44, 50 · Rules 42/43"
      />

      <ServerFilingList cat="GST" />

      <SectionCard title="Diagnostics-specific GST posture">
        <RegCard title="Healthcare services are exempt — most B2C diagnostics revenue carries no GST">
          Diagnostic services by a clinical establishment fall under the healthcare exemption
          (Notification 12/2017, entry 74). No output tax, but also no ITC on inputs attributable to
          exempt supplies.
        </RegCard>
        <RegCard title="Taxable streams still exist — map them precisely">
          Franchise fees & royalties (CCF / Founding Partner programmes), HLM revenue shares
          structured as services, equipment or space licensing, sale of consumables, corporate
          wellness components that aren’t clinical, and any platform/subscription or data-services
          revenue billed by TDPL are taxable. Each needs correct SAC coding in GSTR-1.
        </RegCard>
        <RegCard title="Rule 42/43 reversal is the audit hot-spot">
          Common credits (rent, audit fees, software, marketing) must be reversed in the
          exempt:taxable turnover ratio monthly, trued-up annually by the September return. For a
          mostly-exempt diagnostics business this is the single largest GST risk item in diligence.
        </RegCard>
        <RegCard title="Registration footprint">
          GST registration is state-wise. With 14 branches Pan-India, confirm every state with a
          fixed establishment has its own GSTIN and its returns are in this register (add per-GSTIN
          rows via “+ New filing” if operating beyond Telangana).
        </RegCard>
      </SectionCard>
    </Box>
  );
}
