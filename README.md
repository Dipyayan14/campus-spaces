# SpaceSync

Campus room and event scheduling in one place.

## The problem
Campus rooms are booked through WhatsApp, calls and paper registers. Clashes are found
too late, exams force last-minute cancellations, and some halls sit empty while others
are double-booked.

## What SpaceSync does
- **One calendar** for all halls, labs and classrooms
- **Clash detection** that blocks double bookings
- **Priority rules**: exam > class > lab > event
- **Approval workflow** with role-based access (student, club, faculty, venue admin, super admin)
- **Live occupancy** calculated from real bookings
- **Maintenance log** for room issues
- **Assistant chatbot** that recommends rooms by event type, crowd size and equipment

## Tech stack
React, Vite, Tailwind CSS, FullCalendar, FastAPI, SQLite

## Run it locally
Backend:
    cd backend
    python -m pip install fastapi uvicorn
    python -m uvicorn main:app --reload
    API docs: http://127.0.0.1:8000/docs

Frontend:
    cd frontend
    npm install
    npm run dev
