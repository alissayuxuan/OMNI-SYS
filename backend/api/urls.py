from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, SpaceViewSet, ContextViewSet, RelationshipViewSet, AgentSendMessageView, AgentReceiveMessageView


router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'spaces', SpaceViewSet)
router.register(r'contexts', ContextViewSet)
router.register(r'relationships', RelationshipViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('agents/<str:agent_id>/send/', AgentSendMessageView.as_view()),
    path('agents/<str:agent_id>/receive/', AgentReceiveMessageView.as_view()),
]
