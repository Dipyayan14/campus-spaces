// src/api.js
// Centralized API service layer. All data calls in pages must import from here.
// In-memory state simulates backend behavior for the hackathon prototype.

import { rooms as initialRooms, bookings as initialBookings, demoUsers } from "./mockData";

// Priority map matching backend contract
export const TYPE_PRIORITY = {
  exam: 4,
  class: 3,
  lab: 2,
  event: 1,
};

// In-memory storage for active session
let roomList = [...initialRooms];
let bookingList = [...initialBookings];

// Small helper to simulate realistic network delay (150ms)
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

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
  return { success: true, id };
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
    // 1. Capacity filter
    if (reqCapacity > 0 && room.capacity < reqCapacity) {
      return false;
    }

    // 2. Equipment filter (room must have all requested items)
    if (
      reqEquipment.length > 0 &&
      !reqEquipment.every((item) =>
        room.equipment.some((eq) => eq.toLowerCase() === item.toLowerCase())
      )
    ) {
      return false;
    }

    // 3. Time slot overlap filter with approved bookings
    if (start && end) {
      const slotStart = new Date(start).getTime();
      const slotEnd = new Date(end).getTime();

      const hasConflict = bookingList.some((booking) => {
        if (booking.roomId !== room.id || booking.status !== "approved") {
          return false;
        }
        const bStart = new Date(booking.start).getTime();
        const bEnd = new Date(booking.end).getTime();
        // Overlap condition: start < bEnd and end > bStart
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
 * POST /auth/login
 */
export async function loginUser(roleOrId) {
  await delay();
  const foundUser = demoUsers.find(
    (u) => u.role === roleOrId || u.id === roleOrId
  );
  if (foundUser) {
    return foundUser;
  }
  // Fallback generic role user
  return {
    id: `u_${Date.now()}`,
    name: `${roleOrId.charAt(0).toUpperCase() + roleOrId.slice(1)} User`,
    role: roleOrId,
  };
}

/**
 * Fetch available demo personas for easy login switching during presentations
 */
export async function getDemoUsers() {
  await delay();
  return [...demoUsers];
}