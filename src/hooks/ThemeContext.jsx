import React, { createContext, useContext, useState, useEffect } from "react";
import { LIGHT_THEME, DARK_THEME } from "../lib/theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // The user's actual stored choice — "light", "dark", or "system". Kept
  // separate from the resolved mode below so existing mode === "dark"
  // checks throughout the app keep working unchanged even when the user
  // has picked "system".
  const [themePreference, setThemePreference] = useState(() => {
    try {
      return localStorage.getItem("voidpros-theme-mode") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("voidpros-theme-mode", themePreference);
    } catch {
      // Private browsing / storage disabled — the toggle still works for
      // this session, it just won't persist across visits.
    }
  }, [themePreference]);

  // Live OS preference, only consulted when themePreference is "system".
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let mql;
    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }
    const handleChange = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // Resolved value — always "light" or "dark", never "system". Every
  // existing color decision in the app (including direct mode === "dark"
  // checks) keeps working exactly as before.
  const mode = themePreference === "system" ? (systemPrefersDark ? "dark" : "light") : themePreference;

  const colors = mode === "dark" ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ mode, setMode: setThemePreference, themePreference, ...colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
