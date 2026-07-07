import React from "react";
import { Box } from "@mui/material";
import { pillSx } from "./pillStyles";

// Generic status pill. `kind` selects the colour recipe; children are the label.
export default function Pill({ kind = "ns", children, sx }) {
  return <Box component="span" sx={{ ...pillSx(kind), ...sx }}>{children}</Box>;
}
