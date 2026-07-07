import React from "react";
import { Box, Typography } from "@mui/material";

// Standard page header: display title, muted sub-line, optional statute chip.
export default function PageHead({ title, sub, statute }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="h1" sx={{ fontSize: { xs: "27px", sm: "34px" } }}>
        {title}
      </Typography>
      {sub && (
        <Typography sx={{ color: "text.secondary", fontSize: "13.5px", mt: 0.6, maxWidth: 820 }}>
          {sub}
        </Typography>
      )}
      {statute && (
        <Box
          component="span"
          sx={{
            display: "inline-block",
            mt: 1,
            fontFamily: "'Space Mono', monospace",
            fontSize: "10.5px",
            letterSpacing: "0.05em",
            bgcolor: "brand.goldTint",
            color: "#8a6410",
            borderRadius: "6px",
            px: 1.1,
            py: "3px",
          }}
        >
          {statute}
        </Box>
      )}
    </Box>
  );
}
