import React from "react";
import { Box, Paper, Typography } from "@mui/material";

// White bordered card with an optional display-font heading, chip and right-aligned action.
export default function SectionCard({ title, chip, action, children, sx, headSx }) {
  return (
    <Paper
      variant="outlined"
      sx={{ border: "1px solid", borderColor: "brand.line", borderRadius: "10px", p: { xs: 2, sm: 2.5 }, mb: 2.25, ...sx }}
    >
      {title && (
        <Typography
          variant="h2"
          sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25, flexWrap: "wrap", ...headSx }}
        >
          {title}
          {chip && (
            <Box
              component="span"
              sx={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.08em",
                bgcolor: "brand.tealTint",
                color: "brand.tealDark",
                borderRadius: "6px",
                px: 1,
                py: "2px",
                textTransform: "uppercase",
              }}
            >
              {chip}
            </Box>
          )}
          {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
        </Typography>
      )}
      {children}
    </Paper>
  );
}
