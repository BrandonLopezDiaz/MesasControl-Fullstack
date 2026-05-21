from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from filters.mixins import FiltersMixin
from .filters import PedidoFilter
from .models import CierreDia, Factura, MovimientoCaja, Pedido, ProductoPedido
from .serializers import (
    CierreDiaSerializer,
    FacturaSerializer,
    MovimientoCajaSerializer,
    PedidoDetailSerializer,
    PedidoSerializer,
    ProductoPedidoSerializer,
)


class PedidoViewSet(ModelViewSet):
    """CRUD básico de pedidos (sin productos anidados)."""
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    http_method_names = ['get', 'post', 'put', 'delete']


class ProductoPedidoViewSet(ModelViewSet):
    """CRUD de productos dentro de pedidos. Usado por cocina para marcar listo_cocina."""
    queryset = ProductoPedido.objects.select_related('producto', 'pedido').all()
    serializer_class = ProductoPedidoSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']


class FacturaViewSet(ModelViewSet):
    """CRUD de facturas (solo lectura recomendada)."""
    queryset = Factura.objects.select_related('pedido').all()
    serializer_class = FacturaSerializer
    http_method_names = ['get', 'post', 'put', 'delete']


class PedidoDetailViewSet(PedidoFilter, FiltersMixin, ModelViewSet):
    """Pedidos con productos anidados. Endpoint principal del frontend."""
    serializer_class = PedidoDetailSerializer
    queryset = Pedido.objects.prefetch_related(
        'productos_pedidos',
        'productos_pedidos__producto',
    ).select_related('factura').all()
    model = Pedido

    def get_queryset(self):
        qs = super().get_queryset().order_by('-id')
        qs = self.filter_queryset(qs)
        mesa = self.request.query_params.get('mesa')
        tipo = self.request.query_params.get('tipo')
        # Para queries de mesa (no extras), solo devolver la última orden activa
        if mesa and not tipo:
            latest = qs.values_list('id', flat=True).first()
            return qs.filter(id=latest) if latest else qs.none()
        return qs


class CierreDiaViewSet(ModelViewSet):
    """CRUD de cierres de día (con movimientos anidados)."""
    queryset = CierreDia.objects.prefetch_related('movimientos').all().order_by('-fecha')
    serializer_class = CierreDiaSerializer
    http_method_names = ['get', 'post', 'put', 'delete']


class MovimientoCajaViewSet(ModelViewSet):
    """CRUD de movimientos de caja individuales."""
    queryset = MovimientoCaja.objects.select_related('cierre').all()
    serializer_class = MovimientoCajaSerializer
    http_method_names = ['get', 'post', 'put', 'delete']
