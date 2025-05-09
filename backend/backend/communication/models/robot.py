from protocols.root_protocol import CommunicationNode
from typing import Dict

class SurgicalRobot(CommunicationNode):

    def __init__(self, robot_id):
        super().__init__(f'surgical_robot_{robot_id}')
        self.robot_id = robot_id
        self.current_position = [0.0, 0.0, 0.0]
        self.logger.info(f"Surgical Robot {robot_id} initialized")
        
        # Setup periodic status update
        self.timer = self.create_timer(5.0, self._publish_status)

    def receive_message(self, source: str, message_data: Dict):
        """Handle incoming robot commands"""
        if message_data.get('command') == 'move_to':
            self._handle_move_command(message_data)
        elif message_data.get('command') == 'get_status':
            self._send_status(source)
        elif message_data.get('command') == 'emergency_stop':
            self._handle_emergency_stop()
        else:
            self.logger.warning(f"Unhandled command from {source}: {message_data}")

    def handle_sync_request(self, source: str, request_data: Dict) -> Dict:
        """Handle synchronous robot requests"""
        if request_data.get('request') == 'calibrate':
            return self._perform_calibration()
        elif request_data.get('request') == 'precise_position':
            return {'position': self.current_position}
        return super().handle_sync_request(source, request_data)

    def _handle_move_command(self, data: Dict):
        """Process movement command"""
        if 'position' in data:
            self.current_position = data['position']
            self.logger.info(f"Moving to position: {self.current_position}")
            self.log_event('movement', {
                'from': self.current_position,
                'to': data['position']
            })

    def _send_status(self, target: str):
        """Send current robot status"""
        self.send_message(target, {
            'type': 'robot_status',
            'robot_id': self.robot_id,
            'position': self.current_position,
            'state': 'operational'
        })

    def _handle_emergency_stop(self):
        """Execute emergency stop procedure"""
        self.logger.warning("EMERGENCY STOP ACTIVATED")
        self.log_event('emergency', {'action': 'full_stop'})

    def _perform_calibration(self) -> Dict:
        """Execute calibration routine"""
        self.logger.info("Performing calibration...")
        self.current_position = [0.0, 0.0, 0.0]
        return {'status': 'calibrated', 'position': self.current_position}

    def _publish_status(self):
        """Periodic status update"""
        self.send_message('status_monitor', {
            'type': 'periodic_status',
            'robot_id': self.robot_id,
            'position': self.current_position
        })