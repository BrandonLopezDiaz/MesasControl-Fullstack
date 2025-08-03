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

  useEffect(() => {
    (async () => {
      const datos = await fetchProductos();
      const init = Object.fromEntries(datos.map(p => [p.id, 0]));
      if (initialPedido?.productos_pedidos) {
        initialPedido.productos_pedidos.forEach(item => {
          init[item.producto] = item.cantidad;
        });
      }
      setProductos(datos);
      setCantidades(init);
    })();
  }, [initialPedido]);

  const cambiarCantidad = (pid, delta) =>
    setCantidades(prev => ({ ...prev, [pid]: Math.max(0, prev[pid] + delta) }));

  const handleAgregar = async () => {
    const seleccionados = productos.filter(p => cantidades[p.id] > 0);
    if (!seleccionados.length) return;

    const productos_pedidos = seleccionados.map(p => ({
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

  return (
    <div
      style={{
        padding: "1rem",
        minHeight: "100vh",
        backgroundColor: "#d1ffe6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          alignSelf: "flex-start",
          background: "#ccc",
          border: "none",
          padding: "0.4rem 1rem",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "0.5rem",
        }}
      >
        ← Volver
      </button>

      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Mesa {mesaId}
      </h1>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Agregar productos:
      </h2>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        {productos.map(p => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "0.5rem",
              background: "#c9f7d1",
              padding: "0.5rem",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
              <span style={{ fontWeight: "bold", flex: 1 }}>
                {p.nombre}
              </span>
              <span style={{ width: "60px", textAlign: "right" }}>
                ${parseFloat(p.precio).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                marginLeft: "10px",
              }}
            >
              <button
                onClick={() => cambiarCantidad(p.id, -1)}
                style={{
                  background: "#ff6b6b",
                  border: "none",
                  color: "#fff",
                  width: "32px",
                  height: "32px",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                –
              </button>
              <span style={{ width: "32px", textAlign: "center" }}>
                {cantidades[p.id]}
              </span>
              <button
                onClick={() => cambiarCantidad(p.id, 1)}
                style={{
                  background: "#4d9cff",
                  border: "none",
                  color: "#fff",
                  width: "32px",
                  height: "32px",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAgregar}
        disabled={enviando}
        style={{
          marginTop: "1rem",
          background: enviando ? "#a0eebb" : "#00ff87",
          border: "1px solid #009A8D",
          borderRadius: "24px",
          padding: "0.7rem 2rem",
          fontWeight: "bold",
          cursor: enviando ? "not-allowed" : "pointer",
          fontSize: "1.1rem",
          opacity: enviando ? 0.7 : 1,
        }}
      >
        {enviando ? "Enviando…" : "Agregar productos"}
      </button>
    </div>
  );
};

export default AgregarProductos;
