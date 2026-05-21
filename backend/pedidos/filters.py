from django.db.models import QuerySet


class PedidoFilter:
    """Filtros dinámicos para el endpoint de pedidos detail.

    Los parámetros de query string (ej: ?mesa=3&estatus=ocupado) se mapean
    a campos del modelo mediante `filter_mappings`.
    """
    ordering = ('-id',)
    filter_mappings: dict[str, str] = {
        'mesa': 'mesa',
        'estatus': 'estatus__iexact',
        'tipo': 'tipo__iexact',
    }

    def apply_filters(self, queryset: QuerySet, params: dict) -> QuerySet:
        """Aplica filtros dinámicos según `filter_mappings` y los valores en `params`."""
        for param, value in params.items():
            if param in self.filter_mappings and value:
                field = self.filter_mappings[param]
                queryset = queryset.filter(**{field: value})
        return queryset
