
from datetime import datetime


def validate_booking_times(start_time: datetime, end_time: datetime):
    if end_time <= start_time:
        raise ValueError("End time must be later than start time.")


def bookings_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> bool:
    """Return True if two time intervals overlap."""
    return start_a < end_b and start_b < end_a


def priority_value(booking_type: str) -> int:
    """Exams receive higher scheduling priority than ordinary events."""
    priorities = {
        "event": 1,
        "exam": 2,
    }

    if booking_type not in priorities:
        raise ValueError("booking_type must be 'event' or 'exam'.")

    return priorities[booking_type]
