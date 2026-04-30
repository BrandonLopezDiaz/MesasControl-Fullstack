// src/pages/AgregarProductos.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchProductos, postPedido, updatePedido } from "../api/ListaProductos";

const AgregarProductos = () => {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialPedido = state?.pedido;

  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

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

    console.log("Datos a enviar:", JSON.stringify(payload, null, 2));
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

  const productosFiltrados = busqueda
    ? productos.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : productos;

  const totalNuevos = productos
    .filter((p) => cantidades[p.id] > 0)
    .reduce((sum, p) => sum + cantidades[p.id] * parseFloat(p.precio), 0);
  const cantNuevos = productos.filter((p) => cantidades[p.id] > 0).length;

  return (
    <div className="page fade-in">
      {/* Top bar */}
      <div className="between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="wf-btn sm ghost"
            onClick={() => navigate(-1)}
            style={{ padding: "4px 10px", fontSize: 18, lineHeight: 1 }}
          >
            ‹ atrás
          </button>
          <div>
            <div className="wf-h1" style={{ fontSize: 28 }}>
              Agregar
            </div>
            <div className="wf-sm">a Mesa {mesaId}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        className="wf-search"
        placeholder="🔍 buscar producto…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {/* Product list */}
      <div className="product-grid">
        {productosFiltrados.map((p) => (
          <div key={p.id} className="wf-box" style={{ padding: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <div
                className="wf-img"
                style={{ width: 48, height: 48 }}
              >
                <span style={{ position: "relative", background: "var(--sj-paper)", padding: "1px 6px", borderRadius: 4 }}>
                  foto
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="wf-h3">{p.nombre}</div>
                <div className="wf-sm">
                  ${parseFloat(p.precio).toFixed(2)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div className="stepper">
                  <button
                    className="minus"
                    onClick={() => cambiarCantidad(p.id, -1)}
                  >
                    −
                  </button>
                  <span className="val">{cantidades[p.id] || 0}</span>
                  <button
                    className="plus"
                    onClick={() => cambiarCantidad(p.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending summary bar */}
      {cantNuevos > 0 && (
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
              <div className="wf-h3">{cantNuevos} productos</div>
              <div className="wf-sm">
                ${totalNuevos.toFixed(2)} · pendiente de enviar
              </div>
            </div>
            <button
              className="wf-btn primary"
              onClick={handleAgregar}
              disabled={enviando}
            >
              {enviando ? "Enviando…" : "Enviar a cocina"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgregarProductos;
