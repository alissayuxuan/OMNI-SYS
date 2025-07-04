from django.apps import AppConfig          

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import os
        if os.environ.get("RUN_MAIN") == "true":
            from api.models import Agent
            from mqtt_backend.comm_node_manager import CommNodeManager
            agent_ids = list(Agent.objects.filter(is_archived=False).values_list('id', flat=True))
            CommNodeManager.rebuild_all(agent_ids)
            print("Rebuilt all comm nodes at backend startup")