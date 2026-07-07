import React, { useState } from "react";
import { Box, Drawer } from "@mui/material";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar, { RAIL_WIDTH } from "./Sidebar";

// App shell: sticky topbar, a permanent sidebar on desktop and a temporary drawer
// on mobile, and the routed page content in a max-width main column.
export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Topbar onMenuClick={() => setMobileOpen(true)} />
      <Box sx={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        {/* Desktop permanent rail */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: RAIL_WIDTH,
            flexShrink: 0,
            position: "sticky",
            top: 60,
            height: "calc(100vh - 60px)",
          }}
        >
          <Sidebar />
        </Box>

        {/* Mobile temporary drawer */}
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: RAIL_WIDTH, border: "none" } }}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>

        <Box component="main" sx={{ flex: 1, minWidth: 0, width: "100%", p: { xs: "18px 14px 80px", md: "26px 30px 80px" } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
