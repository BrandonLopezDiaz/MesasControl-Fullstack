from rest_framework import serializers
from .models import Producto, Configuracion

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'precio', 'categoria', 'activo']

class ConfiguracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracion
        fields = ['id', 'clave', 'valor', 'descripcion']