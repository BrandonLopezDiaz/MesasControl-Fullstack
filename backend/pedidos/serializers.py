from rest_framework import serializers
from .models import Pedido, ProductoPedido, Factura, Extras
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.db import transaction




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
        if Pedido.objects.filter(
            mesa=mesa,
        ).filter(
            Q(estatus__iexact='ocupado') | Q(estatus__iexact='preparacion')
        ).exists():
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

class ExtrasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Extras
        fields = ['id', 'nombre_mesa']
        read_only_fields = ['id']


class ExtrasPedidosSerializer(serializers.ModelSerializer):
    productos_pedidos = ProductoPedidoSerializer(many=True)
    factura = FacturaSerializer(read_only=True)
    extras = ExtrasSerializer(many=True)

    class Meta:
        model = Pedido
        fields = [
            'id',
            'mesa',
            'estatus',
            'fecha_creacion',
            'productos_pedidos',
            'factura',
            'extras',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'mesa']

    @transaction.atomic
    def create(self, validated_data):
        productos_data = validated_data.pop('productos_pedidos', [])
        extras_data = validated_data.pop('extras', [])

        validated_data['mesa'] = 0

        pedido = Pedido.objects.create(**validated_data)

        total = 0
        for prod_data in productos_data:
            item = ProductoPedido.objects.create(
                pedido=pedido,
                producto=prod_data['producto'],
                cantidad=prod_data['cantidad'],
                subtotal=prod_data['subtotal'],
            )
            total += item.subtotal

        Factura.objects.create(pedido=pedido, total=total)

        if not extras_data:
            raise serializers.ValidationError({
                'extras': 'Debes enviar al menos un extra con el campo "nombre_mesa".'
            })

        extras_bulk = []
        for ex in extras_data:
            nombre_mesa = ex.get('nombre_mesa')
            if not nombre_mesa:
                raise serializers.ValidationError({
                    'extras': 'Cada extra debe incluir "nombre_mesa".'
                })
            extras_bulk.append(Extras(pedido=pedido, nombre_mesa=nombre_mesa))
        Extras.objects.bulk_create(extras_bulk)

        return pedido
    
    @transaction.atomic
    def update(self, instance, validated_data):
        productos_data = validated_data.pop('productos_pedidos', None)
        extras_data = validated_data.pop('extras', None)

        instance.estatus = validated_data.get('estatus', instance.estatus)
        instance.save()

        if productos_data is not None:
            instance.productos_pedidos.all().delete()

            total = 0
            for prod_data in productos_data:
                item = ProductoPedido.objects.create(
                    pedido=instance,
                    producto=prod_data['producto'],
                    cantidad=prod_data['cantidad'],
                    subtotal=prod_data['subtotal'],
                )
                total += item.subtotal

            if hasattr(instance, 'factura'):
                instance.factura.total = total
                instance.factura.save()
            else:
                Factura.objects.create(pedido=instance, total=total)

        if extras_data is not None:
            for ex in extras_data:
                if not ex.get('nombre_mesa'):
                    raise serializers.ValidationError({
                        'extras': 'Cada extra debe incluir "nombre_mesa".'
                    })

            instance.extras.all().delete()
            Extras.objects.bulk_create([
                Extras(pedido=instance, nombre_mesa=ex['nombre_mesa'])
                for ex in extras_data
            ])

        return instance