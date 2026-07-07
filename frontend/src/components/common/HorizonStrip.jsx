import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { useDrawers } from "../../context/DrawerContext";
import { daysTo, isOverdue, fmt } from "../../data/helpers";

const SPAN = 90;
const pctFor = (d) => ((d + 7) / (SPAN + 7)) * 100;

// The 90-day filing horizon — every open obligation plotted on a timeline.
export default function HorizonStrip({ openRows, entity }) {
  const { openFiling } = useDrawers();
  const hz = openRows.filter((r) => {
    const d = daysTo(r.due);
    return d >= -7 && d <= SPAN;
  });

  const dotColor = (r) => (isOverdue(r) ? "brand.red" : r.module === "CS" ? "brand.gold" : "brand.teal");
  const ticks = [0, 15, 30, 45, 60, 75, 90];
  const todayPct = pctFor(0);

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg,#1A3A2A 0%,#0F2419 100%)",
        borderRadius: "10px",
        p: { xs: 2, sm: "18px 22px 26px" },
        color: "#fff",
        mb: 2.75,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          right: -60,
          top: -80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(240,180,41,.22),transparent 70%)",
        },
      }}
    >
      <Typography variant="h2" sx={{ color: "#fff", mb: 0.25 }}>90-day filing horizon</Typography>
      <Typography sx={{ fontSize: "12.5px", color: "rgba(255,255,255,.65)", mb: 2 }}>
        Every open obligation for {entity} in the next 90 days. Hover a marker for detail, click to open.
      </Typography>

      <Box sx={{ position: "relative", height: 70, mx: 1 }}>
        <Box sx={{ position: "absolute", left: 0, right: 0, top: 34, height: "2px", bgcolor: "rgba(255,255,255,.22)" }} />
        {ticks.map((d) => {
          const p = pctFor(d);
          return (
            <React.Fragment key={d}>
              <Box sx={{ position: "absolute", top: 28, left: `${p}%`, width: "1px", height: 14, bgcolor: "rgba(255,255,255,.28)" }} />
              <Box sx={{ position: "absolute", top: 46, left: `${p}%`, transform: "translateX(-50%)", fontFamily: "'Space Mono', monospace", fontSize: "9.5px", color: "rgba(255,255,255,.55)", whiteSpace: "nowrap" }}>
                {d === 0 ? "today" : `+${d}d`}
              </Box>
            </React.Fragment>
          );
        })}
        <Box sx={{ position: "absolute", top: 18, left: `${todayPct}%`, width: "2px", height: 34, bgcolor: "brand.gold" }} />
        <Box sx={{ position: "absolute", top: 2, left: `${todayPct}%`, transform: "translateX(-50%)", fontFamily: "'Space Mono', monospace", fontSize: "9.5px", color: "brand.gold", letterSpacing: "0.08em" }}>TODAY</Box>

        {hz.map((r) => {
          const p = pctFor(daysTo(r.due));
          return (
            <Tooltip
              key={r.id}
              arrow
              title={
                <Box sx={{ fontSize: "11.5px" }}>
                  <b style={{ display: "block", fontSize: "12px" }}>{r.form}</b>
                  {r.title.slice(0, 52)}
                  <Box sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", opacity: 0.8 }}>{fmt(r.due)} · {r.owner}</Box>
                </Box>
              }
            >
              <Box
                onClick={() => openFiling(r)}
                sx={{
                  position: "absolute",
                  top: 27,
                  left: `${p}%`,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  transform: "translateX(-50%)",
                  border: "2px solid #0F2419",
                  cursor: "pointer",
                  bgcolor: dotColor(r),
                  transition: "transform .12s",
                  "&:hover": { transform: "translateX(-50%) scale(1.35)", zIndex: 5 },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", gap: 2.25, mt: 1.5, fontSize: "11.5px", color: "rgba(255,255,255,.7)", flexWrap: "wrap" }}>
        <Legend color="brand.gold" label="Secretarial (CS)" />
        <Legend color="brand.teal" label="Taxation (CA)" />
        <Legend color="brand.red" label="Overdue" />
      </Box>
    </Box>
  );
}

function Legend({ color, label }) {
  return (
    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box component="i" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, display: "inline-block" }} />
      {label}
    </Box>
  );
}
