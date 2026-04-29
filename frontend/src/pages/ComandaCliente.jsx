// src/pages/ComandaCliente.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchPedidoDetail, updatePedido } from "../api/ListaProductos";
import CambioSugerencias from "./CambioSugerencias";
import { TopBar, SectionHead, StatusBar } from "../components/DesignPrimitives";
import "../design-system.css";

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
      <div className="device">
        <div className="device__inner">
          <StatusBar title="Comanda" />
          <div className="page">
            <div className="wf-body" style={{ color: "var(--sj-ink-2)", marginTop: 40, textAlign: "center" }}>
              Cargando…
            </div>
          </div>
        </div>
      </div>
    );

  const total = parseFloat(pedido.factura.total).toFixed(2);

  const handleFinalizar = async () => {
    const confirmado = window.confirm("¿Estás seguro de que deseas finalizar este pedido?");
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

  return (
    <div className="device">
      <div className="device__inner">
        <StatusBar title={`Mesa ${mesaId}`} />

        <div className="device__body no-tabbar">
          <div className="page">
            {/* TopBar con botón agregar */}
            <TopBar
              back={() => navigate("/")}
              title={`Mesa ${mesaId}`}
              subtitle="abierta"
              right={
                <button
                  className="wf-btn sm ghost"
                  onClick={() => navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })}
                >
                  + producto
                </button>
              }
            />

            {/* Lista de productos */}
            <SectionHead>Comanda</SectionHead>

            <div className="col">
              {pedido.productos_pedidos.map((item) => (
                <div key={item.id} className="wf-box" style={{ padding: "10px 12px" }}>
                  <div className="between">
                    <div style={{ flex: 1 }}>
                      <div className="wf-h3">{item.producto_nombre}</div>
                    </div>
                    <span className="wf-chip">{item.cantidad}</span>
                  </div>
                  <div className="between" style={{ marginTop: 6 }}>
                    <span className="wf-sm">subtotal</span>
                    <span className="wf-h3">${parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div
              className="wf-box bold"
              style={{ padding: 12, background: "var(--sj-green-l)", borderColor: "var(--sj-green-d)" }}
            >
              <div className="between">
                <span className="wf-h2">Total</span>
                <span className="wf-h1" style={{ fontSize: 36, color: "var(--sj-green-d)" }}>
                  ${total}
                </span>
              </div>
            </div>

            <div className="wf-divider" />

            {/* Dinero recibido */}
            <SectionHead>Cobro</SectionHead>

            <div>
              <div className="wf-sm" style={{ marginBottom: 6 }}>Dinero recibido</div>
              <input
                type="number"
                className="wf-input"
                value={dineroRecibido}
                onChange={(e) => setDineroRecibido(parseInt(e.target.value) || 0)}
                placeholder="$0.00"
              />
            </div>

            {/* Cambios posibles */}
            <div
              className="wf-box"
              style={{
                padding: 12,
                borderStyle: "dashed",
                borderColor: "var(--sj-gold-d)",
                background: "oklch(0.98 0.04 85)",
                minHeight: 80,
              }}
            >
              <div className="wf-h3" style={{ marginBottom: 8 }}>Cambios posibles</div>
              <CambioSugerencias
                dineroRecibido={parseInt(dineroRecibido) || 0}
                totalAPagar={parseFloat(total)}
              />
            </div>

            <div className="wf-divider" />

            {/* Acciones */}
            <div className="row" style={{ gap: 8 }}>
              <button
                className="wf-btn gold grow"
                onClick={() => navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })}
              >
                + Agregar
              </button>
              <button className="wf-btn danger grow" onClick={handleFinalizar}>
                Finalizar pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComandaCliente;
