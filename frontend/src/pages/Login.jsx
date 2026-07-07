import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert, Link } from "@mui/material";
import { useAuth } from "../context/AuthContext";

// Full-screen login / first-time signup gate shown before the app loads.
export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") await register(form);
      else await login(form.email, form.password);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: "linear-gradient(135deg,#1A3A2A 0%,#0F2419 100%)",
      }}
    >
      <Paper elevation={8} sx={{ width: "100%", maxWidth: 400, borderRadius: 3, p: { xs: 3, sm: 4 } }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography sx={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: "0.05em", lineHeight: 1 }}>
            TRUST<Box component="span" sx={{ color: "brand.gold" }}>COMPLY</Box>
          </Typography>
          <Typography sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10.5px", color: "text.secondary", letterSpacing: "0.06em", mt: 0.5 }}>
            Statutory Compliance Command Centre
          </Typography>
        </Box>

        <Typography variant="h3" sx={{ mb: 2 }}>
          {mode === "signup" ? "Create your account" : "Sign in"}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={submit}>
          {mode === "signup" && (
            <TextField label="Full name" fullWidth size="small" value={form.name} onChange={set("name")} sx={{ mb: 2 }} required />
          )}
          <TextField label="Email" type="email" fullWidth size="small" value={form.email} onChange={set("email")} sx={{ mb: 2 }} required />
          <TextField label="Password" type="password" fullWidth size="small" value={form.password} onChange={set("password")} sx={{ mb: 2.5 }} required />
          <Button type="submit" fullWidth variant="contained" disabled={busy} sx={{ bgcolor: "brand.teal", py: 1.1, "&:hover": { bgcolor: "brand.tealDark" } }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </Box>

        <Typography sx={{ textAlign: "center", mt: 2.5, fontSize: "13px", color: "text.secondary" }}>
          {mode === "signup" ? "Already have an account? " : "First time here? "}
          <Link
            component="button"
            type="button"
            onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}
            sx={{ color: "brand.tealDark", fontWeight: 700 }}
          >
            {mode === "signup" ? "Sign in" : "Create the first account"}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
