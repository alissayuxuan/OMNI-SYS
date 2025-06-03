import django_filters
from .models import Agent, Space, Context


class AgentFilter(django_filters.FilterSet):
    # Exact match
    access_level = django_filters.NumberFilter()

    # Range filters
    min_access_level = django_filters.NumberFilter(field_name='access_level', lookup_expr='gte')
    max_access_level = django_filters.NumberFilter(field_name='access_level', lookup_expr='lte')

    # Text search (case-insensitive)
    name = django_filters.CharFilter(lookup_expr='icontains')

    # Multiple choice filter
    access_levels = django_filters.MultipleChoiceFilter(
        field_name='access_level',
        choices=[(i, i) for i in range(10)]
    )

    class Meta:
        model = Agent
        fields = ['access_level', 'name']


class SpaceFilter(django_filters.FilterSet):
    min_capacity = django_filters.NumberFilter(field_name='capacity', lookup_expr='gte')
    max_capacity = django_filters.NumberFilter(field_name='capacity', lookup_expr='lte')

    class Meta:
        model = Space
        fields = ['capacity']


class ContextFilter(django_filters.FilterSet):
    # Date range filters
    scheduled_after = django_filters.DateTimeFilter(field_name='scheduled', lookup_expr='gte')
    scheduled_before = django_filters.DateTimeFilter(field_name='scheduled', lookup_expr='lte')

    # Related model filters
    space = django_filters.ModelChoiceFilter(queryset=Space.objects.all())
    agents = django_filters.ModelMultipleChoiceFilter(queryset=Agent.objects.all())

    # Custom filter for checking if context has available space
    has_availability = django_filters.BooleanFilter(method='filter_has_availability')

    def filter_has_availability(self, queryset, name, value):
        if value:
            # Contexts where agent count < space capacity
            from django.db.models import Count, F
            return queryset.annotate(
                agent_count=Count('agents')
            ).filter(
                agent_count__lt=F('space__capacity')
            )
        return queryset

    class Meta:
        model = Context
        fields = ['space', 'scheduled']