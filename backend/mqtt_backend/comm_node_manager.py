from mqtt_backend.core.base_node import BaseNode

class CommNodeManager:
    live_nodes = {}  # {agent_id: BaseNode}

    @classmethod
    def create_node(cls, agent_id):
        if agent_id not in cls.live_nodes:
            node = BaseNode(str(agent_id))
            node.start()
            cls.live_nodes[agent_id] = node
            return node
        return cls.live_nodes[agent_id]

    @classmethod
    def shutdown_node(cls, agent_id):
        node = cls.live_nodes.pop(agent_id, None)
        if node:
            node.shutdown()

    @classmethod
    def get_node(cls, agent_id):
        return cls.live_nodes.get(agent_id)

    @classmethod
    def rebuild_all(cls, agent_ids):
        # Rebuild nodes for all agent IDs
        for agent_id in agent_ids:
            cls.create_node(agent_id)

    @classmethod
    def shutdown_all(cls):
        for node in list(cls.live_nodes.values()):
            node.shutdown()
        cls.live_nodes.clear()
