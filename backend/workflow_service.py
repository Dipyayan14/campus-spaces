
from datetime import datetime, timedelta


REMINDER_AFTER_WORKING_DAYS = 1
ESCALATE_AFTER_WORKING_DAYS = 3
UPCOMING_EVENT_DAYS = 7


def add_working_days(start: datetime, days: int) -> datetime:
    """Add weekdays, excluding Saturday and Sunday."""
    current = start
    added = 0

    while added < days:
        current += timedelta(days=1)

        if current.weekday() < 5:
            added += 1

    return current


def get_workflow_state(
    submitted_at: str,
    start_time: str,
    now: datetime | None = None,
) -> dict:
    """Calculate booking reminder, escalation, and upcoming-event flags."""
    now = now or datetime.now()

    submitted = datetime.fromisoformat(submitted_at)
    event_start = datetime.fromisoformat(start_time)

    reminder_due_at = add_working_days(
        submitted, REMINDER_AFTER_WORKING_DAYS
    )
    escalation_due_at = add_working_days(
        submitted, ESCALATE_AFTER_WORKING_DAYS
    )

    # Compare timestamps consistently when timezone information is present.
    if (now.tzinfo is None) != (submitted.tzinfo is None):
        raise ValueError("Current time and submission time must use the same timezone format.")

    days_until_event = (event_start.date() - now.date()).days

    return {
        "reminder_due": now >= reminder_due_at,
        "escalation_due": now >= escalation_due_at,
        "upcoming_event": 0 <= days_until_event <= UPCOMING_EVENT_DAYS,
        "reminder_due_at": reminder_due_at.isoformat(),
        "escalation_due_at": escalation_due_at.isoformat(),
        "days_until_event": days_until_event,
    }
