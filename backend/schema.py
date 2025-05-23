from abc import ABC
from datetime import datetime
from typing import Set



class Context:
    def __init__(self, id_num: int, date: datetime):
        self.id_num = id_num
        self.date = date


class AssignableEntity(ABC):
    def __init__(self, id_num: int, assigned_context: Set[Context]):
        self.id = id_num
        self.assigned_context = assigned_context

    def check_availability(self, date: datetime) -> bool:
        for context in self.assigned_context:
            if context.date == date:
                return False
        return True


class Agents(AssignableEntity):
    def __init__(self, id_num: int, assigned_context: Set[Context], admin_level: int):
        super().__init__(id_num, assigned_context)
        self.admin_level = admin_level

class Space(AssignableEntity):
    def __init__(self, id_num: int, assigned_context: Set[Context], capacity: int):
        super().__init__(id_num, assigned_context)
        self.capacity = capacity
