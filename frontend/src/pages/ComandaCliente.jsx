// src/pages/ComandaCliente.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchPedidoDetail, updatePedido } from "../api/ListaProductos";
import CambioSugerencias from "./CambioSugerencias";

const ComandaCliente = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [pedido, setPedido] = useState(location.state?.pedido || null);
  const [dineroRecibido, setDineroRecibido] = useState("");

  useEffect(() => {
    if (pedido) return;
    (async () => {
      const data = await fetchPedidoDetail(mesaId);
      if (data.length) setPedido(data[0]);
    })();
  }, [mesaId, pedido]);

  if (!pedido)
    return (
      <div className="loading-screen">Cargando...</div>
    );

  const total = parseFloat(pedido.factura.total);
  const totalStr = total.toFixed(2);
  const received = parseInt(dineroRecibido) || 0;
  const cambio = Math.max(0, received - total);

  const handleFinalizar = async () => {
    const confirmado = window.confirm(
      "¿Estás seguro de que deseas finalizar este pedido?"
    );
    if (!confirmado) return;

    const payload = {
      mesa: pedido.mesa,
      estatus: "finalizado",
      fecha_creacion: pedido.fecha_creacion,
      productos_pedidos: pedido.productos_pedidos.map((item) => ({
        producto: item.producto,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
      })),
    };

    try {
      await updatePedido(pedido.id, payload);
      alert("Pedido finalizado correctamente.");
      navigate("/");
    } catch {
      alert("Error al finalizar el pedido. Intenta de nuevo.");
    }
  };

  // Quick amounts for received money
  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
    Math.ceil(total / 500) * 500,
    1000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 3);

  return (
    <div className="page fade-in">
      {/* Top bar */}
      <div className="between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="wf-btn sm ghost"
            onClick={() => navigate("/")}
            style={{ padding: "4px 10px", fontSize: 18, lineHeight: 1 }}
          >
            ‹ atrás
          </button>
          <div>
            <div className="wf-h1" style={{ fontSize: 28 }}>
              Mesa {mesaId}
            </div>
            <div className="wf-sm">comanda activa</div>
          </div>
        </div>
        <span className="wf-chip red">en cocina</span>
      </div>

      {/* Section: Comanda */}
      <div className="between" style={{ marginTop: 4, marginBottom: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Comanda</div>
        <button
          className="wf-btn sm ghost"
          onClick={() =>
            navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })
          }
        >
          + producto
        </button>
      </div>

      {/* Product items */}
      <div className="col">
        {pedido.productos_pedidos.map((item) => (
          <div key={item.id} className="wf-box" style={{ padding: "10px 12px" }}>
            <div className="between">
              <div style={{ flex: 1 }}>
                <div className="wf-h3">{item.producto_nombre}</div>
              </div>
              <div className="wf-sm" style={{ marginRight: 8 }}>
                × {item.cantidad}
              </div>
            </div>
            <div className="between" style={{ marginTop: 6 }}>
              <span className="wf-sm">
                ${(parseFloat(item.subtotal) / item.cantidad).toFixed(2)} c/u
              </span>
              <span className="wf-h3">${parseFloat(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total box */}
      <div
        className="wf-box bold"
        style={{
          padding: 12,
          background: "var(--sj-green-l)",
          borderColor: "var(--sj-green-d)",
        }}
      >
        <div className="between">
          <span className="wf-h2">Total</span>
          <span
            className="wf-h1"
            style={{ fontSize: 36, color: "var(--sj-green-d)" }}
          >
            ${totalStr}
          </span>
        </div>
      </div>

      <div className="wf-divider" />

      {/* Dinero recibido */}
      <div>
        <div className="wf-sm" style={{ marginBottom: 4 }}>
          Dinero recibido
        </div>
        <div className="wf-box" style={{ padding: "10px 14px" }}>
          <div className="between">
            <input
              type="number"
              className="wf-input"
              value={dineroRecibido}
              onChange={(e) => setDineroRecibido(e.target.value)}
              placeholder="$0"
              style={{ border: "none", boxShadow: "none", padding: 0, fontSize: 28, fontFamily: "'Caveat', cursive", fontWeight: 700 }}
            />
            <button
              className="wf-btn sm ghost"
              onClick={() => setDineroRecibido("")}
            >
              limpiar
            </button>
          </div>
        </div>
        <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {quickAmounts.map((a) => (
            <span
              key={a}
              className="wf-chip"
              style={{ cursor: "pointer" }}
              onClick={() => setDineroRecibido(String(a))}
            >
              ${a}
            </span>
          ))}
          <span
            className="wf-chip gold"
            style={{ cursor: "pointer" }}
            onClick={() => setDineroRecibido(String(Math.ceil(total)))}
          >
            exacto
          </span>
        </div>
      </div>

      {/* Cambio box */}
      {received > 0 && (
        <div
          className="wf-box"
          style={{
            padding: 12,
            borderStyle: "dashed",
            borderColor: "var(--sj-gold-d)",
            background: "oklch(0.98 0.04 85)",
          }}
        >
          <div className="between">
            <span className="wf-h3">Cambio</span>
            <span
              className="wf-h1"
              style={{ fontSize: 30, color: "var(--sj-gold-d)" }}
            >
              ${cambio.toFixed(0)}
            </span>
          </div>
          {cambio > 0 && (
            <>
              <div className="wf-divider" />
              <CambioSugerencias
                dineroRecibido={received}
                totalAPagar={total}
              />
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="row" style={{ gap: 8 }}>
        <button
          className="wf-btn primary grow"
          onClick={handleFinalizar}
        >
          Cobrar y cerrar mesa
        </button>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="wf-btn ghost grow"
          onClick={() =>
            navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })
          }
        >
          + Agregar productos
        </button>
        <button className="wf-btn danger sm" onClick={() => navigate("/")}>
          Volver
        </button>
      </div>
    </div>
  );
};

export default ComandaCliente;
