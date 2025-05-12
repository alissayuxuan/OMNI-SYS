#!/usr/bin/env python3
from omni_pkg.root_protocol import CommunicationNode, ObjectType
from typing import Dict
import rclpy
import random

class MedicalDevice(CommunicationNode):
    def __init__(self, device_id: str):
        super().__init__(f'medical_device_{device_id}', ObjectType.MEDICAL_DEVICE)
        self.device_id = device_id
        self.device_status = "STANDBY"
        self.measurements = []
        
        self.monitor_timer = self.create_timer(2.0, self._monitor_patient)
        self.status_timer = self.create_timer(5.0, self._publish_device_status)
        self.logger.info(f"Medical Device {device_id} operational")

    def handle_message(self, sender: str, data: Dict):
        """Handle incoming medical device commands."""
        command = data.get('command')
        if command == 'start_monitoring':
            self._start_monitoring(data)
        elif command == 'stop_monitoring':
            self._stop_monitoring()
        elif command == 'get_reading':
            self._send_latest_reading(sender)
        else:
            self.logger.warning(f"Unhandled command from {sender}: {data}")

    def handle_acknowledgment(self, msg_id: str, sender: str):
        """Handle successful message delivery acknowledgment."""
        self.logger.info(f"Command {msg_id[:8]} acknowledged by {sender}")

    def _start_monitoring(self, config: Dict):
        self.device_status = "MONITORING"
        self.logger.info(f"Monitoring started with config: {config}")
        self.publish_status({
            'event': 'monitoring_started',
            'config': config
        })

    def _stop_monitoring(self):
        self.device_status = "STANDBY"
        self.logger.info("Monitoring stopped")
        self.publish_status({
            'event': 'monitoring_stopped'
        })

    def _send_latest_reading(self, requester: str):
        reading = self.measurements[-1] if self.measurements else None
        self.send_message(requester, {
            'response': 'latest_reading',
            'reading': reading,
            'timestamp': str(self.get_clock().now().to_msg())
        })

    def _monitor_patient(self):
        if self.device_status == "MONITORING":
            reading = {
                'heart_rate': random.randint(60, 100),
                'ecg_waveform': [round(random.random(), 3) for _ in range(10)]
            }
            self.measurements.append(reading)
            self.publish_status({
                'reading': reading,
                'device_status': self.device_status
            })

    def _publish_device_status(self):
        self.publish_status({
            'status': self.device_status,
            'measurement_count': len(self.measurements),
            'uptime': self.get_clock().now().seconds_nanoseconds()[0]
        })

def main(args=None):
    rclpy.init(args=args)
    device = MedicalDevice("ecg_01")

    try:
        rclpy.spin(device)
    except KeyboardInterrupt:
        pass
    finally:
        device.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
