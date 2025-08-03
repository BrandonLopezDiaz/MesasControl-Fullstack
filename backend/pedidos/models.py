from django.db import models
from productos.models import Producto

# Create your models here.
class Pedido(models.Model):
    mesa = models.IntegerField()
    estatus = models.CharField(max_length=50)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    productos = models.ManyToManyField(Producto, related_name='ProductoPedido')

    def __str__(self):
        return f'Pedido {self.id} - Mesa {self.mesa}'

class ProductoPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='productos_pedidos')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.cantidad} x {self.producto.nombre} en Pedido {self.pedido.id}'
    
class Factura(models.Model):
    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='factura')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    create_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'Factura #{self.id} - Pedido #{self.pedido.id}'