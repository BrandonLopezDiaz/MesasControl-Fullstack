from rest_framework.viewsets import ModelViewSet 
from filters.mixins import FiltersMixin
from .filters import PedidoFilter
from .models import Pedido, ProductoPedido, Factura
from .serializers import PedidoSerializer, ProductoPedidoSerializer, PedidoDetailSerializer, FacturaSerializer

# Create your views here.
class PedidoViewSet(ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    http_method_names = ['get', 'post', 'put', 'delete']

class ProductoPedidoViewSet(ModelViewSet):
    queryset = ProductoPedido.objects.all()
    serializer_class = ProductoPedidoSerializer
    http_method_names = ['get', 'post', 'put', 'delete']

class FacturaViewSet(ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    http_method_names = ['get', 'post', 'put', 'delete']

class PedidoDetailViewSet(PedidoFilter, FiltersMixin, ModelViewSet):
    serializer_class = PedidoDetailSerializer
    queryset = Pedido.objects.all()
    model = Pedido

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-id')
        queryset = self.filter_queryset(queryset)
        mesa = self.request.query_params.get('mesa')
        if mesa:
            return queryset.filter(id__in=queryset.values_list('id', flat=True)[:1])

        return queryset

