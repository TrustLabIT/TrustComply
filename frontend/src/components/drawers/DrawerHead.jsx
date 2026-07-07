import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Shared green-gradient drawer header with a title and close button.
export default function DrawerHead({ title, onClose }) {
  return (
    <Box
      sx={{
        background: "linear-gradient(135deg,#1A3A2A,#0F2419)",
        color: "#fff",
        p: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Typography variant="h3" sx={{ color: "#fff", flex: 1 }}>{title}</Typography>
      <IconButton onClick={onClose} size="small" sx={{ bgcolor: "rgba(255,255,255,.15)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,.25)" } }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
