// src/pages/Mesas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPedidoDetail, fetchConfiguraciones } from "../api/ListaProductos";

const MESAS = Array.from({ length: 10 }, (_, i) => i + 1);
const EXTRAS = [
  { id: "barra", label: "Barra", emoji: "🍺" },
  { id: "para_llevar", label: "Para llevar", emoji: "🛍️" },
  { id: "rapido", label: "Pedido rápido", emoji: "⚡" },
];

function minutosDesde(fechaStr) {
  return Math.floor((Date.now() - new Date(fechaStr)) / 60000);
}

export default function Mesas() {
  const navigate = useNavigate();
  const [mesaStates, setMesaStates] = useState({});
  const [limiteMin, setLimiteMin] = useState(15);

  useEffect(() => {
    let cancelled = false;
    const checkMesas = async () => {
      const states = {};
      await Promise.all(
        MESAS.map(async (mesa) => {
          try {
            const pedidos = await fetchPedidoDetail(mesa);
            const activo = pedidos.find(p => p.estatus === "ocupado" || p.estatus === "listo_cocina");
            if (activo) {
              states[mesa] = {
                state: activo.estatus === "listo_cocina" ? "listo" : "occupied",
                total: parseFloat(activo.factura?.total || 0),
                items: activo.productos_pedidos?.length || 0,
                minutos: minutosDesde(activo.fecha_creacion),
                pedido: activo,
              };
            } else {
              states[mesa] = { state: "free" };
            }
          } catch {
            states[mesa] = { state: "free" };
          }
        })
      );
      if (!cancelled) setMesaStates(states);
    };

    fetchConfiguraciones().then(cfgs => {
      const cfg = cfgs.find(c => c.clave === "tiempo_alerta_cocina");
      if (cfg) setLimiteMin(parseInt(cfg.valor) || 15);
    }).catch(() => {});

    checkMesas();
    const id = setInterval(checkMesas, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const handleMesaClick = async (mesa) => {
    const info = mesaStates[mesa];
    if (info?.state === "occupied" || info?.state === "listo") {
      navigate(`/mesa/${mesa}/comandaCliente`, { state: { pedido: info.pedido } });
    } else {
      navigate(`/mesa/${mesa}/agregar`, { state: { tipo: "mesa" } });
    }
  };

  const handleExtraClick = (extra) => {
    // Use mesa=0 as placeholder for extras, tipo identifies them
    navigate(`/mesa/0/agregar`, { state: { tipo: extra.id } });
  };

  const freeCount = Object.values(mesaStates).filter(s => s.state === "free").length;
  const occCount = Object.values(mesaStates).filter(s => s.state === "occupied" || s.state === "listo").length;

  const mesaColor = (info) => {
    if (!info || info.state === "free") return "var(--sj-green-l)";
    if (info.state === "listo") return "oklch(0.90 0.09 85)"; // gold — ready in kitchen
    if (info.minutos >= limiteMin) return "oklch(0.92 0.06 25)"; // red alert
    return "oklch(0.95 0.07 85)"; // yellow — recently started
  };

  const mesaNumColor = (info) => {
    if (!info || info.state === "free") return "var(--sj-green-d)";
    if (info.state === "listo") return "var(--sj-gold-d)";
    if (info.minutos >= limiteMin) return "var(--sj-red)";
    return "oklch(0.50 0.10 80)";
  };

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="between">
        <div>
          <div className="wf-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="22" height="15" viewBox="0 0 24 17" fill="none">
              <path d="M2 14 L4 5 L9 10 L12 3 L15 10 L20 5 L22 14 Z" stroke="var(--sj-gold-d)" strokeWidth="2" strokeLinejoin="round" fill="var(--sj-gold)" />
              <line x1="2" y1="15" x2="22" y2="15" stroke="var(--sj-gold-d)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Milocal
          </div>
          <div className="wf-sm">{new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}</div>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {freeCount > 0 && <span className="wf-chip green">{freeCount} libres</span>}
          {occCount > 0 && <span className="wf-chip red">{occCount} ocup</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <span className="wf-sm">🟢 libre</span>
        <span className="wf-sm">🟡 activa</span>
        <span className="wf-sm">🔴 &gt;{limiteMin}min</span>
        <span className="wf-sm">🏅 lista en cocina</span>
      </div>

      {/* Mesa grid */}
      <div className="between" style={{ marginTop: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Mesas</div>
      </div>

      <div className="mesa-grid">
        {MESAS.map((mesa) => {
          const info = mesaStates[mesa] || { state: "free" };
          return (
            <div
              key={mesa}
              className="wf-mesa"
              style={{ background: mesaColor(info) }}
              onClick={() => handleMesaClick(mesa)}
            >
              <div className="wf-mesa__num" style={{ color: mesaNumColor(info) }}>{mesa}</div>
              {info.state === "free" && <div className="wf-mesa__lbl">libre</div>}
              {(info.state === "occupied") && (
                <div className="wf-mesa__lbl">{info.minutos}min · ${info.total?.toFixed(0)}</div>
              )}
              {info.state === "listo" && <div className="wf-mesa__lbl">🏅 listo</div>}
            </div>
          );
        })}
      </div>

      {/* Extra options */}
      <div className="between" style={{ marginTop: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Extra</div>
      </div>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {EXTRAS.map(e => (
          <button
            key={e.id}
            className="wf-btn gold"
            style={{ flex: 1, minWidth: 100, justifyContent: "center" }}
            onClick={() => handleExtraClick(e)}
          >
            {e.emoji} {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
