#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.executors import MultiThreadedExecutor
from omni_pkg.robot import SurgicalRobot
from omni_pkg.medical_device import MedicalDevice
from omni_pkg.human import HumanInterface
import threading
import time

class SystemSimulator(Node):
    def __init__(self):
        super().__init__('system_simulator')
        self.robot1 = SurgicalRobot("alpha")
        self.robot2 = SurgicalRobot("beta")  # Second robot
        self.device = MedicalDevice("ecg_01")
        self.human = HumanInterface("surgeon_console")

    def log_startup(self):
        self.get_logger().info("=== OMNI-SYS Simulation Started ===")
        self.get_logger().info("Nodes initialized:")
        for obj in [self.robot1, self.robot2, self.device, self.human]:
            self.get_logger().info(f"- {obj.object_id}")

    def run_simulation(self):
        """Runs all communication tests."""
        self.simulate_device_monitoring()
        self.simulate_robot_device_comms()
        self.simulate_emergency()
        self.simulate_protocols()
        self.simulate_robot_robot_communication()  # New

    def simulate_device_monitoring(self):
        self.get_logger().info("\n=== Starting Device Monitoring Test ===")
        self.human.send_message(
            target='medical_device_ecg_01',
            data={'command': 'start_monitoring'}
        )
        time.sleep(2)

    def simulate_robot_device_comms(self):
        self.get_logger().info("\n=== Starting Robot-Device Communication Test ===")
        self.robot1.send_message(
            target='medical_device_ecg_01',
            data={'command': 'get_reading'},
            require_ack=True
        )
        time.sleep(1)

    def simulate_emergency(self):
        self.get_logger().info("\n=== Starting Emergency Stop Test ===")
        self.human.send_message(
            target='surgical_robot_alpha',
            data={'command': 'emergency_stop'}
        )
        time.sleep(1)

    def simulate_protocols(self):
        self.get_logger().info("\n=== Starting Protocol Testing ===")
        self.device.send_hl7_message(
            target='hospital_system',
            message=self.device._generate_hl7_observation()
        )
        self.device.send_dicom_command(
            target='pacs_server',
            command='C-STORE'
        )
        time.sleep(1)

    def simulate_robot_robot_communication(self):
        self.get_logger().info("\n=== Starting Robot-to-Robot Communication Test ===")
        
        # Robot1 sends coordination command to Robot2
        self.robot1.send_message(
            target='surgical_robot_beta',
            data={'command': 'synchronize_position', 'position': [1.0, 2.0, 3.0]}
        )
        
        # Robot2 acknowledges or updates status (handled in its class)
        time.sleep(1)

def main(args=None):
    rclpy.init(args=args)
    simulator = SystemSimulator()

    executor = MultiThreadedExecutor()
    executor.add_node(simulator)
    executor.add_node(simulator.robot1)
    executor.add_node(simulator.robot2)
    executor.add_node(simulator.device)
    executor.add_node(simulator.human)

    simulator.log_startup()

    try:
        sim_thread = threading.Thread(target=simulator.run_simulation)
        sim_thread.start()
        executor.spin()
        sim_thread.join()
    except KeyboardInterrupt:
        pass
    finally:
        simulator.robot1.destroy_node()
        simulator.robot2.destroy_node()
        simulator.device.destroy_node()
        simulator.human.destroy_node()
        simulator.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
