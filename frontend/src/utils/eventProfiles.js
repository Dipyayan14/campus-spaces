// src/utils/eventProfiles.js
// Event knowledge base detailing typical requirements, equipment, layout,
// and practical campus planning advice for judges and organizers.

export const EVENT_PROFILES = {
  workshop: {
    label: "Hands-on Workshop",
    typicalSeats: { min: 25, max: 60 },
    neededEquipment: ["computers", "projector", "power_outlets"],
    niceToHave: ["whiteboard", "internet", "microphone"],
    layoutTip: "Cluster or lab bench layout so participants can practice together and plug in laptops.",
    durationHint: "2 to 4 hours",
    notes: [
      "Ensure participants have reliable power outlets or charged laptops.",
      "A computer lab or innovation hub works best for interactive software sessions.",
      "Reserve 15 minutes before the session to test projection and network access.",
    ],
  },
  seminar: {
    label: "Seminar / Presentation",
    typicalSeats: { min: 40, max: 120 },
    neededEquipment: ["projector", "microphone", "audio"],
    niceToHave: ["whiteboard", "display"],
    layoutTip: "Theater or tiered lecture seating with good sightlines to the presentation screen.",
    durationHint: "1.5 to 3 hours",
    notes: [
      "Test both the wireless microphone and HDMI/display adapter beforehand.",
      "Select a seminar or lecture hall with built-in amplification for clear acoustics.",
      "Keep a handheld or roving mic ready for Q&A from the audience.",
    ],
  },
  guest_lecture: {
    label: "Guest Lecture",
    typicalSeats: { min: 50, max: 200 },
    neededEquipment: ["projector", "microphone", "audio", "stage"],
    niceToHave: ["whiteboard", "display"],
    layoutTip: "Tiered auditorium or lecture hall with a clear podium/stage for the speaker.",
    durationHint: "1 to 2 hours",
    notes: [
      "A dedicated dais or stage keeps the guest speaker visible to larger crowds.",
      "Have a student coordinator escort the guest from reception 15 minutes prior.",
      "Ensure air conditioning or ventilation is active before guests arrive.",
    ],
  },
  hackathon: {
    label: "Hackathon / Sprint",
    typicalSeats: { min: 40, max: 100 },
    neededEquipment: ["computers", "internet", "power_outlets", "projector"],
    niceToHave: ["audio", "whiteboard"],
    layoutTip: "Spacious flat seating with collaborative tables and dense power distribution.",
    durationHint: "6 to 24 hours",
    notes: [
      "Continuous high-speed Wi-Fi and power strips are critical.",
      "Check with facility staff for extended evening or overnight building access.",
      "Designate separate quiet rest zones and mentor consultation corners.",
    ],
  },
  coding_contest: {
    label: "Coding Contest / Lab Exam",
    typicalSeats: { min: 30, max: 80 },
    neededEquipment: ["computers", "internet", "projector"],
    niceToHave: ["power_outlets", "whiteboard"],
    layoutTip: "Standard computer lab rows with partition dividers to prevent screen peeking.",
    durationHint: "2 to 3 hours",
    notes: [
      "Verify IDE installations and compiler permissions across lab machines.",
      "Coordinate with the IT team to whitelist contest platforms or portals.",
      "Keep spare workstations ready in case of hardware glitch during the round.",
    ],
  },
  club_meeting: {
    label: "Student Club Meeting",
    typicalSeats: { min: 15, max: 40 },
    neededEquipment: ["whiteboard", "display"],
    niceToHave: ["projector", "power_outlets"],
    layoutTip: "U-shape, conference table, or circular seating to encourage team discussion.",
    durationHint: "1 to 2 hours",
    notes: [
      "Tutorial rooms or study halls give an informal, productive environment.",
      "Whiteboards are ideal for brainstorming agenda points and tasks.",
      "No heavy AV setup is needed unless presenting external slides.",
    ],
  },
  exam: {
    label: "Academic Examination",
    typicalSeats: { min: 30, max: 150 },
    neededEquipment: ["whiteboard"],
    niceToHave: ["audio"],
    layoutTip: "Widely spaced single desks or alternate-seat lecture rows with clear invigilator aisles.",
    durationHint: "2 to 3 hours",
    notes: [
      "Requires exam cell coordination and official approval.",
      "Ensure clock visibility and a clean whiteboard for time announcements.",
      "Check quiet zone surroundings so outside campus noise does not interfere.",
    ],
  },
  orientation: {
    label: "Orientation / Induction",
    typicalSeats: { min: 80, max: 300 },
    neededEquipment: ["projector", "microphone", "audio", "stage"],
    niceToHave: ["display"],
    layoutTip: "Auditorium or large seminar hall with clear central aisles for movement.",
    durationHint: "2 to 4 hours",
    notes: [
      "Expect high attendance; select a hall with at least 15% surplus seats.",
      "Check sound levels at the back rows so all new students can hear clearly.",
      "Display campus maps and welcome banners on screens upon entry.",
    ],
  },
  cultural_program: {
    label: "Cultural Program / Fest",
    typicalSeats: { min: 100, max: 500 },
    neededEquipment: ["stage", "audio", "microphone"],
    niceToHave: ["projector", "sports_equipment"],
    layoutTip: "Auditorium or open activity hall with elevated stage and green rooms / backstage wings.",
    durationHint: "3 to 5 hours",
    notes: [
      "Check stage lighting, multi-mic inputs, and backstage changing areas.",
      "Auditorium or Sports Hall gives required clearance for performance acts.",
      "Coordinate security and crowd entry queue management outside the hall.",
    ],
  },
  farewell: {
    label: "Farewell / Felicitation",
    typicalSeats: { min: 60, max: 200 },
    neededEquipment: ["projector", "microphone", "audio", "stage"],
    niceToHave: ["display"],
    layoutTip: "Tiered auditorium or banquet-style hall with space for photo moments.",
    durationHint: "2.5 to 4 hours",
    notes: [
      "Ensure high quality projection for memory montages and video tributes.",
      "Stage space is needed for mementos and faculty speeches.",
      "Leave 30 minutes at the end for group photographs on stage.",
    ],
  },
  quiz: {
    label: "Campus Quiz Competition",
    typicalSeats: { min: 30, max: 100 },
    neededEquipment: ["projector", "audio", "microphone"],
    niceToHave: ["whiteboard", "display"],
    layoutTip: "Tiered hall with front stage tables for finalist teams and audience rows behind.",
    durationHint: "2 to 3 hours",
    notes: [
      "Projector is essential for displaying question rounds and live scoreboards.",
      "Have at least 2 microphones: one for the quizmaster and one for team answers.",
      "Verify buzzer or clicker connectivity if using digital quiz software.",
    ],
  },
  placement_talk: {
    label: "Pre-Placement Talk (PPT)",
    typicalSeats: { min: 50, max: 150 },
    neededEquipment: ["projector", "microphone", "audio"],
    niceToHave: ["display", "video_conferencing"],
    layoutTip: "Formal lecture theater with clear presentation screen and professional ambiance.",
    durationHint: "1.5 to 2.5 hours",
    notes: [
      "Select a premier venue like Seminar Hall A or Lecture Hall B to host corporate recruiters.",
      "Test video conferencing link if remote panelists are dialing in.",
      "Have formal sign-in desks set up at the hall entrance.",
    ],
  },
  paper_presentation: {
    label: "Research Paper Presentation",
    typicalSeats: { min: 20, max: 60 },
    neededEquipment: ["projector", "display", "whiteboard"],
    niceToHave: ["microphone", "audio"],
    layoutTip: "Conference room or seminar classroom with presentation podium and jury evaluation table.",
    durationHint: "2 to 4 hours",
    notes: [
      "Conference Room or Faculty Meeting Room offers an executive academic setting.",
      "Ensure easy laptop connectivity (HDMI / USB-C / DisplayPort).",
      "Keep a timer on the screen or table to maintain the strict 10-minute presentation limit.",
    ],
  },
  networking: {
    label: "Networking / Mixer",
    typicalSeats: { min: 25, max: 60 },
    neededEquipment: ["display"],
    niceToHave: ["audio", "power_outlets"],
    layoutTip: "Open floor plan or movable chairs encouraging standing conversation.",
    durationHint: "1.5 to 2.5 hours",
    notes: [
      "An Innovation Hub or Activity Hall allows attendees to mingle freely.",
      "Provide light background music via modest sound system if permitted.",
      "Designate a corner for registration badges and refreshments.",
    ],
  },
  other: {
    label: "General Campus Event",
    typicalSeats: { min: 20, max: 80 },
    neededEquipment: ["projector"],
    niceToHave: ["whiteboard", "audio"],
    layoutTip: "Standard classroom or seminar setup suitable for multi-purpose activities.",
    durationHint: "1 to 2 hours",
    notes: [
      "Specify anticipated participant numbers for optimal room sizing.",
      "Review equipment checklist based on the planned agenda.",
    ],
  },
};

/**
 * Returns event profile for a given event type key (defaults to 'other')
 */
export function getEventProfile(type) {
  if (!type) return EVENT_PROFILES.other;
  const key = String(type).toLowerCase().replace(/[-\s]/g, "_");
  return EVENT_PROFILES[key] || EVENT_PROFILES.other;
}

