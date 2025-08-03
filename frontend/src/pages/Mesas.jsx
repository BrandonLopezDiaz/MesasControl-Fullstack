// src/pages/Mesas.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import mesaImage from "../assets/mesa.png";
import { fetchPedidoDetail } from "../api/ListaProductos";

const Mesas = () => {
  const navigate = useNavigate();
  const mesas = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleMesaClick = async (mesaNum) => {
    try {
      const pedidos = await fetchPedidoDetail(mesaNum);
      if (pedidos.length > 0 && pedidos[0].estatus === "ocupado") {
        // mesa ya tiene pedido activo
        navigate(
          `/mesa/${mesaNum}/comandaCliente`,
          { state: { pedido: pedidos[0] } }
        );
      } else {
        // mesa libre o pedido finalizado
        navigate(`/mesa/${mesaNum}/agregar`);
      }
    } catch (error) {
      console.error("No fue posible consultar estado de mesa:", error);
      // fallo de red, asumimos mesa libre
      navigate(`/mesa/${mesaNum}/agregar`);
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
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Mesas</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        {mesas.map((mesa) => (
          <div
            key={mesa}
            onClick={() => handleMesaClick(mesa)}
            style={{
              backgroundColor: "#fff",
              border: "2px solid #009A8D",
              borderRadius: "12px",
              padding: 0,
              textAlign: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "transform 0.2s",
              height: "120px",
              position: "relative",
              backgroundImage: `url(${mesaImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#222",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1.0)")
            }
          >
            <span
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
              }}
            >
              Mesa {mesa}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mesas;
