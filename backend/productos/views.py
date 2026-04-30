from rest_framework import viewsets
from .models import Producto, Configuracion
from .serializers import ProductoSerializer, ConfiguracionSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    http_method_names = ['get', 'post', 'put', 'delete']

class ConfiguracionViewSet(viewsets.ModelViewSet):
    queryset = Configuracion.objects.all()
    serializer_class = ConfiguracionSerializer
    http_method_names = ['get', 'post', 'put', 'delete']
