// src/components/ConfirmModal.jsx
// Modal personalizado que reemplaza alert() / confirm() del navegador.
// Se usa a través de ModalProvider + useModal().
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ModalContext = createContext(null);

/* ── Provider que envuelve la app ── */
export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);
  const resolveRef = useRef(null);

  const show = useCallback((opts) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal(opts);
    });
  }, []);

  const close = useCallback((result) => {
    setModal(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  return (
    <ModalContext.Provider value={{ show }}>
      {children}
      {modal && <ConfirmModalDialog {...modal} onClose={() => close(false)} onConfirm={() => close(true)} />}
    </ModalContext.Provider>
  );
}

/* ── Hook para consumir ── */
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal necesita un ModalProvider arriba');
  return ctx;
}

/* ── El modal visual ── */
export default function ConfirmModalDialog({
  title = 'Confirmar',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'confirm', // 'confirm' | 'alert' | 'danger' | 'warning'
  extra,
  onConfirm,
  onClose,
}) {
  const isAlert = variant === 'alert';
  const dangerBg = variant === 'danger' ? 'var(--sj-red)' : 'var(--sj-green)';
  const dangerHover = variant === 'danger' ? '#a33' : 'var(--sj-green-d)';

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={isAlert ? onClose : undefined}
    >
      <div
        className="wf-box"
        style={{
          maxWidth: 420, width: '100%',
          padding: '24px 28px', borderRadius: 16,
          background: 'var(--sj-paper)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wf-h3" style={{ fontSize: 18, marginBottom: 12 }}>
          {variant === 'danger' && '⚠️ '}
          {variant === 'warning' && '⚠️ '}
          {title}
        </div>
        <div className="wf" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
          {message}
        </div>
        {extra}
        <div className="row" style={{ gap: 10, justifyContent: 'flex-end' }}>
          {!isAlert && (
            <button
              className="wf-btn"
              onClick={onClose}
              style={{
                background: 'var(--sj-green-l)', color: 'var(--sj-ink)',
                border: '1.5px solid var(--sj-line)', borderRadius: 10,
                padding: '10px 20px', cursor: 'pointer', fontSize: 15,
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            className="wf-btn"
            onClick={onConfirm}
            style={{
              background: dangerBg, color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '10px 22px', cursor: 'pointer', fontSize: 15, fontWeight: 700,
            }}
            onMouseEnter={(e) => e.target.style.background = dangerHover}
            onMouseLeave={(e) => e.target.style.background = dangerBg}
          >
            {isAlert ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
