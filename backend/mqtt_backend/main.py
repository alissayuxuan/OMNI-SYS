import time
from objects.medical_device import MedicalDevice
from objects.robot import Robot
from objects.human_interface import HumanInterface
from utils.hl7_generator import generate_hl7
from utils.dicom_generator import create_dicom, dicom_bytes_to_base64

if __name__ == "__main__":
    med_device = MedicalDevice("device_X")
    robot = Robot("robot_1")
    human = HumanInterface("nurse_station")

    med_device.start()
    robot.start()
    human.start()

    time.sleep(1)

    # Prepare HL7 message fields
    import time
    msh_kwargs = {
        "msh_3": "SendingApp",
        "msh_4": "SendingFac",
        "msh_5": "ReceivingApp",
        "msh_6": "ReceivingFac",
        "msh_7": time.strftime('%Y%m%d%H%M%S'),
        "msh_9": "ADT^A01",
    }
    segments = {
        "PID": {
            "pid_3": "123456",
            "pid_5": "DOE^JOHN",
            "pid_7": "19600101",
            "pid_8": "M"
        }
    }
    hl7_msg = generate_hl7(
        msg_type="ADT_A01",
        msh_kwargs=msh_kwargs,
        segments=segments
    )
    med_device.send_message("robot_1", "HL7", "admit", hl7_msg)

    # DICOM example
    fields = {'PatientName': 'DOE^JOHN', 'PatientID': '123456', 'Modality': 'CT'}
    dicom_bytes = create_dicom(fields)
    dicom_b64 = dicom_bytes_to_base64(dicom_bytes)
    med_device.send_message("nurse_station", "DICOM", "image", dicom_b64)

    # Robot sends status to nurse_station
    robot.send_message("nurse_station", "CUSTOM", "status", "Surgery prep complete.")

    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        print("Exiting...")

# def main():
#     device = MedicalDevice("device_01", MQTTManager(client_id="device_01"))
#     robot = Robot("robot_alpha", MQTTManager(client_id="robot_alpha"))
#     nurse = HumanInterface("nurse_station_1", MQTTManager(client_id="nurse_station_1"))

#     # Simulate sending a command to the robot
#     device.send_message("robot_alpha", {"command": "move_to", "position": [1, 2, 3]})
#     time.sleep(1)

#     # Simulate robot status update to human interface
#     robot.send_message("nurse_station_1", {"status": "procedure_started"})
#     time.sleep(1)

#     while True:
#         time.sleep(5)  # Keep script running to receive messages

# if __name__ == "__main__":
#     main()
