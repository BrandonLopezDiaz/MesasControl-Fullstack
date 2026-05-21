/**
 * Formatea un valor numérico como moneda.
 * @param {number|string} value
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function fmtMoney(value, decimals = 2) {
  const num = parseFloat(value);
  return Number.isNaN(num) ? '$0.00' : `$${num.toFixed(decimals)}`;
}

/**
 * Formatea un total con estilo compacto (sin decimales si es entero).
 * @param {number|string} value
 * @returns {string}
 */
export function fmtTotal(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '$0';
  return num % 1 === 0 ? `$${num.toFixed(0)}` : `$${num.toFixed(2)}`;
}

/**
 * Convierte una fecha ISO a YYYY-MM-DD en timezone local.
 * @param {string|Date} date - Fecha ISO string o Date object
 * @returns {string}
 */
export function toLocalDateStr(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA');
  } catch {
    return '';
  }
}

/**
 * Formatea una fecha ISO a formato legible es-MX.
 * @param {string|Date} date
 * @param {object} [options]
 * @returns {string}
 */
export function fmtDateMX(date, options = {}) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      ...options,
    });
  } catch {
    return '';
  }
}

/**
 * Calcula los minutos transcurridos desde una fecha ISO.
 * @param {string} fechaStr
 * @returns {number}
 */
export function minutosDesde(fechaStr) {
  if (!fechaStr) return 0;
  try {
    return Math.floor((Date.now() - new Date(fechaStr)) / 60000);
  } catch {
    return 0;
  }
}

/**
 * Calcula tiempo transcurrido en minutos y segundos.
 * @param {string} fechaStr
 * @returns {{ m: number, s: number }}
 */
export function tiempoTranscurrido(fechaStr) {
  if (!fechaStr) return { m: 0, s: 0 };
  try {
    const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
    return { m: Math.floor(diff / 60), s: diff % 60 };
  } catch {
    return { m: 0, s: 0 };
  }
}

/**
 * Suma segura de valores numéricos desde un array de objetos.
 * @param {Array} items
 * @param {function} extractFn - (item) => number
 * @returns {number}
 */
export function sumBy(items, extractFn) {
  return (items || []).reduce((acc, item) => {
    const val = extractFn(item);
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);
}
