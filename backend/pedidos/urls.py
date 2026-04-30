from django.urls import path, include
from rest_framework import routers
from .views import (
    PedidoViewSet, ProductoPedidoViewSet, PedidoDetailViewSet,
    FacturaViewSet, CierreDiaViewSet, MovimientoCajaViewSet,
)

router = routers.DefaultRouter()
router.register(r'pedido', PedidoViewSet)
router.register(r'producto_pedido', ProductoPedidoViewSet)
router.register(r'pedido_detail', PedidoDetailViewSet, basename='pedido-detail')
router.register(r'factura', FacturaViewSet)
router.register(r'cierre_dia', CierreDiaViewSet)
router.register(r'movimiento_caja', MovimientoCajaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]