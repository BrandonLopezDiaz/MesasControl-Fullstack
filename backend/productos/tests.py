"""Tests para productos: Configuracion y Producto models/serializers."""
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from .models import Configuracion, Producto
from .serializers import ConfiguracionSerializer, ProductoSerializer


# ─── Configuracion Model ─────────────────────────────────────────────────


class ConfiguracionModelTest(TestCase):
    def test_str(self):
        cfg = Configuracion(clave='test_key', valor='test_val')
        self.assertEqual(str(cfg), 'test_key = test_val')

    def test_creacion_con_valores(self):
        cfg = Configuracion.objects.create(
            clave='test_key', valor='test_val', descripcion='Una prueba',
        )
        self.assertEqual(cfg.clave, 'test_key')
        self.assertEqual(cfg.valor, 'test_val')
        self.assertEqual(cfg.descripcion, 'Una prueba')

    def test_clave_unica(self):
        Configuracion.objects.create(clave='unica', valor='1')
        with self.assertRaises(Exception):
            Configuracion.objects.create(clave='unica', valor='2')

    def test_descripcion_opcional(self):
        cfg = Configuracion.objects.create(clave='sin_desc', valor='x')
        self.assertEqual(cfg.descripcion, '')


# ─── Configuracion Serializer ────────────────────────────────────────────


class ConfiguracionSerializerTest(TestCase):
    def test_serializa_campos(self):
        cfg = Configuracion.objects.create(
            clave='mi_clave', valor='mi_valor', descripcion='Test',
        )
        data = ConfiguracionSerializer(cfg).data
        self.assertEqual(data['clave'], 'mi_clave')
        self.assertEqual(data['valor'], 'mi_valor')
        self.assertEqual(data['descripcion'], 'Test')
        self.assertIn('id', data)

    def test_deserializa_creacion(self):
        serializer = ConfiguracionSerializer(data={
            'clave': 'nueva', 'valor': '123', 'descripcion': 'Test',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cfg = serializer.save()
        self.assertEqual(cfg.clave, 'nueva')
        self.assertEqual(cfg.valor, '123')

    def test_deserializa_actualizacion(self):
        cfg = Configuracion.objects.create(clave='orig', valor='1')
        serializer = ConfiguracionSerializer(cfg, data={'clave': 'orig', 'valor': '2', 'descripcion': ''})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.valor, '2')

    def test_booleans_como_strings(self):
        """Los feature flags se guardan como strings 'true'/'false'."""
        cfg = Configuracion.objects.create(clave='feature_test', valor='true')
        self.assertEqual(cfg.valor, 'true')
        cfg.valor = 'false'
        cfg.save()
        self.assertEqual(Configuracion.objects.get(clave='feature_test').valor, 'false')


# ─── Configuracion Seed Data ─────────────────────────────────────────────


class ConfiguracionSeedKeysTest(TestCase):
    def test_claves_esperadas(self):
        """Verifica que seed_data.py tenga las claves esperadas."""
        # Importar del management command directamente
        from productos.management.commands.seed_data import CONFIGS_INICIALES

        claves = {c['clave'] for c in CONFIGS_INICIALES}
        esperadas = {
            'tiempo_alerta_cocina', 'costo_extra_llevar',
            'nombre_local', 'feature_barra', 'feature_para_llevar',
            'feature_rapido', 'propina_sugerida',
        }
        self.assertEqual(claves, esperadas)

    def test_feature_keys_tienen_valor_booleano(self):
        from productos.management.commands.seed_data import CONFIGS_INICIALES
        for c in CONFIGS_INICIALES:
            if c['clave'].startswith('feature_'):
                self.assertIn(c['valor'], ('true', 'false'),
                              f'{c["clave"]} debe ser "true" o "false"')


# ─── Producto Model ──────────────────────────────────────────────────────


class ProductoModelTest(TestCase):
    def test_str(self):
        p = Producto(nombre='Tacos', precio='25.00')
        self.assertEqual(str(p), 'Tacos')

    def test_activo_default(self):
        p = Producto.objects.create(nombre='Test', precio='10.00')
        self.assertTrue(p.activo)

    def test_categoria_default(self):
        p = Producto.objects.create(nombre='Test', precio='10.00')
        self.assertEqual(p.categoria, '')

    def test_precio_decimal(self):
        p = Producto.objects.create(nombre='Test', precio='15.50')
        self.assertEqual(float(p.precio), 15.50)


class ProductoSerializerTest(TestCase):
    def test_serializa_campos(self):
        p = Producto.objects.create(
            nombre='Coke', precio='20.00', categoria='Bebidas',
        )
        data = ProductoSerializer(p).data
        self.assertEqual(data['nombre'], 'Coke')
        self.assertIn('id', data)
        self.assertIn('activo', data)
        self.assertIn('imagen', data)

    def test_deserializa_creacion(self):
        serializer = ProductoSerializer(data={
            'nombre': 'New', 'precio': '30.00', 'categoria': 'Test',
            'activo': True, 'imagen': '',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        p = serializer.save()
        self.assertEqual(p.nombre, 'New')
        self.assertEqual(float(p.precio), 30.00)
