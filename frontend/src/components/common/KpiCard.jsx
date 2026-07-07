import React from "react";
import { Paper, Typography } from "@mui/material";
import { tokens } from "../../theme";

const TONE = {
  default: { num: tokens.green, bar: tokens.line },
  good: { num: tokens.tealDark, bar: tokens.teal },
  warn: { num: tokens.amber, bar: tokens.gold },
  bad: { num: tokens.red, bar: tokens.red },
};

// A single KPI tile: big display number + monospace label, with a coloured left accent bar.
export default function KpiCard({ value, label, tone = "default", small = false }) {
  const t = TONE[tone] || TONE.default;
  return (
    <Paper
      variant="outlined"
      sx={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "brand.line",
        borderRadius: "10px",
        px: 2.1,
        py: 1.9,
        height: "100%",
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: t.bar,
        },
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: small ? "26px" : "36px",
          lineHeight: 1,
          color: t.num,
          pt: small ? "6px" : 0,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "text.secondary",
          mt: 0.5,
        }}
      >
        {label}
      </Typography>
    </Paper>
  );
}
