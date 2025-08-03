from rest_framework import serializers
from .models import Pedido, ProductoPedido, Factura
from rest_framework.exceptions import ValidationError



class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'estatus', 'fecha_creacion']

class ProductoPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    
    class Meta:
        model = ProductoPedido
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'subtotal']

class FacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factura
        fields = ['id', 'pedido', 'total', 'create_date']
        read_only_fields = ['create_date']

class PedidoDetailSerializer(serializers.ModelSerializer):
    productos_pedidos = ProductoPedidoSerializer(many=True)
    factura = FacturaSerializer(read_only=True)


    class Meta:
        model = Pedido
        fields = ['id', 'mesa', 'estatus', 'fecha_creacion', 'productos_pedidos', 'factura']
        read_only_fields = ['fecha_creacion']

    def create(self, validated_data):
        productos_data = validated_data.pop('productos_pedidos')
        mesa = validated_data.get('mesa')
        if Pedido.objects.filter(mesa=mesa, estatus__iexact='ocupado').exists():
            raise ValidationError({'mesa': f'La mesa {mesa} ya está ocupada.'})

        pedido = Pedido.objects.create(**validated_data)

        total = 0
        for prod_data in productos_data:
            producto_pedido = ProductoPedido.objects.create(
                pedido=pedido,
                producto=prod_data['producto'],
                cantidad=prod_data['cantidad'],
                subtotal=prod_data['subtotal']
            )
            total += producto_pedido.subtotal

        Factura.objects.create(
            pedido=pedido,
            total=total
        )

        return pedido

    def update(self, instance, validated_data):
        productos_data = validated_data.pop('productos_pedidos', [])

        instance.estatus = validated_data.get('estatus', instance.estatus)
        instance.mesa = validated_data.get('mesa', instance.mesa)
        instance.save()

        instance.productos_pedidos.all().delete()

        total = 0
        for prod_data in productos_data:
            producto_pedido = ProductoPedido.objects.create(
                pedido=instance,
                producto=prod_data['producto'],
                cantidad=prod_data['cantidad'],
                subtotal=prod_data['subtotal']
            )
            total += producto_pedido.subtotal

        if hasattr(instance, 'factura'):
            instance.factura.total = total
            instance.factura.save()
        else:
            Factura.objects.create(
                pedido=instance,
                total=total
            )

        return instance
