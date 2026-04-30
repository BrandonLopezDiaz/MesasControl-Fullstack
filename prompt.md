Contexto general del sistema
Estás desarrollando un sistema de punto de venta (POS) para restaurante.
Debes seguir el patrón de diseño ya existente en el proyecto (mantener estructura de vistas, lógica, naming conventions y separación frontend/backend).

El sistema debe ser modular, escalable y consistente.
Todas las vistas deben ser responsivas.

1. Vista de Administración de Catálogos
Objetivo

Permitir la gestión completa de los catálogos del sistema (datos base como productos, configuraciones, etc.).

Requerimientos
Implementar un menú lateral (sidebar):
Debe ser responsive/adaptativo
Permitir navegar entre los diferentes catálogos
Cada catálogo debe soportar:
CRUD completo:
Crear
Leer (listado con paginación si es necesario)
Actualizar
Eliminar
Validaciones de datos
Ejemplos de catálogos:
Productos
Configuraciones (ej: tiempo de alerta cocina, costo extra “para llevar”)

2. Vista de Finanzas
Vista Principal

Debe mostrar:

Total de ventas
Total de comandas
Comandas agrupadas por mesa
Funcionalidades
Filtros por rango de fecha
Listado de comandas:
Ver detalle (productos vendidos)
Editar
Duplicar (copiar comanda)
Eliminar
 Subvista: Cierre de Día

Debe incluir:

Total de ventas del día
Total de comandas
Órdenes canceladas
Caja

El usuario puede ingresar:

Cantidad inicial (opcional)
Gastos extras (múltiples, opcional)
Retiros (múltiples, opcional)
Cálculos
Dinero esperado en caja:
Basado en ventas
Considerando:
ventas
cantidad inicial
gastos
retiros

Implementar la fórmula correctamente y mostrar diferencias contra el conteo real.

3. Vista de Cocina
Objetivo

Visualizar y gestionar pedidos en tiempo real.

Requerimientos
Mostrar comandas activas:
Mesa o tipo (mesa / extra)
Lista de productos
Cantidad por producto
Funcionalidad:
Marcar productos individualmente como “listos”
Botón para marcar toda la comanda como completada
Tiempo:
Cada comanda debe tener un cronómetro
El tiempo límite debe ser configurable desde catálogos
Actualización:
Las comandas deben aparecer automáticamente al generarse
🍽️ 4. Vista de Comandas
Restricción
No se puede salir de esta vista (modo operativo)
🪑 Selección de Mesas
Cambiar color según estado:
🟡 Amarillo claro → recién iniciada
🔴 Rojo → mucho tiempo en proceso

El tiempo debe sincronizarse con la lógica de cocina

💳 Pago de Comanda
Funcionalidad principal: Cuentas separadas
Permitir dividir productos entre personas
Validaciones:
No se pueden asignar más productos de los existentes
No pueden faltar productos sin asignar
Por cada división:
Mostrar total
Calcular cambio
Persistencia:
Si el usuario sale y regresa, la división debe mantenerse
Validaciones de Pago
No permitir pagos menores al total
Si el usuario insiste:
Mostrar advertencia
Permitir continuar solo con confirmación explícita
➕ Opción “Extra”
Agregar opción llamada “Extra” en la selección de mesas:
Ejemplo:
Barra
Para llevar
Pedido rápido
🛍️ Opción “Para llevar”
Checkbox en la vista de agregar productos:
Label: “Para llevar”
Comportamiento:
Agrega un costo adicional por producto
Este valor debe ser configurable en catálogos
⚙️ Requisitos Técnicos Generales
Mantener:
Consistencia con arquitectura actual
Buenas prácticas de desarrollo
Código limpio y modular
Validaciones:
Tanto en frontend como backend
Estado:
Persistente (evitar pérdida de información al navegar)
🎯 Resultado esperado

Un sistema POS funcional con:

Flujo completo:
Comanda → Cocina → Pago → Finanzas
Control administrativo
Experiencia fluida en operación real