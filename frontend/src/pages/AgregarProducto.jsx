// src/pages/AgregarProductos.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchProductos, postPedido, updatePedido } from "../api/ListaProductos";
import { TopBar, SectionHead, StatusBar, ImgPlaceholder, Stepper } from "../components/DesignPrimitives";
import "../design-system.css";

const CATS = ["Todos", "Caldos", "Tacos", "Bebidas", "Extras"];

const AgregarProductos = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialPedido = state?.pedido;

  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [catActiva, setCatActiva] = useState("Todos");

  useEffect(() => {
    (async () => {
      const datos = await fetchProductos();
      const init = Object.fromEntries(datos.map((p) => [p.id, 0]));
      if (initialPedido?.productos_pedidos) {
        initialPedido.productos_pedidos.forEach((item) => {
          init[item.producto] = item.cantidad;
        });
      }
      setProductos(datos);
      setCantidades(init);
    })();
  }, [initialPedido]);

  const cambiarCantidad = (pid, delta) =>
    setCantidades((prev) => ({ ...prev, [pid]: Math.max(0, prev[pid] + delta) }));

  const handleAgregar = async () => {
    const seleccionados = productos.filter((p) => cantidades[p.id] > 0);
    if (!seleccionados.length) return;

    const productos_pedidos = seleccionados.map((p) => ({
      producto: p.id,
      producto_nombre: p.nombre,
      cantidad: cantidades[p.id],
      subtotal: (cantidades[p.id] * parseFloat(p.precio)).toFixed(2),
    }));

    const payload = {
      mesa: Number(mesaId),
      estatus: "ocupado",
      fecha_creacion: new Date().toISOString(),
      productos_pedidos,
    };

    setEnviando(true);
    try {
      const result = initialPedido?.id
        ? await updatePedido(initialPedido.id, payload)
        : await postPedido(payload);
      navigate(`/mesa/${mesaId}/comandaCliente`, { state: { pedido: result } });
    } catch {
      alert("Error al enviar el pedido. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const productosFiltrados =
    catActiva === "Todos"
      ? productos
      : productos.filter((p) => p.categoria === catActiva);

  const totalSeleccionados = productos
    .filter((p) => cantidades[p.id] > 0)
    .reduce((s, p) => s + cantidades[p.id] * parseFloat(p.precio), 0);

  const numSeleccionados = Object.values(cantidades).reduce((s, v) => s + v, 0);

  return (
    <div className="device">
      <div className="device__inner">
        <StatusBar title="Agregar" />

        <div className="device__body no-tabbar">
          <div className="page">
            {/* TopBar con volver */}
            <TopBar
              back={() => navigate(-1)}
              title="Agregar"
              subtitle={`a Mesa ${mesaId}`}
            />

            {/* Buscador placeholder */}
            <div className="wf-box pill" style={{ padding: "8px 14px" }}>
              <div className="row">
                <span style={{ fontSize: 16 }}>🔍</span>
                <span className="wf-sm">buscar producto…</span>
              </div>
            </div>

            {/* Filtros de categoría */}
            <div className="row" style={{ gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {CATS.map((c) => (
                <span
                  key={c}
                  className={`wf-chip ${catActiva === c ? "green" : ""}`}
                  style={{ flexShrink: 0, cursor: "pointer" }}
                  onClick={() => setCatActiva(c)}
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Lista de productos */}
            <div className="col">
              {productosFiltrados.map((p) => (
                <div key={p.id} className="wf-box" style={{ padding: 10 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <ImgPlaceholder w={48} h={48} label="" />
                    <div style={{ flex: 1 }}>
                      <div className="wf-h3">{p.nombre}</div>
                      <div className="wf-sm">{p.categoria || "General"}</div>
                    </div>
                    <div className="col" style={{ alignItems: "flex-end", gap: 6 }}>
                      <span className="wf-h3">${parseFloat(p.precio).toFixed(2)}</span>
                      <Stepper
                        value={cantidades[p.id] ?? 0}
                        onChange={(v) => setCantidades((prev) => ({ ...prev, [p.id]: v }))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer de envío — solo visible si hay algo seleccionado */}
            {numSeleccionados > 0 && (
              <div
                className="wf-box bold"
                style={{
                  padding: 12,
                  background: "var(--sj-cream)",
                  borderColor: "var(--sj-gold-d)",
                  borderStyle: "dashed",
                }}
              >
                <div className="between">
                  <div>
                    <div className="wf-h3">{numSeleccionados} productos</div>
                    <div className="wf-sm">${totalSeleccionados.toFixed(2)} · pendiente de enviar</div>
                  </div>
                  <button
                    className="wf-btn primary"
                    disabled={enviando}
                    onClick={handleAgregar}
                  >
                    {enviando ? "Enviando…" : "Agregar productos"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgregarProductos;
