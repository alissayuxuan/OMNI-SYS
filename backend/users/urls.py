from django.urls import path
from .views import RegisterUserView, CustomTokenRefreshView, CustomTokenObtainPairView

urlpatterns = [
    path('user/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('user/register/', RegisterUserView.as_view(), name='register_user'),
    #path('user/admin-profile/', AdminProfileView.as_view(), name='admin_profile'),
    #path('user/agent-dashboard/', AgentDashboardView.as_view(), name='agent_dashboard'),
]
