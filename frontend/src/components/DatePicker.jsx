// src/components/DatePicker.jsx
import React, { useState, useEffect, useRef } from "react";

const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function toYMD(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fromYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa" }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = fromYMD(value);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday-based offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: viewMonth - 1, year: viewMonth === 0 ? viewYear - 1 : viewYear, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, other: false });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: viewMonth + 1, year: viewMonth === 11 ? viewYear + 1 : viewYear, other: true });
  }

  const handleSelect = (cell) => {
    const date = new Date(cell.year, cell.month, cell.day);
    onChange(toYMD(date));
    setOpen(false);
  };

  const displayValue = value
    ? fromYMD(value)?.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    : placeholder;

  return (
    <div className="date-picker-wrap" ref={ref}>
      <button className="date-input-btn" onClick={() => setOpen(o => !o)} type="button">
        📅 {displayValue}
      </button>
      {open && (
        <div className="date-cal">
          <div className="date-cal__header">
            <button className="date-cal__nav" onClick={prevMonth}>‹</button>
            <span className="date-cal__month">{MESES[viewMonth]} {viewYear}</span>
            <button className="date-cal__nav" onClick={nextMonth}>›</button>
          </div>
          <div className="date-cal__grid">
            {DIAS.map(d => (
              <div key={d} className="date-cal__cell day-header">{d}</div>
            ))}
            {cells.map((cell, i) => {
              const isToday = cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();
              const isSelected = selected && cell.day === selected.getDate() && cell.month === selected.getMonth() && cell.year === selected.getFullYear();
              return (
                <button
                  key={i}
                  className={[
                    "date-cal__cell",
                    cell.other ? "other-month" : "",
                    isToday ? "today" : "",
                    isSelected ? "selected" : "",
                  ].join(" ")}
                  onClick={() => handleSelect(cell)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button
              className="wf-btn sm ghost"
              onClick={() => { onChange(""); setOpen(false); }}
            >
              Borrar
            </button>
            <button
              className="wf-btn sm"
              style={{ background: "var(--sj-green-l)", color: "var(--sj-green-d)" }}
              onClick={() => { onChange(toYMD(today)); setOpen(false); }}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
