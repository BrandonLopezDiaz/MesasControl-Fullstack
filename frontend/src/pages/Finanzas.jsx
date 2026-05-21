import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  fetchPedidos, deletePedido, postPedido,
  fetchCierres, createCierre,
} from '../api/ListaProductos';
import { ESTATUS } from '../utils/constants';
import { fmtMoney, toLocalDateStr, sumBy } from '../utils/format';
import DatePicker from '../components/DatePicker';
import { useModal } from '../components/ConfirmModal';

const VISTAS = [
  { id: 'ventas', label: '📊 Ventas' },
  { id: 'cierre', label: '🗂️ Cierre de día' },
];

export default function Finanzas() {
  const [vista, setVista] = useState('ventas');
  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar__title wf-h2">Finanzas</div>
        {VISTAS.map((v) => (
          <div
            key={v.id}
            className={`sidebar__item ${vista === v.id ? 'active' : ''}`}
            onClick={() => setVista(v.id)}
          >
            {v.label}
          </div>
        ))}
      </aside>
      <main className="sidebar-main">
        {vista === 'ventas' && <Ventas />}
        {vista === 'cierre' && <CierreDia />}
      </main>
    </div>
  );
}

/* ── Ventas ── */
function Ventas() {
  const today = toLocalDateStr(new Date());
  const [pedidos, setPedidos] = useState([]);
  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const { show } = useModal();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPedidos().catch(() => []);
    setPedidos(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = useMemo(
    () => pedidos.filter((p) => {
      const fechaLocal = toLocalDateStr(p.fecha_creacion);
      if (desde && fechaLocal < desde) return false;
      if (hasta && fechaLocal > hasta) return false;
      return true;
    }),
    [pedidos, desde, hasta],
  );

  const finalizados = useMemo(
    () => filtrados.filter((p) => p.estatus === ESTATUS.FINALIZADO),
    [filtrados],
  );
  const activos = useMemo(
    () => filtrados.filter((p) => p.estatus === ESTATUS.OCUPADO || p.estatus === ESTATUS.LISTO_COCINA),
    [filtrados],
  );
  const cancelados = useMemo(
    () => filtrados.filter((p) => p.estatus === ESTATUS.CANCELADO),
    [filtrados],
  );

  const totalVentas = useMemo(
    () => sumBy(finalizados, (p) => parseFloat(p.factura?.total)),
    [finalizados],
  );
  const pendienteCobrar = useMemo(
    () => sumBy(activos, (p) => parseFloat(p.factura?.total)),
    [activos],
  );

  // ── Top products ──
  const topProductos = useMemo(() => {
    const conteo = {};
    finalizados.forEach((p) => {
      (p.productos_pedidos || []).forEach((pp) => {
        const nombre = pp.producto_nombre || '—';
        conteo[nombre] = (conteo[nombre] || 0) + (pp.cantidad || 0);
      });
    });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, total]) => ({ nombre, total }));
  }, [finalizados]);

  // ── Daily trend ──
  const trendData = useMemo(() => {
    const ventasPorDia = {};
    finalizados.forEach((p) => {
      const dia = toLocalDateStr(p.fecha_creacion);
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + parseFloat(p.factura?.total || 0);
    });
    return Object.entries(ventasPorDia).sort((a, b) => a[0].localeCompare(b[0]));
  }, [finalizados]);

  const maxTrend = useMemo(
    () => Math.max(...trendData.map(([, v]) => v), 1),
    [trendData],
  );

  const porMesa = useMemo(() => {
    const map = {};
    filtrados.forEach((p) => {
      const key = p.tipo === 'mesa'
        ? `Mesa ${p.mesa}`
        : p.tipo === 'barra'
          ? '🍺 Barra'
          : p.tipo === 'para_llevar'
            ? '🛍️ Para llevar'
            : '⚡ Rápido';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtrados]);

  const handleDuplicar = async (pedido) => {
    const payload = {
      mesa: pedido.mesa, tipo: pedido.tipo, estatus: ESTATUS.OCUPADO,
      para_llevar: pedido.para_llevar, costo_extra_llevar: pedido.costo_extra_llevar,
      productos_pedidos: pedido.productos_pedidos.map((pp) => ({
        producto: pp.producto, producto_nombre: pp.producto_nombre,
        cantidad: pp.cantidad, subtotal: pp.subtotal,
      })),
    };
    try {
      await postPedido(payload);
      show({ title: 'Comanda duplicada', message: 'Comanda duplicada correctamente.', variant: 'alert' });
      load();
    } catch (e) {
      show({ title: 'Error', message: 'Error al duplicar: ' + (e.response?.data?.mesa?.[0] || e.message), variant: 'alert' });
    }
  };

  const handleEliminar = async (pedido) => {
    const ok = await show({ title: 'Eliminar comanda', message: '¿Eliminar esta comanda?', variant: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    await deletePedido(pedido.id);
    load();
  };

  const bgEstatus = (e) => {
    if (e === ESTATUS.FINALIZADO) return 'var(--sj-green-l)';
    if (e === ESTATUS.CANCELADO) return 'oklch(0.94 0.04 25)';
    return 'var(--sj-cream-2)';
  };

  return (
    <>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10, marginBottom: 16 }}>
        <KPI label="Total ventas" value={fmtMoney(totalVentas)} />
        <KPI label="Finalizadas" value={finalizados.length} />
        <KPI label="Pendiente cobrar" value={fmtMoney(pendienteCobrar)} color="var(--sj-gold-d)" />
        <KPI label="Canceladas" value={cancelados.length} color="var(--sj-red)" />
      </div>

      {/* Filters */}
      <div className="wf-box" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Desde</div>
            <DatePicker value={desde} onChange={setDesde} />
          </div>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Hasta</div>
            <DatePicker value={hasta} onChange={setHasta} />
          </div>
          <button className="wf-btn sm ghost" onClick={() => { setDesde(''); setHasta(''); }}>
            Ver todo
          </button>
          <button
            className="wf-btn sm"
            style={{ background: 'var(--sj-green-l)', color: 'var(--sj-green-d)' }}
            onClick={() => { setDesde(today); setHasta(today); }}
          >
            Hoy
          </button>
        </div>
      </div>

      {loading && <div className="loading-screen">Cargando…</div>}

      {/* Daily trend chart */}
      {trendData.length > 1 && (
        <div className="wf-box" style={{ padding: 16, marginBottom: 14 }}>
          <div className="wf-h3" style={{ marginBottom: 10 }}>📈 Tendencia diaria</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
            {trendData.map(([dia, total]) => (
              <div key={dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 40,
                    height: `${Math.max(4, (total / maxTrend) * 80)}px`,
                    background: 'var(--sj-green)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s',
                    minHeight: 4,
                  }}
                  title={`${dia}: ${fmtMoney(total)}`}
                />
                <span className="wf-sm" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                  {dia.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top products */}
      {topProductos.length > 0 && (
        <div className="wf-box" style={{ padding: 16, marginBottom: 14 }}>
          <div className="wf-h3" style={{ marginBottom: 10 }}>🥇 Top productos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topProductos.map((p, i) => {
              const maxQty = topProductos[0].total;
              return (
                <div key={p.nombre} className="between" style={{ gap: 8 }}>
                  <div className="row" style={{ gap: 6, flex: 1, minWidth: 0 }}>
                    <span className="wf-sm" style={{ width: 16 }}>{i + 1}.</span>
                    <span className="wf-h3" style={{ fontSize: 16, flex: 1 }}>{p.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{
                      width: `${Math.max(20, (p.total / maxQty) * 80)}px`,
                      height: 16,
                      background: i === 0 ? 'var(--sj-gold)' : 'var(--sj-green-l)',
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                    <span className="wf-sm" style={{ minWidth: 30, textAlign: 'right' }}>×{p.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grouped by mesa/tipo */}
      {Object.entries(porMesa).map(([grupo, cmds]) => (
        <div key={grupo} style={{ marginBottom: 18 }}>
          <div className="wf-h3" style={{ marginBottom: 8 }}>{grupo} · {cmds.length} comandas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cmds.map((p) => (
              <div
                key={p.id}
                className="wf-box"
                style={{ padding: '10px 14px', background: bgEstatus(p.estatus) }}
              >
                <div className="between" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <div
                    style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
                    onClick={() => setDetalle(detalle?.id === p.id ? null : p)}
                  >
                    <span className="wf-h3">#{p.id} · {new Date(p.fecha_creacion).toLocaleDateString('es-MX')}</span>
                    <span className="wf-chip" style={{ marginLeft: 8, fontSize: 13 }}>{p.estatus}</span>
                  </div>
                  <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                    <span className="wf-h3" style={{ color: 'var(--sj-green-d)' }}>{fmtMoney(p.factura?.total)}</span>
                    <button className="wf-btn sm ghost" onClick={() => handleDuplicar(p)}>duplicar</button>
                    <button className="wf-btn sm danger" onClick={() => handleEliminar(p)}>✕</button>
                  </div>
                </div>
                {detalle?.id === p.id && (
                  <div style={{ marginTop: 8, borderTop: '1px dashed var(--sj-line)', paddingTop: 8 }}>
                    {p.productos_pedidos.map((pp) => (
                      <div key={pp.id} className="between wf-sm" style={{ padding: '2px 0' }}>
                        <span>{pp.producto_nombre} × {pp.cantidad}</span>
                        <span>{fmtMoney(pp.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtrados.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--sj-ink-2)', fontFamily: "'Patrick Hand',cursive", fontSize: 18 }}>
          Sin comandas para este período
        </div>
      )}
    </>
  );
}

const todayStr = toLocalDateStr(new Date());

/* ── Cierre de día ── */
function CierreDia() {
  const [fecha, setFecha] = useState(todayStr);
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [movimientos, setMovimientos] = useState([]);
  const [nuevoMov, setNuevoMov] = useState({ tipo: 'gasto', descripcion: '', monto: '' });
  const [movErrors, setMovErrors] = useState({});
  const [cierreError, setCierreError] = useState('');
  const [cierres, setCierres] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => { fetchCierres().then(setCierres).catch(() => {}); }, []);

  const validateMov = () => {
    const errs = {};
    if (!nuevoMov.descripcion.trim()) errs.descripcion = 'La descripción es requerida';
    if (!nuevoMov.monto || parseFloat(nuevoMov.monto) <= 0) errs.monto = 'Ingresa un monto válido';
    return errs;
  };

  const agregarMov = () => {
    const errs = validateMov();
    if (Object.keys(errs).length) { setMovErrors(errs); return; }
    setMovErrors({});
    setMovimientos((m) => [...m, { ...nuevoMov, monto: parseFloat(nuevoMov.monto) }]);
    setNuevoMov({ tipo: 'gasto', descripcion: '', monto: '' });
  };

  const handleGuardar = async () => {
    if (!fecha) { setCierreError('Selecciona una fecha para el cierre'); return; }
    setCierreError('');
    setGuardando(true);
    try {
      const res = await createCierre({
        fecha,
        cantidad_inicial: parseFloat(cantidadInicial) || 0,
        movimientos,
      });
      setResultado(res);
      fetchCierres().then(setCierres).catch(() => {});
    } catch (e) {
      const data = e.response?.data;
      if (data && typeof data === 'object') {
        const msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' · ');
        setCierreError(msg);
      } else {
        setCierreError('Error al generar el cierre. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const inputStyle = (field) => ({
    borderColor: movErrors[field] ? 'var(--sj-red)' : undefined,
    boxShadow: movErrors[field] ? '0 0 0 2px oklch(0.94 0.04 25)' : undefined,
  });

  const gastos = movimientos
    .filter((m) => m.tipo === 'gasto')
    .reduce((s, m) => s + m.monto, 0);
  const retiros = movimientos
    .filter((m) => m.tipo === 'retiro')
    .reduce((s, m) => s + m.monto, 0);

  return (
    <>
      <div className="wf-h1" style={{ marginBottom: 16 }}>Cierre de día</div>
      <div className="wf-box bold" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14, marginBottom: 14 }}>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Fecha</div>
            <DatePicker value={fecha} onChange={(v) => { setFecha(v); setCierreError(''); }} />
          </div>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Cantidad inicial ($)</div>
            <input
              type="number"
              className="wf-input"
              placeholder="0"
              value={cantidadInicial}
              onChange={(e) => setCantidadInicial(e.target.value)}
            />
          </div>
        </div>

        <div className="wf-h3" style={{ marginBottom: 8 }}>Gastos y retiros</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <select
            className="wf-input"
            style={{ width: 110 }}
            value={nuevoMov.tipo}
            onChange={(e) => setNuevoMov((m) => ({ ...m, tipo: e.target.value }))}
          >
            <option value="gasto">Gasto</option>
            <option value="retiro">Retiro</option>
          </select>
          <div style={{ flex: 1, minWidth: 120 }}>
            <input
              className="wf-input"
              style={{ width: '100%', ...inputStyle('descripcion') }}
              placeholder="Descripción *"
              value={nuevoMov.descripcion}
              onChange={(e) => {
                setNuevoMov((m) => ({ ...m, descripcion: e.target.value }));
                if (movErrors.descripcion) setMovErrors((er) => ({ ...er, descripcion: '' }));
              }}
            />
            {movErrors.descripcion && (
              <div style={{ color: 'var(--sj-red)', fontSize: 13, marginTop: 3, fontFamily: "'Patrick Hand',cursive" }}>{movErrors.descripcion}</div>
            )}
          </div>
          <div>
            <input
              type="number"
              className="wf-input"
              style={{ width: 90, ...inputStyle('monto') }}
              placeholder="$ *"
              value={nuevoMov.monto}
              onChange={(e) => {
                setNuevoMov((m) => ({ ...m, monto: e.target.value }));
                if (movErrors.monto) setMovErrors((er) => ({ ...er, monto: '' }));
              }}
            />
            {movErrors.monto && (
              <div style={{ color: 'var(--sj-red)', fontSize: 13, marginTop: 3, fontFamily: "'Patrick Hand',cursive" }}>{movErrors.monto}</div>
            )}
          </div>
          <button className="wf-btn gold" onClick={agregarMov}>+ Agregar</button>
        </div>

        {movimientos.map((m, i) => (
          <div key={i} className="between wf-sm" style={{ padding: '4px 0', borderBottom: '1px dashed var(--sj-line)' }}>
            <span>{m.tipo === 'gasto' ? '💸' : '🏦'} {m.descripcion}</span>
            <div className="row">
              <span style={{ color: 'var(--sj-red)' }}>-{fmtMoney(m.monto)}</span>
              <button className="wf-btn sm ghost" onClick={() => setMovimientos((ms) => ms.filter((_, j) => j !== i))}>✕</button>
            </div>
          </div>
        ))}
        {movimientos.length > 0 && (
          <div className="wf-sm" style={{ marginTop: 6 }}>
            Gastos: {fmtMoney(gastos)} · Retiros: {fmtMoney(retiros)}
          </div>
        )}

        {cierreError && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: 'oklch(0.94 0.04 25)',
            border: '1.5px solid var(--sj-red)',
            borderRadius: 10,
            color: 'var(--sj-red)',
            fontFamily: "'Patrick Hand',cursive",
            fontSize: 16,
          }}>
            ⚠️ {cierreError}
          </div>
        )}

        <button
          className="wf-btn primary"
          style={{ marginTop: 14, width: '100%' }}
          onClick={handleGuardar}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Generar cierre'}
        </button>
      </div>

      {resultado && (
        <div className="wf-box" style={{ padding: 16, marginBottom: 20, borderColor: 'var(--sj-green-d)', background: 'var(--sj-green-l)' }}>
          <div className="wf-h2" style={{ marginBottom: 10 }}>
            Cierre — {resultado.fecha} · Turno {resultado.turno}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 8 }}>
            <KPI label="Ventas del turno" value={fmtMoney(resultado.total_ventas)} />
            <KPI label="Comandas" value={resultado.total_comandas} />
            <KPI label="Canceladas" value={resultado.canceladas} />
            <KPI label="Esperado en caja" value={fmtMoney(resultado.dinero_esperado)} />
          </div>
        </div>
      )}

      {cierres.length > 0 && (
        <>
          <div className="wf-h3" style={{ marginBottom: 8 }}>Historial</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cierres.map((c) => (
              <div key={c.id} className="wf-box" style={{ padding: '10px 14px' }}>
                <div className="between">
                  <div>
                    <span className="wf-h3">{c.fecha}</span>
                    <span className="wf-chip" style={{ marginLeft: 8, fontSize: 13 }}>Turno {c.turno}</span>
                  </div>
                  <div className="row" style={{ gap: 12 }}>
                    <span className="wf-sm">{c.total_comandas} cmd</span>
                    <span className="wf-h3" style={{ color: 'var(--sj-green-d)' }}>{fmtMoney(c.total_ventas)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function KPI({ label, value, color }) {
  return (
    <div className="wf-box" style={{ padding: '12px 14px', borderColor: color || 'var(--sj-line)' }}>
      <div className="wf-sm">{label}</div>
      <div className="wf-h2" style={{ color: color || 'var(--sj-green-d)', marginTop: 2 }}>{value}</div>
    </div>
  );
}
