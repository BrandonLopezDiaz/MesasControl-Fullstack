from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from filters.mixins import FiltersMixin
from .filters import PedidoFilter
from .models import Pedido, ProductoPedido, Factura, CierreDia, MovimientoCaja
from .serializers import (
    PedidoSerializer, ProductoPedidoSerializer,
    PedidoDetailSerializer, FacturaSerializer,
    CierreDiaSerializer, MovimientoCajaSerializer,
)


class PedidoViewSet(ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    http_method_names = ['get', 'post', 'put', 'delete']


class ProductoPedidoViewSet(ModelViewSet):
    queryset = ProductoPedido.objects.all()
    serializer_class = ProductoPedidoSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']


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
        tipo = self.request.query_params.get('tipo')
        # For mesa queries (not extras), return only the latest active pedido
        if mesa and not tipo:
            return queryset.filter(id__in=queryset.values_list('id', flat=True)[:1])
        return queryset


class CierreDiaViewSet(ModelViewSet):
    queryset = CierreDia.objects.all().order_by('-fecha')
    serializer_class = CierreDiaSerializer
    http_method_names = ['get', 'post', 'put', 'delete']


class MovimientoCajaViewSet(ModelViewSet):
    queryset = MovimientoCaja.objects.all()
    serializer_class = MovimientoCajaSerializer
    http_method_names = ['get', 'post', 'put', 'delete']

