#!/usr/bin/env python3
import rclpy
from rclpy.executors import MultiThreadedExecutor
from omni_pkg.robot import SurgicalRobot
from omni_pkg.medical_device import MedicalDevice
from omni_pkg.human import HumanInterface

def main(args=None):
    rclpy.init(args=args)
    
    try:
        # Initialize nodes
        robot = SurgicalRobot("alpha")
        medical_device = MedicalDevice("ecg_01")
        human_interface = HumanInterface("surgeon_console")

        # Use multi-threaded executor to handle multiple nodes
        executor = MultiThreadedExecutor(num_threads=4)
        executor.add_node(robot)
        executor.add_node(medical_device)
        executor.add_node(human_interface)

        # Simulate direct message from robot to device after short delay
        def simulate_robot_to_device():
            robot.get_logger().info("Simulating direct message to medical device...")
            robot.send_message(
                target='medical_device_ecg_01',
                data={'command': 'get_reading'},
                require_ack=True
            )
            robot.get_logger().info("Simulation message sent.")
            # Cancel timer to run only once
            simulation_timer.cancel()

        # Create one-time simulation timer
        simulation_timer = robot.create_timer(3.0, simulate_robot_to_device)

        # Log system readiness
        robot.get_logger().info("Surgical Robot ready")
        medical_device.get_logger().info("Medical Device operational")
        human_interface.get_logger().info("Human Interface connected")

        # Start spinning nodes
        executor.spin()

    except KeyboardInterrupt:
        pass
    finally:
        # Clean up
        robot.destroy_node()
        medical_device.destroy_node()
        human_interface.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()