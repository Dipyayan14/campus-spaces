
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

        # Add sample rooms only if the rooms table is empty
        existing_rooms = connection.execute(
            "SELECT COUNT(*) FROM rooms"
        ).fetchone()[0]

        if existing_rooms == 0:
            sample_rooms = [
                ("Seminar Hall A", 100, "projector,whiteboard,audio"),
                ("Computer Lab 1", 40, "computers,projector"),
                ("Classroom 201", 60, "projector,whiteboard"),
            ]

            connection.executemany(
                """
                INSERT INTO rooms (name, capacity, equipment)
                VALUES (?, ?, ?)
                """,
                sample_rooms,
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
