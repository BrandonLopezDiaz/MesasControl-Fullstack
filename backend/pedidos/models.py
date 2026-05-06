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

class Pedido(models.Model):
    mesa = models.IntegerField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='mesa')
    estatus = models.CharField(max_length=50, choices=ESTATUS_CHOICES, default='ocupado')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    para_llevar = models.BooleanField(default=False)
    costo_extra_llevar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    productos = models.ManyToManyField(Producto, related_name='ProductoPedido')

    def __str__(self):
        return f'Pedido {self.id} - Mesa {self.mesa}'


class ProductoPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='productos_pedidos')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    producto_nombre = models.CharField(max_length=100, blank=True)
    cantidad = models.IntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    listo_cocina = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.cantidad} x {self.producto.nombre} en Pedido {self.pedido.id}'


class Factura(models.Model):
    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='factura')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    create_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'Factura #{self.id} - Pedido #{self.pedido.id}'


class CierreDia(models.Model):
    fecha = models.DateField()  # No longer unique — multiple shifts per day
    turno = models.IntegerField(default=1)
    cantidad_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_ventas = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_comandas = models.IntegerField(default=0)
    canceladas = models.IntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fecha', 'turno')

    def __str__(self):
        return f'Cierre {self.fecha} Turno {self.turno}'


class MovimientoCaja(models.Model):
    TIPO = [('gasto', 'Gasto'), ('retiro', 'Retiro')]
    cierre = models.ForeignKey(CierreDia, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=TIPO)
    descripcion = models.CharField(max_length=200, blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.tipo} ${self.monto}'