from dataclasses import dataclass

@dataclass
class EventInstanceGroupCount:

    attendance_group_id: int
    event_instance_id: int
    count: int