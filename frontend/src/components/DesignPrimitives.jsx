// src/components/DesignPrimitives.jsx
// Primitivos visuales del sistema de diseño Milocal — San Judas Tadeo

import React, { useState } from "react";

// -----------------------------------------------------------------------
// TopBar — barra superior dentro del body de una pantalla
// -----------------------------------------------------------------------
export function TopBar({ back, title, subtitle, right }) {
  return (
    <div className="between" style={{ marginBottom: 12 }}>
      <div className="row" style={{ gap: 8 }}>
        {back && (
          <button
            className="wf-btn sm ghost"
            onClick={back}
            style={{ padding: "4px 10px", fontSize: 18, lineHeight: 1 }}
          >
            ‹ atrás
          </button>
        )}
        <div>
          <div className="wf-h1" style={{ fontSize: 28 }}>{title}</div>
          {subtitle && <div className="wf-sm">{subtitle}</div>}
        </div>
      </div>
      <div className="row">{right}</div>
    </div>
  );
}

// -----------------------------------------------------------------------
// SectionHead — encabezado de sección con underline sketch
// -----------------------------------------------------------------------
export function SectionHead({ children, right }) {
  return (
    <div className="between" style={{ marginTop: 4, marginBottom: 4 }}>
      <div className="wf-h2" style={{ fontSize: 22 }}>{children}</div>
      {right}
    </div>
  );
}

// -----------------------------------------------------------------------
// StatusBar — barra superior tipo status de telefono
// -----------------------------------------------------------------------
export function StatusBar({ title, time = "12:34" }) {
  return (
    <div className="wf-status">
      <span>{time}</span>
      <span style={{ fontFamily: "Caveat, cursive", fontSize: 14, fontWeight: 700 }}>
        · {title} ·
      </span>
      <span>📶 ▮ 73%</span>
    </div>
  );
}

// -----------------------------------------------------------------------
// TabBar — barra de navegación inferior
// -----------------------------------------------------------------------
export function TabBar({ current, onNav }) {
  const tabs = [
    { id: "mesas",    label: "Mesas",   icon: "◫" },
    { id: "extras",   label: "Extras",  icon: "✦" },
    { id: "facturas", label: "Cuentas", icon: "☰" },
    { id: "cierre",   label: "Cierre",  icon: "✕" },
  ];
  return (
    <div className="wf-tabbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          className="wf-tab"
          aria-current={current === t.id ? "page" : undefined}
          onClick={() => onNav && onNav(t.id)}
        >
          <span className="wf-tab__icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Crown — icono corona San Judas
// -----------------------------------------------------------------------
export function Crown({ size = 18, color = "var(--sj-gold-d)" }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 24 17" fill="none">
      <path
        d="M2 14 L4 5 L9 10 L12 3 L15 10 L20 5 L22 14 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="var(--sj-gold)"
      />
      <line x1="2" y1="15" x2="22" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// -----------------------------------------------------------------------
// ImgPlaceholder — placeholder de imagen estilo sketch
// -----------------------------------------------------------------------
export function ImgPlaceholder({ w = 56, h = 56, label = "foto" }) {
  return (
    <div className="wf-img" style={{ width: w, height: h }}>
      <span>{label}</span>
    </div>
  );
}

// -----------------------------------------------------------------------
// Stepper — control de cantidad +/-
// -----------------------------------------------------------------------
export function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <div className="stepper">
      <button className="minus" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="val">{value}</span>
      <button className="plus"  onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}
