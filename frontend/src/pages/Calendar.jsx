import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import PageHead from "../components/common/PageHead";
import { actions } from "../store/complianceSlice";
import { useRows, useScope } from "../store/hooks";
import { useDrawers } from "../context/DrawerContext";
import { TODAY, isOverdue } from "../data/helpers";
import { MN, DOW } from "../data/constants";

const mono = { fontFamily: "'Space Mono', monospace" };

export default function Calendar() {
  const y = useSelector((s) => s.compliance.calYear);
  const m = useSelector((s) => s.compliance.calMonth);
  const rows = useRows();
  const { entity } = useScope();
  const { openFiling } = useDrawers();
  const dispatch = useDispatch();

  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7; // Monday = 0
  const dim = new Date(y, m + 1, 0).getDate();

  const items = rows.filter((r) => {
    const d = new Date(r.due);
    return d.getFullYear() === y && d.getMonth() === m && r.status !== "na";
  });

  const byDay = {};
  items.forEach((r) => {
    const d = new Date(r.due).getDate();
    (byDay[d] = byDay[d] || []).push(r);
  });

  const isToday = (d) =>
    y === TODAY.getFullYear() && m === TODAY.getMonth() && d === TODAY.getDate();

  const chipStyle = (r) => {
    if (isOverdue(r)) return { bgcolor: "brand.redTint", color: "brand.red" };
    if (r.module === "CS") return { bgcolor: "brand.goldTint", color: "#8a6410" };
    return { bgcolor: "brand.tealTint", color: "brand.tealDark" };
  };

  const navBtn = {
    minWidth: 34,
    width: 34,
    height: 34,
    p: 0,
    borderColor: "brand.line",
    color: "text.primary",
    fontSize: "18px",
    lineHeight: 1,
    "&:hover": { borderColor: "brand.teal", color: "brand.tealDark" },
  };

  return (
    <Box>
      <PageHead
        title="Compliance calendar"
        sub={`All statutory due dates for ${entity}, month by month. Gold — secretarial · Teal — taxation · Red — overdue.`}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          mb: 2.25,
          flexWrap: "wrap",
        }}
      >
        <Button variant="outlined" sx={navBtn} onClick={() => dispatch(actions.calShift(-1))}>
          ‹
        </Button>
        <Typography variant="h2" sx={{ minWidth: 160 }}>
          {MN[m]} {y}
        </Typography>
        <Button variant="outlined" sx={navBtn} onClick={() => dispatch(actions.calShift(1))}>
          ›
        </Button>
        <Button
          variant="outlined"
          onClick={() => dispatch(actions.calToday())}
          sx={{
            borderColor: "brand.line",
            color: "text.primary",
            "&:hover": { borderColor: "brand.teal", color: "brand.tealDark" },
          }}
        >
          Today
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          onClick={() => window.print()}
          sx={{
            borderColor: "brand.line",
            color: "text.primary",
            "&:hover": { borderColor: "brand.teal", color: "brand.tealDark" },
          }}
        >
          Print month
        </Button>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 1,
            minWidth: 640,
          }}
        >
          {DOW.map((d) => (
            <Box
              key={d}
              sx={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
                textAlign: "center",
                py: 0.5,
              }}
            >
              {d}
            </Box>
          ))}

          {Array.from({ length: startDow }).map((_, i) => (
            <Box key={`empty-${i}`} />
          ))}

          {Array.from({ length: dim }).map((_, i) => {
            const d = i + 1;
            const today = isToday(d);
            return (
              <Box
                key={d}
                sx={{
                  minHeight: 96,
                  bgcolor: "brand.card",
                  border: "1px solid",
                  borderColor: today ? "brand.gold" : "brand.line",
                  borderRadius: "10px",
                  p: 0.75,
                  boxShadow: today ? (t) => `0 0 0 2px ${t.palette.brand.goldTint}` : "none",
                }}
              >
                <Box sx={{ ...mono, fontSize: "12px", color: "text.secondary", mb: 0.5 }}>{d}</Box>
                {(byDay[d] || []).map((r) => (
                  <Box
                    key={r.id}
                    onClick={() => openFiling(r)}
                    title={r.title}
                    sx={{
                      ...mono,
                      ...chipStyle(r),
                      fontSize: "10.5px",
                      borderRadius: "5px",
                      px: 0.75,
                      py: "2px",
                      mb: 0.5,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.form}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
