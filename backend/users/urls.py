from django.urls import path
from .views import  ( RegisterUserView, CustomTokenRefreshView, CustomTokenObtainPairView, 
UserList, UserDetail, AgentProfileList, AgentProfileDetail, AdminProfileList, AdminProfileDetail,
UserProfileView, ChangePasswordView )

urlpatterns = [
    path('user/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('user/register/', RegisterUserView.as_view(), name='register_user'),
    path('users/', UserList.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserDetail.as_view(), name='user-detail'),
    path('agent-profiles/', AgentProfileList.as_view(), name='agent-profile-list'),
    path('agent-profiles/<int:pk>/', AgentProfileDetail.as_view(), name='agent-profile-detail'),
    path('admin-profiles/', AdminProfileList.as_view(), name='admin-profile-list'),
    path('admin-profiles/<int:pk>/', AdminProfileDetail.as_view(), name='admin-profile-detail'),
    #path('profile/', GetUserProfileView.as_view(), name='get-user-profile'),
    path('profile/', UserProfileView.as_view(), name='get-or-update-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
