import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../store/hooks";
import { roleOf } from "../../data/access";
import { openServerDB, serverFiles } from "./serverStore";
import { setBadge } from "./badges";

// Hosts one of the ported TruFin pages inside the TrustComply shell. The page
// mounts once; the sidebar route (/<base>/<tab>) drives which of its tabs shows,
// and tab changes made inside the page (e.g. a note link) update the route.
export default function TruFinModule({ app, base, module, tabs, mount, scopeClass, cols, seed }) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const ref = useRef(null);
  const inst = useRef(null);
  const valid = tabs.includes(tab);

  // Keep the latest navigate in a ref so the mounted page never holds a stale one.
  const nav = useRef(navigate);
  nav.current = navigate;

  const rd = roleOf(user);
  const canWrite = rd.edit && rd.modules.includes(module);

  useEffect(() => {
    if (!valid || !ref.current) return undefined;
    const api = mount(ref.current, {
      tab,
      uid: user.uid || user.id || null,
      userName: user.name || "",
      canWrite,
      canAdmin: canWrite,
      openDB: () => openServerDB(app, cols, seed),
      files: serverFiles(app),
      onTab: (t) => {
        const p = `/${base}/${t}`;
        if (!window.location.pathname.replace(/\/$/, "").endsWith(p)) nav.current(p);
      },
      onCount: (n) => setBadge(`${app}:overdue`, n),
    });
    inst.current = api;
    return () => {
      api.destroy();
      inst.current = null;
    };
    // Mount once per module / permission level; tab changes go through setTab below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, valid, canWrite]);

  useEffect(() => {
    if (valid && inst.current) inst.current.setTab(tab);
  }, [tab, valid]);

  if (!valid) return <Navigate to={`/${base}/${tabs[0]}`} replace />;

  return (
    <Box
      ref={ref}
      className={scopeClass}
      sx={{ m: { xs: "-18px -14px -80px", md: "-26px -30px -80px" }, pb: "48px" }}
    />
  );
}
