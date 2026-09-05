import React, { createContext, useContext, useState, useEffect } from "react";
import { LIGHT_THEME, DARK_THEME } from "../lib/theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("voidpros-theme-mode") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("voidpros-theme-mode", mode);
    } catch {
      // Private browsing / storage disabled — the toggle still works for
      // this session, it just won't persist across visits.
    }
  }, [mode]);

  const colors = mode === "dark" ? DARK_THEME : LIGHT_THEME;

  return <ThemeContext.Provider value={{ mode, setMode, ...colors }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
