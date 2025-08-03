class FiltersMixin:
    def filter_queryset(self, queryset):
        request = self.request
        params = request.query_params  # obtiene los parámetros ?mesa=3&estatus=ocupado
        if hasattr(self, 'apply_filters'):
            queryset = self.apply_filters(queryset, params)
        return queryset
