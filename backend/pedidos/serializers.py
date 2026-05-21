from decimal import Decimal
from typing import Optional

from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import (
    CierreDia,
    Factura,
    MovimientoCaja,
    Pedido,
    ProductoPedido,
    ESTATUS_ACTIVOS,
    ESTATUS_FINALIZADO,
    ESTATUS_CANCELADO,
    TIPO_MESA,
)


class ProductoPedidoSerializer(serializers.ModelSerializer):
    """Serializer para items individuales dentro de un pedido."""
    producto_nombre = serializers.CharField(read_only=True)

    class Meta:
        model = ProductoPedido
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'subtotal', 'listo_cocina']


class FacturaSerializer(serializers.ModelSerializer):
    """Serializer para facturas (solo lectura para create_date)."""

    class Meta:
        model = Factura
        fields = ['id', 'pedido', 'total', 'create_date']
        read_only_fields = ['create_date']


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer plano de Pedido, sin productos anidados."""

    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'tipo', 'estatus', 'fecha_creacion', 'para_llevar', 'costo_extra_llevar']


class PedidoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo de Pedido con productos anidados y factura."""
    productos_pedidos = ProductoPedidoSerializer(many=True)
    factura = FacturaSerializer(read_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'tipo', 'estatus', 'fecha_creacion',
                  'para_llevar', 'costo_extra_llevar', 'productos_pedidos', 'factura']
        read_only_fields = ['fecha_creacion']

    @staticmethod
    def _calc_subtotal(producto, cantidad: int, para_llevar: bool, costo_extra: Decimal) -> Decimal:
        """Calcula el subtotal de un producto: (precio + extra si para llevar) × cantidad."""
        unit_price = Decimal(str(producto.precio))
        if para_llevar:
            unit_price += Decimal(str(costo_extra or 0))
        return (Decimal(str(cantidad)) * unit_price).quantize(Decimal('0.01'))

    def _validar_mesa_disponible(self, mesa: int, tipo: str) -> None:
        """Valida que una mesa no esté ocupada al crear un nuevo pedido."""
        if tipo == TIPO_MESA and Pedido.objects.filter(
            mesa=mesa, estatus__in=ESTATUS_ACTIVOS
        ).exists():
            raise ValidationError({'mesa': f'La mesa {mesa} ya está ocupada.'})

    def _reconstruir_factura(self, instance, total: Decimal) -> None:
        """Actualiza o crea la factura asociada al pedido."""
        if hasattr(instance, 'factura'):
            instance.factura.total = total
            instance.factura.save()
        else:
            Factura.objects.create(pedido=instance, total=total)

    def create(self, validated_data):
        with transaction.atomic():
            productos_data = validated_data.pop('productos_pedidos')
            mesa = validated_data.get('mesa')
            tipo = validated_data.get('tipo', TIPO_MESA)

            self._validar_mesa_disponible(mesa, tipo)

            pedido = Pedido.objects.create(**validated_data)
            total = self._crear_productos(pedido, productos_data)

            Factura.objects.create(pedido=pedido, total=total)
            return pedido

    def update(self, instance, validated_data):
        with transaction.atomic():
            productos_data = validated_data.pop('productos_pedidos', [])

            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Capturar estado actual antes de regenerar
            existentes = {
                pp.producto_id: {
                    'listo_cocina': pp.listo_cocina,
                    'producto_nombre': pp.producto_nombre,
                    'cantidad': pp.cantidad,
                }
                for pp in instance.productos_pedidos.all()
            }

            instance.productos_pedidos.all().delete()
            total = self._crear_productos(instance, productos_data, existentes)
            self._reconstruir_factura(instance, total)

            return instance

    def _crear_productos(
        self,
        pedido: Pedido,
        productos_data: list,
        existentes: Optional[dict] = None,
    ) -> Decimal:
        """Crea los ProductoPedido para un pedido. Si `existentes` se provee,
        preserva `listo_cocina` y divide rows cuando la cantidad aumenta."""
        total = Decimal('0')
        existentes = existentes or {}

        for prod_data in productos_data:
            producto = prod_data['producto']
            cantidad = prod_data['cantidad']
            producto_id = producto.id
            orig = existentes.get(producto_id, {})
            orig_listo = orig.get('listo_cocina', False)
            orig_cantidad = orig.get('cantidad', 0)
            nombre_snapshot = orig.get('producto_nombre', '') or producto.nombre

            if orig_listo and cantidad > orig_cantidad:
                # Split: porción original se mantiene lista, la nueva va pendiente
                sub_orig = self._calc_subtotal(
                    producto, orig_cantidad,
                    pedido.para_llevar, pedido.costo_extra_llevar,
                )
                ProductoPedido.objects.create(
                    pedido=pedido, producto=producto,
                    producto_nombre=nombre_snapshot,
                    cantidad=orig_cantidad, subtotal=sub_orig,
                    listo_cocina=True,
                )
                delta = cantidad - orig_cantidad
                sub_delta = self._calc_subtotal(
                    producto, delta,
                    pedido.para_llevar, pedido.costo_extra_llevar,
                )
                ProductoPedido.objects.create(
                    pedido=pedido, producto=producto,
                    producto_nombre=nombre_snapshot,
                    cantidad=delta, subtotal=sub_delta,
                    listo_cocina=False,
                )
                total += sub_orig + sub_delta
            else:
                subtotal = self._calc_subtotal(
                    producto, cantidad,
                    pedido.para_llevar, pedido.costo_extra_llevar,
                )
                ProductoPedido.objects.create(
                    pedido=pedido, producto=producto,
                    producto_nombre=nombre_snapshot,
                    cantidad=cantidad, subtotal=subtotal,
                    listo_cocina=orig_listo,
                )
                total += subtotal

        return total


class MovimientoCajaSerializer(serializers.ModelSerializer):
    """Serializer para gastos/retiros asociados a un cierre."""

    class Meta:
        model = MovimientoCaja
        fields = ['id', 'cierre', 'tipo', 'descripcion', 'monto']


class CierreDiaSerializer(serializers.ModelSerializer):
    """Serializer de cierre diario con movimientos anidados y dinero esperado."""
    movimientos = MovimientoCajaSerializer(many=True, required=False)
    dinero_esperado = serializers.SerializerMethodField()

    class Meta:
        model = CierreDia
        fields = ['id', 'fecha', 'turno', 'cantidad_inicial', 'total_ventas',
                  'total_comandas', 'canceladas', 'creado_en', 'movimientos', 'dinero_esperado']
        read_only_fields = ['creado_en', 'turno', 'total_ventas', 'total_comandas', 'canceladas']
        # El UniqueTogetherValidator de DRF se dispara antes de create(),
        # pero turno se calcula en create() — lo removemos.
        validators = []

    def get_dinero_esperado(self, obj: CierreDia) -> float:
        """Calcula cuánto debería haber en caja: inicial + ventas - gastos - retiros."""
        movimientos = obj.movimientos.all()
        gastos = sum(m.monto for m in movimientos if m.tipo == MovimientoCaja.TIPO_GASTO)
        retiros = sum(m.monto for m in movimientos if m.tipo == MovimientoCaja.TIPO_RETIRO)
        return float(obj.cantidad_inicial) + float(obj.total_ventas) - float(gastos) - float(retiros)

    def create(self, validated_data):
        from django.db.models import Sum

        with transaction.atomic():
            movimientos_data = validated_data.pop('movimientos', [])
            fecha = validated_data['fecha']

            cierres_hoy = CierreDia.objects.filter(fecha=fecha).order_by('-turno')
            turno = (cierres_hoy.first().turno + 1) if cierres_hoy.exists() else 1

            if cierres_hoy.exists():
                ultimo_cierre_dt = cierres_hoy.first().creado_en
                pedidos_periodo = Pedido.objects.filter(
                    fecha_creacion__date=fecha,
                    fecha_creacion__gt=ultimo_cierre_dt,
                )
            else:
                pedidos_periodo = Pedido.objects.filter(fecha_creacion__date=fecha)

            total_ventas = pedidos_periodo.filter(estatus=ESTATUS_FINALIZADO).aggregate(
                t=Sum('factura__total'),
            )['t'] or 0
            total_comandas = pedidos_periodo.filter(estatus=ESTATUS_FINALIZADO).count()
            canceladas = pedidos_periodo.filter(estatus=ESTATUS_CANCELADO).count()

            cierre = CierreDia.objects.create(
                **validated_data,
                turno=turno,
                total_ventas=total_ventas,
                total_comandas=total_comandas,
                canceladas=canceladas,
            )
            for m in movimientos_data:
                MovimientoCaja.objects.create(cierre=cierre, **m)
            return cierre
