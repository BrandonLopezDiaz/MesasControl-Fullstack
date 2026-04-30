// src/pages/Cocina.jsx
import React, { useEffect, useState, useCallback } from "react";
import { fetchPedidos, updatePedido, patchProductoPedido, fetchConfiguraciones } from "../api/ListaProductos";

function useTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

function tiempoTranscurrido(fechaStr) {
  const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return { m, s, total: diff };
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState([]);
  const [limiteMin, setLimiteMin] = useState(15);
  useTicker(); // re-renders every second

  const load = useCallback(async () => {
    const data = await fetchPedidos({ estatus: "ocupado" }).catch(() => []);
    setPedidos(data);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // poll each 15s
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    fetchConfiguraciones().then(cfgs => {
      const cfg = cfgs.find(c => c.clave === "tiempo_alerta_cocina");
      if (cfg) setLimiteMin(parseInt(cfg.valor) || 15);
    }).catch(() => {});
  }, []);

  const marcarProductoListo = async (prodId, pedido) => {
    await patchProductoPedido(prodId, { listo_cocina: true });
    load();
  };

  const marcarComandaLista = async (pedido) => {
    const payload = {
      mesa: pedido.mesa,
      tipo: pedido.tipo,
      estatus: "listo_cocina",
      para_llevar: pedido.para_llevar,
      costo_extra_llevar: pedido.costo_extra_llevar,
      productos_pedidos: pedido.productos_pedidos.map(pp => ({
        producto: pp.producto,
        producto_nombre: pp.producto_nombre,
        cantidad: pp.cantidad,
        subtotal: pp.subtotal,
      })),
    };
    await updatePedido(pedido.id, payload);
    load();
  };

  const etiquetaMesa = (p) => {
    if (p.tipo === "mesa") return `Mesa ${p.mesa}`;
    if (p.tipo === "barra") return "Barra";
    if (p.tipo === "para_llevar") return "Para llevar";
    return "Pedido rápido";
  };

  return (
    <div className="page fade-in">
      <div className="between" style={{ marginBottom: 16 }}>
        <div className="wf-h1">🍳 Cocina</div>
        <span className="wf-sm">actualiza cada 15s · alerta &gt;{limiteMin}min</span>
      </div>

      {pedidos.length === 0 && (
        <div className="loading-screen" style={{ fontSize: 22 }}>
          Sin pedidos activos 🎉
        </div>
      )}

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))" }}>
        {pedidos.map(pedido => {
          const { m, s, total } = tiempoTranscurrido(pedido.fecha_creacion);
          const alerta = m >= limiteMin;
          const todosListos = pedido.productos_pedidos.every(pp => pp.listo_cocina);

          return (
            <div
              key={pedido.id}
              className="wf-box bold"
              style={{
                padding: 14,
                borderColor: alerta ? "var(--sj-red)" : "var(--sj-line)",
                background: alerta ? "oklch(0.97 0.03 25)" : "var(--sj-paper)",
              }}
            >
              {/* Header */}
              <div className="between" style={{ marginBottom: 10 }}>
                <div className="wf-h2" style={{ fontSize: 24 }}>{etiquetaMesa(pedido)}</div>
                <span
                  className="wf-chip"
                  style={{
                    background: alerta ? "var(--sj-red)" : "var(--sj-green-l)",
                    color: alerta ? "white" : "var(--sj-green-d)",
                    borderColor: alerta ? "oklch(0.38 0.14 25)" : "var(--sj-green-d)",
                    fontFamily: "'Caveat',cursive",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {m}:{String(s).padStart(2, "0")}
                </span>
              </div>

              {/* Products */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pedido.productos_pedidos.map(pp => (
                  <div
                    key={pp.id}
                    className="between"
                    style={{
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: "1.5px solid var(--sj-line)",
                      background: pp.listo_cocina ? "var(--sj-green-l)" : "var(--sj-cream)",
                      opacity: pp.listo_cocina ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <span className="wf-h3" style={{ fontSize: 17 }}>{pp.producto_nombre}</span>
                      <span className="wf-sm" style={{ marginLeft: 6 }}>× {pp.cantidad}</span>
                    </div>
                    {!pp.listo_cocina && (
                      <button
                        className="wf-btn sm"
                        style={{ padding: "2px 8px", fontSize: 14 }}
                        onClick={() => marcarProductoListo(pp.id, pedido)}
                      >
                        ✓ listo
                      </button>
                    )}
                    {pp.listo_cocina && <span style={{ color: "var(--sj-green-d)", fontSize: 18 }}>✓</span>}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 10 }}>
                <button
                  className="wf-btn primary"
                  style={{ width: "100%" }}
                  onClick={() => marcarComandaLista(pedido)}
                  disabled={!todosListos}
                >
                  {todosListos ? "✓ Comanda lista" : `Falta marcar (${pedido.productos_pedidos.filter(pp => !pp.listo_cocina).length})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
