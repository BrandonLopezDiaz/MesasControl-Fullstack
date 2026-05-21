# Tasks: arreglar-bugs-criticos

## Review Workload Forecast

- **Total estimated changed lines**: ~200-280
- **400-line budget risk**: Low
- **Chained PRs recommended**: No
- **Decision needed before apply**: No

---

## Task 1 — Migración CierreDia (turno + unique_together)

**Effort**: Small  
**Dependencies**: None  
**Files**:
- `backend/pedidos/migrations/0006_fix_cierredia_turno.py` (CREATE)

**Changes**:
Crear migración que depende de `('pedidos', '0005_pedido_extensions')` con estas operaciones:

```python
migrations.AlterField(
    model_name='cierredia',
    name='fecha',
    field=models.DateField(),
),
migrations.AddField(
    model_name='cierredia',
    name='turno',
    field=models.IntegerField(default=1),
),
migrations.AlterUniqueTogether(
    name='cierredia',
    unique_together={('fecha', 'turno')},
),
```

---

## Task 2 — Docker PostgreSQL

**Effort**: Small  
**Dependencies**: None  
**Files**:
- `.env` (MODIFY)

**Changes**:
Agregar al final del `.env`:
```
DATABASE_URL=postgres://pedidos_user:pedidos_pass@db:5432/pedidos_db
```

Esto hace que en Docker (donde `env_file: .env`) el backend use PostgreSQL. Local sin Docker y sin `DATABASE_URL` sigue con SQLite por el fallback en `settings.py`.

---

## Task 3 — Frontend Docker port

**Effort**: Small  
**Dependencies**: None  
**Files**:
- `docker-compose.yml` (MODIFY)

**Changes**:
Cambiar en el servicio `frontend`:
```yaml
ports:
  - "3000:80"
```

(Original: `"3000:3000"`). Nginx dentro del contenedor escucha en `80`; compose mapea `localhost:3000` al `80` del contenedor.

---

## Task 4 — listo_cocina validation

**Effort**: Small  
**Dependencies**: None  
**Files**:
- `backend/pedidos/serializers.py` (MODIFY, línea ~42)

**Changes**:
En `PedidoDetailSerializer.create`, cambiar la validación de mesa ocupada:

**Original** (línea 42):
```python
if tipo == 'mesa' and Pedido.objects.filter(mesa=mesa, estatus__iexact='ocupado').exists():
```

**Nuevo**:
```python
if tipo == 'mesa' and Pedido.objects.filter(mesa=mesa, estatus__in=['ocupado', 'listo_cocina']).exists():
```

---

## Task 5 — Config PUT payload

**Effort**: Small  
**Dependencies**: None  
**Files**:
- `frontend/src/pages/Catalogo.jsx` (MODIFY)

**Changes**:
En `ConfiguracionesPanel`, cambiar los `onSave` de las configuraciones conocidas para enviar el objeto completo en vez de solo `valor`.

**Original** (en slider `tiempo_alerta_cocina` y similar):
```jsx
onSave={async (id, value) => updateConfiguracion(id, { valor: String(value) })}
```

**Nuevo**:
```jsx
onSave={async (cfg, value) => updateConfiguracion(cfg.id, { ...cfg, valor: String(value) })}
```

Actualizar también para `costo_extra_llevar` y cualquier otra config conocida. El modal de crear/editar ya funciona porque envía `formC` completo.

No hace falta modificar `frontend/src/api/ListaProductos.js` — `updateConfiguracion` ya usa `PUT`, solo necesita el payload correcto.

---

## Task 6 — AgregarProducto quantity duplication

**Effort**: Medium  
**Dependencies**: None (pero requiere entender el flujo de estado)  
**Files**:
- `frontend/src/pages/AgregarProducto.jsx` (MODIFY)

**Changes**:
1. En el `useEffect` que carga `initialPedido`, NO pre-cargar las cantidades existentes en el estado `cantidades`. Inicializar todas las claves de producto en `0`.

2. Al hacer submit/save, construir el array `productos_pedidos` para el payload de `PUT /api/v2/pedido_detail/{id}/` de una de estas dos formas:
   - **Opción A (reemplazo completo)**: incluir SOLO los items que el usuario marcó en esta vista con cantidad > 0, más los items existentes con sus cantidades originales (sin sumar).
   - **Opción B (delta)**: mantener los items existentes intactos y solo agregar los nuevos.

   La Opción A es más segura porque el backend ya maneja reemplazo completo en `PedidoDetailSerializer.update`.

3. Asegurarse de que el total de items guardados refleje cantidades correctas (existentes + nuevos, sin duplicación).

---

## Task Order Verification

```
Task 1 (migration) ──────┐
                          ├── No strict order needed
Task 2 (.env) ───────────┤
Task 3 (port) ───────────┤
Task 4 (listo_cocina) ───┤
Task 5 (config PUT) ─────┤
Task 6 (AgregarProducto) ─┘
```

Todos los tasks son independientes entre sí. Se pueden implementar en cualquier orden.
