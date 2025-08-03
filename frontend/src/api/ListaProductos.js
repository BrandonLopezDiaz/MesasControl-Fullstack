import axios from "axios";

// 🔹 Usar variable de entorno para la API
const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const API_v1 = `${BASE_URL}/api/v1/productos/`;
const API_v2 = `${BASE_URL}/api/v2/pedido_detail/`;

export const fetchProductos = async () => {
  try {
    const response = await axios.get(API_v1);
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

export const postPedido = async (payload) => {
  try {
    const { data } = await axios.post(API_v2, payload);
    return data;
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

export const updatePedido = async (pedidoId, payload) => {
  try {
    const { data } = await axios.put(`${API_v2}${pedidoId}/`, payload);
    return data;
  } catch (error) {
    console.error("Error actualizando pedido", error);
    throw error;
  }
};

export const fetchPedidoDetail = async (mesaId) => {
  try {
    const res = await axios.get(API_v2, { params: { mesa: mesaId } });
    return res.data; // array de pedidos
  } catch (e) {
    console.error("Error al obtener detalle:", e);
    return [];
  }
};
