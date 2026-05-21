import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchPedidoDetail, updatePedido } from '../api/ListaProductos';
import { ESTATUS } from '../utils/constants';
import { fmtMoney, fmtTotal } from '../utils/format';
import CambioSugerencias from './CambioSugerencias';

const PERSONA_COLORS = [
  'var(--sj-green)', 'var(--sj-gold-d)', 'var(--sj-red)',
  'oklch(0.52 0.16 270)', 'oklch(0.55 0.14 200)',
];

export default function ComandaCliente() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [pedido, setPedido] = useState(location.state?.pedido || null);
  const [dineroRecibido, setDineroRecibido] = useState('');
  const [vista, setVista] = useState('comanda');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pedido) return;
    (async () => {
      const data = await fetchPedidoDetail(mesaId);
      if (data.length) setPedido(data[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesaId]);

  if (!pedido) return <div className="loading-screen">Cargando...</div>;

  const total = parseFloat(pedido.factura?.total || 0);
  const received = parseFloat(dineroRecibido) || 0;
  const cambio = Math.max(0, received - total);

  const etiqueta = () => {
    if (pedido.tipo === 'barra') return '🍺 Barra';
    if (pedido.tipo === 'para_llevar') return '🛍️ Para llevar';
    if (pedido.tipo === 'rapido') return '⚡ Pedido rápido';
    return `Mesa ${mesaId}`;
  };

  const buildPayloadFromItems = (items, estatus) => ({
    mesa: pedido.mesa,
    tipo: pedido.tipo || 'mesa',
    estatus: estatus || pedido.estatus,
    para_llevar: pedido.para_llevar,
    costo_extra_llevar: pedido.costo_extra_llevar,
    productos_pedidos: items.map((item) => ({
      producto: item.producto,
      producto_nombre: item.producto_nombre,
      cantidad: item.cantidad,
      subtotal: item.subtotal,
    })),
  });

  const buildPayloadBase = (estatus) =>
    buildPayloadFromItems(pedido.productos_pedidos, estatus);

  const handleFinalizar = async () => {
    if (!window.confirm('¿Finalizar y cobrar este pedido?')) return;
    try {
      await updatePedido(pedido.id, buildPayloadBase(ESTATUS.FINALIZADO));
      navigate('/');
    } catch {
      alert('Error al finalizar. Intenta de nuevo.');
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('¿Cancelar este pedido? Esta acción no se puede deshacer.')) return;
    try {
      await updatePedido(pedido.id, buildPayloadBase(ESTATUS.CANCELADO));
      navigate('/');
    } catch {
      alert('Error al cancelar. Intenta de nuevo.');
    }
  };

  const handleRemoveProduct = async (producto) => {
    const nombre = producto.producto_nombre;
    if (!window.confirm(`¿Eliminar "${nombre}" de la comanda?`)) return;
    setSaving(true);
    const items = pedido.productos_pedidos.filter((p) => p.producto !== producto.producto);
    try {
      const updated = await updatePedido(pedido.id, buildPayloadFromItems(items));
      setPedido(updated);
    } catch {
      alert('Error al eliminar producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeQuantity = async (producto, delta) => {
    const newCantidad = producto.cantidad + delta;
    if (newCantidad < 1) {
      await handleRemoveProduct(producto);
      return;
    }
    setSaving(true);
    const precioUnitario = parseFloat(producto.subtotal) / producto.cantidad;
    const items = pedido.productos_pedidos.map((p) =>
      p.producto === producto.producto
        ? { ...p, cantidad: newCantidad, subtotal: (precioUnitario * newCantidad).toFixed(2) }
        : p,
    );
    try {
      const updated = await updatePedido(pedido.id, buildPayloadFromItems(items));
      setPedido(updated);
    } catch {
      alert('Error al cambiar cantidad.');
    } finally {
      setSaving(false);
    }
  };

  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
    Math.ceil(total / 500) * 500,
    1000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 3);

  return (
    <div className="page fade-in">
      <div className="between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="wf-btn sm ghost" onClick={() => navigate('/')}>‹ atrás</button>
          <div>
            <div className="wf-h1" style={{ fontSize: 28 }}>{etiqueta()}</div>
            <div className="wf-sm">comanda activa</div>
          </div>
        </div>
        <span className="wf-chip red">en cocina</span>
      </div>

      <div className="row" style={{ gap: 0, border: '2px solid var(--sj-line)', borderRadius: 12, overflow: 'hidden' }}>
        {['comanda', 'dividir'].map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            style={{
              flex: 1, padding: '10px 0',
              fontFamily: "'Patrick Hand',cursive", fontSize: 17,
              border: 'none', cursor: 'pointer',
              background: vista === v ? 'var(--sj-green)' : 'var(--sj-paper)',
              color: vista === v ? 'white' : 'var(--sj-ink)',
            }}
          >
            {v === 'comanda' ? '🧾 Comanda' : '✂️ Dividir cuenta'}
          </button>
        ))}
      </div>

      {vista === 'comanda' && (
        <ComandaVista
          pedido={pedido}
          mesaId={mesaId}
          navigate={navigate}
          total={total}
          received={received}
          cambio={cambio}
          dineroRecibido={dineroRecibido}
          setDineroRecibido={setDineroRecibido}
          quickAmounts={quickAmounts}
          handleFinalizar={handleFinalizar}
          handleCancelar={handleCancelar}
          onRemoveProduct={handleRemoveProduct}
          onChangeQuantity={handleChangeQuantity}
          saving={saving}
        />
      )}

      {vista === 'dividir' && (
        <DividirCuenta
          pedido={pedido}
          onFinalizar={handleFinalizar}
        />
      )}
    </div>
  );
}

/* ── Vista comanda normal ── */
function ComandaVista({
  pedido, mesaId, navigate, total, received, cambio,
  dineroRecibido, setDineroRecibido, quickAmounts,
  handleFinalizar, handleCancelar,
  onRemoveProduct, onChangeQuantity, saving,
}) {
  const pendientes = pedido.productos_pedidos.filter((pp) => !pp.listo_cocina);
  const hayPendientes = pendientes.length > 0;

  const handleFinalizarClick = async () => {
    const msg = hayPendientes
      ? `⚠️ Hay ${pendientes.length} producto(s) pendientes en cocina.\n\n¿Finalizar igual?`
      : '¿Finalizar y cobrar este pedido?';
    if (!window.confirm(msg)) return;
    await handleFinalizar();
  };

  return (
    <>
      <div className="between" style={{ marginTop: 4, marginBottom: 4 }}>
        <div className="wf-h2" style={{ fontSize: 22 }}>Comanda</div>
        <button className="wf-btn sm ghost" onClick={() => navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })}>
          + producto
        </button>
      </div>

      {hayPendientes && (
        <div className="wf-chip red" style={{ padding: '6px 12px', fontSize: 15, marginBottom: 8 }}>
          ⏳ {pendientes.length} producto(s) pendiente(s) en cocina
        </div>
      )}

      <div className="col">
        {pedido.productos_pedidos.map((item) => {
          const precioUnidad = parseFloat(item.subtotal) / item.cantidad;
          const isReady = item.listo_cocina;
          return (
            <div
              key={item.id}
              className="wf-box"
              style={{
                padding: '10px 12px',
                background: isReady ? 'var(--sj-green-l)' : 'var(--sj-paper)',
                opacity: isReady ? 0.75 : 1,
              }}
            >
              <div className="between" style={{ marginBottom: 4 }}>
                <div className="row" style={{ gap: 6 }}>
                  {isReady && <span style={{ color: 'var(--sj-green-d)', fontSize: 16 }}>✓</span>}
                  <div
                    className="wf-h3"
                    style={isReady ? { textDecoration: 'line-through', color: 'var(--sj-ink-2)' } : {}}
                  >
                    {item.producto_nombre}
                  </div>
                </div>
                {!isReady && (
                  <button
                    className="wf-btn sm ghost"
                    style={{ color: 'var(--sj-red)', padding: '2px 6px', fontSize: 13 }}
                    onClick={() => onRemoveProduct(item)}
                    disabled={saving}
                    title="Eliminar producto"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="between">
                <div className="row" style={{ gap: 4, alignItems: 'center' }}>
                  {!isReady && (
                    <button
                      className="wf-btn sm ghost"
                      style={{ padding: '2px 6px', fontSize: 16, fontWeight: 700 }}
                      onClick={() => onChangeQuantity(item, -1)}
                      disabled={saving}
                    >
                      −
                    </button>
                  )}
                  <span className="wf-sm" style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                    × {item.cantidad}
                  </span>
                  {!isReady && (
                    <button
                      className="wf-btn sm ghost"
                      style={{ padding: '2px 6px', fontSize: 16, fontWeight: 700 }}
                      onClick={() => onChangeQuantity(item, 1)}
                      disabled={saving}
                    >
                      +
                    </button>
                  )}
                  <span className="wf-sm" style={{ marginLeft: 4 }}>{fmtMoney(precioUnidad)} c/u</span>
                </div>
                <span className="wf-h3">{fmtMoney(item.subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="wf-box bold" style={{ padding: 12, background: 'var(--sj-green-l)', borderColor: 'var(--sj-green-d)' }}>
        <div className="between">
          <span className="wf-h2">Total</span>
          <span className="wf-h1" style={{ fontSize: 36, color: 'var(--sj-green-d)' }}>{fmtTotal(total)}</span>
        </div>
      </div>

      <div className="wf-divider" />

      <div>
        <div className="wf-sm" style={{ marginBottom: 4 }}>Dinero recibido</div>
        <div className="wf-box" style={{ padding: '10px 14px' }}>
          <div className="between">
            <input
              type="number"
              value={dineroRecibido}
              onChange={(e) => setDineroRecibido(e.target.value)}
              placeholder="$0"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 28, fontFamily: "'Caveat',cursive", fontWeight: 700, width: '100%' }}
            />
            <button className="wf-btn sm ghost" onClick={() => setDineroRecibido('')}>limpiar</button>
          </div>
        </div>
        <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {quickAmounts.map((a) => (
            <span key={a} className="wf-chip" style={{ cursor: 'pointer' }} onClick={() => setDineroRecibido(String(a))}>{fmtTotal(a)}</span>
          ))}
          <span className="wf-chip gold" style={{ cursor: 'pointer' }} onClick={() => setDineroRecibido(String(Math.ceil(total)))}>exacto</span>
        </div>
      </div>

      {received > 0 && (
        <div className="wf-box" style={{ padding: 12, borderStyle: 'dashed', borderColor: 'var(--sj-gold-d)', background: 'oklch(0.98 0.04 85)' }}>
          <div className="between">
            <span className="wf-h3">Cambio</span>
            <span className="wf-h1" style={{ fontSize: 30, color: 'var(--sj-gold-d)' }}>{fmtTotal(cambio)}</span>
          </div>
          {cambio > 0 && (
            <>
              <div className="wf-divider" />
              <CambioSugerencias dineroRecibido={received} totalAPagar={total} />
            </>
          )}
        </div>
      )}

      <button className="wf-btn primary" style={{ width: '100%' }} onClick={handleFinalizarClick}>
        {hayPendientes ? `Cobrar (${pendientes.length} pendiente(s))` : 'Cobrar y cerrar'}
      </button>
      <div className="row" style={{ gap: 8 }}>
        <button className="wf-btn ghost grow" onClick={() => navigate(`/mesa/${mesaId}/agregar`, { state: { pedido } })}>
          + Agregar productos
        </button>
        <button className="wf-btn danger sm" onClick={handleCancelar}>Cancelar orden</button>
      </div>
    </>
  );
}

/* ── Dividir cuenta ── */
function DividirCuenta({ pedido, onFinalizar }) {
  const [personas, setPersonas] = useState(2);
  const [asignaciones, setAsignaciones] = useState({});
  const [pagos, setPagos] = useState({});

  const pendientes = pedido.productos_pedidos.filter((pp) => !pp.listo_cocina);
  const hayPendientes = pendientes.length > 0;

  const unidades = pedido.productos_pedidos.flatMap((pp) => {
    const precioPorUnidad = parseFloat(pp.subtotal) / pp.cantidad;
    return Array.from({ length: pp.cantidad }, (_, i) => ({
      uid: `${pp.id}_${i}`,
      ppId: pp.id,
      nombre: pp.producto_nombre,
      precio: precioPorUnidad,
      unidadNum: i + 1,
      totalUnidades: pp.cantidad,
    }));
  });

  const getAsignado = (uid) => asignaciones[uid] ?? null;

  const asignar = (uid, personaIdx) => {
    setAsignaciones((prev) => {
      const next = { ...prev };
      next[uid] = prev[uid] === personaIdx ? null : personaIdx;
      return next;
    });
  };

  const totalPersona = (idx) =>
    unidades.filter((u) => asignaciones[u.uid] === idx)
      .reduce((s, u) => s + u.precio, 0);

  const sinAsignar = unidades.filter((u) => asignaciones[u.uid] == null);
  const totalAsignado = unidades
    .filter((u) => asignaciones[u.uid] != null)
    .reduce((s, u) => s + u.precio, 0);
  const totalGeneral = parseFloat(pedido.factura?.total || 0);

  const cambioPersona = (idx) => {
    const pagado = parseFloat(pagos[idx]) || 0;
    return Math.max(0, pagado - totalPersona(idx));
  };

  const quickFor = (total) => [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
    Math.ceil(total / 500) * 500,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 2);

  return (
    <>
      <div className="wf-box" style={{ padding: 12 }}>
        <div className="between">
          <span className="wf-h3">Número de personas</span>
          <div className="stepper">
            <button className="minus" onClick={() => setPersonas((p) => Math.max(2, p - 1))}>−</button>
            <span className="val">{personas}</span>
            <button className="plus" onClick={() => setPersonas((p) => Math.min(8, p + 1))}>+</button>
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {Array.from({ length: personas }, (_, i) => (
          <div key={i} className="row" style={{ gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: PERSONA_COLORS[i % PERSONA_COLORS.length] }} />
            <span className="wf-sm">P{i + 1}</span>
          </div>
        ))}
      </div>

      <div className="wf-sm" style={{ marginBottom: 4 }}>
        Toca una persona para asignar cada unidad. Productos con cantidad &gt;1 se dividen individualmente:
      </div>

      {pedido.productos_pedidos.map((pp) => {
        const ppUnidades = unidades.filter((u) => u.ppId === pp.id);
        return (
          <div key={pp.id} className="wf-box" style={{ padding: '10px 12px' }}>
            <div className="between" style={{ marginBottom: 8 }}>
              <span className="wf-h3" style={{ fontSize: 17 }}>{pp.producto_nombre}</span>
              <span className="wf-sm">{fmtMoney(parseFloat(pp.subtotal) / pp.cantidad)} c/u</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ppUnidades.map((u) => {
                const asignadoA = getAsignado(u.uid);
                return (
                  <div key={u.uid} className="between" style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: asignadoA != null ? `${PERSONA_COLORS[asignadoA % PERSONA_COLORS.length]}22` : 'var(--sj-cream-2)',
                    border: `1.5px solid ${asignadoA != null ? PERSONA_COLORS[asignadoA % PERSONA_COLORS.length] : 'var(--sj-line)'}`,
                  }}>
                    <span className="wf-sm">
                      unidad {u.unidadNum}/{u.totalUnidades} — {fmtMoney(u.precio)}
                    </span>
                    <div className="row" style={{ gap: 4 }}>
                      {Array.from({ length: personas }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => asignar(u.uid, i)}
                          className="wf-btn sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: 14,
                            background: asignadoA === i ? PERSONA_COLORS[i % PERSONA_COLORS.length] : 'var(--sj-paper)',
                            color: asignadoA === i ? 'white' : 'var(--sj-ink)',
                            borderColor: PERSONA_COLORS[i % PERSONA_COLORS.length],
                          }}
                        >
                          P{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {sinAsignar.length > 0 && (
        <div className="wf-chip red" style={{ padding: '6px 12px', fontSize: 15 }}>
          ⚠️ {sinAsignar.length} unidad(es) sin asignar
        </div>
      )}

      <div className="wf-h3" style={{ marginTop: 4, marginBottom: 8 }}>Pago por persona</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: personas }, (_, i) => {
          const subtotal = totalPersona(i);
          const pagado = parseFloat(pagos[i]) || 0;
          const cambio = cambioPersona(i);
          const color = PERSONA_COLORS[i % PERSONA_COLORS.length];
          return (
            <div key={i} className="wf-box bold" style={{ padding: 12, borderColor: color }}>
              <div className="between" style={{ marginBottom: 8 }}>
                <div className="row" style={{ gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                  <span className="wf-h3">Persona {i + 1}</span>
                </div>
                <span className="wf-h2" style={{ color: 'var(--sj-green-d)' }}>{fmtMoney(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  placeholder="Dinero recibido"
                  value={pagos[i] || ''}
                  onChange={(e) => setPagos((prev) => ({ ...prev, [i]: e.target.value }))}
                  style={{
                    flex: 1, border: `1.5px solid ${color}`, borderRadius: 10,
                    padding: '6px 10px', fontFamily: "'Caveat',cursive", fontSize: 22,
                    fontWeight: 700, background: 'transparent', outline: 'none',
                  }}
                />
                <span className="wf-sm">recibido</span>
              </div>
              <div className="row" style={{ gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                {quickFor(subtotal).map((a) => (
                  <span key={a} className="wf-chip" style={{ cursor: 'pointer', fontSize: 14 }} onClick={() => setPagos((prev) => ({ ...prev, [i]: String(a) }))}>{fmtMoney(a)}</span>
                ))}
                <span className="wf-chip gold" style={{ cursor: 'pointer', fontSize: 14 }} onClick={() => setPagos((prev) => ({ ...prev, [i]: String(Math.ceil(subtotal)) }))}>exacto</span>
              </div>
              {pagado > 0 && (
                <div className="between" style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'oklch(0.97 0.04 85)', border: '1px dashed var(--sj-gold-d)' }}>
                  <span className="wf-sm">Cambio P{i + 1}</span>
                  <span className="wf-h3" style={{ color: 'var(--sj-gold-d)' }}>{fmtMoney(cambio)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="wf-box bold" style={{ padding: 12, background: 'var(--sj-green-l)', borderColor: 'var(--sj-green-d)' }}>
        <div className="between">
          <span className="wf-h3">Asignado / Total</span>
          <span className="wf-h2" style={{ color: 'var(--sj-green-d)' }}>
            {fmtMoney(totalAsignado)} / {fmtMoney(totalGeneral)}
          </span>
        </div>
      </div>

      {hayPendientes && (
        <div className="wf-chip red" style={{ padding: '6px 12px', fontSize: 15, marginTop: 8 }}>
          ⏳ {pendientes.length} producto(s) pendiente(s) en cocina
        </div>
      )}

      <button
        className="wf-btn primary"
        style={{ width: '100%' }}
        disabled={sinAsignar.length > 0}
        onClick={() => {
          if (hayPendientes && !window.confirm(`⚠️ Hay ${pendientes.length} producto(s) pendientes en cocina.\n\n¿Finalizar igual?`)) return;
          onFinalizar();
        }}
      >
        {sinAsignar.length > 0
          ? `Asigna ${sinAsignar.length} unidad(es) pendiente(s)`
          : 'Cobrar y cerrar'}
      </button>
    </>
  );
}
