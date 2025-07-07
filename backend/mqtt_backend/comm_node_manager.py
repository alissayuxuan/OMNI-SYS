from mqtt_backend.core.base_node import BaseNode
import logging

logger = logging.getLogger('omnisyslogger')

class CommNodeManager:
    """
    Manager for communication nodes. This class handles the creation, retrieval, and shutdown of BaseNode instances.
    It maintains a dictionary of live nodes indexed by agent_id. Each node is responsible for handling MQTT communication for a specific agent.
    It allows for creating new nodes, reusing existing ones, and shutting them down gracefully.
    It also provides methods to rebuild all nodes for a list of agent IDs and to shut down all nodes.
    The nodes are created with only the agent_id, as the broker and port are predefined.
    The class uses a class-level dictionary to keep track of live nodes, ensuring that only one
    instance of BaseNode exists for each agent_id.
    """
    live_nodes = {}

    @classmethod
    def create_node(cls, agent_id):
        """Create a new communication node for the specified agent ID or reuse an existing one."""
        if agent_id not in cls.live_nodes:
            node = BaseNode(str(agent_id))  # Only agent_id needed
            try:
                node.start()
                logger.info(f"Started BaseNode thread for {agent_id}")
                node.retry_buffered_messages_all()
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
        """Shutdown the communication node for the specified agent ID."""
        node = cls.live_nodes.pop(agent_id, None)
        if node:
            node.shutdown()
            logger.info(f"Node for agent {agent_id} shut down successfully")

    @classmethod
    def get_node(cls, agent_id):
        """Retrieve the communication node for the specified agent ID."""
        return cls.live_nodes.get(agent_id)

    @classmethod
    def rebuild_all(cls, agent_ids):
        """Rebuild all nodes for the specified list of agent IDs."""
        for agent_id in agent_ids:
            cls.create_node(agent_id)
        logger.info("All nodes rebuilt successfully")

    @classmethod
    def shutdown_all(cls):
        """Shutdown all communication nodes."""
        for node in list(cls.live_nodes.values()):
            node.shutdown()
        cls.live_nodes.clear()
        logger.info("All nodes shut down successfully")
