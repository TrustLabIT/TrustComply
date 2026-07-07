import React from "react";
import { Box, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV, NAV_COUNTS } from "../../data/constants";
import { useCurrentUser, useRows } from "../../store/hooks";
import { navAllowed } from "../../data/access";
import { isOpen, isOverdue } from "../../data/helpers";
import { useToast } from "../../context/ToastContext";

export const RAIL_WIDTH = 248;

// Navigation rail — used both as the permanent desktop sidebar and inside the
// mobile temporary drawer. Filters items by the current user's role and shows
// per-section overdue / open badges.
export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const rows = useRows();
  const toast = useToast();

  const openCount = (sel) => rows.filter(sel).filter(isOpen).length;
  const odCount = (sel) => rows.filter(sel).filter(isOverdue).length;

  // Keep only visible items, then drop section headers that end up with no items.
  const filtered = NAV.filter((n) => n.sec || navAllowed(user, n.id));
  // Keep a section header if it's forced (always) or followed by a visible item.
  const visible = filtered.filter((n, i) => !n.sec || n.always || (filtered[i + 1] && !filtered[i + 1].sec));

  const handleClick = (n) => {
    if (n.id === "settings" && !navAllowed(user, "settings")) { toast("Settings are restricted to administrators.", "warning"); return; }
    navigate(n.path);
    if (onNavigate) onNavigate();
  };

  return (
    <Box
      sx={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        background: "linear-gradient(180deg,#1A3A2A 0%,#0F2419 100%)",
        borderRight: "1px solid rgba(240,180,41,.18)",
        p: "18px 12px 40px",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {visible.map((n, i) => {
        if (n.sec) {
          return (
            <Typography key={"s" + i} sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "brand.gold", m: "20px 10px 7px", opacity: 0.9, "&:first-of-type": { mt: "2px" } }}>
              {n.sec}
            </Typography>
          );
        }
        const active = location.pathname === n.path;
        const sel = NAV_COUNTS[n.id];
        let badge = null;
        if (sel) {
          const od = odCount(sel);
          const op = openCount(sel);
          if (od > 0) badge = <Badge tone="bad">{od} overdue</Badge>;
          else if (op > 0) badge = <Badge tone="ok">{op}</Badge>;
        }
        return (
          <Box
            key={n.id}
            onClick={() => handleClick(n)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.1,
              p: "8px 10px",
              borderRadius: "9px",
              color: active ? "#fff" : "rgba(255,255,255,.78)",
              fontSize: "13.5px",
              fontWeight: active ? 700 : 500,
              mb: "2px",
              cursor: "pointer",
              borderLeft: "3px solid",
              borderLeftColor: active ? "brand.teal" : "transparent",
              bgcolor: active ? "rgba(0,180,154,.16)" : "transparent",
              "&:hover": { bgcolor: active ? "rgba(0,180,154,.16)" : "rgba(255,255,255,.07)", color: "#fff" },
            }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, bgcolor: active ? "brand.teal" : "rgba(255,255,255,.28)", boxShadow: active ? "0 0 8px rgba(0,180,154,.55)" : "none" }} />
            <Box sx={{ flex: 1 }}>{n.label}</Box>
            {badge}
          </Box>
        );
      })}
    </Box>
  );
}

function Badge({ tone, children }) {
  const bad = tone === "bad";
  return (
    <Box component="span" sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10.5px", fontWeight: 700, borderRadius: "20px", px: 0.9, py: "1px", bgcolor: bad ? "brand.red" : "rgba(0,180,154,.25)", color: bad ? "#fff" : "#7FE8D6" }}>
      {children}
    </Box>
  );
}
