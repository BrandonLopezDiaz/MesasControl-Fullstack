from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0005_pedido_extensions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cierredia',
            name='fecha',
            field=models.DateField(),
        ),
        migrations.AddField(
            model_name='cierredia',
            name='turno',
            field=models.IntegerField(default=1),
        ),
        migrations.AlterUniqueTogether(
            name='cierredia',
            unique_together={('fecha', 'turno')},
        ),
    ]
