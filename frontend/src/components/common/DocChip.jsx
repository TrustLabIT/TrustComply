import React, { useRef } from "react";
import { Box } from "@mui/material";
import { useDispatch } from "react-redux";
import { updateFiling } from "../../store/complianceSlice";
import { useCurrentUser } from "../../store/hooks";
import { canEditRec } from "../../data/access";
import { readFiles, MAX_DOC_MB } from "../../utils/docs";
import { useToast } from "../../context/ToastContext";
import { useDrawers } from "../../context/DrawerContext";

// Compact "documents" chip used inside filing tables. Behaviour depends on rights:
//  - read-only  → static count (only if any docs)
//  - editable + has docs → opens the edit drawer to manage them
//  - editable + none     → quick-upload via hidden file input
export default function DocChip({ record }) {
  const dispatch = useDispatch();
  const user = useCurrentUser();
  const toast = useToast();
  const { openFiling } = useDrawers();
  const inputRef = useRef(null);
  const n = (record.docs || []).length;
  const editable = canEditRec(user, record);

  if (!editable) {
    return n ? (
      <Box component="span" sx={chipSx(false)} title="Documents attached">
        📎 {n}
      </Box>
    ) : null;
  }

  const onFiles = (e) => {
    if (!e.target.files.length) return;
    readFiles(e.target.files, (name) => toast(`Skipped ${name} — over ${MAX_DOC_MB} MB.`, "warning")).then(async (docs) => {
      if (docs.length) {
        try {
          await dispatch(updateFiling({ id: record.id, docs: (record.docs || []).concat(docs) })).unwrap();
          toast(`${docs.length} document${docs.length === 1 ? "" : "s"} attached to ${record.form}`, "success");
        } catch (err) {
          toast(err.message || "Upload failed", "error");
        }
      }
      e.target.value = "";
    });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (n) openFiling(record);
    else inputRef.current?.click();
  };

  return (
    <Box component="span" sx={chipSx(n === 0)} onClick={handleClick} title={n ? "Manage documents" : "Upload documents"}>
      📎 {n || "+"}
      <input ref={inputRef} type="file" multiple hidden onChange={onFiles} />
    </Box>
  );
}

const chipSx = (empty) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  fontFamily: "'Space Mono', monospace",
  fontSize: "10px",
  fontWeight: 700,
  color: empty ? "text.secondary" : "brand.tealDark",
  bgcolor: empty ? "#F0F3F2" : "brand.tealTint",
  border: "1px solid",
  borderColor: empty ? "brand.line" : "#BDE9DF",
  borderRadius: "12px",
  px: 1,
  py: "1px",
  mt: "3px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  "&:hover": { bgcolor: empty ? "#E8ECEA" : "#D3F1EA" },
});
