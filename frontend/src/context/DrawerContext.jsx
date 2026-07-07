import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import FilingDrawer from "../components/drawers/FilingDrawer";
import UserDrawer from "../components/drawers/UserDrawer";

const DrawerContext = createContext(null);

// Global controller for the two slide-in drawers so any component (tables, chips,
// horizon dots, the topbar) can open them without prop-drilling.
export function DrawerProvider({ children }) {
  const [filing, setFiling] = useState({ open: false, record: null });
  const [userD, setUserD] = useState({ open: false, kind: "employee", user: null });

  const openFiling = useCallback((record = null) => setFiling({ open: true, record }), []);
  const closeFiling = useCallback(() => setFiling((s) => ({ ...s, open: false })), []);
  const openUser = useCallback((kindOrUser) => {
    if (kindOrUser && typeof kindOrUser === "object") setUserD({ open: true, kind: kindOrUser.kind, user: kindOrUser });
    else setUserD({ open: true, kind: kindOrUser || "employee", user: null });
  }, []);
  const closeUser = useCallback(() => setUserD((s) => ({ ...s, open: false })), []);

  const value = useMemo(() => ({ openFiling, openUser }), [openFiling, openUser]);

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <FilingDrawer open={filing.open} record={filing.record} onClose={closeFiling} />
      <UserDrawer open={userD.open} kind={userD.kind} user={userD.user} onClose={closeUser} />
    </DrawerContext.Provider>
  );
}

export const useDrawers = () => useContext(DrawerContext);
