from django.core.management.base import BaseCommand
from productos.models import Producto

PRODUCTOS_INICIALES = [
    {"nombre": "Mondongo",          "precio": "110.00"},
    {"nombre": "Mondongo 1/2",      "precio": "70.00"},
    {"nombre": "Pozole",            "precio": "110.00"},
    {"nombre": "Pozole 1/2",        "precio": "70.00"},
    {"nombre": "Menudo",            "precio": "100.00"},
    {"nombre": "Menudo 1/2",        "precio": "65.00"},
    {"nombre": "Taco de canasta",   "precio": "15.00"},
    {"nombre": "Quesadilla",        "precio": "35.00"},
    {"nombre": "Refresco",          "precio": "25.00"},
    {"nombre": "Agua fresca",       "precio": "20.00"},
    {"nombre": "Cerveza",           "precio": "40.00"},
    {"nombre": "Para llevar",       "precio": "10.00"},
]

class Command(BaseCommand):
    help = "Inserta productos de prueba si no existen"

    def handle(self, *args, **kwargs):
        creados = 0
        for datos in PRODUCTOS_INICIALES:
            obj, created = Producto.objects.get_or_create(
                nombre=datos["nombre"],
                defaults={"precio": datos["precio"]},
            )
            if created:
                creados += 1

        if creados:
            self.stdout.write(self.style.SUCCESS(f"Seed: {creados} productos creados."))
        else:
            self.stdout.write("Seed: productos ya existían, sin cambios.")
