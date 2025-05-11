from object_management.schema import AssignableEntity, Context


class AbstractObjectFactory:
    def __init__(self, id_num: int, agent: bool):
        if (agent):
            # TODO: register node in ROS
            self.ros_id = -1
        self.id_num = id_num

        # TODO: save to DB
        pass

    def __del__(self, obj: AssignableEntity | Context):
        #TODO: remove from ROS
        #TODO: remove from DB
        pass