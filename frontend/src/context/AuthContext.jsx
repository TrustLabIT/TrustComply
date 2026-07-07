import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginApi, registerApi, meApi } from "../api/auth";
import { setToken, clearToken, getToken } from "../api/client";

const AuthContext = createContext(null);

// Holds the logged-in user. The token lives in localStorage; on first load we
// re-validate it against /auth/me so a refresh keeps you signed in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user: u } = await meApi();
        if (active) setUser(u);
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await loginApi(email, password);
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: u } = await registerApi(payload);
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
