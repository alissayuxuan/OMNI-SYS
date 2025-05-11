#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from interfaces.msg import GenericMessage
from rosbridge_library.capabilities.advertise import Advertise
from rosbridge_library.capabilities.publish import Publish
from rosbridge_library.protocol import Protocol
from rosbridge_server import RosbridgeWebSocket
import json
import logging
from threading import Thread
from enum import Enum

class ObjectType(Enum):
    ROBOT = "robot"
    MEDICAL_DEVICE = "medical_device"
    HUMAN_INTERFACE = "human_interface"

class CommunicationNode(Node):
    def __init__(self, node_name: str, object_type: ObjectType):
        super().__init__(node_name)
        
        # Object metadata
        self.object_type = object_type
        self.object_id = node_name  # Unique identifier
        
        # Initialize communication
        self._init_ros_communication()
        self._init_websocket_bridge()
        
        self.logger.info(f"{object_type.value.capitalize()} '{node_name}' online")

    def _init_ros_communication(self):
        """Universal pub/sub for all object types"""
        self.publisher = self.create_publisher(
            GenericMessage,
            '/object_comms/messages',
            10
        )
        
        self.subscription = self.create_subscription(
            GenericMessage,
            '/object_comms/messages',
            self._receive_message_callback,
            10
        )
        
        # Object-specific status topic
        self.status_publisher = self.create_publisher(
            GenericMessage,
            f'/{self.object_type.value}/status',
            10
        )

    def _init_websocket_bridge(self):
        """WebSocket bridge for website integration"""
        self.bridge_thread = Thread(target=self._run_bridge, daemon=True)
        self.bridge_thread.start()
        
        # Advertise status topic to WebSocket
        self.protocol = Protocol(self)
        Advertise(self.protocol).advertise(
            f'/{self.object_type.value}/status',
            'interfaces/msg/GenericMessage'
        )

    def _run_bridge(self):
        RosbridgeWebSocket(host='0.0.0.0', port=9090).start()
        self.logger.info("WebSocket bridge active")

    def send_message(self, target: str, data: dict):
        """Universal message sending"""
        msg = GenericMessage()
        msg.header.sender = self.object_id
        msg.header.receiver = target
        msg.data = json.dumps(data)
        self.publisher.publish(msg)
        self.logger.info(f"Sent to {target}: {data}")

    def publish_status(self, status: dict):
        """Publish status to ROS and WebSocket"""
        status['object_type'] = self.object_type.value
        status['object_id'] = self.object_id
        
        # ROS 2
        ros_msg = GenericMessage()
        ros_msg.data = json.dumps(status)
        self.status_publisher.publish(ros_msg)
        
        # WebSocket
        Publish(self.protocol).publish(
            f'/{self.object_type.value}/status',
            json.dumps({'data': status})
        )

    def _receive_message_callback(self, msg):
        """Universal message handler"""
        try:
            data = json.loads(msg.data)
            self.logger.info(
                f"Received from {msg.header.sender}: {data}"
            )
            # Custom logic per object type
            self.handle_message(msg.header.sender, data)
        except json.JSONDecodeError:
            self.logger.error("Malformed message")

    def handle_message(self, sender: str, data: dict):
        """Override this per object type"""
        pass

# --- Example Implementations ---
class MedicalDevice(CommunicationNode):
    def __init__(self, device_id: str):
        super().__init__(device_id, ObjectType.MEDICAL_DEVICE)
        self.timer = self.create_timer(5.0, self._update_status)
    
    def _update_status(self):
        self.publish_status({
            "heart_rate": 72,
            "status": "normal"
        })
    
    def handle_message(self, sender, data):
        if data.get("command") == "start_ecg":
            self.logger.info("Starting ECG procedure...")

class Robot(CommunicationNode):
    def __init__(self, robot_id: str):
        super().__init__(robot_id, ObjectType.ROBOT)
        self.timer = self.create_timer(1.0, self._update_status)
    
    def _update_status(self):
        self.publish_status({
            "battery": 89,
            "location": [1.2, 3.4]
        })

class HumanInterface(CommunicationNode):
    def __init__(self, user_id: str):
        super().__init__(user_id, ObjectType.HUMAN_INTERFACE)
        
    def handle_message(self, sender, data):
        if data.get("alert"):
            self.logger.warning(f"ALERT from {sender}: {data['alert']}")

# --- Main ---
def main(args=None):
    rclpy.init(args=args)
    
    # Example objects
    medical_device = MedicalDevice("ecg_001")
    robot = Robot("delivery_bot_42")
    human_ui = HumanInterface("nurse_station")
    
    executor = rclpy.executors.MultiThreadedExecutor()
    executor.add_node(medical_device)
    executor.add_node(robot)
    executor.add_node(human_ui)
    
    try:
        executor.spin()
    finally:
        executor.shutdown()

if __name__ == '__main__':
    main()