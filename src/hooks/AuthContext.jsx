import React, { createContext, useContext } from "react";
import { useAuthState } from "./useAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
