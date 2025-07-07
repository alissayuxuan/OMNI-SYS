from django.contrib import admin

# Register your models here.
from .models import Agent, Space, Context, Relationship

admin.site.register(Agent)
admin.site.register(Space)
admin.site.register(Context)
admin.site.register(Relationship)

