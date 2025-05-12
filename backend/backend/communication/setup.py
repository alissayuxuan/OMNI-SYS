from setuptools import find_packages, setup

package_name = 'omni_pkg'

setup(
    name=package_name,
    version='0.1.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/omni_launch.py']),
    ],
    install_requires=[
        'setuptools',
        'rclpy',
        'rosbridge_suite',
        'python-socketio>=5.0.0'
    ],
    zip_safe=True,
    maintainer='your_name',
    maintainer_email='your_email@example.com',
    description='Omnidirectional communication system for ROS 2',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'omni_main = omni_pkg.main:main',
            'omni_robot = omni_pkg.robot:main',
            'omni_device = omni_pkg.medical_device:main',
            'omni_human = omni_pkg.human:main',
        ],
    },
)