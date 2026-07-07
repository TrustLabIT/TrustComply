import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import FilingTable from "../components/common/FilingTable";
import KpiCard from "../components/common/KpiCard";
import HorizonStrip from "../components/common/HorizonStrip";
import { useRows, useScope, useCurrentUser } from "../store/hooks";
import { useDrawers } from "../context/DrawerContext";
import { isOpen, isOverdue, daysTo, penaltyEstimate, inr } from "../data/helpers";
import { canCreate } from "../data/access";

const mono = { fontFamily: "'Space Mono', monospace" };

export default function Dashboard() {
  const { openFiling } = useDrawers();
  const all = useRows();
  const open = all.filter(isOpen);
  const od = all.filter(isOverdue);
  const next30 = open.filter((r) => daysTo(r.due) >= 0 && daysTo(r.due) <= 30);
  const filedFY = all.filter((r) => ["fd", "ak"].includes(r.status)).length;
  const exposure = od.reduce((s, r) => s + penaltyEstimate(r), 0);
  const total = all.filter((r) => r.status !== "na").length;
  const health = total ? Math.round((100 * (total - od.length)) / total) : 100;
  const { entity, fy } = useScope();
  const user = useCurrentUser();

  return (
    <Box>
      <PageHead
        title="Compliance command centre"
        sub={`TrustLab Diagnostics Private Limited · CIN U85100TG2020PTC143059 · FY ${fy}. One register across secretarial (MCA) and taxation (TDS · GST · income tax · payroll) obligations, with due-date and penalty exposure tracking.`}
      />

      {all.length === 0 && (
        <SectionCard
          title={`FY ${fy} — no filings yet`}
          sx={{ border: "1.5px dashed", borderColor: "brand.teal", bgcolor: "brand.tealTint" }}
        >
          <Typography sx={{ fontSize: "13.5px", mb: 2, maxWidth: 820 }}>
            This financial year has no filings recorded. Add your obligations one at a time — each one you
            save is stored in the database and will appear here, on the calendar, and in its CS/CA register.
          </Typography>
          {canCreate(user) ? (
            <Button
              variant="contained"
              onClick={() => openFiling(null)}
              sx={{ bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}
            >
              + Add your first filing
            </Button>
          ) : (
            <Typography sx={{ fontSize: "12.5px", color: "text.secondary" }}>
              Ask an administrator or editor to add filings.
            </Typography>
          )}
        </SectionCard>
      )}

      <Grid container spacing={2} sx={{ mb: 2.75 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <KpiCard
            value={health + "%"}
            label="Compliance health"
            tone={health >= 90 ? "good" : health >= 70 ? "warn" : "bad"}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KpiCard value={od.length} label="Overdue" tone={od.length ? "bad" : "good"} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KpiCard
            value={next30.length}
            label="Due in 30 days"
            tone={next30.length > 6 ? "warn" : "default"}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KpiCard value={filedFY} label="Filed / acknowledged" tone="default" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KpiCard
            value={inr(exposure)}
            label="Est. penalty exposure"
            tone={exposure ? "bad" : "good"}
            small
          />
        </Grid>
      </Grid>

      <HorizonStrip openRows={open} entity={entity} />

      {od.length > 0 && (
        <SectionCard title="Overdue — act now" chip={String(od.length)}>
          <FilingTable rows={od} />
        </SectionCard>
      )}

      <SectionCard title="Next 30 days" chip={String(next30.length)}>
        <FilingTable rows={next30} />
      </SectionCard>

      <Box
        sx={{
          borderLeft: "4px solid",
          borderColor: "brand.gold",
          bgcolor: "brand.goldTint",
          borderRadius: "0 10px 10px 0",
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Typography variant="h3" sx={{ color: "#7a5a0e", mb: 1 }}>
          ⚠ FY 2026-27 regime — what changed
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, m: 0, fontSize: "13.5px", "& li": { mb: 1 } }}>
          <li>
            <b>Income Tax Act 2025 is live from 1 Apr 2026.</b> “Tax Year” replaces FY/AY. Quarterly
            TDS statements move to Form 138 (was 24Q), Form 140 (was 26Q), Form 144 (was 27Q), Form 143
            (was 27EQ). Challans must quote Section 393-series table items, not 194-series. Q1 FY27 (due
            31 Jul 2026) is the first new-format filing.
          </li>
          <li>
            <b>DIR-3 KYC is now triennial</b> for compliant directors — but any change in
            mobile/email/address must be reported within 30 days via KYC-Web. Missed cycle still costs
            ₹5,000 per DIN.
          </li>
          <li>
            <b>GST enforcement hardened:</b> two consecutive missed GSTR-3B filings trigger automatic
            GSTIN suspension (from Jan 2026); Table 3.2 auto-populates from GSTR-1 and is non-editable.
          </li>
          <li>
            <b>MCA V3:</b> MGT-7 needs a geotagged, timestamped registered-office photo; certain forms
            file as linked pairs; shareholding is cross-checked against depository data.
          </li>
          <li>
            <b>CCFS-2026 amnesty</b> (90% waiver on accumulated MCA late fees) closes 15 Jul 2026 — if
            any legacy form is pending, regularise before the window shuts.
          </li>
        </Box>
        <Typography sx={{ ...mono, fontSize: "11px", color: "text.secondary", mt: 1.25 }}>
          See “2026 regulatory watch” in the rail for the full brief with sources.
        </Typography>
      </Box>
    </Box>
  );
}
