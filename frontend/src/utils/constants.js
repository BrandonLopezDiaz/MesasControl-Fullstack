/* ── Estados de pedido ── */
export const ESTATUS = {
  OCUPADO: 'ocupado',
  LISTO_COCINA: 'listo_cocina',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

export const ESTATUS_ACTIVOS = [ESTATUS.OCUPADO, ESTATUS.LISTO_COCINA];

/* ── Tipos de servicio ── */
export const TIPO = {
  MESA: 'mesa',
  BARRA: 'barra',
  PARA_LLEVAR: 'para_llevar',
  RAPIDO: 'rapido',
};

export const TIPO_LABELS = {
  [TIPO.MESA]: 'Mesa',
  [TIPO.BARRA]: 'Barra',
  [TIPO.PARA_LLEVAR]: 'Para llevar',
  [TIPO.RAPIDO]: 'Pedido rápido',
};

/* ── Navegación ── */
export const RUTAS = {
  HOME: '/',
  MESA_AGREGAR: (id) => `/mesa/${id}/agregar`,
  MESA_COMANDA: (id) => `/mesa/${id}/comandaCliente`,
};

/* ── Varios ── */
export const REFRESH_INTERVAL_MS = 5000;
export const COCINA_REFRESH_MS = 15000;
export const LOCK_TTL_MS = 60000;
export const DEFAULT_ALERTA_MIN = 15;
