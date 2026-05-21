// src/components/ThemeProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({ theme: "default", setTheme: () => {}, customColors: {}, setCustomColors: () => {} });

export const TEMAS = [
  { id: "default", label: "San Judas Tadeo", emoji: "🟢", desc: "Verde y dorado clásico" },
  { id: "noche",   label: "Noche",           emoji: "🌙", desc: "Oscuro para cocina nocturna" },
  { id: "tacos",   label: "Tacos",           emoji: "🌮", desc: "Naranja / rojo cálido" },
  { id: "mar",     label: "Mar",             emoji: "🌊", desc: "Azul marino tranquilo" },
  { id: "custom",  label: "Personalizado",   emoji: "🎨", desc: "Tus propios colores" },
];

const CUSTOM_STORAGE_KEY = "milocal_custom_theme";

export const CUSTOM_COLOR_KEYS = [
  { key: "--sj-green",   label: "Principal", fallback: "oklch(0.55 0.13 155)" },
  { key: "--sj-green-d", label: "Oscuro",    fallback: "oklch(0.42 0.12 155)" },
  { key: "--sj-green-l", label: "Claro",     fallback: "oklch(0.92 0.05 155)" },
  { key: "--sj-gold",    label: "Dorado",    fallback: "oklch(0.78 0.13 85)" },
  { key: "--sj-gold-d",  label: "Dorado oscuro", fallback: "oklch(0.62 0.13 80)" },
  { key: "--sj-red",     label: "Rojo",      fallback: "oklch(0.52 0.16 25)" },
  { key: "--sj-ink",     label: "Texto",     fallback: "oklch(0.22 0.02 240)" },
  { key: "--sj-paper",   label: "Fondo",     fallback: "oklch(0.98 0.008 90)" },
];

function loadCustomColors() {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("milocal_theme") || "default");
  const [customColors, setCustomColorsState] = useState(loadCustomColors);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem("milocal_theme", t);
  }, []);

  const setCustomColors = useCallback((colors) => {
    setCustomColorsState(colors);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(colors));
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "custom") {
      root.setAttribute("data-theme", "");
      // Apply custom colors as CSS variables
      for (const { key } of CUSTOM_COLOR_KEYS) {
        if (customColors[key]) {
          root.style.setProperty(key, customColors[key]);
        } else {
          root.style.removeProperty(key);
        }
      }
    } else {
      // Remove custom overrides
      for (const { key } of CUSTOM_COLOR_KEYS) {
        root.style.removeProperty(key);
      }
      root.setAttribute("data-theme", theme === "default" ? "" : theme);
    }
  }, [theme, customColors]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
