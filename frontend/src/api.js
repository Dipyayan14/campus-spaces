const API_BASE = "http://127.0.0.1:8000";

// Demo accounts used by the prototype.
// Approval permissions are restricted separately in App.jsx and Navbar.jsx.
export const demoUsers = [
  { id: "u1", name: "Rahul Sharma", role: "student" },
  { id: "u2", name: "Coding Club Lead", role: "club" },
  { id: "u3", name: "Prof. Ananya Sen", role: "faculty" },
  { id: "u4", name: "Venue Admin", role: "venue_admin" },
  { id: "u5", name: "Super Admin", role: "super_admin" },
  { id: "u6", name: "Exam Cell Officer", role: "exam_cell" },

  // Keep the legacy demo account for existing Insights functionality.
  { id: "u7", name: "Admin Operations", role: "admin" },
];

export const TYPE_PRIORITY = {
  exam: 4,
  class: 3,
  lab: 2,
  event: 1,
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed (${response.status})`);
  }

  if (response.status === 204) return null;

  return response.json();
}

function mapRoom(room) {
  return {
    ...room,
    id: room.id,
    equipment: Array.isArray(room.equipment) ? room.equipment : [],
  };
}

function mapBooking(booking) {
  return {
    ...booking,
    id: booking.id,
    roomId: booking.room_id ?? booking.roomId,
    title: booking.title,
    type: booking.booking_type || booking.type || "event",
    start: booking.start_time || booking.start,
    end: booking.end_time || booking.end,
    status: booking.status,
    requestedBy:
      booking.requested_by || booking.requestedBy || "Campus Member",
  };
}

export async function getRooms() {
  const rooms = await request("/rooms");
  return rooms.map(mapRoom);
}

export async function getBookings() {
  const bookings = await request("/bookings");
  return bookings.map(mapBooking);
}

export async function createBooking(data) {
  const booking = await request("/bookings", {
    method: "POST",
    body: JSON.stringify({
      room_id: data.roomId ?? data.room_id,
      title: data.title,
      start_time: data.start ?? data.start_time,
      end_time: data.end ?? data.end_time,
      booking_type: data.type ?? data.booking_type ?? "event",
    }),
  });

  return mapBooking(booking);
}

async function updateBookingStatus(id, status) {
  const booking = await request(
    `/bookings/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );

  return mapBooking(booking);
}

export async function approveBooking(id) {
  return updateBookingStatus(id, "approved");
}

export async function rejectBooking(id) {
  return updateBookingStatus(id, "rejected");
}

export async function deleteBooking() {
  throw new Error(
    "Deleting bookings is not supported by the current backend API."
  );
}

export async function suggestRooms({
  capacity = 0,
  equipment = [],
  start = null,
  end = null,
} = {}) {
  if (!start || !end) {
    const rooms = await getRooms();

    return rooms.filter((room) => {
      if (Number(capacity) > 0 && room.capacity < Number(capacity)) {
        return false;
      }

      return equipment.every((item) =>
        room.equipment.some(
          (value) => value.toLowerCase() === item.toLowerCase()
        )
      );
    });
  }

  const params = new URLSearchParams({
    start_time: start,
    end_time: end,
    min_capacity: String(Number(capacity) || 0),
  });

  equipment.forEach((item) => params.append("equipment", item));

  const result = await request(`/availability?${params.toString()}`);

  const rooms = Array.isArray(result)
    ? result
    : result.available_rooms || result.rooms || [];

  return rooms.map(mapRoom);
}

export async function loginUser(roleOrId) {
  const user = demoUsers.find(
    (item) => item.role === roleOrId || item.id === roleOrId
  );

  if (user) return user;

  const role = String(roleOrId || "student");

  return {
    id: `u_${Date.now()}`,
    name: `${role.charAt(0).toUpperCase()}${role.slice(1)} User`,
    role,
  };
}

export async function getDemoUsers() {
  return [...demoUsers];
}