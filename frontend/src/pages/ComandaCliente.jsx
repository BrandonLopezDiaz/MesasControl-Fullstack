// src/pages/ComandaCliente.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchPedidoDetail, updatePedido } from "../api/ListaProductos";
import CambioSugerencias from "./CambioSugerencias";

export default function ComandaCliente() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [pedido, setPedido] = useState(location.state?.pedido || null);
  const [dineroRecibido, setDineroRecibido] = useState("");
  const [vista, setVista] = useState("comanda"); // "comanda" | "dividir"

  useEffect(() => {
    if (pedido) return;
    (async () => {
      const data = await fetchPedidoDetail(mesaId);
      if (data.length) setPedido(data[0]);
    })();
  }, [mesaId, pedido]);

  if (!pedido) return <div className="loading-screen">Cargando...</div>;

  const total = parseFloat(pedido.factura?.total || 0);
  const received = parseFloat(dineroRecibido) || 0;
  const cambio = Math.max(0, received - total);

  const etiqueta = () => {
    if (pedido.tipo === "barra") return "🍺 Barra";
    if (pedido.tipo === "para_llevar") return "🛍️ Para llevar";
    if (pedido.tipo === "rapido") return "⚡ Pedido rápido";
    return `Mesa ${mesaId}`;
  };

  const buildPayloadBase = (estatus) => ({
    mesa: pedido.mesa,
    tipo: pedido.tipo || "mesa",
    estatus,
    para_llevar: pedido.para_llevar,
    costo_extra_llevar: pedido.costo_extra_llevar,
    productos_pedidos: pedido.productos_pedidos.map(item => ({
      producto: item.producto,
      producto_nombre: item.producto_nombre,
      cantidad: item.cantidad,
      subtotal: item.subtotal,
    })),
  });

  const handleFinalizar = async () => {
    if (!window.confirm("¿Finalizar y cobrar este pedido?")) return;
    try {
      await updatePedido(pedido.id, buildPayloadBase("finalizado"));
      navigate("/");
    } catch { alert("Error al finalizar. Intenta de nuevo."); }
  };

  const handleCancelar = async () => {
    if (!window.confirm("¿Cancelar este pedido? Esta acción no se puede deshacer.")) return;
    try {
      await updatePedido(pedido.id, buildPayloadBase("cancelado"));
      navigate("/");
    } catch { alert("Error al cancelar. Intenta de nuevo."); }
  };

  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
    Math.ceil(total / 500) * 500,
    1000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 3);

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="wf-btn sm ghost" onClick={() => navigate("/")}>‹ atrás</button>
          <div>
            <div className="wf-h1" style={{ fontSize: 28 }}>{etiqueta()}</div>
            <div className="wf-sm">comanda activa</div>
          </div>
        </div>
        <span className="wf-chip red">en cocina</span>
      </div>

      {/* Tab toggle */}
      <div className="row" style={{ gap: 0, border: "2px solid var(--sj-line)", borderRadius: 12, overflow: "hidden" }}>
        {["comanda", "dividir"].map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            style={{
              flex: 1, padding: "10px 0",
              fontFamily: "'Patrick Hand',cursive", fontSize: 17,
              border: "none", cursor: "pointer",
              background: vista === v ? "var(--sj-green)" : "var(--sj-paper)",
              color: vista === v ? "white" : "var(--sj-ink)",
            }}
          >
            {v === "comanda" ? "🧾 Comanda" : "✂️ Dividir cuenta"}
          </button>
        ))}
      </div>

      {vista === "comanda" && (
        <ComandaVista
          pedido={pedido}
          mesaId={mesaId}
          navigate={navigate}
          total={total}
          received={received}
          cambio={cambio}
          dineroRecibido={dineroRecibido}
          setDineroRecibido={setDineroRecibido}
          quickAmounts={quickAmounts}
          handleFinalizar={handleFinalizar}
          handleCancelar={handleCancelar}
        />
      )}

      {vista === "dividir" && (
        <DividirCuenta
          pedido={pedido}
          onFinalizar={handleFinalizar}
        />
      )}
    </div>
  );
}

/* ── Vista comanda normal ── */
function ComandaVista({ pedido, mesaId, navigate, total, received, cambio, dineroRecibido, setDineroRecibido, quickAmounts, handleFinalizar, handleCancelar }) {
  return (
    <>
      <div className="between" style={{ marginTop: 4, marginBottom: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Comanda</div>
        <button className="wf-btn sm ghost" onClick={() => navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })}>
          + producto
        </button>
      </div>

      <div className="col">
        {pedido.productos_pedidos.map(item => (
          <div key={item.id} className="wf-box" style={{ padding: "10px 12px" }}>
            <div className="between">
              <div className="wf-h3">{item.producto_nombre}</div>
              <div className="wf-sm" style={{ marginRight: 8 }}>× {item.cantidad}</div>
            </div>
            <div className="between" style={{ marginTop: 4 }}>
              <span className="wf-sm">${(parseFloat(item.subtotal) / item.cantidad).toFixed(2)} c/u</span>
              <span className="wf-h3">${parseFloat(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="wf-box bold" style={{ padding: 12, background: "var(--sj-green-l)", borderColor: "var(--sj-green-d)" }}>
        <div className="between">
          <span className="wf-h2">Total</span>
          <span className="wf-h1" style={{ fontSize: 36, color: "var(--sj-green-d)" }}>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="wf-divider" />

      {/* Dinero recibido */}
      <div>
        <div className="wf-sm" style={{ marginBottom: 4 }}>Dinero recibido</div>
        <div className="wf-box" style={{ padding: "10px 14px" }}>
          <div className="between">
            <input
              type="number"
              value={dineroRecibido}
              onChange={e => setDineroRecibido(e.target.value)}
              placeholder="$0"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 28, fontFamily: "'Caveat',cursive", fontWeight: 700, width: "100%" }}
            />
            <button className="wf-btn sm ghost" onClick={() => setDineroRecibido("")}>limpiar</button>
          </div>
        </div>
        <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {quickAmounts.map(a => (
            <span key={a} className="wf-chip" style={{ cursor: "pointer" }} onClick={() => setDineroRecibido(String(a))}>${a}</span>
          ))}
          <span className="wf-chip gold" style={{ cursor: "pointer" }} onClick={() => setDineroRecibido(String(Math.ceil(total)))}>exacto</span>
        </div>
      </div>

      {received > 0 && (
        <div className="wf-box" style={{ padding: 12, borderStyle: "dashed", borderColor: "var(--sj-gold-d)", background: "oklch(0.98 0.04 85)" }}>
          <div className="between">
            <span className="wf-h3">Cambio</span>
            <span className="wf-h1" style={{ fontSize: 30, color: "var(--sj-gold-d)" }}>${cambio.toFixed(0)}</span>
          </div>
          {cambio > 0 && <><div className="wf-divider" /><CambioSugerencias dineroRecibido={received} totalAPagar={total} /></>}
        </div>
      )}

      <button className="wf-btn primary" style={{ width: "100%" }} onClick={handleFinalizar}>
        Cobrar y cerrar
      </button>
      <div className="row" style={{ gap: 8 }}>
        <button className="wf-btn ghost grow" onClick={() => navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })}>
          + Agregar productos
        </button>
        <button className="wf-btn danger sm" onClick={handleCancelar}>Cancelar orden</button>
      </div>
    </>
  );
}

/* ── Dividir cuenta ── */
function DividirCuenta({ pedido, onFinalizar }) {
  const [personas, setPersonas] = useState(2);
  // asignaciones[personaIdx] = Set de product_pedido ids
  const [asignaciones, setAsignaciones] = useState({});

  const toggleAsignar = (personaIdx, ppId) => {
    setAsignaciones(prev => {
      const next = { ...prev };
      // Remove from all other personas first
      for (const k in next) {
        if (parseInt(k) !== personaIdx) {
          next[k] = new Set([...(next[k] || [])].filter(id => id !== ppId));
        }
      }
      const set = new Set(next[personaIdx] || []);
      if (set.has(ppId)) set.delete(ppId);
      else set.add(ppId);
      next[personaIdx] = set;
      return next;
    });
  };

  const totalPersona = (idx) => {
    const ids = asignaciones[idx] || new Set();
    return pedido.productos_pedidos
      .filter(pp => ids.has(pp.id))
      .reduce((sum, pp) => sum + parseFloat(pp.subtotal), 0);
  };

  const totalAsignado = Object.values(asignaciones).reduce((sum, set) => {
    return sum + pedido.productos_pedidos
      .filter(pp => set.has(pp.id))
      .reduce((s, pp) => s + parseFloat(pp.subtotal), 0);
  }, 0);

  const sinAsignar = pedido.productos_pedidos.filter(pp => {
    return !Object.values(asignaciones).some(set => set.has(pp.id));
  });

  return (
    <>
      {/* Personas selector */}
      <div className="wf-box" style={{ padding: 12 }}>
        <div className="between">
          <span className="wf-h3">Número de personas</span>
          <div className="stepper">
            <button className="minus" onClick={() => setPersonas(p => Math.max(2, p - 1))}>−</button>
            <span className="val">{personas}</span>
            <button className="plus" onClick={() => setPersonas(p => p + 1)}>+</button>
          </div>
        </div>
      </div>

      {/* Product assignment */}
      <div className="wf-sm" style={{ marginBottom: 4 }}>Toca una persona para asignar cada producto:</div>
      {pedido.productos_pedidos.map(pp => {
        const asignadoA = Object.entries(asignaciones).find(([, set]) => set.has(pp.id));
        const idxAsignado = asignadoA ? parseInt(asignadoA[0]) : null;
        return (
          <div key={pp.id} className="wf-box" style={{ padding: "8px 12px" }}>
            <div className="between" style={{ marginBottom: 6 }}>
              <div>
                <span className="wf-h3" style={{ fontSize: 17 }}>{pp.producto_nombre}</span>
                <span className="wf-sm" style={{ marginLeft: 6 }}>× {pp.cantidad} · ${parseFloat(pp.subtotal).toFixed(2)}</span>
              </div>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: personas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => toggleAsignar(i, pp.id)}
                  className="wf-btn sm"
                  style={{
                    background: idxAsignado === i ? "var(--sj-green)" : "var(--sj-paper)",
                    color: idxAsignado === i ? "white" : "var(--sj-ink)",
                    borderColor: idxAsignado === i ? "var(--sj-green-d)" : "var(--sj-line)",
                  }}
                >
                  P{i + 1}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Sin asignar warning */}
      {sinAsignar.length > 0 && (
        <div className="wf-chip red" style={{ padding: "6px 12px", fontSize: 15 }}>
          ⚠️ {sinAsignar.length} producto(s) sin asignar
        </div>
      )}

      {/* Totals per person */}
      <div className="wf-h3" style={{ marginTop: 4 }}>Totales por persona</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8 }}>
        {Array.from({ length: personas }, (_, i) => (
          <div key={i} className="wf-box" style={{ padding: "10px 14px", textAlign: "center" }}>
            <div className="wf-sm">Persona {i + 1}</div>
            <div className="wf-h2" style={{ color: "var(--sj-green-d)" }}>${totalPersona(i).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="wf-box bold" style={{ padding: 12, background: "var(--sj-green-l)", borderColor: "var(--sj-green-d)" }}>
        <div className="between">
          <span className="wf-h3">Asignado / Total</span>
          <span className="wf-h2" style={{ color: "var(--sj-green-d)" }}>
            ${totalAsignado.toFixed(2)} / ${parseFloat(pedido.factura?.total || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        className="wf-btn primary"
        style={{ width: "100%" }}
        disabled={sinAsignar.length > 0}
        onClick={onFinalizar}
      >
        {sinAsignar.length > 0 ? `Asigna ${sinAsignar.length} producto(s) pendiente(s)` : "Cobrar y cerrar"}
      </button>
    </>
  );
}
