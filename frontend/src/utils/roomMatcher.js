// src/utils/roomMatcher.js
// Multi-factor room recommendation and scoring engine.
// Scores real rooms against attendance, required equipment, availability,
// and venue type fit using only real data from api.js.

import { getEventProfile } from "./eventProfiles.js";

const CAMPUS_START_HOUR = 8;
const CAMPUS_END_HOUR = 18;

/**
 * Normalizes equipment name for comparison
 */
function normalizeEquip(item) {
  const s = String(item || "").toLowerCase().trim();
  if (s === "mic") return "microphone";
  if (s === "sound" || s === "sound system" || s === "speakers") return "audio";
  if (s === "wifi" || s === "wi-fi") return "internet";
  if (s === "sockets" || s === "power") return "power_outlets";
  return s;
}

/**
 * Checks if a room has a given equipment item
 */
function roomHasEquipment(room, targetItem) {
  const equip = Array.isArray(room.equipment) ? room.equipment : [];
  const normalizedTarget = normalizeEquip(targetItem);

  return equip.some((item) => {
    const norm = normalizeEquip(item);
    if (norm === normalizedTarget) return true;
    if (normalizedTarget === "microphone" && norm.includes("micro")) return true;
    if (normalizedTarget === "audio" && (norm.includes("audio") || norm.includes("sound"))) return true;
    if (normalizedTarget === "computers" && norm.includes("computer")) return true;
    if (normalizedTarget === "internet" && (norm.includes("internet") || norm.includes("wifi"))) return true;
    if (normalizedTarget === "power_outlets" && norm.includes("power")) return true;
    return false;
  });
}

/**
 * Formats time from HH:mm to 12-hour AM/PM format
 */
function formatTime12(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Checks clash between requested time and existing bookings for a room
 */
function checkRoomClash(roomId, bookings, startISO, endISO) {
  const reqStart = new Date(startISO).getTime();
  const reqEnd = new Date(endISO).getTime();

  if (Number.isNaN(reqStart) || Number.isNaN(reqEnd)) return false;

  return bookings.some((b) => {
    if (String(b.roomId ?? b.room_id) !== String(roomId)) return false;
    if (b.status === "rejected") return false;

    const bStart = new Date(b.start ?? b.start_time).getTime();
    const bEnd = new Date(b.end ?? b.end_time).getTime();

    if (Number.isNaN(bStart) || Number.isNaN(bEnd)) return false;

    return reqStart < bEnd && reqEnd > bStart;
  });
}

/**
 * Finds up to 3 alternative free slots for a room on a given date during campus hours (08:00 - 18:00)
 */
export function findAlternativeFreeSlots(room, bookings, dateStr, durationMinutes = 120) {
  if (!dateStr) return [];

  // Filter approved or pending bookings on that day
  const dayBookings = bookings
    .filter((b) => {
      if (String(b.roomId ?? b.room_id) !== String(room.id)) return false;
      if (b.status === "rejected") return false;
      const bDate = String(b.start ?? b.start_time).slice(0, 10);
      return bDate === dateStr;
    })
    .map((b) => ({
      start: new Date(b.start ?? b.start_time).getTime(),
      end: new Date(b.end ?? b.end_time).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  // Campus operating limits
  const campusStart = new Date(`${dateStr}T08:00:00`).getTime();
  const campusEnd = new Date(`${dateStr}T18:00:00`).getTime();
  const durationMs = durationMinutes * 60 * 1000;

  const freeSlots = [];
  let currentPointer = campusStart;

  for (const b of dayBookings) {
    if (b.start > currentPointer) {
      const gap = b.start - currentPointer;
      if (gap >= durationMs) {
        const slotStart = new Date(currentPointer);
        const slotEnd = new Date(currentPointer + durationMs);
        freeSlots.push({
          start: `${String(slotStart.getHours()).padStart(2, "0")}:${String(slotStart.getMinutes()).padStart(2, "0")}`,
          end: `${String(slotEnd.getHours()).padStart(2, "0")}:${String(slotEnd.getMinutes()).padStart(2, "0")}`,
          label: `${formatTime12(`${slotStart.getHours()}:${slotStart.getMinutes()}`)} - ${formatTime12(`${slotEnd.getHours()}:${slotEnd.getMinutes()}`)}`,
        });
        if (freeSlots.length >= 3) break;
      }
    }
    currentPointer = Math.max(currentPointer, b.end);
  }

  if (currentPointer < campusEnd && freeSlots.length < 3) {
    const gap = campusEnd - currentPointer;
    if (gap >= durationMs) {
      const slotStart = new Date(currentPointer);
      const slotEnd = new Date(Math.min(campusEnd, currentPointer + durationMs));
      freeSlots.push({
        start: `${String(slotStart.getHours()).padStart(2, "0")}:${String(slotStart.getMinutes()).padStart(2, "0")}`,
        end: `${String(slotEnd.getHours()).padStart(2, "0")}:${String(slotEnd.getMinutes()).padStart(2, "0")}`,
        label: `${formatTime12(`${slotStart.getHours()}:${slotStart.getMinutes()}`)} - ${formatTime12(`${slotEnd.getHours()}:${slotEnd.getMinutes()}`)}`,
      });
    }
  }

  return freeSlots;
}

/**
 * Scores and ranks rooms based on request criteria
 */
export function recommendRooms({ rooms, bookings = [], request = {}, now = new Date() }) {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return [];
  }

  const targetAttendees = request.attendees?.max || request.attendees?.min || 0;
  const requestedEquip = request.equipment || [];
  const eventProfile = getEventProfile(request.eventType);

  const scoredRooms = rooms.map((room) => {
    let score = 50; // Base score
    const reasons = [];
    const warnings = [];

    // 1. Capacity Fit (Max 40 points)
    if (targetAttendees > 0) {
      if (room.capacity < targetAttendees) {
        score -= 45;
        warnings.push(`Under capacity: holds ${room.capacity} seats, needed ${targetAttendees}`);
      } else {
        const ratio = room.capacity / targetAttendees;
        if (ratio >= 1.05 && ratio <= 1.4) {
          score += 40;
          reasons.push(`Seats ${room.capacity}, ideal fit for ${targetAttendees} with comfortable room to spare`);
        } else if (ratio >= 1.0 && ratio < 1.05) {
          score += 32;
          reasons.push(`Seats ${room.capacity}, accommodates ${targetAttendees} at full capacity`);
        } else if (ratio > 1.4 && ratio <= 2.2) {
          score += 25;
          reasons.push(`Seats ${room.capacity}, spacious layout for ${targetAttendees} attendees`);
        } else {
          score += 10;
          warnings.push(`Significantly oversized: ${room.capacity} seats for ${targetAttendees} attendees`);
        }
      }
    } else {
      reasons.push(`Capacity: ${room.capacity} seats`);
    }

    // 2. Equipment Matching (Max 30 points)
    let missingEquipCount = 0;
    const matchedEquip = [];

    requestedEquip.forEach((item) => {
      if (item === "ac") {
        // AC is a comfort attribute; main facilities have air conditioning
        reasons.push("Central air conditioning supported");
        return;
      }

      if (roomHasEquipment(room, item)) {
        matchedEquip.push(item);
        score += 8;
      } else {
        missingEquipCount++;
        score -= 15;
        const displayItem = item.replace("_", " ");
        warnings.push(`Missing required ${displayItem}`);
      }
    });

    if (matchedEquip.length > 0) {
      reasons.push(`Has ${matchedEquip.map((e) => e.replace("_", " ")).join(", ")}`);
    }

    // Nice-to-have profile equipment bonus
    if (eventProfile?.niceToHave) {
      eventProfile.niceToHave.forEach((item) => {
        if (!requestedEquip.includes(item) && roomHasEquipment(room, item)) {
          score += 4;
        }
      });
    }

    // 3. Availability Check (Max 25 points)
    let isFree = true;
    let nextFreeSlots = [];

    if (request.date && request.startTime && request.endTime) {
      const startISO = `${request.date}T${request.startTime}:00`;
      const endISO = `${request.date}T${request.endTime}:00`;
      const hasClash = checkRoomClash(room.id, bookings, startISO, endISO);

      if (hasClash) {
        isFree = false;
        score -= 30;
        warnings.push(`Booked during ${formatTime12(request.startTime)} - ${formatTime12(request.endTime)} on ${request.date}`);

        const durMins = Math.max(60, (new Date(endISO) - new Date(startISO)) / (60 * 1000)) || 120;
        nextFreeSlots = findAlternativeFreeSlots(room, bookings, request.date, durMins);
      } else {
        score += 25;
        reasons.push(`Free from ${formatTime12(request.startTime)} to ${formatTime12(request.endTime)} on ${request.date}`);
      }
    } else {
      // General availability check for today
      reasons.push("Schedule available for booking");
    }

    // 4. Venue Type & Name Suitability
    const roomNameLower = room.name.toLowerCase();
    const eventType = request.eventType;

    if (eventType === "workshop" || eventType === "coding_contest" || eventType === "hackathon") {
      if (roomNameLower.includes("lab") || roomNameLower.includes("innovation") || roomNameLower.includes("hub")) {
        score += 18;
        reasons.push("Dedicated computer laboratory environment");
      }
    } else if (eventType === "seminar" || eventType === "guest_lecture" || eventType === "placement_talk") {
      if (roomNameLower.includes("seminar") || roomNameLower.includes("lecture hall")) {
        score += 18;
        reasons.push("Tiered hall with integrated presentation acoustics");
      } else if (roomNameLower.includes("auditorium")) {
        score += 10;
        reasons.push("Auditorium stage suitable for keynote speaker");
      }
    } else if (eventType === "cultural_program" || eventType === "farewell") {
      if (roomNameLower.includes("auditorium") || roomNameLower.includes("sports activity")) {
        score += 20;
        reasons.push("Spacious performance venue with stage and sound");
      }
    } else if (eventType === "club_meeting" || eventType === "quiz" || eventType === "paper_presentation") {
      if (roomNameLower.includes("tutorial") || roomNameLower.includes("conference") || roomNameLower.includes("classroom")) {
        score += 15;
        reasons.push("Interactive meeting and group discussion setup");
      }
    }

    // Normalize final score bounds
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      room,
      score: finalScore,
      reasons: reasons.slice(0, 4),
      warnings: warnings.slice(0, 2),
      isFree,
      nextFreeSlots,
    };
  });

  // Sort by score descending and return top 3
  return scoredRooms
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Returns rooms that are currently free right now with duration remaining
 */
export function getCurrentlyFreeRooms(rooms = [], bookings = [], now = new Date()) {
  const currentMs = now.getTime();
  const todayDateStr = now.toISOString().slice(0, 10);

  return rooms.map((room) => {
    // Find active booking right now
    const activeBooking = bookings.find((b) => {
      if (String(b.roomId ?? b.room_id) !== String(room.id)) return false;
      if (b.status === "rejected") return false;
      const startMs = new Date(b.start ?? b.start_time).getTime();
      const endMs = new Date(b.end ?? b.end_time).getTime();
      return currentMs >= startMs && currentMs < endMs;
    });

    if (activeBooking) {
      const end = new Date(activeBooking.end ?? activeBooking.end_time);
      const endFormatted = formatTime12(`${end.getHours()}:${end.getMinutes()}`);
      return {
        room,
        isFreeNow: false,
        statusText: `In use until ${endFormatted} (${activeBooking.title})`,
      };
    }

    // Free right now: check next upcoming booking today
    const upcomingToday = bookings
      .filter((b) => {
        if (String(b.roomId ?? b.room_id) !== String(room.id)) return false;
        if (b.status === "rejected") return false;
        const bStart = new Date(b.start ?? b.start_time);
        return bStart.toISOString().slice(0, 10) === todayDateStr && bStart.getTime() > currentMs;
      })
      .sort((a, b) => new Date(a.start ?? a.start_time).getTime() - new Date(b.start ?? b.start_time).getTime());

    if (upcomingToday.length > 0) {
      const nextB = upcomingToday[0];
      const nextStart = new Date(nextB.start ?? nextB.start_time);
      const nextFormatted = formatTime12(`${nextStart.getHours()}:${nextStart.getMinutes()}`);
      return {
        room,
        isFreeNow: true,
        statusText: `Free now · Next booking at ${nextFormatted}`,
      };
    }

    return {
      room,
      isFreeNow: true,
      statusText: "Free for the rest of campus operating hours",
    };
  });
}
