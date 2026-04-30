// src/pages/Finanzas.jsx
import React, { useEffect, useState } from "react";
import {
  fetchPedidos, deletePedido, postPedido,
  fetchCierres, createCierre,
} from "../api/ListaProductos";

const VISTAS = ["Ventas", "Cierre de día"];

export default function Finanzas() {
  const [vista, setVista] = useState("Ventas");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--sj-cream)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: "var(--sj-paper)",
        borderRight: "2px solid var(--sj-line)",
        padding: "20px 0",
      }}>
        <div className="wf-h2" style={{ padding: "0 16px 16px", borderBottom: "1.5px dashed var(--sj-line)" }}>
          Finanzas
        </div>
        {VISTAS.map(v => (
          <div
            key={v}
            onClick={() => setVista(v)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 18,
              borderLeft: vista === v ? "4px solid var(--sj-green)" : "4px solid transparent",
              background: vista === v ? "var(--sj-green-l)" : "transparent",
              color: vista === v ? "var(--sj-green-d)" : "var(--sj-ink)",
            }}
          >
            {v === "Ventas" ? "📊 " : "🗂️ "}{v}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {vista === "Ventas" && <Ventas />}
        {vista === "Cierre de día" && <CierreDia />}
      </main>
    </div>
  );
}

/* ── Ventas ── */
function Ventas() {
  const [pedidos, setPedidos] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchPedidos().catch(() => []);
    setPedidos(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtrados = pedidos.filter(p => {
    const fecha = new Date(p.fecha_creacion);
    if (desde && fecha < new Date(desde)) return false;
    if (hasta && fecha > new Date(hasta + "T23:59:59")) return false;
    return true;
  });

  const finalizados = filtrados.filter(p => p.estatus === "finalizado");
  const totalVentas = finalizados.reduce((sum, p) => sum + parseFloat(p.factura?.total || 0), 0);

  // Group by mesa
  const porMesa = filtrados.reduce((acc, p) => {
    const key = p.tipo === "mesa" ? `Mesa ${p.mesa}` : (p.tipo === "barra" ? "Barra" : p.tipo);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const handleDuplicar = async (pedido) => {
    const payload = {
      mesa: pedido.mesa,
      tipo: pedido.tipo,
      estatus: "ocupado",
      para_llevar: pedido.para_llevar,
      costo_extra_llevar: pedido.costo_extra_llevar,
      productos_pedidos: pedido.productos_pedidos.map(pp => ({
        producto: pp.producto,
        producto_nombre: pp.producto_nombre,
        cantidad: pp.cantidad,
        subtotal: pp.subtotal,
      })),
    };
    try {
      await postPedido(payload);
      alert("Comanda duplicada.");
      load();
    } catch (e) {
      alert("Error al duplicar: " + (e.response?.data?.mesa?.[0] || e.message));
    }
  };

  const handleEliminar = async (pedido) => {
    if (!window.confirm("¿Eliminar esta comanda?")) return;
    await deletePedido(pedido.id);
    load();
  };

  const estatusColor = (e) => {
    if (e === "finalizado") return "var(--sj-green-l)";
    if (e === "cancelado") return "oklch(0.94 0.04 25)";
    return "var(--sj-cream-2)";
  };

  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <KPI label="Total ventas" value={`$${totalVentas.toFixed(2)}`} />
        <KPI label="Comandas finalizadas" value={finalizados.length} />
        <KPI label="Comandas totales" value={filtrados.length} />
      </div>

      {/* Filters */}
      <div className="wf-box" style={{ padding: 12, marginBottom: 16 }}>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Desde</div>
            <input type="date" className="wf-input" style={{ width: 160 }} value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Hasta</div>
            <input type="date" className="wf-input" style={{ width: 160 }} value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <button className="wf-btn sm ghost" style={{ alignSelf: "flex-end" }} onClick={() => { setDesde(""); setHasta(""); }}>Limpiar</button>
        </div>
      </div>

      {loading && <div className="loading-screen">Cargando…</div>}

      {/* Agrupado por mesa */}
      {Object.entries(porMesa).map(([mesa, cmds]) => (
        <div key={mesa} style={{ marginBottom: 20 }}>
          <div className="wf-h3" style={{ marginBottom: 8 }}>{mesa} · {cmds.length} comandas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cmds.map(p => (
              <div
                key={p.id}
                className="wf-box"
                style={{ padding: "10px 14px", background: estatusColor(p.estatus), cursor: "pointer" }}
              >
                <div className="between">
                  <div onClick={() => setDetalle(detalle?.id === p.id ? null : p)}>
                    <span className="wf-h3">#{p.id} · {new Date(p.fecha_creacion).toLocaleDateString("es-MX")}</span>
                    <span className="wf-chip" style={{ marginLeft: 8, fontSize: 13 }}>{p.estatus}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="wf-h3" style={{ color: "var(--sj-green-d)" }}>${parseFloat(p.factura?.total || 0).toFixed(2)}</span>
                    <button className="wf-btn sm ghost" onClick={() => handleDuplicar(p)}>duplicar</button>
                    <button className="wf-btn sm danger" onClick={() => handleEliminar(p)}>✕</button>
                  </div>
                </div>
                {detalle?.id === p.id && (
                  <div style={{ marginTop: 10, borderTop: "1px dashed var(--sj-line)", paddingTop: 10 }}>
                    {p.productos_pedidos.map(pp => (
                      <div key={pp.id} className="between wf-sm" style={{ padding: "2px 0" }}>
                        <span>{pp.producto_nombre} × {pp.cantidad}</span>
                        <span>${parseFloat(pp.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Cierre de día ── */
function CierreDia() {
  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [nuevoMov, setNuevoMov] = useState({ tipo: "gasto", descripcion: "", monto: "" });
  const [cierres, setCierres] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => { fetchCierres().then(setCierres).catch(() => {}); }, []);

  const agregarMov = () => {
    if (!nuevoMov.monto) return;
    setMovimientos(m => [...m, { ...nuevoMov, monto: parseFloat(nuevoMov.monto) }]);
    setNuevoMov({ tipo: "gasto", descripcion: "", monto: "" });
  };

  const handleGuardar = async () => {
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
      alert("Error al guardar cierre: " + JSON.stringify(e.response?.data || e.message));
    } finally { setGuardando(false); }
  };

  const gastos = movimientos.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
  const retiros = movimientos.filter(m => m.tipo === "retiro").reduce((s, m) => s + m.monto, 0);

  return (
    <>
      <div className="wf-h1" style={{ marginBottom: 16 }}>Cierre de día</div>

      {/* Form */}
      <div className="wf-box bold" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Fecha</div>
            <input type="date" className="wf-input" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Cantidad inicial en caja ($)</div>
            <input type="number" className="wf-input" placeholder="0" value={cantidadInicial} onChange={e => setCantidadInicial(e.target.value)} />
          </div>
        </div>

        {/* Movimientos */}
        <div className="wf-h3" style={{ marginBottom: 8 }}>Gastos y retiros</div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <select
            className="wf-input"
            style={{ width: 120 }}
            value={nuevoMov.tipo}
            onChange={e => setNuevoMov(m => ({ ...m, tipo: e.target.value }))}
          >
            <option value="gasto">Gasto</option>
            <option value="retiro">Retiro</option>
          </select>
          <input
            className="wf-input"
            style={{ flex: 1, minWidth: 120 }}
            placeholder="Descripción"
            value={nuevoMov.descripcion}
            onChange={e => setNuevoMov(m => ({ ...m, descripcion: e.target.value }))}
          />
          <input
            type="number"
            className="wf-input"
            style={{ width: 100 }}
            placeholder="$"
            value={nuevoMov.monto}
            onChange={e => setNuevoMov(m => ({ ...m, monto: e.target.value }))}
          />
          <button className="wf-btn gold" onClick={agregarMov}>+ Agregar</button>
        </div>

        {movimientos.map((m, i) => (
          <div key={i} className="between wf-sm" style={{ padding: "4px 0", borderBottom: "1px dashed var(--sj-line)" }}>
            <span>{m.tipo === "gasto" ? "💸" : "🏦"} {m.descripcion || m.tipo}</span>
            <div className="row">
              <span style={{ color: "var(--sj-red)" }}>-${m.monto.toFixed(2)}</span>
              <button className="wf-btn sm ghost" onClick={() => setMovimientos(ms => ms.filter((_, j) => j !== i))}>✕</button>
            </div>
          </div>
        ))}

        {movimientos.length > 0 && (
          <div className="between wf-sm" style={{ marginTop: 6 }}>
            <span>Total gastos: ${gastos.toFixed(2)} · Retiros: ${retiros.toFixed(2)}</span>
          </div>
        )}

        <button className="wf-btn primary" style={{ marginTop: 16, width: "100%" }} onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Generar cierre"}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="wf-box" style={{ padding: 16, marginBottom: 20, borderColor: "var(--sj-green-d)", background: "var(--sj-green-l)" }}>
          <div className="wf-h2" style={{ marginBottom: 10 }}>Resumen del cierre — {resultado.fecha}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <KPI label="Ventas del día" value={`$${parseFloat(resultado.total_ventas).toFixed(2)}`} />
            <KPI label="Comandas" value={resultado.total_comandas} />
            <KPI label="Canceladas" value={resultado.canceladas} />
            <KPI label="Dinero esperado" value={`$${resultado.dinero_esperado?.toFixed(2)}`} />
          </div>
        </div>
      )}

      {/* Historial */}
      {cierres.length > 0 && (
        <>
          <div className="wf-h3" style={{ marginBottom: 8 }}>Historial de cierres</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cierres.map(c => (
              <div key={c.id} className="wf-box" style={{ padding: "10px 14px" }}>
                <div className="between">
                  <span className="wf-h3">{c.fecha}</span>
                  <div className="row" style={{ gap: 12 }}>
                    <span className="wf-sm">{c.total_comandas} comandas</span>
                    <span className="wf-h3" style={{ color: "var(--sj-green-d)" }}>${parseFloat(c.total_ventas).toFixed(2)}</span>
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

function KPI({ label, value }) {
  return (
    <div className="wf-box" style={{ padding: "12px 16px" }}>
      <div className="wf-sm">{label}</div>
      <div className="wf-h2" style={{ color: "var(--sj-green-d)", marginTop: 2 }}>{value}</div>
    </div>
  );
}
