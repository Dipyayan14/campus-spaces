// src/mockData.js
// Realistic, time-based sample data for rooms, bookings, and facility maintenance.
// Sample times are generated relative to the current date and time.

/**
 * Returns a local ISO-like string "YYYY-MM-DDTHH:mm" for a given day offset and time.
 * @param {number} dayOffset - Offset in days from today (e.g. 0 for today, -1 for yesterday, -7 for last week).
 * @param {number} hour - Hour (0-23).
 * @param {number} minute - Minute (0-59).
 */
export function at(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export const rooms = [
    { id: 1, name: "Main Auditorium", capacity: 400, equipment: ["projector", "mic", "AC"] },
    { id: 2, name: "CSE Lab 1", capacity: 60, equipment: ["computers", "projector"] },
    { id: 3, name: "Seminar Hall", capacity: 120, equipment: ["projector", "mic"] },
    { id: 4, name: "Classroom 101", capacity: 70, equipment: ["projector"] },
];

export const demoUsers = [
  { id: "u1", name: "Rahul Sharma", role: "student" },
  { id: "u2", name: "Coding Club Lead", role: "club" },
  { id: "u3", name: "Prof. Ananya Sen", role: "faculty" },
  { id: "u4", name: "Admin Operations", role: "admin" },
  { id: "u5", name: "Exam Cell Officer", role: "exam_cell" },
];

/**
 * Generates initial bookings relative to the current local time.
 * Ensures 2-3 rooms are in use right now, some free now, some scheduled later.
 */
export function generateInitialBookings() {
  const now = new Date();
  const curH = now.getHours();
  // Determine an active time block covering right now
  let activeStartH;
  let activeEndH;

  if (curH < 8) {
    // Early morning: start at current hour and extend past 8 AM into campus hours
    activeStartH = curH;
    activeEndH = 10;
  } else if (curH >= 17) {
    // Evening: start in campus hours and extend to current hour + 1
    activeStartH = 16;
    activeEndH = Math.min(23, curH + 1);
  } else {
    // Regular campus hours
    activeStartH = Math.max(8, curH - 1);
    activeEndH = Math.min(18, curH + 2);
  }

  return [
    // --- TODAY: Rooms in use right now (2 to 3 rooms) ---
    {
      id: "b_today_1",
      roomId: "r1",
      title: "CS301 Data Structures Lecture",
      type: "class",
      start: at(0, activeStartH, 0),
      end: at(0, activeEndH, 0),
      status: "approved",
      requestedBy: "Prof. Ananya Sen",
    },
    {
      id: "b_today_2",
      roomId: "r2",
      title: "Networks Systems Lab",
      type: "lab",
      start: at(0, activeStartH, 0),
      end: at(0, Math.min(23, activeEndH + 1), 0),
      status: "approved",
      requestedBy: "Prof. Ananya Sen",
    },
    {
      id: "b_today_3",
      roomId: "r3",
      title: "Algorithms Review Seminar",
      type: "class",
      start: at(0, activeStartH, 0),
      end: at(0, activeEndH, 0),
      status: "approved",
      requestedBy: "Prof. Vikram Das",
    },

    // --- TODAY: Room r4 free now, booking later today ---
    {
      id: "b_today_4",
      roomId: "r4",
      title: "Distinguished Speaker Series",
      type: "event",
      start: at(0, Math.min(17, Math.max(activeEndH, 14)), 0),
      end: at(0, Math.min(18, Math.max(activeEndH + 2, 16)), 0),
      status: "approved",
      requestedBy: "Coding Club Lead",
    },

    // --- TODAY: Clashing booking in room r1 (pending review) ---
    {
      id: "b_today_clash",
      roomId: "r1",
      title: "AI Workshop Prep Session",
      type: "event",
      start: at(0, activeStartH, 30),
      end: at(0, activeEndH, 0),
      status: "pending",
      requestedBy: "Rahul Sharma",
    },

    // --- TODAY: Earlier / Completed or rejected booking ---
    {
      id: "b_today_5",
      roomId: "r5",
      title: "Student Project Discussion",
      type: "event",
      start: at(0, 8, 30),
      end: at(0, 9, 30),
      status: "rejected",
      requestedBy: "Rahul Sharma",
    },

    // --- YESTERDAY (-1) ---
    {
      id: "b_yest_1",
      roomId: "r1",
      title: "Midterm Examination Review",
      type: "exam",
      start: at(-1, 9, 0),
      end: at(-1, 12, 0),
      status: "approved",
      requestedBy: "Exam Cell Officer",
    },
    {
      id: "b_yest_2",
      roomId: "r2",
      title: "Operating Systems Practicals",
      type: "lab",
      start: at(-1, 14, 0),
      end: at(-1, 17, 0),
      status: "approved",
      requestedBy: "Prof. Ananya Sen",
    },
    {
      id: "b_yest_3",
      roomId: "r4",
      title: "Cultural Club Rehearsal",
      type: "event",
      start: at(-1, 15, 0),
      end: at(-1, 17, 30),
      status: "approved",
      requestedBy: "Coding Club Lead",
    },

    // --- TOMORROW (+1) ---
    {
      id: "b_tomo_1",
      roomId: "r1",
      title: "Physics Elective Lecture",
      type: "class",
      start: at(1, 10, 0),
      end: at(1, 12, 0),
      status: "approved",
      requestedBy: "Prof. Vikram Das",
    },
    {
      id: "b_tomo_2",
      roomId: "r4",
      title: "Annual Hackathon Orientation",
      type: "event",
      start: at(1, 13, 0),
      end: at(1, 17, 0),
      status: "pending",
      requestedBy: "Coding Club Lead",
    },
    {
      id: "b_tomo_3",
      roomId: "r3",
      title: "Faculty Senate Meeting",
      type: "class",
      start: at(1, 14, 0),
      end: at(1, 16, 0),
      status: "approved",
      requestedBy: "Prof. Ananya Sen",
    },

    // --- SAME WEEKDAY LAST WEEK (-7) for historical trend comparison ---
    {
      id: "b_lastweek_1",
      roomId: "r1",
      title: "CS301 Previous Week Lecture",
      type: "class",
      start: at(-7, 8, 30),
      end: at(-7, 10, 30),
      status: "approved",
      requestedBy: "Prof. Ananya Sen",
    },
    {
      id: "b_lastweek_2",
      roomId: "r2",
      title: "Networks Lab Session A",
      type: "lab",
      start: at(-7, 10, 0),
      end: at(-7, 12, 30),
      status: "approved",
      requestedBy: "Prof. Ananya Sen",
    },
    {
      id: "b_lastweek_3",
      roomId: "r3",
      title: "Department Seminar",
      type: "class",
      start: at(-7, 13, 0),
      end: at(-7, 15, 0),
      status: "approved",
      requestedBy: "Prof. Vikram Das",
    },
    {
      id: "b_lastweek_4",
      roomId: "r4",
      title: "Guest Lecture Series",
      type: "event",
      start: at(-7, 14, 0),
      end: at(-7, 16, 30),
      status: "approved",
      requestedBy: "Coding Club Lead",
    },
    {
      id: "b_lastweek_5",
      roomId: "r5",
      title: "Study Circle",
      type: "event",
      start: at(-7, 9, 0),
      end: at(-7, 11, 0),
      status: "approved",
      requestedBy: "Rahul Sharma",
    },
  ];
}

/**
 * Generates initial facility maintenance log entries.
 * Relative timestamps around recent days.
 */
export function generateInitialMaintenanceLogs() {
  return [
    {
      id: "m1",
      roomId: "r1",
      issue: "Projector bulb flickering intermittently during lectures",
      priority: "medium",
      status: "open",
      reportedBy: "Prof. Ananya Sen",
      reportedAt: at(-1, 9, 15),
      updatedAt: at(-1, 9, 15),
    },
    {
      id: "m2",
      roomId: "r2",
      issue: "AC cooling failure in south corner near workstations 10-14",
      priority: "high",
      status: "in_progress",
      reportedBy: "Lab Technician Ramesh",
      reportedAt: at(-2, 11, 30),
      updatedAt: at(0, 8, 45),
    },
    {
      id: "m3",
      roomId: "r4",
      issue: "Wireless handheld mic #2 audio cutting out intermittently",
      priority: "medium",
      status: "open",
      reportedBy: "Coding Club Lead",
      reportedAt: at(0, 8, 10),
      updatedAt: at(0, 8, 10),
    },
    {
      id: "m4",
      roomId: "r3",
      issue: "Broken chair armrests in row 4, seats 7 and 8",
      priority: "low",
      status: "open",
      reportedBy: "Prof. Vikram Das",
      reportedAt: at(-3, 14, 0),
      updatedAt: at(-3, 14, 0),
    },
    {
      id: "m5",
      roomId: "r2",
      issue: "Network wall port dead (RJ45 loose connector) at Bench C",
      priority: "high",
      status: "in_progress",
      reportedBy: "Lab Assistant Meera",
      reportedAt: at(-1, 16, 20),
      updatedAt: at(0, 9, 0),
    },
    {
      id: "m6",
      roomId: "r5",
      issue: "Whiteboard marker & eraser supply exhausted",
      priority: "low",
      status: "resolved",
      reportedBy: "Rahul Sharma",
      reportedAt: at(-4, 10, 0),
      updatedAt: at(-1, 11, 0),
    },
    {
      id: "m7",
      roomId: "r1",
      issue: "Podium HDMI connection audio buzzing on PA output",
      priority: "medium",
      status: "resolved",
      reportedBy: "Prof. Ananya Sen",
      reportedAt: at(-5, 14, 30),
      updatedAt: at(-2, 16, 0),
    },
    {
      id: "m8",
      roomId: "r4",
      issue: "Stage floodlight bulb replacement required on left truss",
      priority: "low",
      status: "open",
      reportedBy: "Campus Facilities Team",
      reportedAt: at(-1, 18, 0),
      updatedAt: at(-1, 18, 0),
    },
    {
      id: "m9",
      roomId: "r3",
      issue: "Entrance door magnetic latch sticking on close",
      priority: "low",
      status: "resolved",
      reportedBy: "Security Desk",
      reportedAt: at(-6, 8, 0),
      updatedAt: at(-4, 15, 30),
    },
    {
      id: "m10",
      roomId: "r5",
      issue: "Wall display HDMI cable damaged at connector head",
      priority: "medium",
      status: "in_progress",
      reportedBy: "Prof. Vikram Das",
      reportedAt: at(-2, 13, 40),
      updatedAt: at(0, 7, 50),
    },
  ];
}

// Initial exported lists
export const bookings = generateInitialBookings();
export const maintenanceLogs = generateInitialMaintenanceLogs();
