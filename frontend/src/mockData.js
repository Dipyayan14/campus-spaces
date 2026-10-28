// Mock data for rooms, initial bookings, and demo users
// Matching API Contract data shapes:
// Room: { id, name, capacity, equipment: string[] }
// Booking: { id, roomId, title, type, start, end, status, requestedBy }
// Types: exam | class | lab | event
// Status: pending | approved | rejected
// Roles: student | club | faculty | admin | exam_cell

// Helper to format ISO date strings for today and nearby days
const today = new Date();
const formatDate = (offsetDays, hour, minute = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const rooms = [
  {
    id: "r1",
    name: "Lecture Hall A-101",
    capacity: 120,
    equipment: ["Projector", "Sound System", "Mic", "Podium", "AC"],
  },
  {
    id: "r2",
    name: "Computer Science Lab 2",
    capacity: 45,
    equipment: ["Lab Computers", "Projector", "AC", "High-Speed LAN"],
  },
  {
    id: "r3",
    name: "Seminar Hall B",
    capacity: 80,
    equipment: ["Smart Board", "Projector", "Video Conferencing", "AC"],
  },
  {
    id: "r4",
    name: "Campus Auditorium",
    capacity: 350,
    equipment: ["Stage Lights", "Sound System", "Projector", "Wireless Mics"],
  },
  {
    id: "r5",
    name: "Discussion Room 302",
    capacity: 15,
    equipment: ["Whiteboard", "TV Screen", "Conference Table"],
  },
];

export const demoUsers = [
  { id: "u1", name: "Rahul Sharma (Student)", role: "student" },
  { id: "u2", name: "Robotics Club Lead", role: "club" },
  { id: "u3", name: "Prof. Ananya Sen", role: "faculty" },
  { id: "u4", name: "Central Admin Office", role: "admin" },
  { id: "u5", name: "Exam Cell Controller", role: "exam_cell" },
];

export const bookings = [
  {
    id: "b1",
    roomId: "r1",
    title: "CS301 Midterm Examination",
    type: "exam",
    start: formatDate(0, 9, 0),
    end: formatDate(0, 12, 0),
    status: "approved",
    requestedBy: "Exam Cell Controller",
  },
  {
    id: "b2",
    roomId: "r1",
    title: "Operating Systems Lecture",
    type: "class",
    start: formatDate(0, 14, 0),
    end: formatDate(0, 16, 0),
    status: "approved",
    requestedBy: "Prof. Ananya Sen",
  },
  {
    id: "b3",
    roomId: "r2",
    title: "Networks Practical Lab",
    type: "lab",
    start: formatDate(1, 10, 0),
    end: formatDate(1, 13, 0),
    status: "approved",
    requestedBy: "Prof. Ananya Sen",
  },
  {
    id: "b4",
    roomId: "r4",
    title: "Annual Hackathon Opening Ceremony",
    type: "event",
    start: formatDate(2, 11, 0),
    end: formatDate(2, 15, 0),
    status: "pending",
    requestedBy: "Robotics Club Lead",
  },
  {
    id: "b5",
    roomId: "r3",
    title: "Guest Speaker: AI in Healthcare",
    type: "event",
    start: formatDate(1, 15, 0),
    end: formatDate(1, 17, 0),
    status: "pending",
    requestedBy: "Robotics Club Lead",
  },
  {
    id: "b6",
    roomId: "r5",
    title: "Student Council Meeting",
    type: "event",
    start: formatDate(0, 16, 30),
    end: formatDate(0, 18, 0),
    status: "rejected",
    requestedBy: "Rahul Sharma (Student)",
  },
];
