import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchProductos, postPedido, updatePedido, fetchConfiguraciones } from '../api/ListaProductos';
import { ESTATUS, TIPO_LABELS } from '../utils/constants';
import { fmtMoney } from '../utils/format';

export default function AgregarProductos() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialPedido = state?.pedido;
  const tipo = state?.tipo || 'mesa';

  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paraLlevar, setParaLlevar] = useState(initialPedido?.para_llevar || false);
  const [costoLlevar, setCostoLlevar] = useState(0);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  useEffect(() => {
    (async () => {
      const [datos, cfgs] = await Promise.all([
        fetchProductos(),
        fetchConfiguraciones().catch(() => []),
      ]);
      const cfgLlevar = cfgs.find((c) => c.clave === 'costo_extra_llevar');
      if (cfgLlevar) setCostoLlevar(parseFloat(cfgLlevar.valor) || 0);

      const init = Object.fromEntries(datos.map((p) => [p.id, 0]));
      setProductos(datos);
      setCantidades(init);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarCantidad = (pid, delta) =>
    setCantidades((prev) => ({ ...prev, [pid]: Math.max(0, prev[pid] + delta) }));

  const handleAgregar = async () => {
    const seleccionados = productos.filter((p) => cantidades[p.id] > 0);
    if (!seleccionados.length) return;

    const extraPorProd = paraLlevar ? costoLlevar : 0;

    let productosFinales;
    if (initialPedido?.productos_pedidos) {
      const originalMap = {};
      initialPedido.productos_pedidos.forEach((pp) => {
        originalMap[pp.producto] = { ...pp };
      });

      const merged = { ...originalMap };
      seleccionados.forEach((p) => {
        if (merged[p.id]) {
          const orig = merged[p.id];
          const newCantidad = orig.cantidad + cantidades[p.id];
          const precioPorUnidad = parseFloat(orig.subtotal) / orig.cantidad;
          merged[p.id] = {
            ...orig,
            cantidad: newCantidad,
            subtotal: (newCantidad * precioPorUnidad).toFixed(2),
          };
        } else {
          merged[p.id] = {
            producto: p.id,
            producto_nombre: p.nombre,
            cantidad: cantidades[p.id],
            subtotal: (
              (cantidades[p.id] * parseFloat(p.precio)) + (cantidades[p.id] * extraPorProd)
            ).toFixed(2),
          };
        }
      });

      productosFinales = Object.values(merged).map((pp) => ({
        producto: pp.producto,
        producto_nombre: pp.producto_nombre,
        cantidad: pp.cantidad,
        subtotal: pp.subtotal,
      }));
    } else {
      productosFinales = seleccionados.map((p) => ({
        producto: p.id,
        producto_nombre: p.nombre,
        cantidad: cantidades[p.id],
        subtotal: (
          (cantidades[p.id] * parseFloat(p.precio)) + (cantidades[p.id] * extraPorProd)
        ).toFixed(2),
      }));
    }

    const payload = {
      mesa: Number(mesaId),
      tipo,
      estatus: ESTATUS.OCUPADO,
      para_llevar: paraLlevar,
      costo_extra_llevar: costoLlevar,
      productos_pedidos: productosFinales,
    };

    setEnviando(true);
    try {
      const result = initialPedido?.id
        ? await updatePedido(initialPedido.id, payload)
        : await postPedido(payload);
      navigate(`/mesa/${mesaId}/comandaCliente`, { state: { pedido: result } });
    } catch (e) {
      alert('Error al enviar el pedido: ' + (e.response?.data?.mesa?.[0] || 'intenta de nuevo.'));
    } finally {
      setEnviando(false);
    }
  };

  const categorias = ['Todos', ...new Set(productos.map((p) => p.categoria || 'Sin categoría'))];

  const productosFiltrados = productos
    .filter((p) => p.activo !== false)
    .filter((p) => categoriaActiva === 'Todos' || (p.categoria || 'Sin categoría') === categoriaActiva)
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const cantNuevos = productos.filter((p) => cantidades[p.id] > 0).length;
  const totalNuevos = productos.filter((p) => cantidades[p.id] > 0).reduce((sum, p) => {
    const extra = paraLlevar ? costoLlevar : 0;
    return sum + cantidades[p.id] * (parseFloat(p.precio) + extra);
  }, 0);

  return (
    <div className="page fade-in">
      <div className="between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="wf-btn sm ghost" onClick={() => navigate(-1)}>‹ atrás</button>
          <div>
            <div className="wf-h1" style={{ fontSize: 28 }}>Agregar</div>
            <div className="wf-sm">
              {tipo === 'mesa' ? `Mesa ${mesaId}` : TIPO_LABELS[tipo] || tipo}
            </div>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'Patrick Hand',cursive", fontSize: 17 }}>
          <input
            type="checkbox"
            checked={paraLlevar}
            onChange={(e) => setParaLlevar(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          🛍️ Para llevar {costoLlevar > 0 && <span className="wf-sm">(+{fmtMoney(costoLlevar)}/prod)</span>}
        </label>
      </div>

      <input
        className="wf-search"
        placeholder="🔍 buscar producto…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="cat-chips">
        {categorias.map((cat) => (
          <span
            key={cat}
            className={`wf-chip ${categoriaActiva === cat ? 'active' : ''}`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="product-grid">
        {productosFiltrados.map((p) => (
          <div key={p.id} className="wf-box" style={{ padding: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              {p.imagen
                ? <img src={p.imagen} alt={p.nombre} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--sj-line)', flexShrink: 0 }} />
                : <div className="wf-img" style={{ width: 48, height: 48 }}><span style={{ background: 'var(--sj-paper)', padding: '1px 6px', borderRadius: 4, fontSize: 9 }}>foto</span></div>
              }
              <div style={{ flex: 1 }}>
                <div className="wf-h3">{p.nombre}</div>
                <div className="wf-sm">
                  {fmtMoney(p.precio)}
                  {paraLlevar && costoLlevar > 0 && (
                    <span style={{ color: 'var(--sj-gold-d)' }}> +{fmtMoney(costoLlevar)}</span>
                  )}
                </div>
              </div>
              <div className="stepper">
                <button className="minus" onClick={() => cambiarCantidad(p.id, -1)}>−</button>
                <span className="val">{cantidades[p.id] || 0}</span>
                <button className="plus" onClick={() => cambiarCantidad(p.id, 1)}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cantNuevos > 0 && (
        <div className="wf-box bold" style={{ padding: 12, background: 'var(--sj-cream)', borderColor: 'var(--sj-gold-d)', borderStyle: 'dashed' }}>
          <div className="between">
            <div>
              <div className="wf-h3">{cantNuevos} productos</div>
              <div className="wf-sm">{fmtMoney(totalNuevos)} · pendiente</div>
            </div>
            <button className="wf-btn primary" onClick={handleAgregar} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar a cocina'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
