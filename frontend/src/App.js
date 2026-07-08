import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";
import { useAuth } from "./context/AuthContext";
import { fetchFilings } from "./store/complianceSlice";
import Layout from "./components/layout/Layout";
import RequireAccess from "./components/RequireAccess";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import CsAnnual from "./pages/CsAnnual";
import CsEvent from "./pages/CsEvent";
import CsBoard from "./pages/CsBoard";
import CsDin from "./pages/CsDin";
import CsRegisters from "./pages/CsRegisters";
import CaTds from "./pages/CaTds";
import CaGst from "./pages/CaGst";
import CaIt from "./pages/CaIt";
import CaPayroll from "./pages/CaPayroll";
import Archive from "./pages/Archive";
import Regime from "./pages/Regime";
import Settings from "./pages/Settings";
import MedicalLicence from "./pages/MedicalLicence";

export default function App() {
  const { user, loading } = useAuth();
  const dispatch = useDispatch();

  // Load the user's filings from the backend once they're signed in.
  useEffect(() => {
    if (user) dispatch(fetchFilings());
  }, [user, dispatch]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "brand.teal" }} />
      </Box>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />

        <Route path="cs/annual" element={<RequireAccess navId="cs-annual"><CsAnnual /></RequireAccess>} />
        <Route path="cs/event" element={<RequireAccess navId="cs-event"><CsEvent /></RequireAccess>} />
        <Route path="cs/board" element={<RequireAccess navId="cs-board"><CsBoard /></RequireAccess>} />
        <Route path="cs/din" element={<RequireAccess navId="cs-din"><CsDin /></RequireAccess>} />
        <Route path="cs/registers" element={<RequireAccess navId="cs-registers"><CsRegisters /></RequireAccess>} />

        <Route path="ca/tds" element={<RequireAccess navId="ca-tds"><CaTds /></RequireAccess>} />
        <Route path="ca/gst" element={<RequireAccess navId="ca-gst"><CaGst /></RequireAccess>} />
        <Route path="ca/it" element={<RequireAccess navId="ca-it"><CaIt /></RequireAccess>} />
        <Route path="ca/payroll" element={<RequireAccess navId="ca-payroll"><CaPayroll /></RequireAccess>} />

        <Route path="medical/licence" element={<MedicalLicence />} />

        <Route path="archive" element={<Archive />} />
        <Route path="regime" element={<Regime />} />
        <Route path="settings" element={<RequireAccess navId="settings"><Settings /></RequireAccess>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
