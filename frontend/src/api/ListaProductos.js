import axios from "axios";

const getBaseURL = () => {
  const url = process.env.REACT_APP_API_URL;
  if (url) return url.replace(/\/$/, "");
  console.warn("⚠️ REACT_APP_API_URL no está definida, usando localhost");
  return "http://127.0.0.1:8000";
};

const BASE_URL = getBaseURL();

export const API_v1 = `${BASE_URL}/api/v1/`;
export const API_v2 = `${BASE_URL}/api/v2/`;

/* ── Productos ── */
export const fetchProductos = async () => {
  const { data } = await axios.get(`${API_v1}productos/`);
  return data;
};
export const createProducto = async (payload) => {
  const { data } = await axios.post(`${API_v1}productos/`, payload);
  return data;
};
export const updateProducto = async (id, payload) => {
  const { data } = await axios.put(`${API_v1}productos/${id}/`, payload);
  return data;
};
export const deleteProducto = async (id) => {
  await axios.delete(`${API_v1}productos/${id}/`);
};

/* ── Configuraciones ── */
export const fetchConfiguraciones = async () => {
  const { data } = await axios.get(`${API_v1}configuraciones/`);
  return data;
};
export const createConfiguracion = async (payload) => {
  const { data } = await axios.post(`${API_v1}configuraciones/`, payload);
  return data;
};
export const updateConfiguracion = async (id, payload) => {
  const { data } = await axios.put(`${API_v1}configuraciones/${id}/`, payload);
  return data;
};
export const deleteConfiguracion = async (id) => {
  await axios.delete(`${API_v1}configuraciones/${id}/`);
};

/* ── Pedidos detail ── */
export const fetchPedidos = async (params = {}) => {
  const { data } = await axios.get(`${API_v2}pedido_detail/`, { params });
  return data;
};
export const fetchPedidoDetail = async (mesaId) => {
  const { data } = await axios.get(`${API_v2}pedido_detail/`, {
    params: { mesa: mesaId },
  });
  return data;
};
export const postPedido = async (payload) => {
  const { data } = await axios.post(`${API_v2}pedido_detail/`, payload);
  return data;
};
export const updatePedido = async (pedidoId, payload) => {
  const { data } = await axios.put(`${API_v2}pedido_detail/${pedidoId}/`, payload);
  return data;
};
export const deletePedido = async (id) => {
  await axios.delete(`${API_v2}pedido_detail/${id}/`);
};

/* ── Producto Pedido (marcar listo cocina) ── */
export const patchProductoPedido = async (id, payload) => {
  const { data } = await axios.patch(`${API_v2}producto_pedido/${id}/`, payload);
  return data;
};

/* ── Cierre de día ── */
export const fetchCierres = async () => {
  const { data } = await axios.get(`${API_v2}cierre_dia/`);
  return data;
};
export const createCierre = async (payload) => {
  const { data } = await axios.post(`${API_v2}cierre_dia/`, payload);
  return data;
};

