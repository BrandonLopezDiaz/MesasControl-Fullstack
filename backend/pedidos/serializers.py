from rest_framework import serializers
from .models import Pedido, ProductoPedido, Factura, CierreDia, MovimientoCaja
from rest_framework.exceptions import ValidationError


class ProductoPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = ProductoPedido
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'subtotal', 'listo_cocina']


class FacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factura
        fields = ['id', 'pedido', 'total', 'create_date']
        read_only_fields = ['create_date']


class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'tipo', 'estatus', 'fecha_creacion', 'para_llevar', 'costo_extra_llevar']


class PedidoDetailSerializer(serializers.ModelSerializer):
    productos_pedidos = ProductoPedidoSerializer(many=True)
    factura = FacturaSerializer(read_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'tipo', 'estatus', 'fecha_creacion',
                  'para_llevar', 'costo_extra_llevar', 'productos_pedidos', 'factura']
        read_only_fields = ['fecha_creacion']

    def create(self, validated_data):
        productos_data = validated_data.pop('productos_pedidos')
        mesa = validated_data.get('mesa')
        tipo = validated_data.get('tipo', 'mesa')

        if tipo == 'mesa' and Pedido.objects.filter(mesa=mesa, estatus__iexact='ocupado').exists():
            raise ValidationError({'mesa': f'La mesa {mesa} ya está ocupada.'})

        pedido = Pedido.objects.create(**validated_data)

        total = 0
        for prod_data in productos_data:
            pp = ProductoPedido.objects.create(
                pedido=pedido,
                producto=prod_data['producto'],
                producto_nombre=prod_data.get('producto_nombre', prod_data['producto'].nombre),
                cantidad=prod_data['cantidad'],
                subtotal=prod_data['subtotal'],
            )
            total += pp.subtotal

        Factura.objects.create(pedido=pedido, total=total)
        return pedido

    def update(self, instance, validated_data):
        productos_data = validated_data.pop('productos_pedidos', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Keep listo_cocina state for existing products
        existentes = {
            pp.producto_id: pp.listo_cocina
            for pp in instance.productos_pedidos.all()
        }

        instance.productos_pedidos.all().delete()

        total = 0
        for prod_data in productos_data:
            producto_id = prod_data['producto'].id
            # Preserve listo_cocina if product was already in the order
            listo = existentes.get(producto_id, False)
            pp = ProductoPedido.objects.create(
                pedido=instance,
                producto=prod_data['producto'],
                producto_nombre=prod_data.get('producto_nombre', prod_data['producto'].nombre),
                cantidad=prod_data['cantidad'],
                subtotal=prod_data['subtotal'],
                listo_cocina=listo,
            )
            total += pp.subtotal

        if hasattr(instance, 'factura'):
            instance.factura.total = total
            instance.factura.save()
        else:
            Factura.objects.create(pedido=instance, total=total)

        return instance


class MovimientoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCaja
        fields = ['id', 'tipo', 'descripcion', 'monto']


class CierreDiaSerializer(serializers.ModelSerializer):
    movimientos = MovimientoCajaSerializer(many=True, required=False)
    dinero_esperado = serializers.SerializerMethodField()

    class Meta:
        model = CierreDia
        fields = ['id', 'fecha', 'cantidad_inicial', 'total_ventas',
                  'total_comandas', 'canceladas', 'creado_en', 'movimientos', 'dinero_esperado']
        read_only_fields = ['creado_en', 'total_ventas', 'total_comandas', 'canceladas']

    def get_dinero_esperado(self, obj):
        movimientos = obj.movimientos.all()
        gastos = sum(m.monto for m in movimientos if m.tipo == 'gasto')
        retiros = sum(m.monto for m in movimientos if m.tipo == 'retiro')
        return float(obj.cantidad_inicial) + float(obj.total_ventas) - float(gastos) - float(retiros)

    def create(self, validated_data):
        from django.db.models import Sum
        from pedidos.models import Factura as F
        movimientos_data = validated_data.pop('movimientos', [])
        fecha = validated_data['fecha']

        pedidos_dia = Pedido.objects.filter(fecha_creacion__date=fecha)
        total_ventas = pedidos_dia.filter(estatus='finalizado').aggregate(
            t=Sum('factura__total'))['t'] or 0
        total_comandas = pedidos_dia.filter(estatus='finalizado').count()
        canceladas = pedidos_dia.filter(estatus='cancelado').count()

        cierre = CierreDia.objects.create(
            **validated_data,
            total_ventas=total_ventas,
            total_comandas=total_comandas,
            canceladas=canceladas,
        )
        for m in movimientos_data:
            MovimientoCaja.objects.create(cierre=cierre, **m)
        return cierre
