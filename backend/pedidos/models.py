from django.db import models
from productos.models import Producto

TIPO_CHOICES = [
    ('mesa', 'Mesa'),
    ('barra', 'Barra'),
    ('para_llevar', 'Para llevar'),
    ('rapido', 'Pedido rápido'),
]

ESTATUS_CHOICES = [
    ('ocupado', 'Ocupado'),
    ('listo_cocina', 'Listo en cocina'),
    ('finalizado', 'Finalizado'),
    ('cancelado', 'Cancelado'),
]

TIPO_MESA = 'mesa'
TIPO_BARRA = 'barra'
TIPO_PARA_LLEVAR = 'para_llevar'
TIPO_RAPIDO = 'rapido'

ESTATUS_OCUPADO = 'ocupado'
ESTATUS_LISTO_COCINA = 'listo_cocina'
ESTATUS_FINALIZADO = 'finalizado'
ESTATUS_CANCELADO = 'cancelado'

ESTATUS_ACTIVOS = [ESTATUS_OCUPADO, ESTATUS_LISTO_COCINA]


class Pedido(models.Model):
    """Una orden activa o finalizada en una mesa o tipo de servicio."""
    mesa = models.IntegerField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_MESA)
    estatus = models.CharField(max_length=50, choices=ESTATUS_CHOICES, default=ESTATUS_OCUPADO)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    para_llevar = models.BooleanField(default=False)
    costo_extra_llevar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    productos = models.ManyToManyField(Producto, related_name='producto_pedido_relations')

    class Meta:
        ordering = ['-id']
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'

    def __str__(self) -> str:
        return f'Pedido {self.id} — Mesa {self.mesa} ({self.get_estatus_display()})'


class ProductoPedido(models.Model):
    """Producto individual dentro de un pedido, con cantidad y estado de cocina."""
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='productos_pedidos')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    producto_nombre = models.CharField(max_length=200, blank=True)
    cantidad = models.IntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    listo_cocina = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']
        verbose_name = 'Producto del pedido'
        verbose_name_plural = 'Productos del pedido'

    def __str__(self) -> str:
        return f'{self.cantidad} × {self.producto_nombre or self.producto.nombre} en Pedido {self.pedido.id}'


class Factura(models.Model):
    """Factura generada automáticamente al crear un pedido."""
    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='factura')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    create_date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'

    def __str__(self) -> str:
        return f'Factura #{self.id} — Pedido #{self.pedido.id}'


class CierreDia(models.Model):
    """Cierre de caja diario. Pueden haber múltiples turnos por fecha."""
    fecha = models.DateField()
    turno = models.IntegerField(default=1)
    cantidad_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_ventas = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_comandas = models.IntegerField(default=0)
    canceladas = models.IntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fecha', 'turno')
        ordering = ['-fecha', '-turno']
        verbose_name = 'Cierre del día'
        verbose_name_plural = 'Cierres del día'

    def __str__(self) -> str:
        return f'Cierre {self.fecha} Turno {self.turno}'


class MovimientoCaja(models.Model):
    """Gasto o retiro registrado durante un turno."""
    TIPO = [('gasto', 'Gasto'), ('retiro', 'Retiro')]

    TIPO_GASTO = 'gasto'
    TIPO_RETIRO = 'retiro'

    cierre = models.ForeignKey(CierreDia, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=TIPO)
    descripcion = models.CharField(max_length=200, blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']
        verbose_name = 'Movimiento de caja'
        verbose_name_plural = 'Movimientos de caja'

    def __str__(self) -> str:
        return f'{self.tipo} ${self.monto} — {self.descripcion or "(sin desc)"}'
