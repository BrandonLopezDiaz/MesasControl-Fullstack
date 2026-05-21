import { fmtMoney, fmtTotal, toLocalDateStr, fmtDateMX, sumBy } from '../format';

describe('fmtMoney', () => {
  it('formats integer', () => {
    expect(fmtMoney(25)).toBe('$25.00');
  });

  it('formats decimal', () => {
    expect(fmtMoney(25.5)).toBe('$25.50');
  });

  it('formats string number', () => {
    expect(fmtMoney('30')).toBe('$30.00');
  });

  it('handles NaN', () => {
    expect(fmtMoney('not-a-number')).toBe('$0.00');
  });

  it('handles undefined', () => {
    expect(fmtMoney(undefined)).toBe('$0.00');
  });

  it('supports custom decimals', () => {
    expect(fmtMoney(25.678, 0)).toBe('$26');
  });

  it('formats zero', () => {
    expect(fmtMoney(0)).toBe('$0.00');
  });
});

describe('fmtTotal', () => {
  it('formats integer without decimals', () => {
    expect(fmtTotal(100)).toBe('$100');
  });

  it('formats decimal with 2 places', () => {
    expect(fmtTotal(100.5)).toBe('$100.50');
  });

  it('formats string number', () => {
    expect(fmtTotal('50')).toBe('$50');
  });

  it('handles NaN', () => {
    expect(fmtTotal('bad')).toBe('$0');
  });

  it('formats zero', () => {
    expect(fmtTotal(0)).toBe('$0');
  });
});

describe('toLocalDateStr', () => {
  it('formats ISO date to YYYY-MM-DD', () => {
    const result = toLocalDateStr('2025-06-15T12:00:00');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles Date object', () => {
    const result = toLocalDateStr(new Date(2025, 0, 1));
    expect(result).toBe('2025-01-01');
  });

  it('returns empty for null', () => {
    expect(toLocalDateStr(null)).toBe('');
  });

  it('returns empty for undefined', () => {
    expect(toLocalDateStr(undefined)).toBe('');
  });

  it('handles invalid date string', () => {
    expect(toLocalDateStr('not-a-date')).toBe('');
  });
});

describe('fmtDateMX', () => {
  it('formats short date in es-MX locale', () => {
    const result = fmtDateMX('2025-06-15');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns empty for null', () => {
    expect(fmtDateMX(null)).toBe('');
  });

  it('supports extra options', () => {
    const result = fmtDateMX('2025-06-15', { year: 'numeric' });
    expect(result).toContain('2025');
  });
});

describe('sumBy', () => {
  const items = [
    { name: 'a', val: 10 },
    { name: 'b', val: 20 },
    { name: 'c', val: 30 },
  ];

  it('sums values from extractor', () => {
    expect(sumBy(items, (i) => i.val)).toBe(60);
  });

  it('handles empty array', () => {
    expect(sumBy([], (i) => i.val)).toBe(0);
  });

  it('handles undefined array', () => {
    expect(sumBy(undefined, (i) => i.val)).toBe(0);
  });

  it('skips NaN values', () => {
    const mixed = [
      { val: 10 },
      { val: NaN },
      { val: 20 },
    ];
    expect(sumBy(mixed, (i) => i.val)).toBe(30);
  });

  it('handles null values', () => {
    const withNull = [
      { val: 10 },
      { val: null },
    ];
    expect(sumBy(withNull, (i) => i.val)).toBe(10);
  });
});

describe('constantes', () => {
  it('ESTATUS has required keys', () => {
    const { ESTATUS } = require('../constants');
    expect(ESTATUS.OCUPADO).toBe('ocupado');
    expect(ESTATUS.FINALIZADO).toBe('finalizado');
    expect(ESTATUS.CANCELADO).toBe('cancelado');
    expect(ESTATUS.LISTO_COCINA).toBe('listo_cocina');
  });

  it('TIPO has required keys', () => {
    const { TIPO } = require('../constants');
    expect(TIPO.MESA).toBe('mesa');
    expect(TIPO.BARRA).toBe('barra');
    expect(TIPO.PARA_LLEVAR).toBe('para_llevar');
    expect(TIPO.RAPIDO).toBe('rapido');
  });
});
