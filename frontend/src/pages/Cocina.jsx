import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchPedidos, updatePedido, patchProductoPedido, fetchConfiguraciones } from '../api/ListaProductos';
import { ESTATUS, COCINA_REFRESH_MS, DEFAULT_ALERTA_MIN } from '../utils/constants';
import { tiempoTranscurrido } from '../utils/format';

/* ── Notificación sonora (Web Audio API, sin archivos) ── */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Dos tonos rápidos: do6 → mi6
    [1047, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.2);
    });
  } catch {}
}

/* ── Toast de notificación ── */
function Toast({ message, type, onDismiss }) {
  return (
    <div
      style={{
        padding: '12px 20px', borderRadius: 12,
        background: type === 'success' ? 'var(--sj-green-d)' : 'var(--sj-red)',
        color: 'white', fontWeight: 700, fontSize: 15,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        animation: 'fadeIn 0.3s ease',
        cursor: 'pointer',
      }}
      onClick={onDismiss}
      role="alert"
    >
      {message}
    </div>
  );
}

function useTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState([]);
  const [limiteMin, setLimiteMin] = useState(DEFAULT_ALERTA_MIN);
  const [toasts, setToasts] = useState([]);
  const prevPendientesRef = useRef(0);
  useTicker();

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /* ── Title badge ── */
  const actualizarBadge = (count) => {
    document.title = count > 0 ? `(${count}) Cocina - Local100` : 'Cocina - Local100';
  };

  const load = useCallback(async () => {
    const data = await fetchPedidos({ estatus: ESTATUS.OCUPADO }).catch(() => []);
    setPedidos(data);

    const pendientes = data.reduce(
      (sum, p) => sum + p.productos_pedidos.filter((pp) => !pp.listo_cocina).length,
      0,
    );
    actualizarBadge(pendientes);

    // Detectar nuevos productos pendientes vs el poll anterior
    const prev = prevPendientesRef.current;
    if (prev > 0 && pendientes > prev) {
      const nuevos = pendientes - prev;
      playNotificationSound();
      addToast(`🍳 ${nuevos} nuevo(s) producto(s) en cocina`);
    }
    prevPendientesRef.current = pendientes;
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, COCINA_REFRESH_MS);
    return () => {
      clearInterval(id);
      document.title = 'Cocina - Local100'; // cleanup badge on unmount
    };
  }, [load]);

  useEffect(() => {
    fetchConfiguraciones()
      .then((cfgs) => {
        const cfg = cfgs.find((c) => c.clave === 'tiempo_alerta_cocina');
        if (cfg) setLimiteMin(parseInt(cfg.valor, 10) || DEFAULT_ALERTA_MIN);
      })
      .catch(() => {});
  }, []);

  const marcarProductoListo = async (prodId) => {
    await patchProductoPedido(prodId, { listo_cocina: true });
    load();
  };

  const marcarTodoListo = async (pedido) => {
    await Promise.all(
      pedido.productos_pedidos
        .filter((pp) => !pp.listo_cocina)
        .map((pp) => patchProductoPedido(pp.id, { listo_cocina: true })),
    );
    const payload = {
      mesa: pedido.mesa,
      tipo: pedido.tipo || 'mesa',
      estatus: ESTATUS.LISTO_COCINA,
      para_llevar: pedido.para_llevar,
      costo_extra_llevar: pedido.costo_extra_llevar,
      productos_pedidos: pedido.productos_pedidos.map((pp) => ({
        producto: pp.producto,
        producto_nombre: pp.producto_nombre,
        cantidad: pp.cantidad,
        subtotal: pp.subtotal,
      })),
    };
    await updatePedido(pedido.id, payload);
    load();
  };

  const etiquetaMesa = (p) => {
    if (p.tipo === 'barra') return '🍺 Barra';
    if (p.tipo === 'para_llevar') return '🛍️ Para llevar';
    if (p.tipo === 'rapido') return '⚡ Rápido';
    return `Mesa ${p.mesa}`;
  };

  return (
    <div className="page fade-in">
      {/* Toast container */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>

      <div className="between" style={{ marginBottom: 16 }}>
        <div className="wf-h1">🍳 Cocina</div>
        <span className="wf-sm">actualiza cada 15s · alerta &gt;{limiteMin}min</span>
      </div>

      {pedidos.length === 0 && (
        <div className="loading-screen" style={{ fontSize: 22 }}>Sin pedidos activos 🎉</div>
      )}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))' }}>
        {pedidos.map((pedido) => {
          const { m, s } = tiempoTranscurrido(pedido.fecha_creacion);
          const alerta = m >= limiteMin;
          const pendientes = pedido.productos_pedidos.filter((pp) => !pp.listo_cocina);
          const todosListos = pendientes.length === 0;

          return (
            <div
              key={pedido.id}
              className="wf-box bold"
              style={{
                padding: 14,
                borderColor: alerta ? 'var(--sj-red)' : 'var(--sj-line)',
                background: alerta ? 'oklch(0.97 0.03 25)' : 'var(--sj-paper)',
              }}
            >
              <div className="between" style={{ marginBottom: 8 }}>
                <div className="wf-h2" style={{ fontSize: 22 }}>{etiquetaMesa(pedido)}</div>
                <span
                  className="wf-chip"
                  style={{
                    background: alerta ? 'var(--sj-red)' : 'var(--sj-green-l)',
                    color: alerta ? 'white' : 'var(--sj-green-d)',
                    borderColor: alerta ? 'oklch(0.38 0.14 25)' : 'var(--sj-green-d)',
                    fontFamily: "'Caveat',cursive",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {m}:{String(s).padStart(2, '0')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendientes.map((pp) => (
                  <div
                    key={pp.id}
                    className="between"
                    style={{
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: '1.5px solid var(--sj-line)',
                      background: 'var(--sj-cream)',
                    }}
                  >
                    <div>
                      <span className="wf-h3" style={{ fontSize: 17 }}>{pp.producto_nombre}</span>
                      <span className="wf-sm" style={{ marginLeft: 6 }}>× {pp.cantidad}</span>
                    </div>
                    <button
                      className="wf-btn sm"
                      style={{ padding: '2px 10px', fontSize: 14 }}
                      onClick={() => marcarProductoListo(pp.id)}
                    >
                      ✓ listo
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {!todosListos && (
                  <button
                    className="wf-btn gold"
                    style={{ width: '100%' }}
                    onClick={() => marcarTodoListo(pedido)}
                  >
                    ✓ Marcar todo listo ({pendientes.length})
                  </button>
                )}
                <button
                  className="wf-btn primary"
                  style={{ width: '100%' }}
                  onClick={() => marcarTodoListo(pedido)}
                  disabled={!todosListos}
                >
                  {todosListos ? '✓ Comanda lista — entregar' : `Esperando ${pendientes.length} producto(s)`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
