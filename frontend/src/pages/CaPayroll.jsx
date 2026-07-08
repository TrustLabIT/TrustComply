import React from "react";
import { Box, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import PacePayrollSync from "../components/PacePayrollSync";

export default function CaPayroll() {
  return (
    <Box>
      <PageHead
        title="Payroll statutory"
        sub="EPF (ECR + challan) and ESIC by the 15th of the following month; Telangana professional tax by the 10th. Figures are computed in PACE (trust-people) and synced here — there is no manual filing entry for payroll."
        statute="EPF & MP Act 1952 · ESI Act 1948 · TS PT Act 1987"
      />

      <PacePayrollSync />

      <Typography sx={{ color: "text.secondary", fontSize: "12.5px", mt: 0.5 }}>
        Payroll statutory amounts (PF / ESI / PT) come from PACE. Track the actual challan / return filing
        in PACE — this page is read-only.
      </Typography>
    </Box>
  );
}
