# Proposal: arreglar-bugs-criticos

## Intent

Corregir los 6 bugs funcionales críticos encontrados durante la exploración del sistema Local100. El objetivo es estabilizar la aplicación para que las operaciones principales (pedidos, cocina, finanzas, configuración) funcionen sin errores en entornos de desarrollo y producción vía Docker.

## Scope

### In scope
- Migraciones de `CierreDia` para que coincidan con el modelo actual (agregar `turno`, cambiar unique_together)
- Configuración de Docker/entorno para que PostgreSQL se use realmente en Docker
- Corrección del mapeo de puertos del frontend en Docker Compose
- Fix de duplicación de cantidades en `AgregarProducto.jsx`
- Fix de actualización de configuraciones desde Catálogo
- Extender validación de mesa ocupada para incluir `listo_cocina`

### Out of scope
- Bugs WARNING (histórico, timezone, race conditions, movimiento_caja, refrescar comanda)
- Sugerencias (subtotales en backend, seed duplicado)
- Tests nuevos o refactors mayores
- TypeScript, cobertura, prettier, etc.

## Approach

### Bug 1 — Migraciones de CierreDia
1. Crear nueva migración que agregue `turno` field a `CierreDia` con default 1
2. Cambiar `fecha` de `unique=True` a `unique=False`
3. Agregar `unique_together = ('fecha', 'turno')` via `AlterUniqueTogether`
4. No tocar el modelo (ya está correcto en `models.py`)

### Bug 2 — Docker PostgreSQL no usado
1. Agregar `DATABASE_URL=postgres://pedidos_user:pedidos_pass@db:5432/pedidos_db` al `.env`
2. Opcional: la URL se puede construir desde las variables existentes en `settings.py`, pero la solución más limpia es setear `DATABASE_URL` en el `.env` para Docker

### Bug 3 — Frontend Docker port mismatch
1. Cambiar el puerto en `docker-compose.yml` de `3000:3000` a `3000:80` (o `80:80`)
2. Mantener el `ports` en compose como `3000:80` para acceder via `localhost:3000`

### Bug 4 — AgregarProducto duplica cantidades
1. En `AgregarProducto.jsx`, al guardar, NO sumar las cantidades del estado `cantidades` a las del pedido original
2. Enviar SOLO los items nuevos (los que el usuario agregó en esta pantalla) o reemplazar la lista completa
3. Alternativa más simple: al hacer submit, construir el array `productos_pedidos` solo con los items que el usuario seleccionó en esta vista, no mergear con los existentes

### Bug 5 — Config PUT falla
1. Cambiar el `updateConfiguracion` en `ListaProductos.js` para que envíe también `clave` en el payload
2. En `Catalogo.jsx`, cambiar `PUT` por `PATCH` (si el ViewSet lo soporta) o enviar el payload completo con `clave`

### Bug 6 — listo_cocina permite duplicar pedido
1. En `PedidoDetailSerializer.create`, extender la validación para que también bloquee mesas con `estatus__iexact='listo_cocina'`

## Dependencies (orden de implementación)

1. **Bug 1** (migraciones) — primero porque afecta la DB
2. **Bug 2 + Bug 3** (Docker/env) — se pueden hacer en paralelo, afectan infraestructura
3. **Bug 6** (listo_cocina) — cambio chico en backend, independiente
4. **Bug 5** (config PUT) — backend + frontend, cambio acotado
5. **Bug 4** (duplicar cantidades) — frontend, requiere más cuidado por la lógica de estado

## Risks

- **Bug 1**: si hay datos existentes en DB, agregar `turno` con default 1 puede romper el unique_together si hay fechas duplicadas. Requiere migración con datos.
- **Bug 4**: el fix puede cambiar el comportamiento esperado si otras partes del frontend dependen del merge actual. Probar bien el flujo completo de agregar productos.
- **Bug 2**: cambiar `.env` puede afectar dev local que usa SQLite intencionalmente. Asegurarse de que el fallback a SQLite se mantenga cuando `DATABASE_URL` no está seteada.

## Estimated size

~200-350 líneas totales (contando migraciones, cambios de config, fixes de frontend y backend).
