import React from "react";
import { Box } from "@mui/material";
import { tagSx } from "./pillStyles";

// Small monospace module tag (CS / CA) or generic code tag.
export default function Tag({ kind = "ca", children, sx }) {
  return <Box component="span" sx={{ ...tagSx(kind), ...sx }}>{children}</Box>;
}
