from dataclasses import dataclass


@dataclass
class EventInstanceGroupCount:
    event_instance_id: int
    attendance_group_id: int
    count: int
