# Spec: arreglar-bugs-criticos

## Bug 1 — Migraciones de CierreDia

### Acceptance criteria
- `CierreDia` tiene campo `turno` (IntegerField, default=1) en DB
- `fecha` NO es unique en DB
- Existe unique_together = (`fecha`, `turno`) en DB
- Migración es nueva (no modifica la existente `0005_pedido_extensions`)
- Datos existentes migran sin errores (turno=1 para todos los registros actuales)

### Scenarios
- **Normal**: `python manage.py migrate` se ejecuta sin errores
- **Datos existentes**: filas actuales reciben `turno=1` y mantienen su `fecha`
- **Duplicados post-fix**: se puede crear `CierreDia(fecha='2026-05-21', turno=1)` y `CierreDia(fecha='2026-05-21', turno=2)`
- **Regresión**: endpoint `POST /api/v2/cierre_dia/` sigue auto-calculando turno

### What should NOT change
- El modelo Python en `backend/pedidos/models.py` (ya está correcto)
- La lógica de `CierreDiaSerializer.create` (ya calcula turno correctamente)
- Ningún otro modelo o serializer

---

## Bug 2 — Docker PostgreSQL

### Acceptance criteria
- `docker compose up` hace que el backend use PostgreSQL (servicio `db`)
- Backend local sin Docker sigue usando SQLite
- `python manage.py runserver` local funciona sin cambios

### Scenarios
- **Docker**: `DATABASE_URL` está seteada → PostgreSQL via dj-database-url
- **Local**: `DATABASE_URL` NO está seteada → SQLite en `backend/db.sqlite3`
- **Variable de entorno**: `DATABASE_URL` sobreescribe cualquier default

### What should NOT change
- `backend/localback/settings.py` (el dual-mode ya funciona)
- La lógica de `IN_DOCKER` o `ALLOWED_HOSTS`
- Los datos existentes en SQLite local

---

## Bug 3 — Frontend Docker port

### Acceptance criteria
- `docker compose up frontend` sirve la app en `http://localhost:3000`
- Nginx dentro del contenedor escucha en puerto 80

### Scenarios
- **Docker compose**: `curl localhost:3000` devuelve HTML del index.html
- **SPA fallback**: `curl localhost:3000/cocina` devuelve index.html (no 404)

### What should NOT change
- `frontend/Dockerfile` (EXPOSE 80, comando nginx)
- `frontend/nginx.conf` (listen 80, SPA fallback)

---

## Bug 4 — AgregarProducto duplica cantidades

### Acceptance criteria
- Agregar un producto a una comanda existente NO duplica las cantidades del producto original
- Si una comanda tiene 2x Taco y agrego 1x Refresco, la comanda queda con 2x Taco + 1x Refresco

### Scenarios
- **Nuevo producto a comanda existente**: solo se agrega el nuevo, los existentes no cambian
- **Múltiples productos nuevos**: todos se agregan sin afectar existentes
- **Cero productos nuevos**: guardar sin seleccionar nada no modifica la comanda
- **Refrescar página**: después de agregar, la comanda muestra cantidades correctas

### What should NOT change
- El flujo de crear pedidos NUEVOS (donde no hay cantidades pre-existentes)
- El formato del payload `PUT /api/v2/pedido_detail/{id}/`
- La navegación y routing

---

## Bug 5 — Config PUT falla desde Catálogo

### Acceptance criteria
- Mover el slider de `tiempo_alerta_cocina` guarda el valor sin errores
- Editar `costo_extra_llevar` desde la UI guarda el valor sin errores
- Crear/editar configuraciones desde el modal también funciona

### Scenarios
- **Slider inline**: cambiar valor y que persista (PUT con payload completo)
- **Modal crear**: POST con `{clave, valor, descripcion}` funciona
- **Modal editar**: PUT con `{clave, valor, descripcion}` funciona
- **Regresión**: crear configuración nueva sigue funcionando

### API contract
```
PUT /api/v1/configuraciones/{id}/
Payload: { "clave": "...", "valor": "...", "descripcion": "..." }
Response: 200 OK con el objeto actualizado
```

### What should NOT change
- `backend/productos/serializers.py` (ConfiguracionSerializer con todos los fields)
- `backend/productos/views.py` (ConfiguracionViewSet con http_method_names)
- Las otras funciones CRUD del API de configuraciones

---

## Bug 6 — Mesa `listo_cocina` permite duplicar pedido

### Acceptance criteria
- No se puede crear un pedido para una mesa que está `listo_cocina`
- El endpoint devuelve error 400 con mensaje claro

### Scenarios
- **Mesa ocupada**: POST pedido a mesa con estatus='ocupado' → 400 error (ya funciona)
- **Mesa listo_cocina**: POST pedido a mesa con estatus='listo_cocina' → 400 error (NUEVO)
- **Mesa finalizada**: POST pedido a mesa con estatus='finalizado' → OK
- **Mesa cancelada**: POST pedido a mesa con estatus='cancelado' → OK
- **Mesa sin pedido**: POST pedido a mesa sin pedido activo → OK

### API contract
```
POST /api/v2/pedido_detail/
Payload: { "mesa": 1, "productos_pedidos": [...] }
Response 400: { "mesa": "La mesa 1 ya está ocupada." }
```
(mensaje existente, aplica también a listo_cocina)

### What should NOT change
- La lógica de `update` en `PedidoDetailSerializer`
- El modelo `Pedido`
- Cualquier otra validación de negocio
