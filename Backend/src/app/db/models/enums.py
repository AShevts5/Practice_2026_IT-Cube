import enum

class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    FINISHED = "finished"

class RegistrationStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    FULL = "full"
