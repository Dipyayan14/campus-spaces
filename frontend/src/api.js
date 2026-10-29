// src/api.js
// Centralized API service layer with localStorage persistence and multi-tab sync.

import {
  rooms as initialRooms,
  generateInitialBookings,
  generateInitialMaintenanceLogs,
} from "./mockData";

// Demo personas for quick login testing
export const demoUsers = [
  { id: "u1", name: "Rahul Sharma", role: "student" },
  { id: "u2", name: "Coding Club Lead", role: "club" },
  { id: "u3", name: "Prof. Ananya Sen", role: "faculty" },
  { id: "u4", name: "Admin Operations", role: "admin" },
  { id: "u5", name: "Exam Cell Officer", role: "exam_cell" },
];

// Priority map matching backend contract
export const TYPE_PRIORITY = {
  exam: 4,
  class: 3,
  lab: 2,
  event: 1,
};

const STORAGE_KEY = "campus_spaces_state_v1";

// Helper for simulating network latency
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

function getTodayDateString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// In-memory state containers
const roomList = [...initialRooms];
let bookingList = [];
let maintenanceLogList = [];

// Event subscribers for in-tab reactive updates
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
 * Fires after createBooking, approveBooking, rejectBooking, deleteBooking, and updateMaintenanceStatus.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToChanges(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Saves current bookings and maintenance logs to localStorage with today's seedDate.
 */
function saveToStorage() {
  try {
    const payload = {
      seedDate: getTodayDateString(),
      bookings: bookingList,
      maintenanceLogs: maintenanceLogList,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to write state to localStorage (falling back to memory):", err);
  }
}

/**
 * Loads bookings and maintenance logs from localStorage.
 * If data is missing or from a previous day (seedDate mismatch), regenerates fresh time-relative sample data.
 */
function loadFromStorage() {
  const todayStr = getTodayDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.seedDate === todayStr &&
        Array.isArray(parsed.bookings) &&
        Array.isArray(parsed.maintenanceLogs)
      ) {
        bookingList = parsed.bookings;
        maintenanceLogList = parsed.maintenanceLogs;
        return;
      }
    }
  } catch (err) {
    console.warn("Failed to read from localStorage:", err);
  }

  // Stored data is missing, corrupted, or from another date: reseed
  bookingList = generateInitialBookings();
  maintenanceLogList = generateInitialMaintenanceLogs();
  saveToStorage();
}

// Initialize store
loadFromStorage();

// Synchronize state across open browser tabs via storage events
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (
          parsed &&
          Array.isArray(parsed.bookings) &&
          Array.isArray(parsed.maintenanceLogs)
        ) {
          bookingList = parsed.bookings;
          maintenanceLogList = parsed.maintenanceLogs;
          notifySubscribers();
        }
      } catch (err) {
        console.warn("Failed to process cross-tab storage update:", err);
      }
    }
  });
}

/**
 * Resets local demo state back to freshly generated sample data.
 */
export function resetDemoData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear localStorage:", err);
  }
  bookingList = generateInitialBookings();
  maintenanceLogList = generateInitialMaintenanceLogs();
  saveToStorage();
  notifySubscribers();
}

/**
 * Fetch all campus rooms
 * GET /rooms
 */
export async function getRooms() {
  await delay();
  return [...roomList];
}

/**
 * Fetch all bookings across all rooms
 * GET /bookings
 */
export async function getBookings() {
  await delay();
  return [...bookingList];
}

/**
 * Create a new booking request
 * POST /bookings
 */
export async function createBooking(data) {
  await delay();
  const newBooking = {
    id: `b_${Date.now()}`,
    roomId: data.roomId,
    title: data.title,
    type: data.type || "event",
    start: data.start,
    end: data.end,
    status: data.status || "pending",
    requestedBy: data.requestedBy || "Campus Member",
  };
  bookingList = [newBooking, ...bookingList];
  saveToStorage();
  notifySubscribers();
  return newBooking;
}

/**
 * Approve a pending booking
 * PATCH /bookings/:id/approve
 */
export async function approveBooking(id) {
  await delay();
  let updatedBooking = null;
  bookingList = bookingList.map((b) => {
    if (b.id === id) {
      updatedBooking = { ...b, status: "approved" };
      return updatedBooking;
    }
    return b;
  });

  if (!updatedBooking) {
    throw new Error(`Booking with ID "${id}" was not found.`);
  }

  saveToStorage();
  notifySubscribers();
  return updatedBooking;
}

/**
 * Reject a pending booking
 * PATCH /bookings/:id/reject
 */
export async function rejectBooking(id) {
  await delay();
  let updatedBooking = null;
  bookingList = bookingList.map((b) => {
    if (b.id === id) {
      updatedBooking = { ...b, status: "rejected" };
      return updatedBooking;
    }
    return b;
  });

  if (!updatedBooking) {
    throw new Error(`Booking with ID "${id}" was not found.`);
  }

  saveToStorage();
  notifySubscribers();
  return updatedBooking;
}

/**
 * Delete a booking
 * DELETE /bookings/:id
 */
export async function deleteBooking(id) {
  await delay();
  const exists = bookingList.some((b) => b.id === id);
  if (!exists) {
    throw new Error(`Booking with ID "${id}" was not found.`);
  }
  bookingList = bookingList.filter((b) => b.id !== id);
  saveToStorage();
  notifySubscribers();
  return { success: true, id };
}

/**
 * Fetch all facility maintenance logs
 * GET /maintenance-logs
 */
export async function getMaintenanceLogs() {
  await delay();
  return [...maintenanceLogList];
}

/**
 * Updates status of a maintenance log entry and records update timestamp.
 * PATCH /maintenance-logs/:id/status
 */
export async function updateMaintenanceStatus(id, status) {
  await delay();
  let updatedLog = null;
  const nowIso = new Date().toISOString();

  maintenanceLogList = maintenanceLogList.map((item) => {
    if (item.id === id) {
      updatedLog = {
        ...item,
        status,
        updatedAt: nowIso,
      };
      return updatedLog;
    }
    return item;
  });

  if (!updatedLog) {
    throw new Error(`Maintenance record with ID "${id}" was not found.`);
  }

  saveToStorage();
  notifySubscribers();
  return updatedLog;
}

/**
 * Suggest available rooms based on capacity, required equipment, and time window
 * GET /rooms/suggest?capacity=&equipment=&start=&end=
 */
export async function suggestRooms({ capacity = 0, equipment = [], start = null, end = null }) {
  await delay();

  const reqCapacity = Number(capacity) || 0;
  const reqEquipment = Array.isArray(equipment) ? equipment : [];

  return roomList.filter((room) => {
    if (reqCapacity > 0 && room.capacity < reqCapacity) {
      return false;
    }

    if (
      reqEquipment.length > 0 &&
      !reqEquipment.every((item) =>
        room.equipment.some((eq) => eq.toLowerCase() === item.toLowerCase())
      )
    ) {
      return false;
    }

    if (start && end) {
      const slotStart = new Date(start).getTime();
      const slotEnd = new Date(end).getTime();

      const hasConflict = bookingList.some((booking) => {
        if (booking.roomId !== room.id || booking.status !== "approved") {
          return false;
        }
        const bStart = new Date(booking.start).getTime();
        const bEnd = new Date(booking.end).getTime();
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (hasConflict) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Simulate user login and fetch available demo roles
 */
export async function loginUser(roleOrId) {
  await delay();
  const foundUser = demoUsers.find(
    (u) => u.role === roleOrId || u.id === roleOrId
  );
  if (foundUser) {
    return foundUser;
  }
  return {
    id: `u_${Date.now()}`,
    name: `${roleOrId.charAt(0).toUpperCase() + roleOrId.slice(1)} User`,
    role: roleOrId,
  };
}

/**
 * Fetch available demo personas
 */
export async function getDemoUsers() {
  await delay();
  return [...demoUsers];
}
