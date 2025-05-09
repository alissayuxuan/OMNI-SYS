#!/usr/bin/env python3
from typing import Dict
import random
from protocols.root_protocol import CommunicationNode

class MedicalDevice(CommunicationNode):
    def __init__(self, device_id):
        super().__init__(f'medical_device_{device_id}')
        self.device_id = device_id
        self.vital_signs = {
            'heart_rate': 72,
            'blood_pressure': '120/80',
            'oxygen_saturation': 98
        }
        self.logger.info(f"Medical Device {device_id} initialized")

    def receive_message(self, source: str, message_data: Dict):
        """Handle incoming messages specific to medical devices"""
        if message_data.get('command') == 'get_vitals':
            self._send_vitals(source)
        elif message_data.get('command') == 'set_alert':
            self._set_alert_threshold(message_data)
        else:
            self.logger.warning(f"Unhandled command from {source}: {message_data}")

    def handle_sync_request(self, source: str, request_data: Dict) -> Dict:
        """Handle synchronous requests"""
        if request_data.get('request') == 'emergency_check':
            return self._perform_emergency_check()
        return super().handle_sync_request(source, request_data)

    def _send_vitals(self, target: str):
        """Send current vital signs to requester"""
        self.send_message(target, {
            'type': 'vitals_update',
            'device_id': self.device_id,
            'data': self.vital_signs
        })
        self.log_event('vitals_sent', {'target': target})

    def _set_alert_threshold(self, data: Dict):
        """Update alert thresholds"""
        if 'thresholds' in data:
            self.logger.info(f"Updated alert thresholds: {data['thresholds']}")
            self.log_event('threshold_updated', data['thresholds'])

    def _perform_emergency_check(self) -> Dict:
        """Perform immediate diagnostic check"""
        self.vital_signs['heart_rate'] = random.randint(60, 120)
        self.vital_signs['blood_pressure'] = f"{random.randint(100,140)}/{random.randint(60,90)}"
        return {
            'status': 'completed',
            'vitals': self.vital_signs
        }

    def simulate_vital_change(self):
        """Simulate changing vital signs for testing"""
        self.vital_signs['heart_rate'] += random.randint(-5, 5)
        self.vital_signs['oxygen_saturation'] += random.randint(-2, 2)
        self.log_event('vitals_changed', self.vital_signs)