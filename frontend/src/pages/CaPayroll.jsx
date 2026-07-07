import React from "react";
import { Box, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import ServerFilingList from "../components/ServerFilingList";
import PacePayrollSync from "../components/PacePayrollSync";

export default function CaPayroll() {
  return (
    <Box>
      <PageHead
        title="Payroll statutory"
        sub="EPF (ECR + challan) and ESIC by the 15th of the following month; Telangana professional tax by the 10th. These sit with HR/Payroll operationally but roll up into the CA module because defaults surface in tax audits and diligence."
        statute="EPF & MP Act 1952 · ESI Act 1948 · TS PT Act 1987"
      />

      <ServerFilingList cat="Payroll statutory" />

      <PacePayrollSync />

      <Typography sx={{ color: "text.secondary", fontSize: "12.5px", mt: 0.5 }}>
        Branches outside Telangana: add that state’s PT obligation as a recurring row — PT is state
        legislation and slabs/due dates differ.
      </Typography>
    </Box>
  );
}
