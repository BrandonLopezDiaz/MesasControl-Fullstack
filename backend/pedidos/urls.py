from django.urls import path,include
from rest_framework import routers 
from .views import PedidoViewSet, ProductoPedidoViewSet, PedidoDetailViewSet, FacturaViewSet, ExtrasViewSet, ExtrasPedidosViewSet

router = routers.DefaultRouter()
router.register(r'pedido', PedidoViewSet)
router.register(r'producto_pedido', ProductoPedidoViewSet)
router.register(r'pedido_detail', PedidoDetailViewSet, basename='pedido-detail')
router.register(r'factura', FacturaViewSet)
router.register(r'extra', ExtrasViewSet)
router.register(r'extras_pedido', ExtrasPedidosViewSet, basename='extras-pedido')


urlpatterns = [
    path('', include(router.urls)),
]