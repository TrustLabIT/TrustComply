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
import EmpEpfo from "./pages/EmpEpfo";
import EmpEsi from "./pages/EmpEsi";
import EmpPt from "./pages/EmpPt";
import Settings from "./pages/Settings";
import MedicalLicence from "./pages/MedicalLicence";
import Accounts from "./pages/Accounts";
import Secretarial from "./pages/Secretarial";

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

        <Route path="emp/epfo" element={<RequireAccess navId="emp-epfo"><EmpEpfo /></RequireAccess>} />
        <Route path="emp/esi" element={<RequireAccess navId="emp-esi"><EmpEsi /></RequireAccess>} />
        <Route path="emp/pt" element={<RequireAccess navId="emp-pt"><EmpPt /></RequireAccess>} />

        <Route path="accounts" element={<Navigate to="/accounts/pl" replace />} />
        <Route path="accounts/:tab" element={<RequireAccess navId="acc-pl"><Accounts /></RequireAccess>} />
        <Route path="secretarial" element={<Navigate to="/secretarial/overview" replace />} />
        <Route path="secretarial/:tab" element={<RequireAccess navId="sec-overview"><Secretarial /></RequireAccess>} />

        <Route path="medical/licence" element={<MedicalLicence />} />

        <Route path="settings" element={<RequireAccess navId="settings"><Settings /></RequireAccess>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
