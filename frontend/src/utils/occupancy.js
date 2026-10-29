// src/utils/occupancy.js
// Pure occupancy calculation utilities based on real time and approved bookings.

export const CAMPUS_START = 8;  // 08:00 AM
export const CAMPUS_END = 18;   // 06:00 PM
export const CAMPUS_TOTAL_HOURS = CAMPUS_END - CAMPUS_START; // 10 hours

/**
 * Formats a Date object into "3:00 PM" style time string.
 */
function formatTime12h(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Checks whether two Date objects share the same calendar day.
 */
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Merges an array of [startMs, endMs] intervals to avoid double-counting overlapping bookings.
 */
function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = merged[merged.length - 1];

    if (current.start <= prev.end) {
      prev.end = Math.max(prev.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Calculates the percentage of today's campus hours (08:00 - 18:00) covered by
 * approved bookings for a room. Overlapping bookings are merged to prevent double-counting.
 *
 * @param {Object} room - Room object with { id, name, capacity, ... }
 * @param {Array} bookings - All bookings
 * @param {Date} now - Current time
 * @returns {number} Integer percentage (0 - 100)
 */
export function getRoomOccupancy(room, bookings, now = new Date()) {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CAMPUS_START, 0, 0, 0).getTime();
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CAMPUS_END, 0, 0, 0).getTime();
  const totalCampusMs = dayEnd - dayStart;

  // Filter approved bookings for this room on today's calendar day
  const intervals = bookings
    .filter(
      (b) =>
        String(b.roomId) === String(room.id) &&
        b.status === "approved" &&
        b.start &&
        b.end
    )
    .map((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      // Clip to today's campus hours (08:00 to 18:00)
      const start = Math.max(bStart, dayStart);
      const end = Math.min(bEnd, dayEnd);
      return { start, end };
    })
    .filter((slot) => slot.end > slot.start);

  const merged = mergeIntervals(intervals);
  const bookedMs = merged.reduce((acc, slot) => acc + (slot.end - slot.start), 0);

  if (totalCampusMs <= 0) return 0;
  return Math.min(100, Math.round((bookedMs / totalCampusMs) * 100));
}

/**
 * Returns a human-friendly status string for a room right now.
 *
 * @param {Object} room - Room object
 * @param {Array} bookings - All bookings
 * @param {Date} now - Current time
 * @returns {string} Status string
 */
export function getRoomStatus(room, bookings, now = new Date()) {
  const nowMs = now.getTime();

  // Filter approved bookings for this room that take place today
  const todaysApproved = bookings.filter((b) => {
    if (String(b.roomId) !== String(room.id) || b.status !== "approved" || !b.start || !b.end) {
      return false;
    }
    const bStart = new Date(b.start);
    return isSameDay(bStart, now);
  });

  // Check if an approved booking is happening right now
  const activeBooking = todaysApproved.find((b) => {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return bStart <= nowMs && nowMs < bEnd;
  });

  if (activeBooking) {
    const endStr = formatTime12h(new Date(activeBooking.end));
    return `In use now - ${activeBooking.title}, until ${endStr}`;
  }

  // If not currently in use, look for the next upcoming booking today
  const upcomingBookings = todaysApproved
    .filter((b) => new Date(b.start).getTime() > nowMs)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (upcomingBookings.length > 0) {
    const nextStartStr = formatTime12h(new Date(upcomingBookings[0].start));
    return `Free now - next at ${nextStartStr}`;
  }

  return "Free for the rest of the day";
}

/**
 * Calculates campus-wide active occupancy summary and comparison against last week.
 *
 * @param {Array} rooms - Array of all rooms
 * @param {Array} bookings - Array of all bookings
 * @param {Date} now - Current time
 * @returns {Object} Summary stats
 */
export function getCampusSummary(rooms, bookings, now = new Date()) {
  const nowMs = now.getTime();
  const totalRooms = rooms.length;

  // Find all approved bookings happening right now
  const activeNow = bookings.filter((b) => {
    if (b.status !== "approved" || !b.start || !b.end) return false;
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return bStart <= nowMs && nowMs < bEnd;
  });

  // Distinct rooms currently in use
  const inUseRoomIds = new Set(activeNow.map((b) => String(b.roomId)));
  const roomsInUse = inUseRoomIds.size;
  const activePercent = totalRooms > 0 ? Math.round((roomsInUse / totalRooms) * 100) : 0;

  // --- Historical comparison against same weekday last week up to same time ---
  const todayCampusStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CAMPUS_START, 0, 0, 0).getTime();
  const todayCampusEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CAMPUS_END, 0, 0, 0).getTime();
  const todayCutoff = Math.min(Math.max(nowMs, todayCampusStart), todayCampusEnd);

  // Sum merged booked hours across rooms today up to current time
  let todayHoursSoFar = 0;
  rooms.forEach((r) => {
    const intervals = bookings
      .filter((b) => String(b.roomId) === String(r.id) && b.status === "approved" && b.start && b.end)
      .map((b) => {
        const s = Math.max(new Date(b.start).getTime(), todayCampusStart);
        const e = Math.min(new Date(b.end).getTime(), todayCutoff);
        return { start: s, end: e };
      })
      .filter((slot) => slot.end > slot.start);

    const merged = mergeIntervals(intervals);
    todayHoursSoFar += merged.reduce((sum, slot) => sum + (slot.end - slot.start), 0) / (1000 * 60 * 60);
  });

  // Same weekday last week (-7 days)
  const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekCampusStart = new Date(
    lastWeekDate.getFullYear(),
    lastWeekDate.getMonth(),
    lastWeekDate.getDate(),
    CAMPUS_START,
    0,
    0,
    0
  ).getTime();
  const lastWeekCampusEnd = new Date(
    lastWeekDate.getFullYear(),
    lastWeekDate.getMonth(),
    lastWeekDate.getDate(),
    CAMPUS_END,
    0,
    0,
    0
  ).getTime();
  const lastWeekCutoff = Math.min(
    Math.max(
      new Date(
        lastWeekDate.getFullYear(),
        lastWeekDate.getMonth(),
        lastWeekDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      ).getTime(),
      lastWeekCampusStart
    ),
    lastWeekCampusEnd
  );

  let lastWeekHoursSoFar = 0;
  rooms.forEach((r) => {
    const intervals = bookings
      .filter((b) => String(b.roomId) === String(r.id) && b.status === "approved" && b.start && b.end)
      .map((b) => {
        const s = Math.max(new Date(b.start).getTime(), lastWeekCampusStart);
        const e = Math.min(new Date(b.end).getTime(), lastWeekCutoff);
        return { start: s, end: e };
      })
      .filter((slot) => slot.end > slot.start);

    const merged = mergeIntervals(intervals);
    lastWeekHoursSoFar += merged.reduce((sum, slot) => sum + (slot.end - slot.start), 0) / (1000 * 60 * 60);
  });

  let trendPercent = null;
  if (lastWeekHoursSoFar > 0) {
    trendPercent = Math.round(((todayHoursSoFar - lastWeekHoursSoFar) / lastWeekHoursSoFar) * 100);
  }

  return {
    activeNow,
    roomsInUse,
    totalRooms,
    activePercent,
    trendPercent,
  };
}

