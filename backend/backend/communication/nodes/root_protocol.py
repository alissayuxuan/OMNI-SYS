#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from interfaces.msg import GenericMessage
import json
import uuid
from enum import Enum


class ObjectType(Enum):
    ROBOT = "robot"
    MEDICAL_DEVICE = "medical_device"
    HUMAN = "human"

class CommunicationNode(Node):
    def __init__(self, node_name: str, object_type: ObjectType):
        super().__init__(node_name)
        self.object_type = object_type
        self.object_id = node_name
        self.logger = self.get_logger()

        # Communication setup
        self._init_ros_communication()
        self.pending_acks = {}
        self.sequence_number = 0
        self.logger.info(f"{object_type.value.capitalize()} '{node_name}' initialized")

    def _init_ros_communication(self):
        """Initialize dedicated inbox/outbox topics"""
        # Outbox (messages this node sends to others)
        self.outbox_pub = self.create_publisher(
            GenericMessage,
            f'/{self.object_id}/outbox',
            10
        )
        
        # Inbox (messages sent to this node)
        self.inbox_sub = self.create_subscription(
            GenericMessage,
            f'/{self.object_id}/inbox',
            self._receive_message_callback,
            10
        )
        
        # Acknowledgments (unchanged)
        self.ack_publisher = self.create_publisher(
            GenericMessage, 
            '/object_comms/acknowledgments', 
            10
        )
        self.ack_subscription = self.create_subscription(
            GenericMessage,
            '/object_comms/acknowledgments',
            self._ack_callback,
            10
        )
        
        # Status broadcasts (unchanged)
        self.status_publisher = self.create_publisher(
            GenericMessage,
            f'/{self.object_type.value}/status',
            10
        )

    def send_message(self, target: str, data: dict, require_ack=True):
        """Send message directly to target's inbox with full ACK support"""
        msg_id = str(uuid.uuid4())
        data.update({
            '_msg_id': msg_id,
            '_sender': self.object_id,
            '_sequence': self.sequence_number
        })
        self.sequence_number += 1

        msg = GenericMessage()
        msg.sender = self.object_id
        msg.receiver = target
        msg.data = json.dumps(data)
        
        # Create temporary publisher to target's inbox
        target_pub = self.create_publisher(
            GenericMessage,
            f'/{target}/inbox',
            10
        )
        target_pub.publish(msg)
        
        # Immediately destroy publisher to avoid resource buildup
        self.destroy_publisher(target_pub)

        if require_ack:
            self.pending_acks[msg_id] = {
                'target': target,
                'data': data,
                'timestamp': self.get_clock().now().to_msg(),
                'retries': 3
            }
            self.create_timer(2.0, lambda: self._check_ack(msg_id))

        self.logger.info(f"Sent directly to {target}'s inbox (ID:{msg_id[:8]}): {data}")
        return msg_id

    def _receive_message_callback(self, msg):
        try:
            data = json.loads(msg.data)
            self.logger.info(f"Received from {msg.sender}: {data}")

            if '_msg_id' in data:
                self._send_acknowledgment(data['_msg_id'], msg.sender)

            self.handle_message(msg.sender, data)

        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Message processing error: {str(e)}")

    def _send_acknowledgment(self, msg_id: str, receiver: str):
        ack = {
            '_ack_for': msg_id,
            '_receiver': self.object_id,
            '_timestamp': str(self.get_clock().now().to_msg())
        }

        ack_msg = GenericMessage()
        ack_msg.sender = self.object_id
        ack_msg.receiver = receiver
        ack_msg.data = json.dumps(ack)
        self.ack_publisher.publish(ack_msg)

    def _ack_callback(self, msg):
        try:
            ack = json.loads(msg.data)
            msg_id = ack['_ack_for']

            if msg_id in self.pending_acks:
                self.logger.info(f"ACK received for message {msg_id[:8]} from {msg.sender}")
                del self.pending_acks[msg_id]
                self.handle_acknowledgment(msg_id, msg.sender)

        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"ACK processing error: {str(e)}")

    def _check_ack(self, msg_id: str):
        if msg_id in self.pending_acks:
            entry = self.pending_acks[msg_id]
            entry['retries'] -= 1

            if entry['retries'] > 0:
                self.logger.warning(f"Retrying message {msg_id[:8]} to {entry['target']}")
                self.send_message(entry['target'], entry['data'])
            else:
                self.logger.error(f"ACK timeout for message {msg_id[:8]}")
                del self.pending_acks[msg_id]
                self.handle_ack_timeout(msg_id, entry['target'])

    def publish_status(self, status: dict):
        """Publish status update"""
        status.update({
            'object_type': self.object_type.value,
            'object_id': self.object_id,
            'timestamp': str(self.get_clock().now().to_msg())
        })

        ros_msg = GenericMessage()
        ros_msg.data = json.dumps(status)
        self.status_publisher.publish(ros_msg)

    def handle_message(self, sender: str, data: dict):
        pass

    def handle_acknowledgment(self, msg_id: str, sender: str):
        pass

    def handle_ack_timeout(self, msg_id: str, target: str):
        self.logger.error(f"Message {msg_id[:8]} to {target} failed after retries")
