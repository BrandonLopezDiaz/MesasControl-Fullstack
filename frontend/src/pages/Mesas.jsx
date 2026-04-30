// src/pages/Mesas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPedidoDetail } from "../api/ListaProductos";

const Mesas = () => {
  const navigate = useNavigate();
  const mesas = Array.from({ length: 10 }, (_, i) => i + 1);
  const [mesaStates, setMesaStates] = useState({});

  useEffect(() => {
    // Check status of all tables on load
    const checkMesas = async () => {
      const states = {};
      for (const mesa of mesas) {
        try {
          const pedidos = await fetchPedidoDetail(mesa);
          if (pedidos.length > 0 && pedidos[0].estatus === "ocupado") {
            states[mesa] = {
              state: "occupied",
              items: pedidos[0].productos_pedidos?.length || 0,
              total: parseFloat(pedidos[0].factura?.total || 0),
            };
          } else {
            states[mesa] = { state: "free" };
          }
        } catch {
          states[mesa] = { state: "free" };
        }
      }
      setMesaStates(states);
    };
    checkMesas();
    // eslint-disable-next-line
  }, []);

  const handleMesaClick = async (mesaNum) => {
    try {
      const pedidos = await fetchPedidoDetail(mesaNum);
      if (pedidos.length > 0 && pedidos[0].estatus === "ocupado") {
        navigate(`/mesa/${mesaNum}/comandaCliente`, {
          state: { pedido: pedidos[0] },
        });
      } else {
        navigate(`/mesa/${mesaNum}/agregar`);
      }
    } catch (error) {
      console.error("No fue posible consultar estado de mesa:", error);
      navigate(`/mesa/${mesaNum}/agregar`);
    }
  };

  const freeCount = Object.values(mesaStates).filter(
    (s) => s.state === "free"
  ).length;
  const occCount = Object.values(mesaStates).filter(
    (s) => s.state === "occupied"
  ).length;

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="between">
        <div>
          <div className="wf-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="22" height="15" viewBox="0 0 24 17" fill="none">
              <path
                d="M2 14 L4 5 L9 10 L12 3 L15 10 L20 5 L22 14 Z"
                stroke="var(--sj-gold-d)"
                strokeWidth="2"
                strokeLinejoin="round"
                fill="var(--sj-gold)"
              />
              <line x1="2" y1="15" x2="22" y2="15" stroke="var(--sj-gold-d)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Milocal
          </div>
          <div className="wf-sm">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {freeCount > 0 && <span className="wf-chip green">{freeCount} libres</span>}
          {occCount > 0 && <span className="wf-chip red">{occCount} ocup</span>}
        </div>
      </div>

      {/* Section header */}
      <div className="between" style={{ marginTop: 4, marginBottom: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Mesas</div>
        <span className="wf-sm">toca para abrir →</span>
      </div>

      {/* Mesa grid */}
      <div className="mesa-grid">
        {mesas.map((mesa) => {
          const info = mesaStates[mesa] || { state: "free" };
          return (
            <div
              key={mesa}
              className={`wf-mesa ${info.state}`}
              onClick={() => handleMesaClick(mesa)}
            >
              <div className="wf-mesa__num">{mesa}</div>
              {info.state === "occupied" && (
                <div className="wf-mesa__lbl">
                  ${info.total?.toFixed(0)} · {info.items} prod
                </div>
              )}
              {info.state === "free" && (
                <div className="wf-mesa__lbl">libre</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Mesas;
