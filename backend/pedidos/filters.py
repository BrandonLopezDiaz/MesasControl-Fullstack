from django.db.models import Q

class PedidoFilter:
    ordering = ('-id',)  

    filter_mappings = {
        'mesa': 'mesa',                   
        'estatus': 'estatus__iexact',    
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
