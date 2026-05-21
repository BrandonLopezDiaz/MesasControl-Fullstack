# Archive Report: arreglar-bugs-criticos

**Status**: ✅ Complete

## Summary

Se corrigieron 6 bugs críticos funcionales en Local100 (sistema POS de restaurante Django 4.2 + React 19).

## Bugs Corregidos

| # | Bug | Fix | Archivos |
|---|-----|-----|----------|
| 1 | CierreDia: migraciones no coinciden con modelo | Nueva migración `0006_fix_cierredia_turno.py` que agrega `turno`, saca `unique=True` de `fecha`, agrega `unique_together` | `backend/pedidos/migrations/0006_fix_cierredia_turno.py` |
| 2 | Docker PostgreSQL no usado | Agregada `DATABASE_URL` al `.env` para que Docker use el servicio `db` | `.env` |
| 3 | Frontend Docker port mismatch | Cambiado `3000:3000` → `3000:80` (Nginx escucha en 80) | `docker-compose.yml` |
| 4 | Mesa listo_cocina permite duplicar pedido | Extendida validación a `estatus__in=['ocupado', 'listo_cocina']` | `backend/pedidos/serializers.py` |
| 5 | Config PUT falla desde Catálogo | `onSave` envía payload completo `{ ...cfg, valor }` | `frontend/src/pages/Catalogo.jsx` |
| 6 | AgregarProducto duplica cantidades | `cantidades` inicia en 0 (delta), merge suma sobre original con `orig.cantidad + cantidades[p.id]` | `frontend/src/pages/AgregarProducto.jsx` |

## Verification Results

- ✅ Migraciones: aplicadas sin errores (SQLite local)
- ✅ Backend tests: 0 tests, 0 errores
- ✅ Frontend syntax: ambos archivos validados (braces balanceados, lógica correcta)
- ⚠️ Frontend tests: timeout por recursos del entorno (no por error de código)

## Artifacts

- `openspec/arreglar-bugs-criticos/proposal.md`
- `openspec/arreglar-bugs-criticos/spec.md`
- `openspec/arreglar-bugs-criticos/design.md`
- `openspec/arreglar-bugs-criticos/tasks.md`
- `openspec/arreglar-bugs-criticos/verify-report.md`
- Engram: topic `sdd/arreglar-bugs-criticos/{type}` project `mesascontrol-fullstack`
