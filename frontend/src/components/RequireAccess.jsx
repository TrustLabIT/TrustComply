import React from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../store/hooks";
import { navAllowed } from "../data/access";

// Route guard — redirects to the dashboard if the current user's role does not
// grant access to the given nav section (CS/CA desks, settings).
export default function RequireAccess({ navId, children }) {
  const user = useCurrentUser();
  if (!navAllowed(user, navId)) return <Navigate to="/" replace />;
  return children;
}
