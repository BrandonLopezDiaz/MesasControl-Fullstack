from django.db.models import Q

class PedidoFilter:
    ordering = ('-id',)  # Ordena del más nuevo al más antiguo

    filter_mappings = {
        'mesa': 'mesa',                   # filtro exacto
        'estatus': 'estatus__iexact',     # filtro case-insensitive
    }

    def apply_filters(self, queryset, params):
        """
        Aplica filtros dinámicos en base a filter_mappings
        """
        for param, value in params.items():
            if param in self.filter_mappings and value:
                field = self.filter_mappings[param]
                queryset = queryset.filter(**{field: value})
        return queryset
