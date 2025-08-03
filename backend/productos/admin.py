from django.contrib import admin# type: ignore
from .models import Producto
# Register your models here.

admin.site.register(Producto)