from django.contrib import admin

# Register your models here.
from .models import CustomUser, AdminProfile, AgentProfile

admin.site.register(CustomUser)
admin.site.register(AdminProfile)
admin.site.register(AgentProfile)