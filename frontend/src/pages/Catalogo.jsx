// src/pages/Catalogo.jsx
import React, { useEffect, useState } from "react";
import {
  fetchProductos, createProducto, updateProducto, deleteProducto,
  fetchConfiguraciones, createConfiguracion, updateConfiguracion, deleteConfiguracion,
} from "../api/ListaProductos";

const SECCION_OPTS = ["Productos", "Configuraciones"];

const emptyProducto = { nombre: "", precio: "", categoria: "", activo: true };
const emptyConfig = { clave: "", valor: "", descripcion: "" };

export default function Catalogo() {
  const [seccion, setSeccion] = useState("Productos");

  // Productos state
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editP, setEditP] = useState(null); // null = no modal, {} = nuevo, {id,...} = editar
  const [formP, setFormP] = useState(emptyProducto);

  // Config state
  const [configs, setConfigs] = useState([]);
  const [editC, setEditC] = useState(null);
  const [formC, setFormC] = useState(emptyConfig);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadProductos(); loadConfigs(); }, []);

  const loadProductos = async () => setProductos(await fetchProductos().catch(() => []));
  const loadConfigs = async () => setConfigs(await fetchConfiguraciones().catch(() => []));

  /* ─── Productos ─── */
  const openNewP = () => { setFormP(emptyProducto); setEditP({}); setError(""); };
  const openEditP = (p) => { setFormP({ nombre: p.nombre, precio: p.precio, categoria: p.categoria || "", activo: p.activo }); setEditP(p); setError(""); };
  const closeP = () => setEditP(null);

  const saveP = async () => {
    if (!formP.nombre.trim() || !formP.precio) { setError("Nombre y precio son requeridos."); return; }
    setSaving(true);
    try {
      if (editP.id) await updateProducto(editP.id, formP);
      else await createProducto(formP);
      await loadProductos();
      closeP();
    } catch { setError("Error al guardar."); }
    finally { setSaving(false); }
  };

  const delP = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    await deleteProducto(p.id);
    loadProductos();
  };

  /* ─── Configs ─── */
  const openNewC = () => { setFormC(emptyConfig); setEditC({}); setError(""); };
  const openEditC = (c) => { setFormC({ clave: c.clave, valor: c.valor, descripcion: c.descripcion }); setEditC(c); setError(""); };
  const closeC = () => setEditC(null);

  const saveC = async () => {
    if (!formC.clave.trim() || !formC.valor.trim()) { setError("Clave y valor son requeridos."); return; }
    setSaving(true);
    try {
      if (editC.id) await updateConfiguracion(editC.id, formC);
      else await createConfiguracion(formC);
      await loadConfigs();
      closeC();
    } catch { setError("Error al guardar."); }
    finally { setSaving(false); }
  };

  const delC = async (c) => {
    if (!window.confirm(`¿Eliminar config "${c.clave}"?`)) return;
    await deleteConfiguracion(c.id);
    loadConfigs();
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  /* Group productos by category */
  const porCategoria = productosFiltrados.reduce((acc, p) => {
    const cat = p.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

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
          Catálogos
        </div>
        {SECCION_OPTS.map(s => (
          <div
            key={s}
            onClick={() => setSeccion(s)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 18,
              borderLeft: seccion === s ? "4px solid var(--sj-green)" : "4px solid transparent",
              background: seccion === s ? "var(--sj-green-l)" : "transparent",
              color: seccion === s ? "var(--sj-green-d)" : "var(--sj-ink)",
            }}
          >
            {s === "Productos" ? "🥘 " : "⚙️ "}{s}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 24 }}>
        {seccion === "Productos" && (
          <>
            <div className="between" style={{ marginBottom: 16 }}>
              <div className="wf-h1">Productos</div>
              <button className="wf-btn primary" onClick={openNewP}>+ Nuevo producto</button>
            </div>
            <input
              className="wf-search"
              placeholder="🔍 buscar por nombre o categoría…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            {Object.entries(porCategoria).map(([cat, prods]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div className="wf-sm" style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{cat}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {prods.map(p => (
                    <div key={p.id} className="wf-box" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <span className="wf-h3">{p.nombre}</span>
                        {!p.activo && <span className="wf-chip" style={{ marginLeft: 8, fontSize: 12 }}>inactivo</span>}
                      </div>
                      <span className="wf-h3" style={{ color: "var(--sj-green-d)" }}>${parseFloat(p.precio).toFixed(2)}</span>
                      <button className="wf-btn sm ghost" onClick={() => openEditP(p)}>editar</button>
                      <button className="wf-btn sm danger" onClick={() => delP(p)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {seccion === "Configuraciones" && (
          <>
            <div className="between" style={{ marginBottom: 16 }}>
              <div className="wf-h1">Configuraciones</div>
              <button className="wf-btn primary" onClick={openNewC}>+ Nueva config</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {configs.map(c => (
                <div key={c.id} className="wf-box" style={{ padding: "12px 14px" }}>
                  <div className="between">
                    <div>
                      <div className="wf-h3">{c.clave}</div>
                      <div className="wf-sm">{c.descripcion}</div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="wf-chip gold" style={{ fontFamily: "'Caveat',cursive", fontSize: 18 }}>{c.valor}</span>
                      <button className="wf-btn sm ghost" onClick={() => openEditC(c)}>editar</button>
                      <button className="wf-btn sm danger" onClick={() => delC(c)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal Producto */}
      {editP !== null && (
        <Modal title={editP.id ? "Editar producto" : "Nuevo producto"} onClose={closeP}>
          {error && <div style={{ color: "var(--sj-red)", marginBottom: 8, fontFamily: "'Patrick Hand', cursive" }}>{error}</div>}
          <Field label="Nombre">
            <input className="wf-input" value={formP.nombre} onChange={e => setFormP(f => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <Field label="Precio ($)">
            <input className="wf-input" type="number" step="0.01" value={formP.precio} onChange={e => setFormP(f => ({ ...f, precio: e.target.value }))} />
          </Field>
          <Field label="Categoría">
            <input className="wf-input" value={formP.categoria} onChange={e => setFormP(f => ({ ...f, categoria: e.target.value }))} placeholder="Caldos, Bebidas…" />
          </Field>
          <Field label="">
            <label style={{ fontFamily: "'Patrick Hand',cursive", fontSize: 17, display: "flex", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={formP.activo} onChange={e => setFormP(f => ({ ...f, activo: e.target.checked }))} />
              Producto activo
            </label>
          </Field>
          <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            <button className="wf-btn ghost" onClick={closeP}>Cancelar</button>
            <button className="wf-btn primary" onClick={saveP} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </Modal>
      )}

      {/* Modal Config */}
      {editC !== null && (
        <Modal title={editC.id ? "Editar configuración" : "Nueva configuración"} onClose={closeC}>
          {error && <div style={{ color: "var(--sj-red)", marginBottom: 8, fontFamily: "'Patrick Hand', cursive" }}>{error}</div>}
          <Field label="Clave (sin espacios)">
            <input className="wf-input" value={formC.clave} onChange={e => setFormC(f => ({ ...f, clave: e.target.value }))} disabled={!!editC.id} />
          </Field>
          <Field label="Valor">
            <input className="wf-input" value={formC.valor} onChange={e => setFormC(f => ({ ...f, valor: e.target.value }))} />
          </Field>
          <Field label="Descripción">
            <input className="wf-input" value={formC.descripcion} onChange={e => setFormC(f => ({ ...f, descripcion: e.target.value }))} />
          </Field>
          <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            <button className="wf-btn ghost" onClick={closeC}>Cancelar</button>
            <button className="wf-btn primary" onClick={saveC} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div className="wf-box bold fade-in" style={{ width: "min(420px,95vw)", padding: 24 }}>
        <div className="between" style={{ marginBottom: 16 }}>
          <div className="wf-h2">{title}</div>
          <button className="wf-btn sm ghost" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div className="wf-sm" style={{ marginBottom: 4 }}>{label}</div>}
      {children}
    </div>
  );
}
