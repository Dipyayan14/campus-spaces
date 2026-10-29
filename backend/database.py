
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "spacesync.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    with get_connection() as connection:
        # Campus rooms
        connection.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                capacity INTEGER NOT NULL CHECK (capacity > 0),
                equipment TEXT NOT NULL DEFAULT ''
            )
        """)

        # Room bookings
        connection.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                booking_type TEXT NOT NULL DEFAULT 'event'
                    CHECK (booking_type IN ('event', 'exam')),
                status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
                submitted_at TEXT NOT NULL DEFAULT (
                    strftime('%Y-%m-%dT%H:%M:%S', 'now')
                ),
                reminder_sent_at TEXT,
                escalated_at TEXT,
                FOREIGN KEY (room_id) REFERENCES rooms(id)
            )
        """)

        # Detect columns in an existing bookings table
        existing_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(bookings)"
            ).fetchall()
        }

        # Add missing workflow columns without deleting existing bookings
        if "submitted_at" not in existing_columns:
            connection.execute("""
                ALTER TABLE bookings ADD COLUMN submitted_at TEXT
            """)
            connection.execute("""
                UPDATE bookings
                SET submitted_at = strftime('%Y-%m-%dT%H:%M:%S', 'now')
                WHERE submitted_at IS NULL
            """)

        if "reminder_sent_at" not in existing_columns:
            connection.execute("""
                ALTER TABLE bookings ADD COLUMN reminder_sent_at TEXT
            """)

        if "escalated_at" not in existing_columns:
            connection.execute("""
                ALTER TABLE bookings ADD COLUMN escalated_at TEXT
            """)

                # Add the initial campus facilities without duplicating them
        sample_rooms = [
            ("Seminar Hall A", 100, "projector,whiteboard,audio,microphone"),
            ("Computer Lab 1", 40, "computers,projector,internet"),
            ("Classroom 201", 60, "projector,whiteboard"),
            ("Classroom 202", 50, "projector,whiteboard"),
            ("Classroom 203", 45, "whiteboard"),
            ("Lecture Hall A", 200, "projector,audio,microphone"),
            ("Lecture Hall B", 150, "projector,audio,microphone,whiteboard"),
            ("Auditorium", 500, "projector,audio,microphone,stage"),
            ("Physics Laboratory", 35, "lab_benches,scientific_instruments"),
            ("Chemistry Laboratory", 30, "lab_benches,fume_hood,safety_equipment"),
            ("Electronics Lab", 32, "computers,circuit_kits,oscilloscopes"),
            ("Research Lab", 25, "computers,projector,internet"),
            ("Library Study Room", 12, "whiteboard,power_outlets"),
            ("Conference Room", 20, "display,video_conferencing,whiteboard"),
            ("Tutorial Room 101", 25, "whiteboard"),
            ("Tutorial Room 102", 25, "projector,whiteboard"),
            ("Computer Lab 2", 45, "computers,projector,internet"),
            ("Innovation Hub", 40, "computers,projector,3d_printer"),
            ("Sports Activity Hall", 120, "audio,sports_equipment"),
            ("Faculty Meeting Room", 15, "display,video_conferencing,whiteboard"),
        ]

        for name, capacity, equipment in sample_rooms:
            connection.execute(
                """
                INSERT INTO rooms (name, capacity, equipment)
                SELECT ?, ?, ?
                WHERE NOT EXISTS (
                    SELECT 1 FROM rooms WHERE name = ?
                )
                """,
                (name, capacity, equipment, name),
            )


def list_rooms():
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT id, name, capacity, equipment
            FROM rooms
            ORDER BY id
        """).fetchall()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "capacity": row["capacity"],
            "equipment": [
                item for item in row["equipment"].split(",") if item
            ],
        }
        for row in rows
    ]
