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
  { key: "--sj-green",   label: "Principal",  fallback: "#68b36b" },
  { key: "--sj-green-d", label: "Oscuro",     fallback: "#428c4b" },
  { key: "--sj-green-l", label: "Claro",      fallback: "#e8f5e4" },
  { key: "--sj-gold",    label: "Dorado",     fallback: "#e8b84b" },
  { key: "--sj-gold-d",  label: "Dorado osc", fallback: "#c9943a" },
  { key: "--sj-red",     label: "Rojo",       fallback: "#c44f4f" },
  { key: "--sj-ink",     label: "Texto",      fallback: "#333333" },
  { key: "--sj-paper",   label: "Fondo",      fallback: "#fafaf5" },
];

/* Paletas predefinidas para elegir rápido */
export const COLOR_PRESETS = [
  {
    name: '🌮 Taquería',
    colors: { '--sj-green': '#d9782b', '--sj-green-d': '#b85d1a', '--sj-green-l': '#fdf0e4', '--sj-gold': '#e8c84b', '--sj-gold-d': '#c9a83a', '--sj-red': '#c44f3a', '--sj-ink': '#2d1f14', '--sj-paper': '#fefaf5' },
  },
  {
    name: '🍃 Naturaleza',
    colors: { '--sj-green': '#4a8c5c', '--sj-green-d': '#2d6b3e', '--sj-green-l': '#e4f0e8', '--sj-gold': '#c4a84b', '--sj-gold-d': '#a0883a', '--sj-red': '#c45f4f', '--sj-ink': '#1a2d1f', '--sj-paper': '#f5faf5' },
  },
  {
    name: '☕ Café',
    colors: { '--sj-green': '#8b6b4a', '--sj-green-d': '#6b4f33', '--sj-green-l': '#f0e8dc', '--sj-gold': '#d4a85b', '--sj-gold-d': '#b88a44', '--sj-red': '#a85b4f', '--sj-ink': '#2d1f14', '--sj-paper': '#faf5ed' },
  },
  {
    name: '🌊 Océano',
    colors: { '--sj-green': '#3a8ba8', '--sj-green-d': '#2a6b88', '--sj-green-l': '#dcecf5', '--sj-gold': '#6ba8c4', '--sj-gold-d': '#4a8aa8', '--sj-red': '#c45f5f', '--sj-ink': '#142d33', '--sj-paper': '#f0f8fa' },
  },
  {
    name: '🌅 Atardecer',
    colors: { '--sj-green': '#d46b5b', '--sj-green-d': '#b84a3a', '--sj-green-l': '#fdf0ed', '--sj-gold': '#e8a84b', '--sj-gold-d': '#d48a33', '--sj-red': '#c43a3a', '--sj-ink': '#2d1414', '--sj-paper': '#fefaf5' },
  },
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
