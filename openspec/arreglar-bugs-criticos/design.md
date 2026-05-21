# Design: arreglar-bugs-criticos

## Technical Approach

Apply six small, isolated fixes that align runtime behavior with existing models and deployment intent. Backend changes stay in Django migrations/settings/serializers; frontend changes stay in current CRA state/API patterns. No model refactor or API redesign is needed.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| CierreDia schema repair | Create `backend/pedidos/migrations/0006_fix_cierredia_turno.py` after `0005_pedido_extensions` | Edit old migration | A new migration is safe for already-applied DBs and keeps history auditable. |
| Docker database selection | Set `DATABASE_URL` through Docker env (`.env` consumed by Compose), keep `settings.py` fallback | Hardcode Postgres in settings | Existing settings already switch on `os.environ.get("DATABASE_URL")`; absent env still uses SQLite locally. |
| Config update method | Keep `PUT` and send complete payload | Add PATCH support | `ConfiguracionViewSet.http_method_names` excludes `patch`, so full `PUT` is the smallest backend-free fix. |
| AgregarProducto quantities | Track only newly added quantities in state | Preload existing quantities and merge | Current preload makes existing quantities look newly selected, then the merge adds them again. |

## Data Flow

```text
Docker Compose -> backend env DATABASE_URL -> settings.py -> Postgres
Local run without DATABASE_URL ---------------------------> SQLite

AgregarProducto: initialPedido existing lines stay read-only baseline
User +/− changes cantidades (new deltas only) -> updatePedido full replacement payload
```

## File Changes

| File | Action | Description |
|---|---|---|
| `.env` | Modify | Add `DATABASE_URL=postgres://pedidos_user:pedidos_pass@db:5432/pedidos_db` for Compose-injected backend env. |
| `docker-compose.yml` | Modify | Change frontend port from `"3000:3000"` to `"3000:80"`; Nginx image exposes/listens on 80. |
| `backend/pedidos/migrations/0006_fix_cierredia_turno.py` | Create | Repair DB schema for current `CierreDia` model. |
| `backend/pedidos/serializers.py` | Modify | Extend duplicate mesa validation to include `listo_cocina`. |
| `frontend/src/pages/AgregarProducto.jsx` | Modify | Initialize quantities to zero and merge deltas correctly. |
| `frontend/src/pages/Catalogo.jsx` | Modify | Send complete config payload for inline and modal edits. |
| `frontend/src/api/ListaProductos.js` | No change | `updateConfiguracion` already uses `PUT`; callers must pass full payload. |

## Interfaces / Contracts

### Bug 1 — CierreDia migration

Create migration with dependency `('pedidos', '0005_pedido_extensions')` and operations:

```python
migrations.AlterField(model_name='cierredia', name='fecha', field=models.DateField()),
migrations.AddField(model_name='cierredia', name='turno', field=models.IntegerField(default=1)),
migrations.AlterUniqueTogether(name='cierredia', unique_together={('fecha', 'turno')}),
migrations.AlterModelOptions(name='cierredia', options={}),
```

### Bug 2 — Docker PostgreSQL

Add `DATABASE_URL` to root `.env`. `backend` already has `env_file: .env`; `settings.py` already parses it with `dj_database_url`. Do not change the SQLite fallback.

### Bug 3 — Frontend port

Only change Compose mapping to `3000:80`; keep `frontend/Dockerfile` `EXPOSE 80` and `nginx.conf listen 80` unchanged.

### Bug 4 — AgregarProducto quantity duplication

In `useEffect`, remove preloading existing `initialPedido.productos_pedidos` into `cantidades`; initialize all product ids to `0`. On save, build `originalMap` from existing lines, then add only selected non-zero deltas. This preserves the intended full replacement payload while avoiding `orig.cantidad + orig.cantidad`.

### Bug 5 — Config PUT

For inline known configs, change callback to pass the full config object:

```jsx
onSave={async (cfg, valor) => updateConfiguracion(cfg.id, { ...cfg, valor: String(valor) })}
```

Update all `onSave(cfg.id, value)` calls inside `ConfiguracionesPanel` to `onSave(cfg, value)`. Modal edit already sends `formC` with `clave`, `valor`, `descripcion`; keep it.

### Bug 6 — listo_cocina validation

Change the create validation filter to:

```python
Pedido.objects.filter(mesa=mesa, estatus__in=['ocupado', 'listo_cocina']).exists()
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Migration | `CierreDia` columns/constraint match model | `python manage.py migrate`; inspect creating two rows same date with different turnos. |
| Backend | Mesa duplicate validation and config PUT | Manual API calls or Django shell/API client. |
| Frontend | Docker frontend and UI fixes | `docker compose up`, visit `localhost:3000`; edit config; add products to existing order. |

## Migration / Rollout

Run migrations before exercising finance close. Existing DBs with one `CierreDia` per fecha are safe because `turno=1` preserves uniqueness; duplicates should not exist under the old `fecha unique=True` constraint.

## Open Questions

- None.
