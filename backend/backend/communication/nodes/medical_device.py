#!/usr/bin/env python3
from omni_pkg.root_protocol import CommunicationNode, ObjectType
from typing import Dict, Optional
import rclpy
import random
from datetime import datetime
import hl7
from pydicom import Dataset
from pydicom.uid import generate_uid
from interfaces.msg import GenericMessage

class MedicalDevice(CommunicationNode):
    def __init__(self, device_id: str):
        super().__init__(f'medical_device_{device_id}', ObjectType.MEDICAL_DEVICE)
        self.device_id = device_id
        self.device_status = "STANDBY"
        self.measurements = []
        self.patient_data = {
            'id': 'PATIENT123',
            'name': 'John Doe',
            'dob': '1980-01-01'
        }
        
        # Timers
        self.monitor_timer = self.create_timer(2.0, self._monitor_patient)
        self.status_timer = self.create_timer(5.0, self._publish_device_status)
        
        # Protocol handlers
        self.create_subscription(
            GenericMessage,
            f'/{self.object_id}/protocol',
            self._handle_protocol_message,
            10
        )
        
        self.logger.info(f"Medical Device {device_id} initialized with HL7/DICOM support")

    def handle_message(self, sender: str, data: Dict):
        """Handle incoming medical device commands."""
        if 'protocol' in data:  # Protocol-specific messages
            self._handle_protocol_message(data)
        else:  # Standard commands
            command = data.get('command')
            if command == 'start_monitoring':
                self._start_monitoring(data)
            elif command == 'stop_monitoring':
                self._stop_monitoring()
            elif command == 'get_reading':
                self._send_latest_reading(sender)
            else:
                self.logger.warning(f"Unhandled command from {sender}: {data}")

    def _handle_protocol_message(self, data: Dict):
        """Route protocol-specific messages"""
        protocol = data.get('protocol')
        if protocol == 'hl7':
            self._process_hl7_message(data['message'])
        elif protocol == 'dicom':
            self._process_dicom_command(data['command'])
        else:
            self.logger.warning(f"Unknown protocol: {protocol}")

    # HL7 Implementation
    def _generate_hl7_observation(self):
        """Create HL7 ORU^R01 message for observations"""
        hl7_message = f"MSH|^~\\&|{self.device_id}|ICU|||{datetime.now().strftime('%Y%m%d%H%M%S')}||ORU^R01|{random.randint(1000,9999)}|P|2.5\n"
        hl7_message += f"PID|||{self.patient_data['id']}||{self.patient_data['name']}||{self.patient_data['dob']}\n"
        
        if self.measurements:
            latest = self.measurements[-1]
            hl7_message += f"OBX|1|NM|HR||{latest['heart_rate']}|bpm|||||F\n"
            hl7_message += "OBX|2|ED|ECG||^ECG^BASE64|||F||||\n"
        
        return hl7.parse(hl7_message)

    def _process_hl7_message(self, message: str):
        """Process incoming HL7 messages"""
        try:
            hl7_msg = hl7.parse(message)
            msg_type = hl7_msg.segments('MSH')[0][9]
            
            if msg_type == 'ORM^O01':
                self._handle_hl7_order(hl7_msg)
            elif msg_type == 'ORU^R01':
                self.logger.info("Received HL7 observation")
            else:
                self.logger.warning(f"Unsupported HL7 message type: {msg_type}")
                
        except hl7.HL7Exception as e:
            self.logger.error(f"HL7 parsing error: {str(e)}")

    # DICOM Implementation
    def _generate_dicom_image(self):
        """Create sample DICOM dataset"""
        ds = Dataset()
        ds.PatientName = self.patient_data['name']
        ds.PatientID = self.patient_data['id']
        ds.StudyInstanceUID = generate_uid()
        ds.SeriesInstanceUID = generate_uid()
        ds.SOPInstanceUID = generate_uid()
        ds.SOPClassUID = '1.2.840.10008.5.1.4.1.1.7'  # Secondary Capture Image Storage
        
        # Simulate image data (in real use, this would be actual pixel data)
        ds.Rows = 256
        ds.Columns = 256
        ds.SamplesPerPixel = 1
        ds.BitsAllocated = 8
        ds.BitsStored = 8
        ds.HighBit = 7
        ds.PixelRepresentation = 0
        ds.PixelData = bytes([random.randint(0, 255) for _ in range(256*256)])
        
        return ds

    def _process_dicom_command(self, command: str):
        """Handle DICOM commands"""
        if command == 'C-STORE':
            self.logger.info("Received DICOM C-STORE request")
            # In a real implementation, this would store the received image
        elif command == 'C-FIND':
            self.logger.info("Processing DICOM C-FIND query")
        else:
            self.logger.warning(f"Unsupported DICOM command: {command}")

    def send_hl7_message(self, target: str, message: hl7.Message):
        """Send HL7 formatted message"""
        self.send_message(target, {
            'protocol': 'hl7',
            'message': str(message)
        })

    def send_dicom_command(self, target: str, command: str, dataset: Optional[Dataset] = None):
        """Send DICOM command"""
        payload = {
            'protocol': 'dicom',
            'command': command
        }
        if dataset:
            payload['dataset'] = dataset.to_json()
        self.send_message(target, payload)

    # Modified existing methods
    def _monitor_patient(self):
        if self.device_status == "MONITORING":
            reading = {
                'heart_rate': random.randint(60, 100),
                'ecg_waveform': [round(random.random(), 3) for _ in range(10)],
                'timestamp': datetime.now().isoformat()
            }
            self.measurements.append(reading)
            
            # Send HL7 observation
            if len(self.measurements) % 5 == 0:  # Send HL7 every 5 readings
                hl7_msg = self._generate_hl7_observation()
                self.send_hl7_message('central_server', hl7_msg)
            
            self.publish_status({
                'reading': reading,
                'device_status': self.device_status
            })

    def _send_latest_reading(self, requester: str):
        """Enhanced to support multiple formats"""
        if self.measurements:
            reading = self.measurements[-1]
            self.send_message(requester, {
                'response': 'latest_reading',
                'format': 'json',  # or 'hl7'/'dicom'
                'data': reading,
                'timestamp': str(self.get_clock().now().to_msg())
            })

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
