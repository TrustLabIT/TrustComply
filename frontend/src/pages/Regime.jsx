import React from "react";
import { Box, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";

function RegCard({ title, children }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "brand.line", borderRadius: "10px", p: 1.75, mb: 1.5, "&:last-of-type": { mb: 0 } }}>
      <Typography variant="h4" sx={{ mb: 0.6 }}>{title}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: "13px", lineHeight: 1.55 }}>{children}</Typography>
    </Box>
  );
}

export default function Regime() {
  return (
    <Box>
      <PageHead
        title="2026 regulatory watch"
        sub="Compiled July 2026. The changes that alter how this register is operated in FY 2026-27, with the practical consequence for TrustLab."
      />

      <SectionCard title="Income Tax Act 2025" chip="Effective 1 Apr 2026">
        <RegCard title="New TDS/TCS form family">
          Form 138 replaces 24Q (salary) · Form 140 replaces 26Q (resident non-salary) · Form 144 replaces 27Q (non-resident) · Form 143 replaces 27EQ (TCS) · Form 141 replaces 26QC (rent challan-cum-statement). Rates and thresholds unchanged. Filing software must be on the updated RPU/FVU and the portal option “Forms as per Income Tax Act 2025” selected.
        </RegCard>
        <RegCard title="Section renumbering on challans">
          Deductions from 1 Apr 2026 quote Section 393-series table items (e.g. contractor payments) instead of 194C/194J. Q4 FY 2025-26 filings remained on old numbering — mixed-regime quarters are the transition-year error to watch.
        </RegCard>
        <RegCard title="“Tax Year” terminology">
          Single Tax Year concept replaces FY/AY. Update engagement letters, board papers and the IPM’s tax annexures to the new vocabulary.
        </RegCard>
      </SectionCard>

      <SectionCard title="MCA / Companies Act" chip="MCA V3">
        <RegCard title="DIR-3 KYC goes triennial">
          Routine KYC once every three years for compliant directors; contact-detail changes reportable within 30 days via KYC-Web. Missed filing still deactivates the DIN and costs ₹5,000 to restore.
        </RegCard>
        <RegCard title="MGT-7 evidentiary additions">
          Geotagged, timestamped registered-office photograph with visible signage attaches to the annual return; shareholding is machine-checked against depository records. Linked-form filing pairs certain forms (e.g. AOC-4 with MGT-7/ADT-1).
        </RegCard>
        <RegCard title="CCFS-2026 amnesty">
          90% waiver on accumulated additional fees for pending forms, window 15 Apr – 15 Jul 2026. Any legacy default should be cured inside the window.
        </RegCard>
      </SectionCard>

      <SectionCard title="GST" chip="From Nov 2025 / Jan 2026">
        <RegCard title="Auto-suspension on two consecutive GSTR-3B misses">
          Suspension blocks future returns and e-way bills and interrupts buyers’ ITC — for B2B/franchise revenue this is a commercial event, not just a compliance one.
        </RegCard>
        <RegCard title="GSTR-3B Table 3.2 locked">
          Inter-state supply values auto-populate from GSTR-1/IFF and are non-editable — GSTR-1 accuracy is now the control point; fix errors via amendment in the next GSTR-1, not in 3B.
        </RegCard>
      </SectionCard>

      <Typography sx={{ color: "text.secondary", fontSize: "12px", lineHeight: 1.55, mt: 0.5 }}>
        Verify against current notifications before relying on any date — extensions and circulars issue mid-year. Sources reviewed: MCA V3 practice guides, CBDT transition notes on the IT Act 2025 forms, GSTN advisories (as at Jul 2026).
      </Typography>
    </Box>
  );
}
