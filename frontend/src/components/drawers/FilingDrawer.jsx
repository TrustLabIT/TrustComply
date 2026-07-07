import React, { useEffect, useRef, useState } from "react";
import {
  Drawer, Box, Typography, IconButton, TextField, MenuItem, Button, Stack, Grid,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useDispatch } from "react-redux";
import { createFiling, updateFiling, removeFiling } from "../../store/complianceSlice";
import { useScope } from "../../store/hooks";
import { CATS, STATUS_LABEL, OWNERS, PENALTY_OPTIONS } from "../../data/constants";
import { fmt, fsize, dext } from "../../data/helpers";
import { readFiles, MAX_DOC_MB } from "../../utils/docs";
import { useToast } from "../../context/ToastContext";
import DrawerHead from "./DrawerHead";

const EMPTY = {
  module: "CS", cat: "Annual filing", form: "", title: "", statute: "",
  period: "", due: "", owner: "Company Secretary", status: "ns", ref: "", filed: "", penalty: "none", notes: "",
};

const FIELDS = ["module", "cat", "form", "title", "statute", "period", "due", "owner", "status", "ref", "filed", "penalty", "notes"];

export default function FilingDrawer({ open, record, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { entity, fy } = useScope();
  const [form, setForm] = useState(EMPTY);
  const [docs, setDocs] = useState([]);
  const fileRef = useRef(null);
  const editing = Boolean(record);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({ ...EMPTY, ...record });
      setDocs((record.docs || []).slice());
    } else {
      setForm(EMPTY);
      setDocs([]);
    }
  }, [open, record]);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => (k === "module" ? { ...f, module: v, cat: CATS[v][0] } : { ...f, [k]: v }));
  };

  const onUpload = (e) => {
    if (!e.target.files.length) return;
    readFiles(e.target.files, (name) => toast(`Skipped ${name} — over ${MAX_DOC_MB} MB.`, "warning")).then((added) => {
      setDocs((d) => d.concat(added));
      if (added.length) toast(`${added.length} document${added.length === 1 ? "" : "s"} ready — save to keep them.`, "info");
      e.target.value = "";
    });
  };

  const save = async () => {
    if (!form.form || !form.due) {
      toast("Form name and due date are required.", "warning");
      return;
    }
    const base = { docs };
    FIELDS.forEach((k) => { base[k] = form[k]; });
    try {
      if (record) await dispatch(updateFiling({ id: record.id, ...base })).unwrap();
      else await dispatch(createFiling({ ...base, entity, fy })).unwrap();
      toast(`${editing ? "Updated" : "Added"} — ${form.form}`, "success");
      onClose();
    } catch (e) {
      toast(e.message || "Save failed — is the backend running?", "error");
    }
  };

  const remove = async () => {
    if (!record) return;
    if (!window.confirm("Delete this filing record? This cannot be undone.")) return;
    try {
      await dispatch(removeFiling(record.id)).unwrap();
      toast("Deleted.", "info");
      onClose();
    } catch (e) {
      toast(e.message || "Delete failed", "error");
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100vw", sm: 540 }, maxWidth: "94vw" } }}>
      <DrawerHead title={editing ? `Edit — ${record.form}` : "New filing"} onClose={onClose} />
      <Box sx={{ flex: 1, overflowY: "auto", p: "20px 22px" }}>
        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Field label="Module">
              <TextField size="small" select fullWidth value={form.module} onChange={set("module")}>
                <MenuItem value="CS">Secretarial (CS)</MenuItem>
                <MenuItem value="CA">Taxation (CA)</MenuItem>
              </TextField>
            </Field>
          </Grid>
          <Grid item xs={6}>
            <Field label="Category">
              <TextField size="small" select fullWidth value={form.cat} onChange={set("cat")}>
                {CATS[form.module].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Field>
          </Grid>
        </Grid>

        <Field label="Form / filing"><TextField size="small" fullWidth value={form.form} onChange={set("form")} placeholder="e.g. AOC-4, GSTR-3B, Form 138" /></Field>
        <Field label="Title"><TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="What is being filed" /></Field>
        <Field label="Statutory reference"><TextField size="small" fullWidth value={form.statute} onChange={set("statute")} placeholder="e.g. Sec 137, Companies Act 2013" /></Field>

        <Grid container spacing={1.5}>
          <Grid item xs={6}><Field label="Period"><TextField size="small" fullWidth value={form.period} onChange={set("period")} placeholder="e.g. Q1 FY27" /></Field></Grid>
          <Grid item xs={6}><Field label="Due date"><TextField size="small" type="date" fullWidth value={form.due} onChange={set("due")} InputLabelProps={{ shrink: true }} /></Field></Grid>
        </Grid>
        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Field label="Owner">
              <TextField size="small" select fullWidth value={form.owner} onChange={set("owner")}>
                {OWNERS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            </Field>
          </Grid>
          <Grid item xs={6}>
            <Field label="Status">
              <TextField size="small" select fullWidth value={form.status} onChange={set("status")}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Field>
          </Grid>
        </Grid>
        <Grid container spacing={1.5}>
          <Grid item xs={6}><Field label="SRN / ARN / Ack no."><TextField size="small" fullWidth value={form.ref} onChange={set("ref")} placeholder="After filing" /></Field></Grid>
          <Grid item xs={6}><Field label="Filed on"><TextField size="small" type="date" fullWidth value={form.filed} onChange={set("filed")} InputLabelProps={{ shrink: true }} /></Field></Grid>
        </Grid>

        <Field label="Penalty rule">
          <TextField size="small" select fullWidth value={form.penalty} onChange={set("penalty")}>
            {PENALTY_OPTIONS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </TextField>
        </Field>
        <Field label="Notes"><TextField size="small" fullWidth multiline minRows={3} value={form.notes} onChange={set("notes")} placeholder="Working notes, dependencies, attachments reference" /></Field>

        <Field label="Documents — challans, SRN receipts, signed forms, working papers">
          <Box onClick={() => fileRef.current?.click()}
            sx={{ border: "1.5px dashed", borderColor: "brand.teal", bgcolor: "brand.tealTint", color: "brand.tealDark", borderRadius: 2.5, p: "11px 14px", fontWeight: 700, fontSize: "13px", cursor: "pointer", textAlign: "center", "&:hover": { bgcolor: "#D3F1EA" } }}>
            ＋ Upload documents
            <Box sx={{ fontWeight: 400, fontSize: "11px", color: "text.secondary", mt: 0.25 }}>select multiple files (PDF, images, XLSX…)</Box>
          </Box>
          <input ref={fileRef} type="file" multiple hidden onChange={onUpload} />
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            {docs.length === 0 ? (
              <Box sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10.5px", color: "text.secondary" }}>No documents attached yet.</Box>
            ) : docs.map((d, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.1, bgcolor: "#fff", border: "1px solid", borderColor: "brand.line", borderRadius: 2, p: "7px 10px" }}>
                <Box sx={{ width: 28, height: 28, flex: "none", borderRadius: 1.5, bgcolor: "brand.green", color: "brand.gold", fontFamily: "'Space Mono', monospace", fontSize: "8.5px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{dext(d.name)}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontSize: "12.5px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</Box>
                  <Box sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "text.secondary" }}>{fsize(d.size)} · {fmt(d.added)}</Box>
                </Box>
                <IconButton size="small" component="a" href={d.data} download={d.name} title="Download"><DownloadIcon fontSize="small" sx={{ color: "brand.tealDark" }} /></IconButton>
                <IconButton size="small" onClick={() => setDocs((x) => x.filter((_, j) => j !== i))} title="Remove"><DeleteOutlineIcon fontSize="small" sx={{ color: "brand.red" }} /></IconButton>
              </Box>
            ))}
          </Stack>
        </Field>
      </Box>

      <Box sx={{ p: "14px 22px", borderTop: "1px solid", borderColor: "brand.line", display: "flex", gap: 1.25 }}>
        {editing && (
          <Button onClick={remove} sx={{ color: "brand.red", borderColor: "brand.redTint", bgcolor: "brand.redTint", fontWeight: 700 }}>Delete</Button>
        )}
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: "brand.line", color: "text.primary" }}>Cancel</Button>
        <Button onClick={save} variant="contained" sx={{ flex: 1, bgcolor: "brand.teal", "&:hover": { bgcolor: "brand.tealDark" } }}>Save filing</Button>
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
