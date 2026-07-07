import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, TextField, MenuItem, Button, Grid,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { createDirector, updateDirector, removeDirector } from "../../store/complianceSlice";
import { useToast } from "../../context/ToastContext";

const blank = { name: "", din: "", role: "", kycCycle: "", dscExpiry: "", status: "Active" };

// Add / edit a director in the DIN & DSC register.
export default function DirectorDialog({ open, director, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const editing = Boolean(director);

  useEffect(() => {
    if (open) setForm(director ? { ...blank, ...director } : blank);
  }, [open, director]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name) { toast("Director name is required.", "warning"); return; }
    const { id, ...rest } = form;
    try {
      if (editing) await dispatch(updateDirector({ id: director.id, ...rest })).unwrap();
      else await dispatch(createDirector(rest)).unwrap();
      toast(`${editing ? "Updated" : "Added"} — ${form.name}`, "success");
      onClose();
    } catch (e) {
      toast(e.message || "Save failed — is the backend running?", "error");
    }
  };

  const remove = async () => {
    if (!director) return;
    if (!window.confirm(`Remove director "${director.name}"?`)) return;
    try {
      await dispatch(removeDirector(director.id)).unwrap();
      toast("Director removed.", "info");
      onClose();
    } catch (e) {
      toast(e.message || "Delete failed", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, width: 480, maxWidth: "94vw" } }}>
      <DialogTitle sx={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "brand.green" }}>
        {editing ? "Edit director" : "Add director"}
      </DialogTitle>
      <DialogContent>
        <Field label="Full name"><TextField size="small" fullWidth value={form.name} onChange={set("name")} placeholder="e.g. Venkata Cherukuri" /></Field>
        <Grid container spacing={1.5}>
          <Grid item xs={6}><Field label="DIN"><TextField size="small" fullWidth value={form.din} onChange={set("din")} placeholder="e.g. 0084xxxx" /></Field></Grid>
          <Grid item xs={6}><Field label="DSC expiry"><TextField size="small" fullWidth value={form.dscExpiry} onChange={set("dscExpiry")} placeholder="e.g. 2027-03-31" /></Field></Grid>
        </Grid>
        <Field label="Role / designation"><TextField size="small" fullWidth value={form.role} onChange={set("role")} placeholder="e.g. Managing Director (CMD)" /></Field>
        <Field label="KYC cycle"><TextField size="small" fullWidth value={form.kycCycle} onChange={set("kycCycle")} placeholder="e.g. Filed FY 2025-26 — next cycle FY 2028-29" /></Field>
        <Field label="Status">
          <TextField size="small" select fullWidth value={form.status} onChange={set("status")}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Verify">Verify</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        </Field>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {editing && (
          <Button onClick={remove} sx={{ color: "brand.red", bgcolor: "brand.redTint", fontWeight: 700, mr: "auto" }}>Remove</Button>
        )}
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: "brand.line", color: "text.primary" }}>Cancel</Button>
        <Button onClick={save} variant="contained" sx={{ bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>Save</Button>
      </DialogActions>
    </Dialog>
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
