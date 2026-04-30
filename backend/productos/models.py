from django.db import models 

# Create your models here.
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=50, blank=True, default='')
    activo = models.BooleanField(default=True)
    imagen = models.TextField(blank=True, default='')  # base64 data URL

    def __str__(self):
        return self.nombre


class Configuracion(models.Model):
    clave = models.CharField(max_length=100, unique=True)
    valor = models.CharField(max_length=255)
    descripcion = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f'{self.clave} = {self.valor}'