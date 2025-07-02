from mqtt_backend.core.base_node_v1 import BaseNode
import logging

logger = logging.getLogger('omnisyslogger')

class CommNodeManager:
    live_nodes = {}

    @classmethod
    def create_node(cls, agent_id, username, password):
        if agent_id not in cls.live_nodes:
            node = BaseNode(str(agent_id), username, password)
            try:
                node.start()
                logger.info(f"Started BaseNode thread for {agent_id}")
            except Exception as e:
                logger.error(f"Failed to start BaseNode for {agent_id}: {str(e)}")
            cls.live_nodes[agent_id] = node
            logger.info(f"Created new node for agent {agent_id}")
            logger.debug(f"Live nodes after creation: {cls.live_nodes.keys()}")
            return node
        
        logger.info(f"Reusing existing node for agent {agent_id}")
        return cls.live_nodes[agent_id]

    @classmethod
    def shutdown_node(cls, agent_id):
        node = cls.live_nodes.pop(agent_id, None)
        if node:
            node.shutdown()
            logger.info(f"Node for agent {agent_id} shut down successfully")

    @classmethod
    def get_node(cls, agent_id):
        return cls.live_nodes.get(agent_id)

    @classmethod
    def rebuild_all(cls, agent_ids):
        for agent_id in agent_ids:
            cls.create_node(agent_id)
        logger.info("All nodes rebuilt successfully")

    @classmethod
    def shutdown_all(cls):
        for node in list(cls.live_nodes.values()):
            node.shutdown()
        cls.live_nodes.clear()
        logger.info("All nodes shut down successfully")
