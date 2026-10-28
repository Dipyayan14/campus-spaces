# API Contract

## Data shapes
Room:    { id, name, capacity, equipment[] }
Booking: { id, roomId, title, type, start, end, status, requestedBy }
User:    { id, name, role }

## Types:    exam | class | lab | event
## Status:   pending | approved | rejected
## Roles:    student | club | faculty | admin | exam_cell
## Priority: exam > class > lab > event

## Endpoints
POST   /auth/login
GET    /rooms
GET    /bookings
POST   /bookings
PATCH  /bookings/:id/approve
PATCH  /bookings/:id/reject
DELETE /bookings/:id
GET    /rooms/suggest?capacity=&equipment=&start=&end=