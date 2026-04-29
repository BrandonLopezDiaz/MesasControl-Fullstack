// src/pages/Mesas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPedidoDetail } from "../api/ListaProductos";
import { Crown, StatusBar, TabBar } from "../components/DesignPrimitives";
import "../design-system.css";

const Mesas = () => {
  const navigate = useNavigate();
  const [mesasEstado, setMesasEstado] = useState({});

  // Carga el estado real de cada mesa desde la API
  useEffect(() => {
    const nums = Array.from({ length: 10 }, (_, i) => i + 1);
    nums.forEach(async (n) => {
      try {
        const pedidos = await fetchPedidoDetail(n);
        const activo = pedidos.find((p) => p.estatus === "ocupado");
        setMesasEstado((prev) => ({
          ...prev,
          [n]: activo
            ? {
                state: "occupied",
                total: parseFloat(activo.factura?.total || 0).toFixed(0),
                items: activo.productos_pedidos?.length || 0,
              }
            : { state: "free" },
        }));
      } catch {
        setMesasEstado((prev) => ({ ...prev, [n]: { state: "free" } }));
      }
    });
  }, []);

  const handleMesaClick = async (mesaNum) => {
    try {
      const pedidos = await fetchPedidoDetail(mesaNum);
      if (pedidos.length > 0 && pedidos[0].estatus === "ocupado") {
        navigate(`/mesa/${mesaNum}/comandaCliente`, { state: { pedido: pedidos[0] } });
      } else {
        navigate(`/mesa/${mesaNum}/agregar`);
      }
    } catch {
      navigate(`/mesa/${mesaNum}/agregar`);
    }
  };

  const mesas = Array.from({ length: 10 }, (_, i) => i + 1);

  const libres   = mesas.filter((n) => !mesasEstado[n] || mesasEstado[n]?.state === "free").length;
  const ocupadas = mesas.filter((n) => mesasEstado[n]?.state === "occupied").length;

  const now   = new Date();
  const fecha = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });

  return (
    <div className="device">
      <div className="device__inner">
        <StatusBar title="Mesas" />

        <div className="device__body">
          <div className="page">
            {/* Header */}
            <div className="between">
              <div>
                <div className="wf-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Crown size={22} /> Milocal
                </div>
                <div className="wf-sm">{fecha}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <span className="wf-chip green">{libres} libres</span>
                <span className="wf-chip red">{ocupadas} ocup</span>
              </div>
            </div>

            {/* Filtros de área */}
            <div className="wf-box" style={{ padding: 10 }}>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                <span className="wf-chip" style={{ background: "var(--sj-cream-2)" }}>Todas</span>
                <span className="wf-chip">Salón</span>
                <span className="wf-chip">Terraza</span>
                <span className="wf-chip">Barra</span>
              </div>
            </div>

            {/* Sección mesas */}
            <div className="between" style={{ marginTop: 4, marginBottom: 4 }}>
              <div className="wf-h2" style={{ fontSize: 22 }}>Mesas</div>
              <span className="wf-sm">toca para abrir →</span>
            </div>

            {/* Grid de mesas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {mesas.map((n) => {
                const info = mesasEstado[n] || { state: "free" };
                return (
                  <button
                    key={n}
                    onClick={() => handleMesaClick(n)}
                    style={{ all: "unset", cursor: "pointer" }}
                  >
                    <div className={`wf-mesa ${info.state}`}>
                      <div className="wf-mesa__num">{n}</div>
                      {info.state === "occupied" && (
                        <div className="wf-mesa__lbl">${info.total} · {info.items} prod</div>
                      )}
                      {info.state === "free" && (
                        <div className="wf-mesa__lbl">libre</div>
                      )}
                      {info.state === "reserved" && (
                        <div className="wf-mesa__lbl">reservada</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="wf-divider" />

            <button
              className="wf-btn primary"
              style={{ width: "100%" }}
              onClick={() => navigate("/mesa/barra/agregar")}
            >
              + Venta rápida (barra)
            </button>
          </div>
        </div>

        <TabBar current="mesas" />
      </div>
    </div>
  );
};

export default Mesas;
