// src/utils/clash.js
// Booking clash detection and priority hierarchy logic.
// Priority: exam (4) > class (3) > lab (2) > event (1)

export const TYPE_PRIORITY = {
  exam: 4,
  class: 3,
  lab: 2,
  event: 1,
};

/**
 * Checks if a requested time interval overlaps with any existing booking for the same room.
 * Rule: overlap means newStart < existingEnd AND newEnd > existingStart.
 * Ignores rejected bookings.
 *
 * @param {Object} newBooking - { roomId, type, start, end }
 * @param {Array} existingBookings - Array of booking objects
 * @param {string|number|null} currentBookingId - Optional ID to ignore (when editing)
 * @returns {Object} { hasClash, clashingBookings, canBump, bumpedTitles, highestClashPriority }
 */
export function checkBookingClash(newBooking, existingBookings, currentBookingId = null) {
  if (!newBooking.roomId || !newBooking.start || !newBooking.end) {
    return {
      hasClash: false,
      clashingBookings: [],
      canBump: false,
      bumpedTitles: [],
      highestClashPriority: 0,
    };
  }

  const reqStart = new Date(newBooking.start).getTime();
  const reqEnd = new Date(newBooking.end).getTime();

  // Filter existing active bookings for the same room
  const clashingBookings = existingBookings.filter((b) => {
    if (currentBookingId && String(b.id) === String(currentBookingId)) {
      return false;
    }
    // Ignore rejected bookings
    if (b.status === "rejected") {
      return false;
    }
    // Room must match
    if (String(b.roomId) !== String(newBooking.roomId)) {
      return false;
    }

    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();

    // Standard interval overlap condition
    return reqStart < bEnd && reqEnd > bStart;
  });

  if (clashingBookings.length === 0) {
    return {
      hasClash: false,
      clashingBookings: [],
      canBump: false,
      bumpedTitles: [],
      highestClashPriority: 0,
    };
  }

  const newPriority = TYPE_PRIORITY[newBooking.type] || 1;
  const highestClashPriority = Math.max(
    ...clashingBookings.map((b) => TYPE_PRIORITY[b.type] || 1)
  );

  // If new booking has STRICTLY HIGHER priority than all clashing bookings, it can bump them
  const canBump = newPriority > highestClashPriority;
  const bumpedTitles = clashingBookings.map((b) => b.title);

  return {
    hasClash: true,
    clashingBookings,
    canBump,
    bumpedTitles,
    highestClashPriority,
  };
}
