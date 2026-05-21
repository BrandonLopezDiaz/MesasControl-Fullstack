// src/pages/Catalogo.jsx
import React, { useEffect, useState } from "react";
import {
  fetchProductos, createProducto, updateProducto, deleteProducto,
  fetchConfiguraciones, createConfiguracion, updateConfiguracion, deleteConfiguracion,
} from "../api/ListaProductos";
import { useTheme, TEMAS } from "../components/ThemeProvider";

const SECCION_OPTS = [
  { id: "productos",       label: "🥘 Productos" },
  { id: "configuraciones", label: "⚙️ Configuraciones" },
  { id: "temas",           label: "🎨 Temas" },
];

const emptyProducto = { nombre: "", precio: "", categoria: "", activo: true, imagen: "" };
const emptyConfig   = { clave: "", valor: "", descripcion: "" };

export default function Catalogo() {
  const [seccion, setSeccion] = useState("productos");

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editP, setEditP] = useState(null);
  const [formP, setFormP] = useState(emptyProducto);

  const [configs, setConfigs] = useState([]);
  const [editC, setEditC] = useState(null);
  const [formC, setFormC] = useState(emptyConfig);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { theme, setTheme } = useTheme();

  useEffect(() => { loadProductos(); loadConfigs(); }, []);

  const loadProductos = async () => setProductos(await fetchProductos().catch(() => []));
  const loadConfigs   = async () => setConfigs(await fetchConfiguraciones().catch(() => []));

  /* ── Productos ── */
  const openNewP  = () => { setFormP(emptyProducto); setEditP({}); setError(""); };
  const openEditP = (p) => { setFormP({ nombre: p.nombre, precio: p.precio, categoria: p.categoria || "", activo: p.activo, imagen: p.imagen || "" }); setEditP(p); setError(""); };
  const closeP    = () => setEditP(null);

  const saveP = async () => {
    if (!formP.nombre.trim() || !formP.precio) { setError("Nombre y precio son requeridos."); return; }
    setSaving(true);
    try {
      editP.id ? await updateProducto(editP.id, formP) : await createProducto(formP);
      await loadProductos(); closeP();
    } catch { setError("Error al guardar."); }
    finally { setSaving(false); }
  };

  const delP = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    await deleteProducto(p.id); loadProductos();
  };

  /* ── Configs ── */
  const openNewC  = () => { setFormC(emptyConfig); setEditC({}); setError(""); };
  const openEditC = (c) => { setFormC({ clave: c.clave, valor: c.valor, descripcion: c.descripcion }); setEditC(c); setError(""); };
  const closeC    = () => setEditC(null);

  const saveC = async () => {
    if (!formC.clave.trim() || !formC.valor.trim()) { setError("Clave y valor son requeridos."); return; }
    setSaving(true);
    try {
      editC.id ? await updateConfiguracion(editC.id, formC) : await createConfiguracion(formC);
      await loadConfigs(); closeC();
    } catch { setError("Error al guardar."); }
    finally { setSaving(false); }
  };

  const delC = async (c) => {
    if (!window.confirm(`¿Eliminar config "${c.clave}"?`)) return;
    await deleteConfiguracion(c.id); loadConfigs();
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const porCategoria = productosFiltrados.reduce((acc, p) => {
    const cat = p.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="sidebar-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__title wf-h2">Catálogos</div>
        {SECCION_OPTS.map(s => (
          <div
            key={s.id}
            className={`sidebar__item ${seccion === s.id ? "active" : ""}`}
            onClick={() => setSeccion(s.id)}
          >
            {s.label}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="sidebar-main">

        {/* ── Productos ── */}
        {seccion === "productos" && (
          <>
            <div className="between" style={{ marginBottom: 14 }}>
              <div className="wf-h1">Productos</div>
              <button className="wf-btn primary" onClick={openNewP}>+ Nuevo</button>
            </div>
            <input
              className="wf-search"
              placeholder="🔍 buscar por nombre o categoría…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ marginBottom: 14 }}
            />
            {Object.entries(porCategoria).map(([cat, prods]) => (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div className="wf-sm" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{cat}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {prods.map(p => (
                    <div key={p.id} className="wf-box" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {p.imagen
                        ? <img src={p.imagen} alt={p.nombre} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--sj-line)", flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--sj-cream-2)", border: "1px solid var(--sj-line)", flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="wf-h3">{p.nombre}</span>
                        <span
                          className="wf-chip"
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            background: p.activo ? "var(--sj-green-l)" : "oklch(0.94 0.04 25)",
                            borderColor: p.activo ? "var(--sj-green-d)" : "var(--sj-red)",
                            color: p.activo ? "var(--sj-green-d)" : "var(--sj-red)",
                          }}
                        >
                          {p.activo ? "activo" : "inactivo"}
                        </span>
                      </div>
                      <span className="wf-h3" style={{ color: "var(--sj-green-d)", flexShrink: 0 }}>${parseFloat(p.precio).toFixed(2)}</span>
                      <button className="wf-btn sm ghost" onClick={() => openEditP(p)}>editar</button>
                      <button className="wf-btn sm danger" onClick={() => delP(p)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Configuraciones ── */}
        {seccion === "configuraciones" && (
          <ConfiguracionesPanel
            configs={configs}
            onSave={async (cfg, valor) => {
              await updateConfiguracion(cfg.id, { ...cfg, valor: String(valor) });
              loadConfigs();
            }}
            openNewC={openNewC}
            openEditC={openEditC}
            delC={delC}
          />
        )}

        {/* ── Temas ── */}
        {seccion === "temas" && (
          <>
            <div className="wf-h1" style={{ marginBottom: 6 }}>Temas</div>
            <div className="wf-sm" style={{ marginBottom: 16 }}>Cambia la paleta de colores del sistema. El cambio se aplica al instante.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
              {TEMAS.map(t => (
                <div
                  key={t.id}
                  className="wf-box bold"
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: 16,
                    cursor: "pointer",
                    borderColor: theme === t.id ? "var(--sj-green)" : "var(--sj-line)",
                    background: theme === t.id ? "var(--sj-green-l)" : "var(--sj-paper)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 6 }}>{t.emoji}</div>
                  <div className="wf-h3">{t.label}</div>
                  <div className="wf-sm" style={{ marginTop: 2 }}>{t.desc}</div>
                  {theme === t.id && (
                    <div className="wf-chip green" style={{ marginTop: 8, fontSize: 13 }}>✓ Activo</div>
                  )}
                </div>
              ))}
            </div>

            {/* Color swatches preview */}
            <div className="wf-h3" style={{ marginTop: 20, marginBottom: 8 }}>Colores del tema actual</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Principal", bg: "var(--sj-green)" },
                { label: "Oscuro",    bg: "var(--sj-green-d)" },
                { label: "Claro",     bg: "var(--sj-green-l)", border: true },
                { label: "Dorado",    bg: "var(--sj-gold)" },
                { label: "Rojo",      bg: "var(--sj-red)" },
                { label: "Papel",     bg: "var(--sj-paper)", border: true },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48,
                    background: s.bg,
                    borderRadius: 10,
                    border: s.border ? "1.5px solid var(--sj-line)" : "none",
                    marginBottom: 4,
                  }} />
                  <div className="wf-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal Producto */}
      {editP !== null && (
        <Modal title={editP.id ? "Editar producto" : "Nuevo producto"} onClose={closeP}>
          {error && <div style={{ color: "var(--sj-red)", marginBottom: 8, fontFamily: "'Patrick Hand',cursive" }}>{error}</div>}
          <Field label="Nombre">
            <input className="wf-input" value={formP.nombre} onChange={e => setFormP(f => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <Field label="Precio ($)">
            <input className="wf-input" type="number" step="0.01" value={formP.precio} onChange={e => setFormP(f => ({ ...f, precio: e.target.value }))} />
          </Field>
          <Field label="Categoría">
            <div style={{ display: "flex", gap: 6 }}>
              <select
                className="wf-input"
                style={{ flex: 1 }}
                value={formP.categoria}
                onChange={e => {
                  if (e.target.value === "__nueva__") return;
                  setFormP(f => ({ ...f, categoria: e.target.value }));
                }}
              >
                <option value="">Sin categoría</option>
                {[...new Set(productos.map(p => p.categoria).filter(Boolean))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__nueva__" disabled>── Nueva ──</option>
              </select>
              <input
                className="wf-input"
                style={{ flex: 1 }}
                placeholder="Nueva categoría…"
                value={formP._catNueva || ""}
                onChange={e => setFormP(f => ({ ...f, _catNueva: e.target.value }))}
                onBlur={e => {
                  if (e.target.value.trim()) setFormP(f => ({ ...f, categoria: e.target.value.trim(), _catNueva: "" }));
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    setFormP(f => ({ ...f, categoria: e.target.value.trim(), _catNueva: "" }));
                  }
                }}
              />
            </div>
            {formP.categoria && (
              <div className="wf-sm" style={{ marginTop: 4 }}>
                Categoría seleccionada: <strong>{formP.categoria}</strong>
              </div>
            )}
          </Field>
          <Field label="Imagen del producto">
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {formP.imagen && (
                <img src={formP.imagen} alt="preview" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1.5px solid var(--sj-line)" }} />
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} id="img-upload"
                  onChange={e => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => setFormP(f => ({ ...f, imagen: ev.target.result }));
                    reader.readAsDataURL(file);
                  }}
                />
                <label htmlFor="img-upload" className="wf-btn sm ghost" style={{ cursor: "pointer" }}>
                  📷 {formP.imagen ? "Cambiar" : "Subir imagen"}
                </label>
                {formP.imagen && (
                  <button className="wf-btn sm danger" onClick={() => setFormP(f => ({ ...f, imagen: "" }))}>quitar</button>
                )}
              </div>
            </div>
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
          {error && <div style={{ color: "var(--sj-red)", marginBottom: 8, fontFamily: "'Patrick Hand',cursive" }}>{error}</div>}
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

/* ── ConfiguracionesPanel ── */
function ConfiguracionesPanel({ configs, onSave, openNewC, openEditC, delC }) {
  const KNOWN = {
    tiempo_alerta_cocina: {
      label: "⏱️ Tiempo de alerta en cocina",
      desc: "Minutos antes de que una comanda se marque como demorada",
      type: "slider", min: 5, max: 60, step: 5, unit: "min",
    },
    costo_extra_llevar: {
      label: "🛍️ Costo extra por producto para llevar",
      desc: "Se agrega automáticamente cuando el pedido es para llevar",
      type: "number", min: 0, max: 500, step: 5, unit: "$",
    },
  };

  const knownKeys = Object.keys(KNOWN);
  const knownConfigs = configs.filter(c => knownKeys.includes(c.clave));
  const otherConfigs = configs.filter(c => !knownKeys.includes(c.clave));

  return (
    <>
      <div className="between" style={{ marginBottom: 14 }}>
        <div className="wf-h1">Configuraciones</div>
        <button className="wf-btn sm ghost" onClick={openNewC}>+ Personalizada</button>
      </div>

      {/* Known system configs — friendly UI */}
      <div className="wf-h3" style={{ marginBottom: 8 }}>Ajustes del sistema</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {knownKeys.map(clave => {
          const cfg = knownConfigs.find(c => c.clave === clave);
          if (!cfg) return null;
          const meta = KNOWN[clave];
          const val = parseFloat(cfg.valor) || 0;

          return (
            <div key={clave} className="wf-box bold" style={{ padding: 16 }}>
              <div className="between" style={{ marginBottom: 10 }}>
                <div>
                  <div className="wf-h3">{meta.label}</div>
                  <div className="wf-sm">{meta.desc}</div>
                </div>
                <div style={{
                  fontFamily: "'Caveat', cursive",
                  fontWeight: 700,
                  fontSize: 32,
                  color: "var(--sj-green-d)",
                  minWidth: 60,
                  textAlign: "right",
                }}>
                  {meta.unit === "$" ? `$${val}` : `${val}${meta.unit}`}
                </div>
              </div>

              {meta.type === "slider" && (
                <div>
                  <input
                    type="range"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={val}
                    onChange={e => onSave(cfg, e.target.value)}
                    style={{ width: "100%", accentColor: "var(--sj-green)" }}
                  />
                  <div className="between" style={{ marginTop: 2 }}>
                    <span className="wf-sm">{meta.min}{meta.unit}</span>
                    <span className="wf-sm">{meta.max}{meta.unit}</span>
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {[5, 10, 15, 20, 30, 45].map(v => (
                      <span
                        key={v}
                        className="wf-chip"
                        style={{
                          cursor: "pointer",
                          fontSize: 14,
                          background: val === v ? "var(--sj-green-l)" : undefined,
                          borderColor: val === v ? "var(--sj-green-d)" : undefined,
                          color: val === v ? "var(--sj-green-d)" : undefined,
                        }}
                        onClick={() => onSave(cfg, v)}
                      >
                        {v}{meta.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {meta.type === "number" && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="wf-btn sm"
                    style={{ background: "oklch(0.94 0.04 25)" }}
                    onClick={() => onSave(cfg, Math.max(meta.min, val - meta.step))}
                  >−{meta.step}</button>
                  <input
                    type="number"
                    className="wf-input"
                    style={{ flex: 1, textAlign: "center", fontFamily: "'Caveat',cursive", fontSize: 22, fontWeight: 700 }}
                    value={val}
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    onChange={e => onSave(cfg, e.target.value)}
                  />
                  <button
                    className="wf-btn sm"
                    style={{ background: "var(--sj-green-l)", color: "var(--sj-green-d)" }}
                    onClick={() => onSave(cfg, Math.min(meta.max, val + meta.step))}
                  >+{meta.step}</button>
                  <span className="wf-sm">{meta.unit} por prod</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Other / custom configs */}
      {otherConfigs.length > 0 && (
        <>
          <div className="wf-h3" style={{ marginTop: 20, marginBottom: 8 }}>Configuraciones personalizadas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {otherConfigs.map(c => (
              <div key={c.id} className="wf-box" style={{ padding: "12px 14px" }}>
                <div className="between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="wf-h3">{c.clave}</div>
                    <div className="wf-sm">{c.descripcion}</div>
                  </div>
                  <div className="row" style={{ gap: 8, flexShrink: 0 }}>
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
    </>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="wf-box bold fade-in" style={{ width: "min(440px,95vw)", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
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
