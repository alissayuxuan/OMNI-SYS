from api.models import OMNISysObject

class DatabaseConnector:
    def __init__(self, id_num: int):
        self.id_num = id_num

    def create_object(self, obj: OMNISysObject) -> OMNISysObject:
        return obj.__class__.objects.create(id=obj.id)

    def read_object(self, obj: OMNISysObject):
        return obj.objects.get(id=obj.id)

    def update_object(self, obj: OMNISysObject):
        object = obj.objects.get(id=obj.id)
        for f, v in obj.__dict__.items():
            setattr(object, f, v)
        object.save()

    def delete_object(self, obj: OMNISysObject):
        object = obj.objects.get(id=obj.id)
        object.delete()