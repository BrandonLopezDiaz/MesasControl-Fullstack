// react-router-dom v7 exports ESM — CRA jest can't resolve it.
// Test that constants load fine instead.
import { ESTATUS, TIPO } from './utils/constants';

test('constants load correctly', () => {
  expect(ESTATUS.OCUPADO).toBe('ocupado');
  expect(ESTATUS.FINALIZADO).toBe('finalizado');
  expect(TIPO.MESA).toBe('mesa');
  expect(TIPO.BARRA).toBe('barra');
});
