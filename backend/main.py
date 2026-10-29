
from contextlib import asynccontextmanager
from datetime import datetime
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import initialize_database, list_rooms, get_connection
from workflow_service import get_workflow_state


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()

    # Safe, additive migration. Existing booking records are preserved.
    with get_connection() as connection:
        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(bookings)"
            ).fetchall()
        }

        if "requested_by" not in columns:
            connection.execute(
                "ALTER TABLE bookings ADD COLUMN requested_by TEXT"
            )

    yield


app = FastAPI(
    title="SpaceSync AI API",
    description="Campus room booking and availability backend",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ALLOWED_BOOKING_TYPES = {"event", "exam", "class", "lab"}


class BookingRequest(BaseModel):
    room_id: int
    title: str = Field(min_length=1, max_length=150)
    start_time: datetime
    end_time: datetime
    booking_type: str = "event"
    requested_by: str = Field(default="Campus Member", max_length=150)


class BookingStatusUpdate(BaseModel):
    status: str


def parse_booking_time(value: str) -> datetime:
    return datetime.fromisoformat(value)


def check_time_range(start_time: datetime, end_time: datetime):
    if start_time.tzinfo != end_time.tzinfo:
        raise HTTPException(
            status_code=400,
            detail="Start and end times must use the same timezone format.",
        )

    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time.",
        )


def find_conflict(
    connection,
    room_id,
    start_time,
    end_time,
    exclude_id=None,
):
    query = """
        SELECT id, title, start_time, end_time, status, booking_type
        FROM bookings
        WHERE room_id = ?
          AND status IN ('pending', 'approved')
          AND start_time < ?
          AND end_time > ?
    """
    params = [
        room_id,
        end_time.isoformat(),
        start_time.isoformat(),
    ]

    if exclude_id is not None:
        query += " AND id != ?"
        params.append(exclude_id)

    return connection.execute(query, params).fetchone()


def booking_to_dict(row):
    result = {
        "id": row["id"],
        "room_id": row["room_id"],
        "title": row["title"],
        "start_time": row["start_time"],
        "end_time": row["end_time"],
        "booking_type": row["booking_type"],
        "status": row["status"],
        "requested_by": (
            row["requested_by"]
            if "requested_by" in row.keys() and row["requested_by"]
            else "Campus Member"
        ),
    }

    if "submitted_at" in row.keys() and row["submitted_at"]:
        result["workflow"] = get_workflow_state(
            submitted_at=row["submitted_at"],
            start_time=row["start_time"],
        )

    return result


@app.get("/")
def home():
    return {
        "message": "Welcome to SpaceSync AI",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/rooms")
def get_rooms():
    return list_rooms()


@app.get("/bookings")
def get_bookings():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, room_id, title, start_time, end_time,
                   booking_type, status, submitted_at, requested_by
            FROM bookings
            ORDER BY start_time
            """
        ).fetchall()

    return [booking_to_dict(row) for row in rows]


@app.post("/bookings", status_code=201)
def create_booking(booking: BookingRequest):
    booking_type = booking.booking_type.strip().lower()

    if booking_type not in ALLOWED_BOOKING_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Booking type must be event, exam, class, or lab.",
        )

    title = booking.title.strip()
    if not title:
        raise HTTPException(
            status_code=400,
            detail="Event title cannot be empty.",
        )

    check_time_range(booking.start_time, booking.end_time)

    try:
        with get_connection() as connection:
            connection.execute("BEGIN IMMEDIATE")

            room = connection.execute(
                "SELECT id FROM rooms WHERE id = ?",
                (booking.room_id,),
            ).fetchone()

            if room is None:
                raise HTTPException(
                    status_code=404,
                    detail="Room not found.",
                )

            conflict = find_conflict(
                connection,
                booking.room_id,
                booking.start_time,
                booking.end_time,
            )

            if conflict:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This room already has a pending or approved "
                        "booking during the selected time. Choose another "
                        "room or a different time."
                    ),
                )

            cursor = connection.execute(
                """
                INSERT INTO bookings
                    (room_id, title, start_time, end_time,
                     booking_type, status, requested_by)
                VALUES (?, ?, ?, ?, ?, 'pending', ?)
                """,
                (
                    booking.room_id,
                    title,
                    booking.start_time.isoformat(),
                    booking.end_time.isoformat(),
                    booking_type,
                    booking.requested_by.strip() or "Campus Member",
                ),
            )

            row = connection.execute(
                """
                SELECT id, room_id, title, start_time, end_time,
                       booking_type, status, submitted_at, requested_by
                FROM bookings
                WHERE id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()

            return booking_to_dict(row)

    except sqlite3.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Database error while creating booking.",
        ) from error


@app.patch("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    update: BookingStatusUpdate,
):
    status = update.status.strip().lower()

    if status not in ("approved", "rejected"):
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected.",
        )

    try:
        with get_connection() as connection:
            connection.execute("BEGIN IMMEDIATE")

            booking = connection.execute(
                "SELECT * FROM bookings WHERE id = ?",
                (booking_id,),
            ).fetchone()

            if booking is None:
                raise HTTPException(
                    status_code=404,
                    detail="Booking not found.",
                )

            if booking["status"] != "pending":
                raise HTTPException(
                    status_code=409,
                    detail="Only pending bookings can be reviewed.",
                )

            if status == "approved":
                conflict = find_conflict(
                    connection,
                    booking["room_id"],
                    parse_booking_time(booking["start_time"]),
                    parse_booking_time(booking["end_time"]),
                    exclude_id=booking_id,
                )

                if conflict:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            "Cannot approve this request because another "
                            "pending or approved booking overlaps. Resolve "
                            "the other request first."
                        ),
                    )

            connection.execute(
                "UPDATE bookings SET status = ? WHERE id = ?",
                (status, booking_id),
            )

            updated = connection.execute(
                """
                SELECT id, room_id, title, start_time, end_time,
                       booking_type, status, submitted_at, requested_by
                FROM bookings
                WHERE id = ?
                """,
                (booking_id,),
            ).fetchone()

            return booking_to_dict(updated)

    except sqlite3.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Database error while updating booking.",
        ) from error


@app.get("/availability")
def check_availability(
    start_time: datetime,
    end_time: datetime,
    min_capacity: int = 1,
    equipment: str = "",
):
    check_time_range(start_time, end_time)

    if min_capacity < 1:
        raise HTTPException(
            status_code=400,
            detail="min_capacity must be at least 1.",
        )

    required_equipment = {
        item.strip().lower()
        for item in equipment.split(",")
        if item.strip()
    }

    with get_connection() as connection:
        room_rows = connection.execute(
            """
            SELECT id, name, capacity, equipment
            FROM rooms
            WHERE capacity >= ?
            ORDER BY capacity, id
            """,
            (min_capacity,),
        ).fetchall()

        available_rooms = []

        for room in room_rows:
            raw_equipment = room["equipment"] or ""

            if isinstance(raw_equipment, str):
                room_equipment = {
                    item.strip().lower()
                    for item in raw_equipment.split(",")
                    if item.strip()
                }
            else:
                room_equipment = {
                    str(item).strip().lower()
                    for item in raw_equipment
                    if str(item).strip()
                }

            if not required_equipment.issubset(room_equipment):
                continue

            conflict = find_conflict(
                connection,
                room["id"],
                start_time,
                end_time,
            )

            if conflict is None:
                available_rooms.append({
                    "id": room["id"],
                    "name": room["name"],
                    "capacity": room["capacity"],
                    "equipment": sorted(room_equipment),
                })

    return {
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "available_rooms": available_rooms,
    }
