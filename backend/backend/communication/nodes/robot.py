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
        self.battery_level = 100
        self.synchronized = False

        self.status_timer = self.create_timer(5.0, self._publish_robot_status)
        self.logger.info(f"Surgical Robot {robot_id} ready")

    def handle_message(self, sender: str, data: Dict):
        command = data.get('command')
        if command == 'move_to':
            self._handle_move_command(data)
        elif command == 'get_status':
            self._send_status_response(sender)
        elif command == 'emergency_stop':
            self._handle_emergency_stop()
        elif command == 'sync_request':
            self._handle_sync_request(sender, data)
        elif command == 'broadcast_task':
            self._handle_broadcast_task(data)
        else:
            self.logger.warning(f"Unhandled command from {sender}: {data}")

    def handle_acknowledgment(self, msg_id: str, sender: str):
        self.logger.info(f"Command {msg_id[:8]} processed by {sender}")

    def _handle_move_command(self, data: Dict):
        if 'position' in data:
            old_position = self.current_position.copy()
            self.current_position = data['position']
            self.operational_status = "MOVING"
            self.logger.info(f"Moving from {old_position} to {self.current_position}")
            self.publish_status({
                'event': 'movement_started',
                'from': old_position,
                'to': self.current_position
            })

    def _send_status_response(self, requester: str):
        self.send_message(requester, {
            'response': 'status_report',
            'robot_id': self.robot_id,
            'position': self.current_position,
            'status': self.operational_status,
            'battery': self.battery_level,
            'synchronized': self.synchronized,
            'errors': []
        })

    def _handle_emergency_stop(self):
        self.operational_status = "EMERGENCY_STOP"
        self.logger.error("EMERGENCY STOP ACTIVATED")
        self.publish_status({
            'event': 'emergency_stop',
            'position': self.current_position
        })

    def _handle_sync_request(self, sender: str, data: Dict):
        """Respond to a synchronization request from a central controller or another robot."""
        target_phase = data.get('phase')
        self.logger.info(f"Sync request received for phase: {target_phase}")
        self.synchronized = True
        self.send_message(sender, {
            'response': 'sync_ack',
            'robot_id': self.robot_id,
            'phase': target_phase,
            'status': 'ready'
        })

    def _handle_broadcast_task(self, data: Dict):
        """Execute a broadcast task if synchronized."""
        if self.synchronized:
            task = data.get('task')
            self.logger.info(f"Executing broadcasted task: {task}")
            self.publish_status({
                'event': 'task_started',
                'task': task,
                'status': self.operational_status
            })
        else:
            self.logger.warning("Cannot execute broadcast task: not synchronized")

    def _publish_robot_status(self):
        self.publish_status({
            'robot_id': self.robot_id,
            'position': self.current_position,
            'status': self.operational_status,
            'battery': self.battery_level,
            'synchronized': self.synchronized,
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
