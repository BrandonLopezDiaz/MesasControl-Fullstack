"""Tests para pedidos: modelos, serializers, lógica de negocio."""
from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from productos.models import Configuracion, Producto
from .models import (
    CierreDia,
    Factura,
    MovimientoCaja,
    Pedido,
    ProductoPedido,
    ESTATUS_CANCELADO,
    ESTATUS_FINALIZADO,
    ESTATUS_LISTO_COCINA,
    ESTATUS_OCUPADO,
    TIPO_MESA,
    TIPO_PARA_LLEVAR,
    TIPO_BARRA,
)
from .serializers import CierreDiaSerializer, PedidoDetailSerializer


# ─── Test Data Helpers ────────────────────────────────────────────────────


def crear_productos():
    return [
        Producto.objects.create(nombre='Coke', precio='20.00', categoria='Bebidas'),
        Producto.objects.create(nombre='Fries', precio='30.00', categoria='Comida'),
        Producto.objects.create(nombre='Tacos', precio='25.00', categoria='Comida'),
    ]


def build_payload(mesa=1, tipo=TIPO_MESA, productos=None, **kw):
    """Construye un payload válido para PedidoDetailSerializer."""
    return {
        'mesa': mesa,
        'tipo': tipo,
        'estatus': ESTATUS_OCUPADO,
        'para_llevar': False,
        'costo_extra_llevar': 0,
        'productos_pedidos': productos or [],
        **kw,
    }


def pp(prod_id, cantidad, subtotal):
    """Crea un item de productos_pedidos para test."""
    return {'producto': prod_id, 'cantidad': cantidad, 'subtotal': subtotal}


SUB = {
    'coke_x1': '20.00', 'coke_x2': '40.00', 'coke_x3': '60.00',
    'coke_x5': '100.00', 'coke_x10': '200.00',
    'fries_x1': '30.00', 'fries_x2': '60.00', 'fries_x3': '90.00',
    'fries_x5': '150.00',
    'tacos_x3': '75.00',
    'coke_ll_x2': '60.00',  # (20+10)*2
}


# ─── Model Tests ──────────────────────────────────────────────────────────


class PedidoModelTest(TestCase):
    def test_str(self):
        p = Pedido.objects.create(mesa=1)
        self.assertIn('Pedido', str(p))
        self.assertIn('Mesa 1', str(p))

    def test_creacion_con_valores_default(self):
        p = Pedido.objects.create(mesa=5)
        self.assertEqual(p.estatus, ESTATUS_OCUPADO)
        self.assertEqual(p.tipo, TIPO_MESA)
        self.assertEqual(p.para_llevar, False)
        self.assertEqual(p.costo_extra_llevar, Decimal('0'))


class ProductoPedidoModelTest(TestCase):
    def test_str_con_producto_nombre(self):
        prod = Producto.objects.create(nombre='Tacos', precio='25.00')
        pedido = Pedido.objects.create(mesa=1)
        pp_inst = ProductoPedido.objects.create(
            pedido=pedido, producto=prod,
            producto_nombre='Tacos',
            cantidad=2, subtotal='50.00',
        )
        self.assertIn('2 × Tacos', str(pp_inst))

    def test_listo_cocina_default(self):
        prod = Producto.objects.create(nombre='Coke', precio='20.00')
        pedido = Pedido.objects.create(mesa=1)
        pp_inst = ProductoPedido.objects.create(
            pedido=pedido, producto=prod,
            cantidad=1, subtotal='20.00',
        )
        self.assertFalse(pp_inst.listo_cocina)


class FacturaModelTest(TestCase):
    def test_str(self):
        pedido = Pedido.objects.create(mesa=1)
        f = Factura.objects.create(pedido=pedido, total='100.00')
        self.assertIn('Factura', str(f))


class CierreDiaModelTest(TestCase):
    def test_unique_together(self):
        """Misma fecha permite múltiples turnos."""
        CierreDia.objects.create(fecha='2025-01-01', turno=1, cantidad_inicial=0)
        CierreDia.objects.create(fecha='2025-01-01', turno=2, cantidad_inicial=0)
        self.assertEqual(CierreDia.objects.count(), 2)


# ─── Serializer: _calc_subtotal ──────────────────────────────────────────


class CalcSubtotalTest(TestCase):
    def setUp(self):
        self.prod = Producto(nombre='Test', precio='20.00')

    def test_sin_extra(self):
        r = PedidoDetailSerializer._calc_subtotal(self.prod, 3, False, Decimal('0'))
        self.assertEqual(r, Decimal('60.00'))

    def test_con_para_llevar(self):
        r = PedidoDetailSerializer._calc_subtotal(self.prod, 3, True, Decimal('10.00'))
        self.assertEqual(r, Decimal('90.00'))

    def test_cantidad_cero(self):
        r = PedidoDetailSerializer._calc_subtotal(self.prod, 0, False, Decimal('0'))
        self.assertEqual(r, Decimal('0.00'))

    def test_decimal_precision(self):
        prod = Producto(nombre='Test', precio='15.50')
        r = PedidoDetailSerializer._calc_subtotal(prod, 3, True, Decimal('5.25'))
        self.assertEqual(r, Decimal('62.25'))


# ─── Serializer: create ───────────────────────────────────────────────────


class PedidoDetailSerializerCreateTest(TestCase):
    def setUp(self):
        self.prods = crear_productos()

    def test_crea_pedido_con_productos(self):
        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 1, SUB['fries_x1']),
        ])
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        pedido = serializer.save()
        self.assertEqual(pedido.productos_pedidos.count(), 2)
        self.assertEqual(pedido.mesa, 1)
        self.assertEqual(pedido.estatus, ESTATUS_OCUPADO)

    def test_crea_factura_auto(self):
        payload = build_payload(productos=[
            pp(self.prods[0].id, 3, SUB['coke_x3']),
        ])
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        self.assertIsNotNone(pedido.factura)
        self.assertEqual(pedido.factura.total, Decimal('60.00'))

    def test_rechaza_mesa_ocupada(self):
        Pedido.objects.create(mesa=1, estatus=ESTATUS_OCUPADO)
        payload = build_payload(mesa=1, productos=[
            pp(self.prods[0].id, 1, SUB['coke_x1']),
        ])
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid())  # validation passes, create() rechaza
        with self.assertRaises(ValidationError):
            serializer.save()

    def test_permite_segundo_pedido_si_el_primero_finalizo(self):
        Pedido.objects.create(mesa=1, estatus=ESTATUS_FINALIZADO)
        payload = build_payload(mesa=1, productos=[
            pp(self.prods[0].id, 1, SUB['coke_x1']),
        ])
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_crea_snapshot_producto_nombre(self):
        payload = build_payload(productos=[
            pp(self.prods[0].id, 1, SUB['coke_x1']),
        ])
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        pp_inst = pedido.productos_pedidos.first()
        self.assertEqual(pp_inst.producto_nombre, 'Coke')

    def test_para_llevar_aplica_extra(self):
        payload = build_payload(
            tipo=TIPO_PARA_LLEVAR, para_llevar=True, costo_extra_llevar=10,
            productos=[pp(self.prods[0].id, 2, SUB['coke_ll_x2'])],
        )
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        self.assertEqual(pedido.factura.total, Decimal('60.00'))


# ─── Serializer: update ───────────────────────────────────────────────────


class PedidoDetailSerializerUpdateTest(TestCase):
    def setUp(self):
        self.prods = crear_productos()
        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 2, SUB['fries_x2']),
        ])
        serializer = PedidoDetailSerializer(data=payload)
        self.assertTrue(serializer.is_valid())
        self.pedido = serializer.save()

    def test_actualiza_cantidad(self):
        payload = build_payload(productos=[
            pp(self.prods[0].id, 5, SUB['coke_x5']),
            pp(self.prods[1].id, 2, SUB['fries_x2']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        pedido = serializer.save()
        pp_inst = pedido.productos_pedidos.get(producto=self.prods[0])
        self.assertEqual(pp_inst.cantidad, 5)

    def test_preserva_listo_cocina_existente(self):
        fries_pp = self.pedido.productos_pedidos.get(producto=self.prods[1])
        fries_pp.listo_cocina = True
        fries_pp.save()

        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 2, SUB['fries_x2']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()

        updated_fries = pedido.productos_pedidos.get(producto=self.prods[1])
        self.assertTrue(updated_fries.listo_cocina)
        updated_coke = pedido.productos_pedidos.get(producto=self.prods[0])
        self.assertFalse(updated_coke.listo_cocina)

    def test_split_ready_items_when_qty_increases(self):
        """Cuando un producto listo aumenta de cantidad, se splitea en 2 rows."""
        fries_pp = self.pedido.productos_pedidos.get(producto=self.prods[1])
        fries_pp.listo_cocina = True
        fries_pp.save()

        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 5, SUB['fries_x5']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        pedido = serializer.save()

        fries_ready = pedido.productos_pedidos.filter(
            producto=self.prods[1], listo_cocina=True,
        )
        fries_pending = pedido.productos_pedidos.filter(
            producto=self.prods[1], listo_cocina=False,
        )
        self.assertEqual(fries_ready.count(), 1)
        self.assertEqual(fries_pending.count(), 1)
        self.assertEqual(fries_ready.first().cantidad, 2)
        self.assertEqual(fries_pending.first().cantidad, 3)

    def test_split_preserves_snapshot(self):
        fries_pp = self.pedido.productos_pedidos.get(producto=self.prods[1])
        fries_pp.listo_cocina = True
        fries_pp.producto_nombre = 'Papas Fritas'
        fries_pp.save()

        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 3, SUB['fries_x3']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()

        for pp_inst in pedido.productos_pedidos.filter(producto=self.prods[1]):
            self.assertEqual(pp_inst.producto_nombre, 'Papas Fritas')

    def test_no_split_if_qty_same_or_less(self):
        fries_pp = self.pedido.productos_pedidos.get(producto=self.prods[1])
        fries_pp.listo_cocina = True
        fries_pp.save()

        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 2, SUB['fries_x2']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()

        fries = pedido.productos_pedidos.filter(producto=self.prods[1])
        self.assertEqual(fries.count(), 1)
        self.assertTrue(fries.first().listo_cocina)

    def test_agrega_producto_nuevo(self):
        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
            pp(self.prods[1].id, 2, SUB['fries_x2']),
            pp(self.prods[2].id, 3, SUB['tacos_x3']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        self.assertEqual(pedido.productos_pedidos.count(), 3)
        tacos_pp = pedido.productos_pedidos.get(producto=self.prods[2])
        self.assertEqual(tacos_pp.producto_nombre, 'Tacos')
        self.assertFalse(tacos_pp.listo_cocina)

    def test_update_actualiza_factura(self):
        payload = build_payload(productos=[
            pp(self.prods[0].id, 10, SUB['coke_x10']),
            pp(self.prods[1].id, 2, SUB['fries_x2']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        self.assertEqual(pedido.factura.total, Decimal('260.00'))

    def test_eliminar_producto_via_put(self):
        """Eliminar un producto = enviar PUT sin ese producto."""
        payload = build_payload(productos=[
            pp(self.prods[0].id, 2, SUB['coke_x2']),
        ])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        self.assertEqual(pedido.productos_pedidos.count(), 1)
        self.assertEqual(pedido.productos_pedidos.first().producto_id, self.prods[0].id)
        self.assertEqual(pedido.factura.total, Decimal('40.00'))

    def test_eliminar_todos_los_productos(self):
        """Enviar lista vacía de productos debe funcionar — pedido sin items."""
        payload = build_payload(productos=[])
        serializer = PedidoDetailSerializer(self.pedido, data=payload)
        self.assertTrue(serializer.is_valid())
        pedido = serializer.save()
        self.assertEqual(pedido.productos_pedidos.count(), 0)
        self.assertEqual(pedido.factura.total, Decimal('0.00'))


# ─── CierreDia Serializer ────────────────────────────────────────────────


class CierreDiaSerializerTest(TestCase):
    def setUp(self):
        self.prods = crear_productos()
        self.hoy = date.today().isoformat()
        for i in range(3):
            p = Pedido.objects.create(mesa=i + 10, estatus=ESTATUS_FINALIZADO)
            Factura.objects.create(pedido=p, total=Decimal(f'{i+1}00.00'))

    def test_create_incrementa_turno(self):
        serializer = CierreDiaSerializer(data={
            'fecha': self.hoy,
            'cantidad_inicial': 500,
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cierre = serializer.save()
        self.assertEqual(cierre.turno, 1)
        self.assertEqual(cierre.total_ventas, Decimal('600.00'))
        self.assertEqual(cierre.total_comandas, 3)

    def test_segundo_turno_incrementa(self):
        CierreDia.objects.create(fecha=self.hoy, turno=1, cantidad_inicial=0)
        serializer = CierreDiaSerializer(data={
            'fecha': self.hoy,
            'cantidad_inicial': 500,
        })
        self.assertTrue(serializer.is_valid())
        cierre = serializer.save()
        self.assertEqual(cierre.turno, 2)

    def test_dinero_esperado(self):
        cierre = CierreDia.objects.create(
            fecha=self.hoy, turno=1,
            cantidad_inicial=500, total_ventas=600,
        )
        MovimientoCaja.objects.create(cierre=cierre, tipo='gasto', descripcion='Limpieza', monto=50)
        serializer = CierreDiaSerializer(cierre)
        self.assertEqual(serializer.data['dinero_esperado'], 1050.0)
