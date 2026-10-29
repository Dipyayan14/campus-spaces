// src/api.js
// Centralized API service layer connecting to the FastAPI backend,
// with client-side reactive change subscriptions and local persistence for maintenance logs.

import { generateInitialMaintenanceLogs } from "./mockData";

const API_BASE = "http://127.0.0.1:8000";
const MAINTENANCE_STORAGE_KEY = "campus_spaces_maintenance_v1";

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

// ==========================================
// Reactive Change Subscriptions & Tab Sync
// ==========================================
const listeners = new Set();

function notifySubscribers() {
  listeners.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.error("Error in change subscriber callback:", err);
    }
  });
}

/**
 * Subscribes a callback to data changes in the local session.
 * Fires after createBooking, approveBooking, rejectBooking, and updateMaintenanceStatus.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToChanges(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Synchronize maintenance state across open browser tabs via storage events
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === MAINTENANCE_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          maintenanceLogList = parsed;
          notifySubscribers();
        }
      } catch (err) {
        console.warn("Failed to process cross-tab storage update:", err);
      }
    }
  });
}

// ==========================================
// Maintenance Logs (Mock / LocalStorage)
// TODO: connect to backend when maintenance endpoints are added
// ==========================================
let maintenanceLogList = [];

function saveMaintenanceToStorage() {
  try {
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(maintenanceLogList));
  } catch (err) {
    console.warn("Failed to write maintenance logs to localStorage:", err);
  }
}

function loadMaintenanceFromStorage() {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        maintenanceLogList = parsed;
        return;
      }
    }
  } catch (err) {
    console.warn("Failed to read maintenance logs from localStorage:", err);
  }

  // Fallback to fresh seed data
  maintenanceLogList = generateInitialMaintenanceLogs();
  saveMaintenanceToStorage();
}

// Initialize immediately in browser context
if (typeof window !== "undefined") {
  loadMaintenanceFromStorage();
}

/**
 * Retrieves the full list of campus facility maintenance issues.
 * Returns a cloned array to prevent external mutations.
 * TODO: connect to backend when maintenance endpoints are added
 */
export async function getMaintenanceLogs() {
  await new Promise((resolve) => setTimeout(resolve, 30));
  if (maintenanceLogList.length === 0) {
    loadMaintenanceFromStorage();
  }
  return JSON.parse(JSON.stringify(maintenanceLogList));
}

/**
 * Updates the status of an existing maintenance log item.
 * Valid statuses: "open" | "in_progress" | "resolved"
 * Updates updatedAt timestamp, persists to localStorage, and alerts subscribers.
 * TODO: connect to backend when maintenance endpoints are added
 */
export async function updateMaintenanceStatus(id, newStatus) {
  await new Promise((resolve) => setTimeout(resolve, 40));

  const validStatuses = ["open", "in_progress", "resolved"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid maintenance status: ${newStatus}`);
  }

  const index = maintenanceLogList.findIndex((item) => String(item.id) === String(id));
  if (index === -1) {
    throw new Error(`Maintenance record with id ${id} was not found.`);
  }

  const updatedItem = {
    ...maintenanceLogList[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  maintenanceLogList[index] = updatedItem;
  saveMaintenanceToStorage();
  notifySubscribers();

  return JSON.parse(JSON.stringify(updatedItem));
}

/**
 * Resets local demo maintenance logs back to default seed data.
 * Useful for development and demo environments.
 */
export function resetDemoData() {
  maintenanceLogList = generateInitialMaintenanceLogs();
  saveMaintenanceToStorage();
  notifySubscribers();
}

// ==========================================
// HTTP Client for FastAPI Backend
// ==========================================
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
    equipment: Array.isArray(room.equipment)
      ? room.equipment
      : typeof room.equipment === "string" && room.equipment
      ? room.equipment.split(",").map((s) => s.trim())
      : [],
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

  notifySubscribers();
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

  notifySubscribers();
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
