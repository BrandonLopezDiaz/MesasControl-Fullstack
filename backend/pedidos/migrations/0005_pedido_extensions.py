from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0004_extras'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='tipo',
            field=models.CharField(
                choices=[('mesa','Mesa'),('barra','Barra'),('para_llevar','Para llevar'),('rapido','Pedido rápido')],
                default='mesa', max_length=20
            ),
        ),
        migrations.AddField(
            model_name='pedido',
            name='para_llevar',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='pedido',
            name='costo_extra_llevar',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='productopedido',
            name='listo_cocina',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='productopedido',
            name='producto_nombre',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='pedido',
            name='estatus',
            field=models.CharField(
                choices=[('ocupado','Ocupado'),('listo_cocina','Listo en cocina'),('finalizado','Finalizado'),('cancelado','Cancelado')],
                default='ocupado', max_length=50
            ),
        ),
        migrations.CreateModel(
            name='CierreDia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField(unique=True)),
                ('cantidad_inicial', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_ventas', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_comandas', models.IntegerField(default=0)),
                ('canceladas', models.IntegerField(default=0)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='MovimientoCaja',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('gasto','Gasto'),('retiro','Retiro')], max_length=10)),
                ('descripcion', models.CharField(blank=True, max_length=200)),
                ('monto', models.DecimalField(decimal_places=2, max_digits=10)),
                ('cierre', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='movimientos', to='pedidos.cierredia')),
            ],
        ),
    ]
