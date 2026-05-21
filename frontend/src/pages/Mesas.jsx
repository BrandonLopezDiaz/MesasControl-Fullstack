import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPedidoDetail, fetchPedidos, fetchConfiguraciones } from '../api/ListaProductos';
import { ESTATUS, ESTATUS_ACTIVOS, TIPO, RUTAS, REFRESH_INTERVAL_MS, LOCK_TTL_MS, DEFAULT_ALERTA_MIN } from '../utils/constants';
import { fmtTotal, minutosDesde } from '../utils/format';

const MESAS = Array.from({ length: 10 }, (_, i) => i + 1);
const EXTRAS = [
  { id: 'barra', label: 'Barra', emoji: '🍺' },
  { id: 'para_llevar', label: 'Para llevar', emoji: '🛍️' },
  { id: 'rapido', label: 'Pedido rápido', emoji: '⚡' },
];

/* ── Lock system via localStorage ── */
const LOCK_KEY = 'milocal_mesa_locks';

function getUID() {
  let uid = sessionStorage.getItem('milocal_uid');
  if (!uid) {
    uid = Math.random().toString(36).slice(2);
    sessionStorage.setItem('milocal_uid', uid);
  }
  return uid;
}

function getLocks() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return {};
    const locks = JSON.parse(raw);
    const now = Date.now();
    const active = Object.fromEntries(
      Object.entries(locks).filter(([, v]) => now - v.ts < LOCK_TTL_MS),
    );
    localStorage.setItem(LOCK_KEY, JSON.stringify(active));
    return active;
  } catch {
    return {};
  }
}

function acquireLock(mesaId) {
  const locks = getLocks();
  locks[String(mesaId)] = { ts: Date.now(), uid: getUID() };
  localStorage.setItem(LOCK_KEY, JSON.stringify(locks));
}

function releaseLock(mesaId) {
  const locks = getLocks();
  if (locks[String(mesaId)]?.uid === getUID()) {
    delete locks[String(mesaId)];
    localStorage.setItem(LOCK_KEY, JSON.stringify(locks));
  }
}

function isLockedByOther(mesaId) {
  const locks = getLocks();
  const lock = locks[String(mesaId)];
  if (!lock) return false;
  return lock.uid !== getUID() && Date.now() - lock.ts < LOCK_TTL_MS;
}

/* ── Colores según estado ── */
const mesaColor = (info, locked, limiteMin) => {
  if (locked) return 'oklch(0.92 0.06 25)';
  if (!info || info.state === 'free') return 'var(--sj-green-l)';
  if (info.state === 'listo') return 'oklch(0.90 0.09 85)';
  if (info.minutos >= limiteMin) return 'oklch(0.92 0.06 25)';
  return 'oklch(0.95 0.07 85)';
};

const mesaNumColor = (info, locked, limiteMin) => {
  if (locked) return 'var(--sj-red)';
  if (!info || info.state === 'free') return 'var(--sj-green-d)';
  if (info.state === 'listo') return 'var(--sj-gold-d)';
  if (info.minutos >= limiteMin) return 'var(--sj-red)';
  return 'oklch(0.50 0.10 80)';
};

/* ── Helper: etiqueta para extras ── */
const extraLabel = (tipo) => EXTRAS.find((e) => e.id === tipo) || { emoji: '📦', label: tipo };

export default function Mesas() {
  const navigate = useNavigate();
  const [mesaStates, setMesaStates] = useState({});
  const [extraPedidos, setExtraPedidos] = useState([]);
  const [limiteMin, setLimiteMin] = useState(DEFAULT_ALERTA_MIN);
  const [locks, setLocks] = useState({});
  const [nombreLocal, setNombreLocal] = useState('Milocal');
  const [features, setFeatures] = useState({});
  const [configsLoaded, setConfigsLoaded] = useState(false);

  const extrasVisibles = EXTRAS.filter((e) => features[e.id] !== false);

  const refreshLocks = useCallback(() => setLocks(getLocks()), []);

  const checkMesas = useCallback(async () => {
    const states = {};
    await Promise.all(
      MESAS.map(async (mesa) => {
        try {
          const pedidos = await fetchPedidoDetail(mesa);
          const activo = pedidos.find(
            (p) => p.estatus === ESTATUS.OCUPADO || p.estatus === ESTATUS.LISTO_COCINA,
          );
          if (activo) {
            states[mesa] = {
              state: activo.estatus === ESTATUS.LISTO_COCINA ? 'listo' : 'occupied',
              total: parseFloat(activo.factura?.total || 0),
              minutos: minutosDesde(activo.fecha_creacion),
              pedido: activo,
            };
          } else {
            states[mesa] = { state: 'free' };
          }
        } catch {
          states[mesa] = { state: 'free' };
        }
      }),
    );
    setMesaStates(states);

    try {
      const [ocupados, listos] = await Promise.all([
        fetchPedidos({ estatus: ESTATUS.OCUPADO }),
        fetchPedidos({ estatus: ESTATUS.LISTO_COCINA }),
      ]);
      const todosActivos = [...ocupados, ...listos];
      setExtraPedidos(todosActivos.filter((p) => p.tipo && p.tipo !== TIPO.MESA));
    } catch { /* silently ignore */ }

    refreshLocks();
  }, [refreshLocks]);

  useEffect(() => {
    checkMesas();
    const id = setInterval(checkMesas, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checkMesas]);

  useEffect(() => {
    fetchConfiguraciones()
      .then((cfgs) => {
        const getVal = (clave, fallback) => {
          const c = cfgs.find((x) => x.clave === clave);
          return c ? c.valor : fallback;
        };
        setLimiteMin(parseInt(getVal('tiempo_alerta_cocina', DEFAULT_ALERTA_MIN), 10) || DEFAULT_ALERTA_MIN);
        setNombreLocal(getVal('nombre_local', 'Milocal'));
        setFeatures({
          barra: getVal('feature_barra', 'true') === 'true',
          para_llevar: getVal('feature_para_llevar', 'true') === 'true',
          rapido: getVal('feature_rapido', 'true') === 'true',
        });
        setConfigsLoaded(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = nombreLocal;
  }, [nombreLocal]);

  // Release lock when coming back to this page
  useEffect(() => {
    MESAS.forEach((m) => releaseLock(m));
    refreshLocks();
  }, [refreshLocks]);

  const handleMesaClick = (mesa) => {
    if (isLockedByOther(mesa)) return;
    acquireLock(mesa);
    refreshLocks();
    const info = mesaStates[mesa];
    if (info?.state === 'occupied' || info?.state === 'listo') {
      navigate(RUTAS.MESA_COMANDA(mesa), { state: { pedido: info.pedido } });
    } else {
      navigate(RUTAS.MESA_AGREGAR(mesa), { state: { tipo: TIPO.MESA } });
    }
  };

  const handleExtraClick = (extra) => navigate(RUTAS.MESA_AGREGAR(0), { state: { tipo: extra.id } });
  const handleExtraPedidoClick = (pedido) => navigate(RUTAS.MESA_COMANDA(pedido.mesa), { state: { pedido } });

  const freeCount = Object.values(mesaStates).filter((s) => s.state === 'free').length;
  const occCount = Object.values(mesaStates).filter(
    (s) => s.state === 'occupied' || s.state === 'listo',
  ).length;

  return (
    <div className="page fade-in">
      <div className="between">
        <div>
          <div className="wf-h1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="22" height="15" viewBox="0 0 24 17" fill="none">
              <path d="M2 14 L4 5 L9 10 L12 3 L15 10 L20 5 L22 14 Z" stroke="var(--sj-gold-d)" strokeWidth="2" strokeLinejoin="round" fill="var(--sj-gold)" />
              <line x1="2" y1="15" x2="22" y2="15" stroke="var(--sj-gold-d)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {nombreLocal}
          </div>
          <div className="wf-sm">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {freeCount > 0 && <span className="wf-chip green">{freeCount} libres</span>}
          {occCount > 0 && <span className="wf-chip red">{occCount} ocup</span>}
        </div>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span className="wf-sm">
          <span style={dotStyle('var(--sj-green-d)')} /> libre
        </span>
        <span className="wf-sm">
          <span style={dotStyle('oklch(0.50 0.10 80)')} /> activa
        </span>
        <span className="wf-sm">
          <span style={dotStyle('var(--sj-red)')} /> &gt;{limiteMin}min o en uso
        </span>
        <span className="wf-sm">
          <span style={dotStyle('var(--sj-gold)', true)} /> lista en cocina
        </span>
      </div>

      <div className="between" style={{ marginTop: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Mesas</div>
      </div>
      <div className="mesa-grid">
        {MESAS.map((mesa) => {
          const info = mesaStates[mesa] || { state: 'free' };
          const locked = isLockedByOther(mesa);
          return (
            <div
              key={mesa}
              className="wf-mesa"
              style={{
                background: mesaColor(info, locked, limiteMin),
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.85 : 1,
              }}
              onClick={() => handleMesaClick(mesa)}
              title={locked ? 'Otro camarero está trabajando en esta mesa' : ''}
            >
              <div className="wf-mesa__num" style={{ color: mesaNumColor(info, locked, limiteMin) }}>{mesa}</div>
              {locked && <div className="wf-mesa__lbl">🔒 en uso</div>}
              {!locked && info.state === 'free' && <div className="wf-mesa__lbl">libre</div>}
              {!locked && info.state === 'occupied' && (
                <div className="wf-mesa__lbl">{info.minutos}min · {fmtTotal(info.total)}</div>
              )}
              {!locked && info.state === 'listo' && <div className="wf-mesa__lbl">🏅 listo</div>}
            </div>
          );
        })}
      </div>

      {extraPedidos.length > 0 && (
        <>
          <div className="between" style={{ marginTop: 4 }}>
            <div className="wf-h2" style={{ fontSize: 22 }}>Extras activos</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {extraPedidos.map((p) => {
              const { emoji, label } = extraLabel(p.tipo);
              const mins = minutosDesde(p.fecha_creacion);
              return (
                <div
                  key={p.id}
                  className="wf-box bold"
                  style={{ padding: '12px 14px', cursor: 'pointer', borderColor: 'var(--sj-gold-d)', background: 'oklch(0.97 0.04 85)' }}
                  onClick={() => handleExtraPedidoClick(p)}
                >
                  <div className="between">
                    <div>
                      <div className="wf-h3">{emoji} {label} <span className="wf-sm">#{p.id}</span></div>
                      <div className="wf-sm">{p.productos_pedidos?.length || 0} productos · {mins}min</div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="wf-h2" style={{ color: 'var(--sj-green-d)' }}>{fmtTotal(p.factura?.total)}</span>
                      <span className="wf-sm">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="between" style={{ marginTop: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Nuevo extra</div>
      </div>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        {extrasVisibles.map((e) => (
          <button
            key={e.id}
            className="wf-btn gold"
            style={{ flex: 1, minWidth: 100, justifyContent: 'center' }}
            onClick={() => handleExtraClick(e)}
          >
            {e.emoji} {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Estilo reutilizable para los dots de la leyenda ── */
const dotStyle = (bg, squared = false) => ({
  display: 'inline-block',
  width: 12,
  height: 12,
  borderRadius: squared ? 3 : '50%',
  background: bg,
  border: squared ? '1.5px solid var(--sj-gold-d)' : 'none',
  marginRight: 3,
  verticalAlign: 'middle',
});
