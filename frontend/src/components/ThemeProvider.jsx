// src/components/ThemeProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ theme: "default", setTheme: () => {} });

export const TEMAS = [
  { id: "default", label: "San Judas Tadeo", emoji: "🟢", desc: "Verde y dorado clásico" },
  { id: "noche",   label: "Noche",           emoji: "🌙", desc: "Oscuro para cocina nocturna" },
  { id: "tacos",   label: "Tacos",           emoji: "🌮", desc: "Naranja / rojo cálido" },
  { id: "mar",     label: "Mar",             emoji: "🌊", desc: "Azul marino tranquilo" },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("milocal_theme") || "default");

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem("milocal_theme", t);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "default" ? "" : theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
