#!/usr/bin/env python3
import json
from omni_pkg.root_protocol import CommunicationNode, ObjectType
from typing import Dict
import rclpy
from std_msgs.msg import String

class HumanInterface(CommunicationNode):
    def __init__(self, interface_id: str):
        super().__init__(f'human_interface_{interface_id}', ObjectType.HUMAN)
        self.interface_id = interface_id
        self.alert_status = "NORMAL"
        
        # UI control subscription (unchanged)
        self.control_sub = self.create_subscription(
            String,
            '/human_interface/control',
            self._control_callback,
            10
        )
        self.logger.info(f"Human Interface {interface_id} initialized")

    def handle_message(self, sender: str, data: Dict):
        """Handle messages from the network"""
        if data.get('type') == 'alert':
            self._handle_alert(sender, data)
        elif data.get('type') == 'status_update':
            self._handle_status_update(data)
        else:
            self.logger.info(f"Received message from {sender}: {data}")

    def _control_callback(self, msg: String):
        """Handle UI control commands (e.g., acknowledge alert)"""
        try:
            command = json.loads(msg.data)
            self.logger.info(f"Control command received: {command}")

            if command.get('action') == 'acknowledge_alert':
                self.alert_status = "NORMAL"
                self.publish_status({'alert_status': self.alert_status})

        except json.JSONDecodeError:
            self.logger.error("Malformed control command")

    def _handle_alert(self, sender: str, alert_data: Dict):
        """React to alert messages"""
        self.alert_status = "ALERT"
        self.logger.warning(f"ALERT from {sender}: {alert_data.get('message')}")

        self.publish_status({
            'event': 'alert_received',
            'alert_status': self.alert_status,
            'source': sender,
            'message': alert_data.get('message'),
            'timestamp': str(self.get_clock().now().to_msg())
        })

    def _handle_status_update(self, update_data: Dict):
        """Process system status updates"""
        self.logger.info(f"Status update received: {update_data.get('status')}")

        self.publish_status({
            'event': 'status_forwarded',
            'update': update_data,
            'timestamp': str(self.get_clock().now().to_msg())
        })

def main(args=None):
    rclpy.init(args=args)
    node = HumanInterface("nurse_station_1")
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
