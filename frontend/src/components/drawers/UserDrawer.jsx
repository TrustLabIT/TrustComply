import React, { useEffect, useState } from "react";
import { Drawer, Box, Typography, TextField, MenuItem, Button, Grid } from "@mui/material";
import { useDispatch } from "react-redux";
import { createUser, updateUser, removeUser } from "../../store/complianceSlice";
import { useCurrentUser } from "../../store/hooks";
import { useToast } from "../../context/ToastContext";
import DrawerHead from "./DrawerHead";

const blank = (kind) => ({
  uid: "", kind: kind || "employee", name: "", desig: "", firm: "", memno: "", valid: "",
  email: "", mobile: "", role: kind === "consultant" ? "ca" : "view", status: "active", password: "",
});

export default function UserDrawer({ open, kind, user, onClose }) {
  const dispatch = useDispatch();
  const current = useCurrentUser();
  const toast = useToast();
  const [form, setForm] = useState(blank("employee"));
  const editing = Boolean(user);

  useEffect(() => {
    if (!open) return;
    setForm(user ? { ...blank(user.kind), ...user, password: "" } : blank(kind));
  }, [open, user, kind]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const consultant = form.kind === "consultant";
  const isSelf = user && user.uid === current.uid;

  const save = async () => {
    if (!form.name || !form.email) { toast("Name and email are required.", "warning"); return; }
    if (consultant && !form.firm) { toast("Firm / practice name is required for consultants.", "warning"); return; }
    if (!editing && !form.password) { toast("Set an initial password for the new account.", "warning"); return; }

    const { uid, password, ...rest } = form;
    const payload = { ...rest, entities: ["TDPL"] };
    if (password) payload.password = password;

    try {
      if (editing) await dispatch(updateUser({ uid: user.uid, ...payload })).unwrap();
      else await dispatch(createUser(payload)).unwrap();
      toast(`${editing ? "Updated" : "Added"} — ${form.name}`, "success");
      onClose();
    } catch (e) {
      toast(e.message || "Save failed", "error");
    }
  };

  const remove = async () => {
    if (!user) return;
    if (!window.confirm(`Remove ${user.name} entirely? Prefer “Disable” to retain the audit trail.`)) return;
    try {
      await dispatch(removeUser(user.uid)).unwrap();
      toast("User removed.", "info");
      onClose();
    } catch (e) {
      toast(e.message || "Delete failed", "error");
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100vw", sm: 540 }, maxWidth: "94vw" } }}>
      <DrawerHead title={editing ? `Edit — ${user.name}` : consultant ? "New consultant (external CA / CS)" : "New employee"} onClose={onClose} />
      <Box sx={{ flex: 1, overflowY: "auto", p: "20px 22px" }}>
        <Field label="User type">
          <TextField size="small" select fullWidth value={form.kind} onChange={set("kind")}>
            <MenuItem value="employee">Employee — internal</MenuItem>
            <MenuItem value="consultant">Consultant — external (CA / CS firm)</MenuItem>
          </TextField>
        </Field>
        <Field label="Full name"><TextField size="small" fullWidth value={form.name} onChange={set("name")} placeholder="e.g. CA R. Mehta / K. Rao" /></Field>
        <Field label="Designation / department"><TextField size="small" fullWidth value={form.desig} onChange={set("desig")} placeholder="e.g. Accounts Executive — Corporate Services" /></Field>

        {consultant && (
          <>
            <Field label="Firm / practice"><TextField size="small" fullWidth value={form.firm} onChange={set("firm")} placeholder="e.g. R. Mehta & Associates, Chartered Accountants" /></Field>
            <Grid container spacing={1.5}>
              <Grid item xs={6}><Field label="Membership / CP no."><TextField size="small" fullWidth value={form.memno} onChange={set("memno")} placeholder="ICAI M.No. / ICSI CP No." /></Field></Grid>
              <Grid item xs={6}><Field label="Engagement valid till"><TextField size="small" type="date" fullWidth value={form.valid} onChange={set("valid")} InputLabelProps={{ shrink: true }} /></Field></Grid>
            </Grid>
          </>
        )}

        <Grid container spacing={1.5}>
          <Grid item xs={6}><Field label="Email (login ID)"><TextField size="small" type="email" fullWidth value={form.email} onChange={set("email")} placeholder={consultant ? "name@firmdomain.in" : "name@mytrustlab.com"} /></Field></Grid>
          <Grid item xs={6}><Field label="Mobile"><TextField size="small" fullWidth value={form.mobile} onChange={set("mobile")} placeholder="+91 …" /></Field></Grid>
        </Grid>

        <Field label={editing ? "Reset password (leave blank to keep)" : "Initial password (login)"}>
          <TextField size="small" type="password" fullWidth value={form.password} onChange={set("password")} placeholder={editing ? "•••••••• (unchanged)" : "Set a password for first sign-in"} />
        </Field>

        <Field label="Access role">
          <TextField size="small" select fullWidth value={form.role} onChange={set("role")} disabled={isSelf}>
            <MenuItem value="admin">Administrator — full access + settings</MenuItem>
            <MenuItem value="cs">Secretarial editor — CS Desk (edit) + overview</MenuItem>
            <MenuItem value="ca">Tax editor — CA Desk (edit) + overview</MenuItem>
            <MenuItem value="view">Viewer — read-only, all registers</MenuItem>
          </TextField>
        </Field>
        <Field label="Entity access">
          <Box sx={{ p: "6px 2px", fontSize: "13px" }}>TrustLab Diagnostics Private Limited (TDPL) — single-entity deployment</Box>
        </Field>
        <Field label="Account status">
          <TextField size="small" select fullWidth value={form.status} onChange={set("status")} disabled={isSelf}>
            <MenuItem value="invited">Invited — awaiting first sign-in</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="disabled">Disabled — access revoked</MenuItem>
          </TextField>
        </Field>
        {isSelf && (
          <Typography sx={{ fontSize: "12px", color: "brand.amber", mb: 1 }}>
            You cannot change your own role or status.
          </Typography>
        )}
        <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 0.5 }}>
          Consultant accounts are external identities: scope them to one role, set an engagement expiry, and revoke on disengagement.
        </Typography>
      </Box>

      <Box sx={{ p: "14px 22px", borderTop: "1px solid", borderColor: "brand.line", display: "flex", gap: 1.25 }}>
        {editing && !isSelf && (
          <Button onClick={remove} sx={{ color: "brand.red", bgcolor: "brand.redTint", fontWeight: 700 }}>Remove</Button>
        )}
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: "brand.line", color: "text.primary" }}>Cancel</Button>
        <Button onClick={save} variant="contained" sx={{ flex: 1, bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>Save user</Button>
      </Box>
    </Drawer>
  );
}

function Field({ label, children }) {
  return (
    <Box sx={{ mb: 1.6 }}>
      <Typography component="label" sx={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  );
}
