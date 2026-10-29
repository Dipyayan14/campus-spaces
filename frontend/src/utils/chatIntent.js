// src/utils/chatIntent.js
// Rule-based Natural Language Processing to extract event details and intent
// from user messages without any external AI service or API key.

// Canonical list of supported event types
export const EVENT_TYPES = [
  "seminar",
  "workshop",
  "hackathon",
  "guest_lecture",
  "club_meeting",
  "exam",
  "orientation",
  "cultural_program",
  "farewell",
  "quiz",
  "placement_talk",
  "coding_contest",
  "paper_presentation",
  "networking",
  "other",
];

// Equipment synonyms mapped to canonical database equipment names
const EQUIPMENT_SYNONYMS = [
  { canonical: "projector", patterns: [/\bprojector\b/i, /\bprojection\b/i] },
  { canonical: "microphone", patterns: [/\bmic\b/i, /\bmicrophone\b/i, /\bmics\b/i, /\bcollar mic\b/i] },
  { canonical: "audio", patterns: [/\baudio\b/i, /\bsound system\b/i, /\bspeakers?\b/i, /\bsound\b/i] },
  { canonical: "whiteboard", patterns: [/\bwhiteboard\b/i, /\bboard\b/i, /\bmarker board\b/i] },
  { canonical: "computers", patterns: [/\bcomputers?\b/i, /\bpcs?\b/i, /\blab machines?\b/i, /\blaptops?\b/i] },
  { canonical: "internet", patterns: [/\bwi-?fi\b/i, /\binternet\b/i, /\blan\b/i, /\bnetwork\b/i] },
  { canonical: "power_outlets", patterns: [/\bpower sockets?\b/i, /\bpower outlets?\b/i, /\bplug points?\b/i, /\bcharging\b/i] },
  { canonical: "stage", patterns: [/\bstage\b/i, /\bpodium\b/i, /\bdais\b/i] },
  { canonical: "display", patterns: [/\bdisplay\b/i, /\btv\b/i, /\bscreens?\b/i, /\bmonitors?\b/i] },
  { canonical: "video_conferencing", patterns: [/\bvideo conferenc(ing|e)\b/i, /\bzoom\b/i, /\bvc\b/i, /\bteams\b/i] },
  { canonical: "3d_printer", patterns: [/\b3d printer\b/i, /\b3d printing\b/i] },
  { canonical: "sports_equipment", patterns: [/\bsports equipment\b/i, /\bindoor sports\b/i, /\bgames?\b/i] },
  { canonical: "ac", patterns: [/\bac\b/i, /\bair conditioning\b/i, /\bair conditioner\b/i, /\bcooling\b/i] },
];

/**
 * Normalizes text for keyword matching
 */
function clean(text) {
  return String(text || "").toLowerCase().trim();
}

/**
 * Extracts attendee counts (min/max bounds)
 */
export function extractAttendees(text) {
  const t = clean(text);

  // Range with explicit attendee keyword: "50-100 students", "50 to 100 people"
  const rangeWithKeyword = t.match(/(\d{1,4})\s*(?:-|to|–|—)\s*(\d{1,4})\s*(?:students?|people|persons?|attendees?|participants?|seats?|members?)\b/i);
  if (rangeWithKeyword) {
    const min = parseInt(rangeWithKeyword[1], 10);
    const max = parseInt(rangeWithKeyword[2], 10);
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }

  // Around / about with keyword: "around 80 students", "about 60 people"
  const aroundMatch = t.match(/(?:around|about|approx(?:imately)?|nearly)\s*(\d{1,4})\s*(?:students?|people|persons?|attendees?|participants?|seats?|members?)?/i);
  if (aroundMatch) {
    const val = parseInt(aroundMatch[1], 10);
    return { min: Math.max(1, Math.round(val * 0.9)), max: val };
  }

  // Upper bound: "up to 120 students", "max 120"
  const upToMatch = t.match(/(?:up to|max(?:imum)? of?|at most)\s*(\d{1,4})\s*(?:students?|people|persons?|attendees?|participants?|seats?|members?)?/i);
  if (upToMatch) {
    const max = parseInt(upToMatch[1], 10);
    return { min: 1, max };
  }

  // Lower bound: "100+ students", "at least 50 people"
  const plusMatch = t.match(/(\d{1,4})\s*\+\s*(?:students?|people|persons?|attendees?|participants?|seats?|members?)?/i);
  if (plusMatch) {
    const min = parseInt(plusMatch[1], 10);
    return { min, max: null };
  }

  const atLeastMatch = t.match(/(?:at least|min(?:imum)? of?)\s*(\d{1,4})\s*(?:students?|people|persons?|attendees?|participants?|seats?|members?)?/i);
  if (atLeastMatch) {
    const min = parseInt(atLeastMatch[1], 10);
    return { min, max: null };
  }

  // Single count with explicit attendee keyword: "80 students", "for 60 people"
  const singleWithKeyword = t.match(/(?:for\s+)?(\d{1,4})\s*(?:students?|people|persons?|attendees?|participants?|seats?|members?)\b/i);
  if (singleWithKeyword) {
    const count = parseInt(singleWithKeyword[1], 10);
    return { min: count, max: count };
  }

  // Range without keyword, ensuring not followed by am/pm or time indicator
  const rangeWithoutKeyword = t.match(/(?:for|holds?|capacity of)\s*(\d{1,4})\s*(?:-|to|–|—)\s*(\d{1,4})\b(?!\s*(?:am|pm|:))/i);
  if (rangeWithoutKeyword) {
    const min = parseInt(rangeWithoutKeyword[1], 10);
    const max = parseInt(rangeWithoutKeyword[2], 10);
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }

  return { min: null, max: null };
}

/**
 * Parses natural relative and day-of-week dates relative to a reference date
 */
export function extractDate(text, now = new Date()) {
  const t = clean(text);

  // Today
  if (/\btoday\b/i.test(t)) {
    return formatDateISO(now);
  }

  // Tomorrow
  if (/\btomorrow\b/i.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  }

  // Day after tomorrow
  if (/\bday after tomorrow\b/i.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return formatDateISO(d);
  }

  // Days of the week: "this Saturday", "next Friday", "on Saturday"
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const day = daysOfWeek[i];
    const regex = new RegExp(`\\b(this|next|on)?\\s*${day}\\b`, "i");
    const match = t.match(regex);
    if (match) {
      const modifier = clean(match[1]);
      const currentDay = now.getDay();
      let diff = i - currentDay;

      if (modifier === "next") {
        diff += 7;
      } else if (diff <= 0) {
        // "this Saturday" or "Saturday" refers to the upcoming Saturday
        diff += 7;
      }

      const target = new Date(now);
      target.setDate(target.getDate() + diff);
      return formatDateISO(target);
    }
  }

  // Exact ISO date: YYYY-MM-DD
  const isoMatch = t.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Month + day: "Nov 2", "November 2nd", "2nd Nov"
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  for (let m = 0; m < months.length; m++) {
    const mStr = months[m];
    const mRegex = new RegExp(`\\b${mStr}[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i");
    const mMatch = t.match(mRegex);
    if (mMatch) {
      const dayNum = parseInt(mMatch[1], 10);
      const year = now.getFullYear();
      const target = new Date(year, m, dayNum);
      if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        target.setFullYear(year + 1);
      }
      return formatDateISO(target);
    }
  }

  return null;
}

/**
 * Extracts start and end times in HH:mm 24-hour format
 */
export function extractTimes(text) {
  const t = clean(text);

  // Time range: "2 to 5 PM", "2:00 to 5:00 PM", "2 - 5 PM", "2pm - 5pm", "14:00 to 17:00"
  const rangeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–|—)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const rangeMatch = t.match(rangeRegex);
  if (rangeMatch) {
    let startH = parseInt(rangeMatch[1], 10);
    const startM = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const startMeridiem = rangeMatch[3] ? rangeMatch[3].toLowerCase() : null;

    let endH = parseInt(rangeMatch[4], 10);
    const endM = rangeMatch[5] ? parseInt(rangeMatch[5], 10) : 0;
    const endMeridiem = rangeMatch[6] ? rangeMatch[6].toLowerCase() : null;

    // Resolve meridiem inheritance (e.g. "2 to 5 PM" means 2 PM to 5 PM)
    const effectiveEndMeridiem = endMeridiem || (endH < 12 && endH >= 1 ? "pm" : null);
    const effectiveStartMeridiem = startMeridiem || (effectiveEndMeridiem === "pm" && startH <= endH && startH >= 1 && startH < 12 ? "pm" : "am");

    if (effectiveStartMeridiem === "pm" && startH < 12) startH += 12;
    if (effectiveStartMeridiem === "am" && startH === 12) startH = 0;

    if (effectiveEndMeridiem === "pm" && endH < 12) endH += 12;
    if (effectiveEndMeridiem === "am" && endH === 12) endH = 0;

    const startTime = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    return { startTime, endTime };
  }

  // Broad times of day
  if (/\bmorning\b/i.test(t)) {
    return { startTime: "09:00", endTime: "12:00" };
  }
  if (/\bafternoon\b/i.test(t)) {
    return { startTime: "14:00", endTime: "17:00" };
  }
  if (/\bevening\b/i.test(t)) {
    return { startTime: "16:00", endTime: "18:00" };
  }

  // Single time point: "at 5 PM", "at 10:30 AM" -> assume default 2h duration
  const singleRegex = /(?:at|from|starts?\s+at)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const singleMatch = t.match(singleRegex);
  if (singleMatch) {
    let h = parseInt(singleMatch[1], 10);
    const m = singleMatch[2] ? parseInt(singleMatch[2], 10) : 0;
    const meridiem = singleMatch[3] ? singleMatch[3].toLowerCase() : (h >= 1 && h <= 6 ? "pm" : "am");

    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;

    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const endH = Math.min(18, h + 2); // Default 2 hours
    const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return { startTime, endTime };
  }

  return { startTime: null, endTime: null };
}

/**
 * Extracts requested equipment from message
 */
export function extractEquipment(text) {
  const result = new Set();
  for (const item of EQUIPMENT_SYNONYMS) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        result.add(item.canonical);
        break;
      }
    }
  }
  return Array.from(result);
}

/**
 * Extracts event type from message
 */
export function extractEventType(text) {
  const t = clean(text);

  if (/\b(coding\s+workshop|code\s+workshop|coding\s+contest|hackathon)\b/i.test(t)) {
    return /\bhackathon\b/i.test(t) ? "hackathon" : "workshop";
  }
  if (/\bseminar\b/i.test(t)) return "seminar";
  if (/\bworkshop\b/i.test(t)) return "workshop";
  if (/\bguest\s+lecture\b/i.test(t) || (/\btalk\b/i.test(t) && !/placement/i.test(t))) return "guest_lecture";
  if (/\bclub\s+meeting\b/i.test(t) || /\bmeeting\b/i.test(t)) return "club_meeting";
  if (/\bexams?\b/i.test(t) || /\btest\b/i.test(t) || /\bmidterm\b/i.test(t)) return "exam";
  if (/\borientation\b/i.test(t)) return "orientation";
  if (/\bcultural\b/i.test(t) || /\bfest\b/i.test(t) || /\bconcert\b/i.test(t)) return "cultural_program";
  if (/\bfarewell\b/i.test(t)) return "farewell";
  if (/\bquiz\b/i.test(t) || (/\bcompetition\b/i.test(t) && !/coding/i.test(t))) return "quiz";
  if (/\bplacement\b/i.test(t)) return "placement_talk";
  if (/\bpaper\s+presentation\b/i.test(t)) return "paper_presentation";
  if (/\bnetworking\b/i.test(t)) return "networking";

  return null;
}

/**
 * Categorizes user intent
 */
export function extractIntent(text) {
  const t = clean(text);

  // User explicitly asks what they need or says they don't know
  if (
    /don'?t know what (i|we) need/i.test(t) ||
    /what do (i|we) need/i.test(t) ||
    /help me plan/i.test(t) ||
    /requirements for/i.test(t) ||
    /plan (my|our|an) event/i.test(t) ||
    /plan event/i.test(t) ||
    /suggest requirements/i.test(t) ||
    /event checklist/i.test(t)
  ) {
    return "plan_event";
  }

  // Availability / free right now
  if (
    /what'?s free right now/i.test(t) ||
    /available right now/i.test(t) ||
    /available now/i.test(t) ||
    /free right now/i.test(t) ||
    /free rooms?/i.test(t) ||
    /vacant right now/i.test(t)
  ) {
    return "check_availability";
  }

  // How to / guidance
  if (
    /how (do|can) (i|we) book/i.test(t) ||
    /how to book/i.test(t) ||
    /approval (process|rule|policy)/i.test(t) ||
    /booking steps/i.test(t)
  ) {
    return "how_to";
  }

  // Find room recommendation request
  if (
    /which (hall|room|space|place|auditorium)/i.test(t) ||
    /find (a|me a)? (room|hall|place|space)/i.test(t) ||
    /recommend (a|me a)? (room|hall)/i.test(t) ||
    /need (a|me a)? (room|hall|place|space|lab)/i.test(t) ||
    /organizing (a|an)/i.test(t) ||
    /host (a|an)/i.test(t) ||
    /book (a|an)? (room|hall)/i.test(t) ||
    /where can (i|we) (host|conduct|do)/i.test(t) ||
    extractEventType(t) !== null
  ) {
    return "find_room";
  }

  return "other";
}

/**
 * Core parsing entrypoint: combines extracted fields with previous conversation context
 */
export function extractEventDetails(message, context = {}, now = new Date()) {
  const intent = extractIntent(message);
  const eventType = extractEventType(message) || context.eventType || null;
  const rawAttendees = extractAttendees(message);
  const attendees = {
    min: rawAttendees.min ?? context.attendees?.min ?? null,
    max: rawAttendees.max ?? context.attendees?.max ?? null,
  };

  const newEquip = extractEquipment(message);
  const combinedEquip = Array.from(new Set([...(context.equipment || []), ...newEquip]));

  const date = extractDate(message, now) || context.date || null;
  const rawTimes = extractTimes(message);
  const startTime = rawTimes.startTime || context.startTime || null;
  const endTime = rawTimes.endTime || context.endTime || null;

  // Determine missing fields required for concrete recommendations
  const missing = [];
  if (!attendees.max && !attendees.min) {
    missing.push("attendees");
  }
  if (!date) {
    missing.push("date");
  }
  if (!startTime || !endTime) {
    missing.push("time");
  }

  return {
    intent,
    eventType,
    attendees,
    equipment: combinedEquip,
    date,
    startTime,
    endTime,
    missing,
  };
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
