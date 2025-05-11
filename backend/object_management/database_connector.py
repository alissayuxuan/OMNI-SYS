from object_management.schema import OMNISysObject


class DatabaseConnector:
    def __init__(self, id_num: int):
        self.id_num = id_num

    def create_object(self, obj: OMNISysObject):
        pass

    def read_object(self, obj: OMNISysObject):
        pass

    def update_object(self, obj: OMNISysObject):
        pass

    def delete_object(self, obj: OMNISysObject):
        pass