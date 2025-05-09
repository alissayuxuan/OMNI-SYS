#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from typing import Any, Dict, Optional
from interfaces.msg import GenericMessage  # Custom message type
from interfaces.srv import SyncRequest      # Custom service type
import json
import logging

class CommunicationNode(Node):
    """
    Base class for all objects in the system providing root communication capabilities.
    """
    
    def __init__(self, node_name: str):
        super().__init__(node_name)
        
        # Configure logging
        self.logger = self.get_logger()
        self.logger.set_level(logging.INFO)
        
        # Communication parameters
        self.declare_parameter('qos_depth', 10)
        qos_depth = self.get_parameter('qos_depth').value
        
        # Initialize communication channels
        self._init_communication_interfaces(qos_depth)
        
        # Message counter for tracking
        self._message_counter = 0
        self._active_requests: Dict[int, Any] = {}
        
        self.logger.info(f"{node_name} communication node initialized")

    def _init_communication_interfaces(self, qos_depth: int):
        """Initialize all communication channels with configurable QoS"""
        # Async pub/sub (fire-and-forget)
        self.publisher = self.create_publisher(
            GenericMessage,
            'comms/messages',
            qos_profile=qos_depth
        )
        
        self.subscription = self.create_subscription(
            GenericMessage,
            'comms/messages',
            self._receive_message_callback,
            qos_depth,
            callback_group=ReentrantCallbackGroup()
        )
        
        # Sync request/response
        self.service = self.create_service(
            SyncRequest,
            'comms/sync_service',
            self._handle_sync_request,
            callback_group=ReentrantCallbackGroup()
        )
        
        # Event publisher
        self.event_publisher = self.create_publisher(
            GenericMessage,
            'comms/events',
            qos_depth
        )

    def send_message(self, target: str, message_data: Dict, is_sync: bool = False) -> Optional[Dict]:
        """
        Base method for sending messages to other objects
        :param target: Destination object/node name
        :param message_data: Dictionary of data to send
        :param is_sync: Whether to wait for response
        :return: Response dict if synchronous, None otherwise
        """
        self._message_counter += 1
        msg_id = self._message_counter
        
        if is_sync:
            return self._send_sync_message(target, message_data, msg_id)
        else:
            self._send_async_message(target, message_data, msg_id)
            return None

    def _send_async_message(self, target: str, data: Dict, msg_id: int):
        """Asynchronous message sending (fire-and-forget)"""
        message = GenericMessage()
        message.header.sender = self.get_name()
        message.header.receiver = target
        message.header.message_id = msg_id
        message.data = json.dumps(data)
        
        self.publisher.publish(message)
        self.logger.info(f"Sent async message to {target} (ID: {msg_id})")

    def _send_sync_message(self, target: str, data: Dict, msg_id: int) -> Dict:
        """Synchronous message sending (request-response)"""
        client = self.create_client(SyncRequest, f'{target}/comms/sync_service')
        
        if not client.wait_for_service(timeout_sec=1.0):
            self.logger.error(f"Service {target}/comms/sync_service not available")
            return {'error': 'service_unavailable'}
        
        request = SyncRequest.Request()
        request.header.sender = self.get_name()
        request.header.message_id = msg_id
        request.data = json.dumps(data)
        
        future = client.call_async(request)
        self._active_requests[msg_id] = future
        
        # Wait for response (with timeout)
        rclpy.spin_until_future_complete(self, future, timeout_sec=5.0)
        
        if future.done():
            response = future.result()
            return json.loads(response.data)
        else:
            self.logger.warning(f"Timeout waiting for response from {target}")
            return {'error': 'timeout'}

    def _receive_message_callback(self, msg):
        """Base handler for incoming messages"""
        try:
            data = json.loads(msg.data)
            self.logger.info(f"Received message from {msg.header.sender} (ID: {msg.header.message_id})")
            
            # Child classes should override this
            self.receive_message(msg.header.sender, data)
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse message: {str(e)}")

    def receive_message(self, source: str, message_data: Dict):
        """
        To be overridden by child classes for custom message handling
        :param source: Sender object/node name
        :param message_data: Parsed message data
        """
        self.logger.warning(f"Base receive_message called (unhandled message from {source})")

    def _handle_sync_request(self, request, response):
        """Base handler for synchronous requests"""
        try:
            data = json.loads(request.data)
            self.logger.info(f"Received sync request from {request.header.sender}")
            
            # Child classes should override this
            result = self.handle_sync_request(request.header.sender, data)
            
            response.data = json.dumps(result)
            return response
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse sync request: {str(e)}")
            response.data = json.dumps({'error': 'invalid_format'})
            return response

    def handle_sync_request(self, source: str, request_data: Dict) -> Dict:
        """
        To be overridden by child classes for custom sync request handling
        :param source: Sender object/node name
        :param request_data: Parsed request data
        :return: Response data as dict
        """
        self.logger.warning(f"Base handle_sync_request called (unhandled request from {source})")
        return {'error': 'unhandled_request'}

    def log_event(self, event_type: str, event_data: Dict):
        """Log structured events to the event bus"""
        event_msg = GenericMessage()
        event_msg.header.sender = self.get_name()
        event_msg.header.message_id = self._message_counter
        event_msg.data = json.dumps({
            'type': event_type,
            'data': event_data,
            'timestamp': self.get_clock().now().to_msg()
        })
        self.event_publisher.publish(event_msg)

def main(args=None):
    rclpy.init(args=args)
    
    # Use multi-threaded executor for handling sync/async together
    executor = MultiThreadedExecutor()
    comm_node = CommunicationNode('base_communication_node')
    executor.add_node(comm_node)
    
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        comm_node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()