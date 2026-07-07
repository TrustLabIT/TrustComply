import React, { createContext, useCallback, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [state, setState] = useState({ open: false, msg: "", severity: "info" });

  const toast = useCallback((msg, severity = "info") => {
    setState({ open: true, msg, severity });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={2600}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          sx={{ bgcolor: "brand.greenDeep", color: "#fff", borderRadius: 2, fontSize: 13.5, "& .MuiAlert-icon": { color: "brand.gold" } }}
        >
          {state.msg}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
