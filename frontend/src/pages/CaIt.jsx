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

export default function CaIt() {
  return (
    <Box>
      <PageHead
        title="Income tax"
        sub="Advance tax on 15 Jun / 15 Sep / 15 Dec / 15 Mar (15% → 45% → 75% → 100% cumulative); tax audit report by 30 September; ITR-6 by 31 October for audited companies. Shortfalls attract 1% per month under 234B/234C. From TY 2026-27 the Income Tax Act 2025 applies — old-Act provisions continue to govern periods up to 31 Mar 2026."
        statute="Income Tax Act 2025 · Tax audit u/s 44AB · ITR-6"
      />

      <ServerFilingList cat="Income tax" />

      <SectionCard title="Exit-process tax checkpoints">
        <RegCard title="On-time ITR filing preserves loss carry-forward">
          The Sec 72A/79 value identified in the exit structure exists only if returns claiming the
          losses were filed by the due date. Treat ITR-6 as a hard deadline, not an extendable one.
        </RegCard>
        <RegCard title="Sec 79 shareholding-change test">
          A secondary sale or primary round changing beneficial shareholding beyond 49% can
          extinguish carried-forward losses of a closely-held company. Model the cap table impact
          before signing — coordinate CA + transaction counsel.
        </RegCard>
        <RegCard title="Valuation compliance">
          Any fresh issue needs Rule 11UA valuation (and FEMA pricing if non-resident investors) by a
          Registered Valuer — log the report here as an income-tax record with the PAS-3 event filing.
        </RegCard>
        <RegCard title="Inter-company transactions">
          Service/data arrangements with related parties and group entities should be at arm’s length
          with documented pricing rationale — specified domestic transaction rules and general
          anti-avoidance scrutiny both look here first.
        </RegCard>
      </SectionCard>
    </Box>
  );
}
