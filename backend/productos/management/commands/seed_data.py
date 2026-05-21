from django.core.management.base import BaseCommand
from productos.models import Producto, Configuracion

PRODUCTOS_INICIALES = [
    {"nombre": "Mondongo",          "precio": "110.00", "categoria": "Caldos"},
    {"nombre": "Mondongo 1/2",      "precio": "70.00",  "categoria": "Caldos"},
    {"nombre": "Pozole",            "precio": "110.00", "categoria": "Caldos"},
    {"nombre": "Pozole 1/2",        "precio": "70.00",  "categoria": "Caldos"},
    {"nombre": "Menudo",            "precio": "100.00", "categoria": "Caldos"},
    {"nombre": "Menudo 1/2",        "precio": "65.00",  "categoria": "Caldos"},
    {"nombre": "Taco de canasta",   "precio": "15.00",  "categoria": "Antojitos"},
    {"nombre": "Quesadilla",        "precio": "35.00",  "categoria": "Antojitos"},
    {"nombre": "Refresco",          "precio": "25.00",  "categoria": "Bebidas"},
    {"nombre": "Agua fresca",       "precio": "20.00",  "categoria": "Bebidas"},
    {"nombre": "Cerveza",           "precio": "40.00",  "categoria": "Bebidas"},
    {"nombre": "Para llevar",       "precio": "10.00",  "categoria": "Extra"},
]

CONFIGS_INICIALES = [
    {"clave": "tiempo_alerta_cocina", "valor": "15",  "descripcion": "Minutos antes de mostrar alerta en cocina"},
    {"clave": "costo_extra_llevar",   "valor": "10",  "descripcion": "Costo adicional por producto para llevar ($MXN)"},
    {"clave": "nombre_local",         "valor": "Mi Local", "descripcion": "Nombre del restaurante/local"},
    {"clave": "feature_barra",        "valor": "true", "descripcion": "Mostrar tipo Barra en pantalla principal"},
    {"clave": "feature_para_llevar",  "valor": "true", "descripcion": "Mostrar tipo Para llevar en pantalla principal"},
    {"clave": "feature_rapido",       "valor": "true", "descripcion": "Mostrar tipo Pedido rápido en pantalla principal"},
    {"clave": "propina_sugerida",     "valor": "10",   "descripcion": "Porcentaje de propina sugerido (%)"},
]


class Command(BaseCommand):
    help = "Inserta productos y configuraciones de prueba si no existen"

    def handle(self, *args, **kwargs):
        prod_creados = 0
        for datos in PRODUCTOS_INICIALES:
            _, created = Producto.objects.get_or_create(
                nombre=datos["nombre"],
                defaults={"precio": datos["precio"], "categoria": datos["categoria"]},
            )
            if created:
                prod_creados += 1

        conf_creadas = 0
        for datos in CONFIGS_INICIALES:
            _, created = Configuracion.objects.get_or_create(
                clave=datos["clave"],
                defaults={"valor": datos["valor"], "descripcion": datos["descripcion"]},
            )
            if created:
                conf_creadas += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seed: {prod_creados} productos, {conf_creadas} configuraciones creadas."
        ))
