#!/usr/bin/env python3
from omni_pkg.root_protocol import CommunicationNode, ObjectType
from typing import Dict
import rclpy

class SurgicalRobot(CommunicationNode):
    def __init__(self, robot_id: str):
        super().__init__(f'surgical_robot_{robot_id}', ObjectType.ROBOT)
        self.robot_id = robot_id
        self.current_position = [0.0, 0.0, 0.0]
        self.operational_status = "INITIALIZING"
        
        # Status timer (unchanged)
        self.status_timer = self.create_timer(5.0, self._publish_robot_status)
        self.logger.info(f"Surgical Robot {robot_id} ready")

    def handle_message(self, sender: str, data: Dict):
        """Handle incoming robot commands"""
        if data.get('command') == 'move_to':
            self._handle_move_command(data)
        elif data.get('command') == 'get_status':
            self._send_status_response(sender)
        elif data.get('command') == 'emergency_stop':
            self._handle_emergency_stop()
        else:
            self.logger.warning(f"Unhandled command from {sender}: {data}")

    def handle_acknowledgment(self, msg_id: str, sender: str):
        """Handle successful message delivery"""
        self.logger.info(f"Command {msg_id[:8]} processed by {sender}")

    def _handle_move_command(self, data: Dict):
        """Process movement command"""
        if 'position' in data:
            old_position = self.current_position.copy()
            self.current_position = data['position']
            self.operational_status = "MOVING"
            
            self.logger.info(
                f"Moving from {old_position} to {self.current_position}"
            )
            
            self.publish_status({
                'event': 'movement_started',
                'from': old_position,
                'to': self.current_position
            })

    def _send_status_response(self, requester: str):
        """Send detailed status to requester"""
        self.send_message(requester, {
            'response': 'status_report',
            'position': self.current_position,
            'status': self.operational_status,
            'battery': 85,  # Example value
            'errors': []
        })

    def _handle_emergency_stop(self):
        """Execute emergency stop procedure"""
        self.operational_status = "EMERGENCY_STOP"
        self.logger.error("EMERGENCY STOP ACTIVATED")
        
        self.publish_status({
            'event': 'emergency_stop',
            'position': self.current_position
        })

    def _publish_robot_status(self):
        """Periodic status update"""
        self.publish_status({
            'position': self.current_position,
            'status': self.operational_status,
            'uptime': self.get_clock().now().seconds_nanoseconds()[0]
        })

def main(args=None):
    rclpy.init(args=args)
    robot = SurgicalRobot("alpha")
    
    try:
        rclpy.spin(robot)
    except KeyboardInterrupt:
        pass
    finally:
        robot.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()