from django.urls import path, include
from rest_framework import routers
from .views import ProductoViewSet, ConfiguracionViewSet

router = routers.DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'configuraciones', ConfiguracionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]