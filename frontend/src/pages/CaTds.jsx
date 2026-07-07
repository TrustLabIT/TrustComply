import React from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import ServerFilingList from "../components/ServerFilingList";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = {
  ...mono,
  fontSize: "10px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "text.secondary",
  borderBottom: "2px solid",
  borderColor: "brand.line",
  py: 1,
  px: 1.25,
  verticalAlign: "bottom",
};
const td = {
  py: 1.1,
  px: 1.25,
  borderBottom: "1px solid",
  borderColor: "brand.line",
  verticalAlign: "top",
  fontSize: "13px",
};

const DEDUCTIONS = [
  {
    pay: "Salaries",
    sec: "192 → 392(1)*",
    rate: "Slab",
    ctx: "All employees; Form 138 quarterly, Form 16 by 15 Jun",
  },
  {
    pay: "Contractor / service payments",
    sec: "194C → 393 table",
    rate: "1% / 2%",
    ctx: "Housekeeping, logistics, phlebotomy agencies, courier of samples",
  },
  {
    pay: "Professional & technical fees",
    sec: "194J → 393 table",
    rate: "10% (2% technical)",
    ctx: "Consultant pathologists/radiologists, visiting doctors, Pithonix AI agency fees",
  },
  {
    pay: "Rent — premises & equipment",
    sec: "194-I → 393 table",
    rate: "10% / 2%",
    ctx: "14 branch leases; analyser rentals if any",
  },
  {
    pay: "Commission / referral-adjacent payouts",
    sec: "194H → 393 table",
    rate: "2%",
    ctx: "Channel/franchise incentive structures — verify characterisation with CA",
  },
  {
    pay: "Purchase of goods (if threshold crossed)",
    sec: "194Q → 393 table",
    rate: "0.1%",
    ctx: "Reagent & consumable vendors above ₹50L, if turnover test met",
  },
];

export default function CaTds() {
  return (
    <Box>
      <PageHead
        title="TDS / TCS"
        sub="Monthly deposit by the 7th of the following month (March by 30 April); quarterly statements by 31 Jul / 31 Oct / 31 Jan / 31 May. From TY 2026-27 the Income Tax Act 2025 renumbers everything: Form 138 (salary, ex-24Q), Form 140 (resident non-salary, ex-26Q), Form 144 (non-resident, ex-27Q), Form 143 (TCS, ex-27EQ) — and challans quote Section 393-series items instead of 194C/194J."
        statute="IT Act 2025 · Sec 393 series · Sec 234E late fee ₹200/day, capped at TDS amount"
      />

      <ServerFilingList cat="TDS / TCS" />

      <SectionCard title="Deduction map for a diagnostics network">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ borderCollapse: "collapse", minWidth: 640 }}>
            <TableHead>
              <TableRow>
                {["Payment", "Old section", "Typical rate", "TrustLab context"].map((h) => (
                  <TableCell key={h} sx={th}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {DEDUCTIONS.map((d) => (
                <TableRow key={d.pay}>
                  <TableCell sx={td}>{d.pay}</TableCell>
                  <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{d.sec}</TableCell>
                  <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{d.rate}</TableCell>
                  <TableCell sx={td}>{d.ctx}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography sx={{ color: "text.secondary", fontSize: "12.5px", mt: 1.5 }}>
          *Exact new table-item numbers to be confirmed against the deductor’s updated RPU — rates and
          thresholds carried over unchanged, numbering did not. Q4 FY 2025-26 (filed May 2026) was the
          last old-format quarter.
        </Typography>
      </SectionCard>
    </Box>
  );
}
