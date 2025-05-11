#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from interfaces.msg import GenericMessage
import json
import logging
from datetime import datetime
import random
import hl7  # pip install hl7
from pydicom import dcmread, Dataset  # pip install pydicom
from io import BytesIO
from root_protocol import CommunicationNode, ObjectType

class MedicalDevice(CommunicationNode):
    def __init__(self, device_id: str, device_type: str = "patient_monitor"):
        super().__init__(f"med_{device_id}", ObjectType.MEDICAL_DEVICE)
        
        # Device configuration
        self.device_type = device_type
        self.patient_data = {
            "patient_id": "PT-"+device_id,
            "vitals": {
                "heart_rate": 72,
                "blood_pressure": "120/80",
                "spo2": 98
            },
            "active_alerts": []
        }
        
        # Protocol handlers
        self.hl7_parser = hl7.HL7Parser()
        self.dicom_dataset = self._init_dicom_template()
        
        # Setup timers
        self.create_timer(2.0, self._update_vitals)  # Simulate data changes
        self.create_timer(5.0, self._publish_hl7_update)  # HL7 ADT^A08 messages
        self.logger.info(f"{device_type.capitalize()} {device_id} initialized")

    def _init_dicom_template(self) -> Dataset:
        """Create a base DICOM dataset for this device"""
        ds = Dataset()
        ds.PatientName = "Last^First"
        ds.PatientID = self.patient_data["patient_id"]
        ds.Modality = "OT"  # Other
        ds.SamplesPerPixel = 3
        return ds

    def _update_vitals(self):
        """Simulate changing patient vitals"""
        self.patient_data["vitals"].update({
            "heart_rate": max(60, min(120, self.patient_data["vitals"]["heart_rate"] + random.randint(-5, 5))),
            "spo2": max(90, min(100, self.patient_data["vitals"]["spo2"] + random.randint(-2, 2)))
        })
        
        # Random alerts
        if random.random() < 0.1:
            alert = f"HR_{'HIGH' if self.patient_data['vitals']['heart_rate'] > 100 else 'LOW'}"
            self.patient_data["active_alerts"].append(alert)
            self._send_hl7_alert(alert)
        
        self.publish_status(self.patient_data)

    def _publish_hl7_update(self):
        """Send periodic HL7 patient data updates"""
        hl7_msg = self._create_hl7_message("ADT^A08")  # Update message
        self.send_message(
            target="ehr_system",
            data={
                "protocol": "HL7",
                "message": hl7_msg
            }
        )

    def _send_hl7_alert(self, alert_code: str):
        """Send HL7 alert message (ADT^A13)"""
        hl7_msg = self._create_hl7_message("ADT^A13", alert_code=alert_code)
        self.send_message(
            target="alert_system",
            data={
                "protocol": "HL7",
                "message": hl7_msg,
                "priority": "HIGH"
            }
        )

    def _create_hl7_message(self, message_type: str, alert_code: str = None) -> str:
        """Generate HL7-formatted message"""
        now = datetime.now().strftime("%Y%m%d%H%M%S")
        msg = [
            f"MSH|^~\&|{self.device_type}|{self.object_id}|EHR|HOSP|{now}||{message_type}|{random.randint(1000,9999)}|P|2.5",
            f"PID|||{self.patient_data['patient_id']}||Doe^John",
            f"PV1||I|ICU^BED-{random.randint(10,50)}"
        ]
        
        if alert_code:
            msg.append(f"AL1||{alert_code}|||{now}")
        
        # Add vitals (OBX segments)
        msg.extend([
            f"OBX||NM|HR||{self.patient_data['vitals']['heart_rate']}|bpm",
            f"OBX||NM|BP||{self.patient_data['vitals']['blood_pressure']}|mmHg",
            f"OBX||NM|SpO2||{self.patient_data['vitals']['spo2']}|%"
        ])
        
        return "\r".join(msg)  # HL7 uses \r as segment separator

    def handle_message(self, sender: str, data: dict):
        """Process incoming messages"""
        try:
            if data.get("protocol") == "HL7":
                self._handle_hl7_message(sender, data["message"])
            elif data.get("protocol") == "DICOM":
                self._handle_dicom_message(sender, data["data"])
            else:
                self.logger.warning(f"Unknown protocol from {sender}")
        except Exception as e:
            self.logger.error(f"Message handling failed: {str(e)}")

    def _handle_hl7_message(self, sender: str, raw_message: str):
        """Process HL7-formatted message"""
        try:
            msg = self.hl7_parser.parse(raw_message)
            msg_type = str(msg.segments("MSH")[0][8])
            
            if msg_type == "ORM^O01":  # Order message
                self.logger.info(f"New order from {sender}: {msg.segments('ORC')[0][1]}")
                self._process_medical_order(msg)
                
            elif msg_type == "ORU^R01":  # Result message
                self.logger.info(f"Results received from {sender}")
                self._update_from_results(msg)
                
        except hl7.HL7Exception as e:
            self.logger.error(f"HL7 parsing failed: {str(e)}")

    def _handle_dicom_message(self, sender: str, dicom_data: bytes):
        """Process DICOM payload"""
        try:
            ds = dcmread(BytesIO(dicom_data))
            self.logger.info(f"DICOM received from {sender} - Modality: {ds.Modality}")
            
            if ds.Modality == "US":  # Ultrasound
                self._process_ultrasound(ds)
            elif ds.Modality == "MR":  # MRI
                self._process_mri(ds)
                
        except Exception as e:
            self.logger.error(f"DICOM processing failed: {str(e)}")

    def send_dicom_image(self, target: str, image_path: str):
        """Send DICOM file to another node"""
        try:
            ds = dcmread(image_path)
            # Anonymize (simplified)
            ds.PatientName = f"ANON^{self.patient_data['patient_id']}"
            ds.PatientID = self.patient_data["patient_id"]
            
            # Send via ROS
            buffer = BytesIO()
            ds.save_as(buffer)
            self.send_message(
                target=target,
                data={
                    "protocol": "DICOM",
                    "data": buffer.getvalue()
                }
            )
        except Exception as e:
            self.logger.error(f"DICOM send failed: {str(e)}")

    # --- Medical-specific processing methods ---
    def _process_medical_order(self, hl7_msg):
        """Handle HL7 order messages"""
        order = hl7_msg.segments("ORC")[0][1]
        self.patient_data["active_orders"].append(str(order))
        self.log_event("order_received", {"order": str(order)})

    def _update_from_results(self, hl7_msg):
        """Process HL7 result messages"""
        for obx in hl7_msg.segments("OBX"):
            code = str(obx[3])
            value = str(obx[5])
            self.patient_data["results"][code] = value

    def _process_ultrasound(self, ds: Dataset):
        """Handle ultrasound DICOM"""
        self.logger.info(f"US image - {ds.Rows}x{ds.Columns} pixels")
        self.log_event("image_received", {
            "type": "ultrasound",
            "dimensions": f"{ds.Rows}x{ds.Columns}"
        })

    def _process_mri(self, ds: Dataset):
        """Handle MRI DICOM"""
        self.logger.info(f"MRI series {ds.SeriesNumber} - {ds.SequenceName}")
        self.log_event("image_received", {
            "type": "mri",
            "series": ds.SeriesNumber
        })