import React, { useState } from "react";
import {
  Box, Typography, Select, MenuItem, Button, IconButton, useMediaQuery, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../../store/complianceSlice";
import { useCurrentUser } from "../../store/hooks";
import { useAuth } from "../../context/AuthContext";
import { FY_OPTIONS } from "../../data/constants";
import { roleOf, canCreate } from "../../data/access";
import { useDrawers } from "../../context/DrawerContext";

const selectSx = {
  bgcolor: "rgba(255,255,255,.1)",
  color: "#fff",
  borderRadius: 2,
  fontSize: 13,
  height: 34,
  ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,.25)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,.4)" },
  ".MuiSvgIcon-root": { color: "rgba(255,255,255,.7)" },
};
const labelSx = { fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)" };

export default function Topbar({ onMenuClick }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const user = useCurrentUser();
  const { logout } = useAuth();
  const { openFiling } = useDrawers();
  const fy = useSelector((s) => s.compliance.fy);
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        background: "linear-gradient(135deg,#1A3A2A 0%,#0F2419 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: { xs: 1.5, sm: 2.75 },
        height: 60,
        boxShadow: "0 2px 12px rgba(15,36,25,.25)",
      }}
    >
      {mobile && (
        <IconButton onClick={onMenuClick} sx={{ color: "#fff" }} edge="start"><MenuIcon /></IconButton>
      )}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography sx={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 27, letterSpacing: "0.05em", lineHeight: 1 }}>
          TRUST<Box component="span" sx={{ color: "brand.gold" }}>COMPLY</Box>
        </Typography>
        {!mobile && <Box sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10.5px", color: "rgba(255,255,255,.55)", letterSpacing: "0.06em" }}>TL-CMP-SCC-001 · v1.0</Box>}
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 }, overflowX: "auto" }}>
        {!mobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={labelSx}>Entity</Typography>
            <Typography sx={{ fontSize: 13, color: "#fff", whiteSpace: "nowrap" }}>TrustLab Diagnostics Pvt Ltd</Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {!mobile && <Typography sx={labelSx}>FY</Typography>}
          <Select size="small" value={fy} onChange={(e) => dispatch(actions.setFY(e.target.value))} sx={selectSx}>
            {FY_OPTIONS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </Select>
        </Box>

        {!mobile && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.1, ml: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>{user.name}</Typography>
            <Typography sx={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,.6)" }}>{roleOf(user).label}</Typography>
          </Box>
        )}

        <Tooltip title="Sign out">
          <IconButton onClick={() => setConfirmOut(true)} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 2 }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {canCreate(user) && (
          mobile ? (
            <IconButton onClick={() => openFiling(null)} sx={{ bgcolor: "brand.gold", color: "brand.greenDeep", "&:hover": { bgcolor: "brand.gold", filter: "brightness(1.06)" } }}><AddIcon /></IconButton>
          ) : (
            <Button onClick={() => openFiling(null)} startIcon={<AddIcon />} sx={{ bgcolor: "brand.gold", color: "brand.greenDeep", fontWeight: 700, "&:hover": { bgcolor: "brand.gold", filter: "brightness(1.06)" }, whiteSpace: "nowrap" }}>New filing</Button>
          )
        )}
      </Box>

      <Dialog open={confirmOut} onClose={() => setConfirmOut(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}>
        <DialogTitle sx={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "brand.green", pb: 0.5 }}>
          Sign out?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            You’ll be returned to the login screen. Any unsaved changes in an open form will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOut(false)} variant="outlined" sx={{ borderColor: "brand.line", color: "text.primary" }}>
            Cancel
          </Button>
          <Button onClick={() => { setConfirmOut(false); logout(); }} variant="contained" sx={{ bgcolor: "brand.red", "&:hover": { bgcolor: "#b83a3a" } }}>
            Sign out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
