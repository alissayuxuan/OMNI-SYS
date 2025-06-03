from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, SpaceViewSet, ContextViewSet, RelationshipViewSet

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'spaces', SpaceViewSet)
router.register(r'contexts', ContextViewSet)
router.register(r'relationships', RelationshipViewSet)

urlpatterns = [
    path('', include(router.urls)),
]