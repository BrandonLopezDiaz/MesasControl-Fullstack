// src/pages/ComandaCliente.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  fetchPedidoDetail,
  updatePedido,
} from "../api/ListaProductos";
import CambioSugerencias from "./CambioSugerencias"; // ✅ Importamos el componente

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

  if (!pedido) return <div>Cargando...</div>;

  const total = parseFloat(pedido.factura.total).toFixed(2);

  const handleFinalizar = async () => {
    const confirmado = window.confirm(
      "¿Estás seguro de que deseas finalizar este pedido?"
    );
    if (!confirmado) return;

    const payload = {
      mesa: pedido.mesa,
      estatus: "finalizado",
      fecha_creacion: pedido.fecha_creacion,
      productos_pedidos: pedido.productos_pedidos.map(item => ({
        producto: item.producto,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
      })),
    };

    try {
      await updatePedido(pedido.id, payload);
      alert("Pedido finalizado correctamente.");
      navigate("/"); // vuelve al listado de mesas
    } catch {
      alert("Error al finalizar el pedido. Intenta de nuevo.");
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
      {/* Botones superiores */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <button
          onClick={() =>
            navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })
          }
          style={{
            background: "#ffeb57",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Agregar producto
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#ccc",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ← Principal
        </button>
      </div>

      <h1 style={{ fontSize: "1.8rem", width: "100%", maxWidth: "400px", textAlign: "left" }}>
        Mesa {mesaId}
      </h1>

      <h2 style={{ fontSize: "1.5rem", margin: "1rem 0 0.5rem", width: "100%", maxWidth: "400px", textAlign: "left" }}>
        Comanda del cliente:
      </h2>

      {/* Lista de productos */}
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {pedido.productos_pedidos.map(item => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#c9f7d1",
              padding: "0.5rem",
              borderRadius: "8px",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ flex: 1, fontWeight: "bold" }}>
              {item.producto_nombre}
            </span>
            <span style={{ width: "60px", textAlign: "right" }}>
              ${parseFloat(item.subtotal).toFixed(2)}
            </span>
            <div style={{ marginLeft: "10px" }}>
              <span style={{ padding: "0 0.5rem" }}>{item.cantidad}</span>
            </div>
          </div>
        ))}
      </div>

      <hr style={{ width: "100%", maxWidth: "400px", border: "1px solid #bbb", margin: "1rem 0" }} />

      {/* Total */}
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Total:</strong>
        <span>${total}</span>
      </div>

      {/* Input Dinero recibido */}
      <label style={{ alignSelf: "flex-start", marginTop: "1rem", fontWeight: "bold" }}>
        Dinero recibido:
      </label>
      <input
        type="number"
        value={dineroRecibido}
        onChange={e => setDineroRecibido(parseInt(e.target.value) || 0)}
        placeholder="$0.00"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "0.5rem",
          borderRadius: "16px",
          border: "1px solid #000",
          fontSize: "1rem",
          marginTop: "0.5rem",
        }}
      />

      {/* Contenedor de combinaciones */}
      <h3 style={{ alignSelf: "flex-start", marginTop: "1rem", width: "100%", maxWidth: "400px" }}>
        Cambios posibles:
      </h3>
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          minHeight: "100px",
          background: "#75ada1",
          borderRadius: "16px",
          marginBottom: "1rem",
        }}
      >
        {/* ✅ Aquí renderizamos dinámicamente el componente con las combinaciones */}
        <CambioSugerencias dineroRecibido={parseInt(dineroRecibido) || 0} totalAPagar={parseFloat(total)} />
      </div>

      {/* Botón Finalizar */}
      <button
        onClick={handleFinalizar}
        style={{
          marginTop: "0.5rem",
          background: "#ff6b6b",
          border: "none",
          padding: "0.7rem 1.5rem",
          borderRadius: "16px",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Finalizar pedido
      </button>
    </div>
  );
};

export default ComandaCliente;
