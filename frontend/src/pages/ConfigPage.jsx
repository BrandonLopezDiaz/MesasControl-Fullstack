import React, { useEffect, useState } from 'react';
import { fetchConfiguraciones, updateConfiguracion } from '../api/ListaProductos';
import { TEMAS, useTheme } from '../components/ThemeProvider';

const FEATURE_KEYS = ['feature_barra', 'feature_para_llevar', 'feature_rapido'];

function esFeature(clave) {
  return FEATURE_KEYS.includes(clave);
}

function esBooleano(clave) {
  return esFeature(clave);
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [editando, setEditando] = useState(null); // id del config siendo editado
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchConfiguraciones().then(setConfigs).catch(() => {});
  }, []);

  const startEdit = (cfg) => {
    setEditando(cfg.id);
    setEditVal(cfg.valor);
    setMsg('');
  };

  const cancelEdit = () => {
    setEditando(null);
    setEditVal('');
    setMsg('');
  };

  const saveEdit = async (cfg) => {
    setSaving(true);
    try {
      const updated = await updateConfiguracion(cfg.id, {
        clave: cfg.clave,
        valor: editVal,
        descripcion: cfg.descripcion,
      });
      setConfigs((prev) => prev.map((c) => (c.id === cfg.id ? updated : c)));
      setMsg(`✓ ${cfg.clave} actualizado`);
      setEditando(null);
    } catch {
      setMsg('✗ Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = async (cfg) => {
    const newVal = cfg.valor === 'true' ? 'false' : 'true';
    setSaving(true);
    try {
      const updated = await updateConfiguracion(cfg.id, {
        clave: cfg.clave,
        valor: newVal,
        descripcion: cfg.descripcion,
      });
      setConfigs((prev) => prev.map((c) => (c.id === cfg.id ? updated : c)));
    } catch {
      setMsg('✗ Error al cambiar');
    } finally {
      setSaving(false);
    }
  };

  const { theme: _, setTheme: _st, ...cfgRest } = {};

  return (
    <div className="page fade-in">
      <div className="between" style={{ marginBottom: 16 }}>
        <div className="wf-h1">⚙️ Configuración</div>
        {saving && <span className="wf-sm">guardando…</span>}
      </div>

      {msg && (
        <div
          className="wf-box"
          style={{
            padding: '8px 14px', marginBottom: 12, fontSize: 14,
            background: msg.startsWith('✓') ? 'var(--sj-green-l)' : 'oklch(0.94 0.04 25)',
            borderColor: msg.startsWith('✓') ? 'var(--sj-green-d)' : 'var(--sj-red)',
          }}
        >
          {msg}
          <button
            className="wf-btn sm ghost"
            style={{ float: 'right', padding: '0 4px' }}
            onClick={() => setMsg('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Tema ── */}
      <div className="wf-h2" style={{ fontSize: 20, marginBottom: 8 }}>🎨 Tema visual</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TEMAS.map((t) => (
          <button
            key={t.id}
            className="wf-box bold"
            style={{
              padding: '10px 16px', cursor: 'pointer', flex: '1 1 120px',
              borderColor: theme === t.id ? 'var(--sj-green)' : 'var(--sj-line)',
              background: theme === t.id ? 'var(--sj-green-l)' : 'var(--sj-paper)',
              textAlign: 'left',
            }}
            onClick={() => setTheme(t.id)}
          >
            <div style={{ fontSize: 24, marginBottom: 2 }}>{t.emoji}</div>
            <div className="wf-h3" style={{ fontSize: 14 }}>{t.label}</div>
            <div className="wf-sm">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Configs ── */}
      <div className="wf-h2" style={{ fontSize: 20, marginBottom: 8 }}>📋 Ajustes del sistema</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {configs.map((cfg) => (
          <div
            key={cfg.id}
            className="wf-box"
            style={{
              padding: '10px 14px',
              borderColor: editando === cfg.id ? 'var(--sj-green)' : 'var(--sj-line)',
            }}
          >
            {/* Header: clave + toggle/save */}
            <div className="between" style={{ marginBottom: 4 }}>
              <div className="wf-h3" style={{ fontSize: 15 }}>{cfg.clave}</div>
              {esFeature(cfg.clave) ? (
                <label
                  className="wf-chip"
                  style={{
                    cursor: 'pointer',
                    background: cfg.valor === 'true' ? 'var(--sj-green-l)' : 'var(--sj-cream-2)',
                    borderColor: cfg.valor === 'true' ? 'var(--sj-green-d)' : 'var(--sj-line)',
                  }}
                  onClick={() => toggleFeature(cfg)}
                >
                  {cfg.valor === 'true' ? '✓ activo' : '✕ inactivo'}
                </label>
              ) : editando === cfg.id ? (
                <div className="row" style={{ gap: 4 }}>
                  <button
                    className="wf-btn sm primary"
                    onClick={() => saveEdit(cfg)}
                    disabled={saving}
                  >
                    guardar
                  </button>
                  <button className="wf-btn sm ghost" onClick={cancelEdit}>cancelar</button>
                </div>
              ) : (
                <button className="wf-btn sm ghost" onClick={() => startEdit(cfg)}>editar</button>
              )}
            </div>

            {/* Value: editable or display */}
            {editando === cfg.id ? (
              <input
                className="wf-input"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            ) : (
              <div className="wf-sm" style={{ fontFamily: "'Caveat',cursive", fontSize: 18, fontWeight: 700 }}>
                {cfg.valor}
              </div>
            )}

            {/* Description */}
            {cfg.descripcion && (
              <div className="wf-sm" style={{ marginTop: 4, color: 'var(--sj-ink-2)' }}>
                {cfg.descripcion}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
