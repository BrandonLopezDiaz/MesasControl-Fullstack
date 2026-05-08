// src/pages/Finanzas.jsx
import React, { useEffect, useState } from "react";
import {
  fetchPedidos, deletePedido, postPedido,
  fetchCierres, createCierre,
} from "../api/ListaProductos";
import DatePicker from "../components/DatePicker";

const VISTAS = [
  { id: "ventas",  label: "📊 Ventas" },
  { id: "cierre",  label: "🗂️ Cierre de día" },
];

export default function Finanzas() {
  const [vista, setVista] = useState("ventas");
  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar__title wf-h2">Finanzas</div>
        {VISTAS.map(v => (
          <div
            key={v.id}
            className={`sidebar__item ${vista === v.id ? "active" : ""}`}
            onClick={() => setVista(v.id)}
          >
            {v.label}
          </div>
        ))}
      </aside>
      <main className="sidebar-main">
        {vista === "ventas" && <Ventas />}
        {vista === "cierre" && <CierreDia />}
      </main>
    </div>
  );
}

/* ── Ventas ── */
function Ventas() {
  const today = new Date().toISOString().slice(0, 10);
  const [pedidos, setPedidos] = useState([]);
  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
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
    // fecha_creacion comes as ISO string — compare as local date string
    const fechaLocal = new Date(p.fecha_creacion)
      .toLocaleDateString("en-CA"); // "YYYY-MM-DD" in local tz
    if (desde && fechaLocal < desde) return false;
    if (hasta && fechaLocal > hasta) return false;
    return true;
  });

  const finalizados = filtrados.filter(p => p.estatus === "finalizado");
  const totalVentas = finalizados.reduce((sum, p) => sum + parseFloat(p.factura?.total || 0), 0);

  const porMesa = filtrados.reduce((acc, p) => {
    const key = p.tipo === "mesa" ? `Mesa ${p.mesa}` : (p.tipo === "barra" ? "🍺 Barra" : p.tipo === "para_llevar" ? "🛍️ Para llevar" : "⚡ Rápido");
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const handleDuplicar = async (pedido) => {
    const payload = {
      mesa: pedido.mesa, tipo: pedido.tipo, estatus: "ocupado",
      para_llevar: pedido.para_llevar, costo_extra_llevar: pedido.costo_extra_llevar,
      productos_pedidos: pedido.productos_pedidos.map(pp => ({
        producto: pp.producto, producto_nombre: pp.producto_nombre,
        cantidad: pp.cantidad, subtotal: pp.subtotal,
      })),
    };
    try {
      await postPedido(payload);
      alert("Comanda duplicada.");
      load();
    } catch (e) { alert("Error al duplicar: " + (e.response?.data?.mesa?.[0] || e.message)); }
  };

  const handleEliminar = async (pedido) => {
    if (!window.confirm("¿Eliminar esta comanda?")) return;
    await deletePedido(pedido.id);
    load();
  };

  const bgEstatus = (e) => {
    if (e === "finalizado") return "var(--sj-green-l)";
    if (e === "cancelado") return "oklch(0.94 0.04 25)";
    return "var(--sj-cream-2)";
  };

  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10, marginBottom: 16 }}>
        <KPI label="Total ventas" value={`$${totalVentas.toFixed(2)}`} />
        <KPI label="Finalizadas" value={finalizados.length} />
        <KPI label="Total comandas" value={filtrados.length} />
      </div>

      {/* Filters — custom date pickers */}
      <div className="wf-box" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Desde</div>
            <DatePicker value={desde} onChange={setDesde} />
          </div>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Hasta</div>
            <DatePicker value={hasta} onChange={setHasta} />
          </div>
          <button
            className="wf-btn sm ghost"
            onClick={() => { setDesde(""); setHasta(""); }}
          >
            Ver todo
          </button>
          <button
            className="wf-btn sm"
            style={{ background: "var(--sj-green-l)", color: "var(--sj-green-d)" }}
            onClick={() => { setDesde(today); setHasta(today); }}
          >
            Hoy
          </button>
        </div>
      </div>

      {loading && <div className="loading-screen">Cargando…</div>}

      {/* Grouped by mesa/tipo */}
      {Object.entries(porMesa).map(([grupo, cmds]) => (
        <div key={grupo} style={{ marginBottom: 18 }}>
          <div className="wf-h3" style={{ marginBottom: 8 }}>{grupo} · {cmds.length} comandas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cmds.map(p => (
              <div
                key={p.id}
                className="wf-box"
                style={{ padding: "10px 14px", background: bgEstatus(p.estatus) }}
              >
                <div className="between" style={{ flexWrap: "wrap", gap: 6 }}>
                  <div
                    style={{ cursor: "pointer", flex: 1, minWidth: 0 }}
                    onClick={() => setDetalle(detalle?.id === p.id ? null : p)}
                  >
                    <span className="wf-h3">#{p.id} · {new Date(p.fecha_creacion).toLocaleDateString("es-MX")}</span>
                    <span className="wf-chip" style={{ marginLeft: 8, fontSize: 13 }}>{p.estatus}</span>
                  </div>
                  <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                    <span className="wf-h3" style={{ color: "var(--sj-green-d)" }}>${parseFloat(p.factura?.total || 0).toFixed(2)}</span>
                    <button className="wf-btn sm ghost" onClick={() => handleDuplicar(p)}>duplicar</button>
                    <button className="wf-btn sm danger" onClick={() => handleEliminar(p)}>✕</button>
                  </div>
                </div>
                {detalle?.id === p.id && (
                  <div style={{ marginTop: 8, borderTop: "1px dashed var(--sj-line)", paddingTop: 8 }}>
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

      {filtrados.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--sj-ink-2)", fontFamily: "'Patrick Hand',cursive", fontSize: 18 }}>
          Sin comandas para este período
        </div>
      )}
    </>
  );
}

const today_str = new Date().toISOString().slice(0, 10);

/* ── Cierre de día ── */
function CierreDia() {
  const [fecha, setFecha] = useState(today_str);
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [nuevoMov, setNuevoMov] = useState({ tipo: "gasto", descripcion: "", monto: "" });
  const [movErrors, setMovErrors] = useState({});
  const [cierreError, setCierreError] = useState("");
  const [cierres, setCierres] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => { fetchCierres().then(setCierres).catch(() => {}); }, []);

  const agregarMov = () => {
    const errs = {};
    if (!nuevoMov.descripcion.trim()) errs.descripcion = "La descripción es requerida";
    if (!nuevoMov.monto || parseFloat(nuevoMov.monto) <= 0) errs.monto = "Ingresa un monto válido";
    if (Object.keys(errs).length) { setMovErrors(errs); return; }
    setMovErrors({});
    setMovimientos(m => [...m, { ...nuevoMov, monto: parseFloat(nuevoMov.monto) }]);
    setNuevoMov({ tipo: "gasto", descripcion: "", monto: "" });
  };

  const handleGuardar = async () => {
    if (!fecha) { setCierreError("Selecciona una fecha para el cierre"); return; }
    setCierreError("");
    setGuardando(true);
    try {
      const res = await createCierre({ fecha, cantidad_inicial: parseFloat(cantidadInicial) || 0, movimientos });
      setResultado(res);
      fetchCierres().then(setCierres).catch(() => {});
    } catch (e) {
      const data = e.response?.data;
      if (data && typeof data === "object") {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" · ");
        setCierreError(msg);
      } else {
        setCierreError("Error al generar el cierre. Intenta de nuevo.");
      }
    } finally { setGuardando(false); }
  };

  const inputStyle = (field) => ({
    borderColor: movErrors[field] ? "var(--sj-red)" : undefined,
    boxShadow: movErrors[field] ? "0 0 0 2px oklch(0.94 0.04 25)" : undefined,
  });

  const gastos = movimientos.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
  const retiros = movimientos.filter(m => m.tipo === "retiro").reduce((s, m) => s + m.monto, 0);

  return (
    <>
      <div className="wf-h1" style={{ marginBottom: 16 }}>Cierre de día</div>
      <div className="wf-box bold" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Fecha</div>
            <DatePicker value={fecha} onChange={v => { setFecha(v); setCierreError(""); }} />
          </div>
          <div>
            <div className="wf-sm" style={{ marginBottom: 4 }}>Cantidad inicial ($)</div>
            <input type="number" className="wf-input" placeholder="0" value={cantidadInicial} onChange={e => setCantidadInicial(e.target.value)} />
          </div>
        </div>

        <div className="wf-h3" style={{ marginBottom: 8 }}>Gastos y retiros</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <select
            className="wf-input"
            style={{ width: 110 }}
            value={nuevoMov.tipo}
            onChange={e => setNuevoMov(m => ({ ...m, tipo: e.target.value }))}
          >
            <option value="gasto">Gasto</option>
            <option value="retiro">Retiro</option>
          </select>
          <div style={{ flex: 1, minWidth: 120 }}>
            <input
              className="wf-input"
              style={{ width: "100%", ...inputStyle("descripcion") }}
              placeholder="Descripción *"
              value={nuevoMov.descripcion}
              onChange={e => { setNuevoMov(m => ({ ...m, descripcion: e.target.value })); if (movErrors.descripcion) setMovErrors(er => ({ ...er, descripcion: "" })); }}
            />
            {movErrors.descripcion && <div style={{ color: "var(--sj-red)", fontSize: 13, marginTop: 3, fontFamily: "'Patrick Hand',cursive" }}>{movErrors.descripcion}</div>}
          </div>
          <div>
            <input
              type="number"
              className="wf-input"
              style={{ width: 90, ...inputStyle("monto") }}
              placeholder="$ *"
              value={nuevoMov.monto}
              onChange={e => { setNuevoMov(m => ({ ...m, monto: e.target.value })); if (movErrors.monto) setMovErrors(er => ({ ...er, monto: "" })); }}
            />
            {movErrors.monto && <div style={{ color: "var(--sj-red)", fontSize: 13, marginTop: 3, fontFamily: "'Patrick Hand',cursive" }}>{movErrors.monto}</div>}
          </div>
          <button className="wf-btn gold" onClick={agregarMov}>+ Agregar</button>
        </div>

        {movimientos.map((m, i) => (
          <div key={i} className="between wf-sm" style={{ padding: "4px 0", borderBottom: "1px dashed var(--sj-line)" }}>
            <span>{m.tipo === "gasto" ? "💸" : "🏦"} {m.descripcion}</span>
            <div className="row">
              <span style={{ color: "var(--sj-red)" }}>-${m.monto.toFixed(2)}</span>
              <button className="wf-btn sm ghost" onClick={() => setMovimientos(ms => ms.filter((_, j) => j !== i))}>✕</button>
            </div>
          </div>
        ))}
        {movimientos.length > 0 && (
          <div className="wf-sm" style={{ marginTop: 6 }}>Gastos: ${gastos.toFixed(2)} · Retiros: ${retiros.toFixed(2)}</div>
        )}

        {cierreError && (
          <div style={{
            marginTop: 10, padding: "8px 12px",
            background: "oklch(0.94 0.04 25)",
            border: "1.5px solid var(--sj-red)",
            borderRadius: 10,
            color: "var(--sj-red)",
            fontFamily: "'Patrick Hand',cursive",
            fontSize: 16,
          }}>
            ⚠️ {cierreError}
          </div>
        )}

        <button className="wf-btn primary" style={{ marginTop: 14, width: "100%" }} onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Generar cierre"}
        </button>
      </div>

      {resultado && (
        <div className="wf-box" style={{ padding: 16, marginBottom: 20, borderColor: "var(--sj-green-d)", background: "var(--sj-green-l)" }}>
          <div className="wf-h2" style={{ marginBottom: 10 }}>Cierre — {resultado.fecha} · Turno {resultado.turno}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 8 }}>
            <KPI label="Ventas del turno" value={`$${parseFloat(resultado.total_ventas).toFixed(2)}`} />
            <KPI label="Comandas" value={resultado.total_comandas} />
            <KPI label="Canceladas" value={resultado.canceladas} />
            <KPI label="Esperado en caja" value={`$${resultado.dinero_esperado?.toFixed(2)}`} />
          </div>
        </div>
      )}

      {cierres.length > 0 && (
        <>
          <div className="wf-h3" style={{ marginBottom: 8 }}>Historial</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cierres.map(c => (
              <div key={c.id} className="wf-box" style={{ padding: "10px 14px" }}>
                <div className="between">
                  <div>
                    <span className="wf-h3">{c.fecha}</span>
                    <span className="wf-chip" style={{ marginLeft: 8, fontSize: 13 }}>Turno {c.turno}</span>
                  </div>
                  <div className="row" style={{ gap: 12 }}>
                    <span className="wf-sm">{c.total_comandas} cmd</span>
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
    <div className="wf-box" style={{ padding: "12px 14px" }}>
      <div className="wf-sm">{label}</div>
      <div className="wf-h2" style={{ color: "var(--sj-green-d)", marginTop: 2 }}>{value}</div>
    </div>
  );
}
