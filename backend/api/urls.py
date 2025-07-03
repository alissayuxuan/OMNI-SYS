from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, SpaceViewSet, ContextViewSet, RelationshipViewSet, get_agent_id_by_username


router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'spaces', SpaceViewSet)
router.register(r'contexts', ContextViewSet)
router.register(r'relationships', RelationshipViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("agents/by-username/<str:username>/", get_agent_id_by_username),
    # path('agents/<str:agent_id>/send/', AgentSendMessageView.as_view()),
    # path('agents/<str:agent_id>/receive/', AgentReceiveMessageView.as_view()),
]
