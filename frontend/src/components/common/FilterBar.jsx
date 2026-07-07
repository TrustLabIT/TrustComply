import React from "react";
import { Box, TextField, MenuItem, Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { actions } from "../../store/complianceSlice";
import { useFilter } from "../../store/hooks";
import { STATUS_LABEL, OWNERS } from "../../data/constants";

// Search + status + owner filter row. Reads/writes the shared filter in the store.
export default function FilterBar() {
  const dispatch = useDispatch();
  const filter = useFilter();

  return (
    <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center", mb: 1.75 }}>
      <TextField
        size="small"
        type="search"
        placeholder="Search form / title…"
        value={filter.q}
        onChange={(e) => dispatch(actions.setFilter({ q: e.target.value }))}
        sx={{ width: { xs: "100%", sm: 230 }, bgcolor: "#fff" }}
      />
      <TextField
        size="small"
        select
        value={filter.status}
        onChange={(e) => dispatch(actions.setFilter({ status: e.target.value }))}
        SelectProps={{ displayEmpty: true }}
        sx={{ bgcolor: "#fff", minWidth: 150 }}
      >
        <MenuItem value="">All statuses</MenuItem>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <MenuItem key={k} value={k}>{v}</MenuItem>
        ))}
        <MenuItem value="_od">Overdue only</MenuItem>
      </TextField>
      <TextField
        size="small"
        select
        value={filter.owner}
        onChange={(e) => dispatch(actions.setFilter({ owner: e.target.value }))}
        SelectProps={{ displayEmpty: true }}
        sx={{ bgcolor: "#fff", minWidth: 150 }}
      >
        <MenuItem value="">All owners</MenuItem>
        {OWNERS.map((o) => (
          <MenuItem key={o} value={o}>{o}</MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        onClick={() => dispatch(actions.clearFilter())}
        sx={{ borderColor: "brand.line", color: "text.primary", "&:hover": { borderColor: "brand.teal" } }}
      >
        Clear
      </Button>
    </Box>
  );
}

// Pure filter predicate reused by pages that show a FilterBar.
export function applyFilters(list, filter) {
  return list.filter((r) => {
    if (filter.q && !`${r.form} ${r.title} ${r.period}`.toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.status === "_od") return !["fd", "ak", "na"].includes(r.status) && new Date(r.due) < new Date(new Date().setHours(0, 0, 0, 0));
    if (filter.status && r.status !== filter.status) return false;
    if (filter.owner && r.owner !== filter.owner) return false;
    return true;
  });
}
