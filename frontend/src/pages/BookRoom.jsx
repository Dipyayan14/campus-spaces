// src/pages/BookRoom.jsx
// Pixel-accurate implementation matching the Stitch Book a Room design (book_a_room_campus_spaces).
// Includes 7:5 responsive grid, clash detection & priority bump warnings,
// and the "Smart Alternative Suggestions" panel using suggestRooms() from api.js.

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRooms, getBookings, createBooking, suggestRooms } from "../api";
import { checkBookingClash, TYPE_PRIORITY } from "../utils/clash";
import Toast from "../components/Toast";

export default function BookRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("event");
  const [date, setDate] = useState("2026-11-02");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [attendance, setAttendance] = useState(40);
  const [selectedEquipment, setSelectedEquipment] = useState(["projector"]);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Feedback states
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role permissions
  const canBookExam = user?.role === "exam_cell" || user?.role === "faculty" || user?.role === "admin";

  // Load initial rooms & bookings
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [roomsData, bookingsData] = await Promise.all([
          getRooms(),
          getBookings(),
        ]);
        setRooms(roomsData);
        setExistingBookings(bookingsData);
        if (roomsData.length > 0) {
          setRoomId(String(roomsData[0].id));
        }
      } catch (err) {
        setErrorMessage("Failed to load campus facilities. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Compute full ISO start and end timestamps
  const startDateTime = useMemo(() => {
    if (!date || !startTime) return null;
    return `${date}T${startTime}`;
  }, [date, startTime]);

  const endDateTime = useMemo(() => {
    if (!date || !endTime) return null;
    return `${date}T${endTime}`;
  }, [date, endTime]);

  // Clash detection logic via src/utils/clash.js
  const clashInfo = useMemo(() => {
    if (!roomId || !startDateTime || !endDateTime) {
      return { hasClash: false, clashingBookings: [], canBump: false, bumpedTitles: [] };
    }
    return checkBookingClash(
      { roomId, type, start: startDateTime, end: endDateTime },
      existingBookings
    );
  }, [roomId, type, startDateTime, endDateTime, existingBookings]);

  // Validate time ordering
  const isTimeValid = useMemo(() => {
    if (!startTime || !endTime) return false;
    return startTime < endTime;
  }, [startTime, endTime]);

  // Fetch smart room suggestions when attendance, equipment, or time changes
  useEffect(() => {
    let isCurrent = true;
    async function fetchSuggestions() {
      if (!date || !startTime || !endTime || !isTimeValid) return;
      setLoadingSuggestions(true);
      try {
        const results = await suggestRooms({
          capacity: Number(attendance) || 0,
          equipment: selectedEquipment,
          start: `${date}T${startTime}`,
          end: `${date}T${endTime}`,
        });

        if (isCurrent) {
          // Sort smallest fitting room first, limit to 3
          const sorted = [...results]
            .sort((a, b) => a.capacity - b.capacity)
            .slice(0, 3);
          setSuggestions(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch room recommendations", err);
      } finally {
        if (isCurrent) setLoadingSuggestions(false);
      }
    }

    const timer = setTimeout(fetchSuggestions, 200);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [attendance, selectedEquipment, date, startTime, endTime, isTimeValid]);

  // Equipment toggle handler
  const handleEquipmentToggle = (item) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Event title is required.");
      return;
    }
    if (!roomId) {
      setErrorMessage("Please select a room.");
      return;
    }
    if (!isTimeValid) {
      setErrorMessage("End time must be strictly after start time.");
      return;
    }

    // Clash enforcement
    if (clashInfo.hasClash && !clashInfo.canBump) {
      setErrorMessage(
        "Cannot submit: schedule clash with existing booking of equal or higher priority."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking({
        roomId: isNaN(roomId) ? roomId : Number(roomId),
        title: title.trim(),
        type: type,
        start: startDateTime,
        end: endDateTime,
        status: "pending",
        requestedBy: user?.name || "Campus Member",
      });

      setToastMessage("Reservation request submitted successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit booking.");
      setIsSubmitting(false);
    }
  };

  const selectedRoomDetails = rooms.find((r) => String(r.id) === String(roomId));

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 font-['Inter',sans-serif]">
      {/* Toast Notification */}
      <Toast message={toastMessage} type="success" onClose={() => setToastMessage("")} />

      {/* Breadcrumb & Status Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hover:text-[#4F46E5] transition flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Spaces Portal</span>
          </button>
          <span className="text-slate-300">/</span>
          <span>Reservations</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">New Space Booking</span>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-semibold bg-[#EFF4FF] px-3 py-1 rounded-full text-[#3525CD] border border-indigo-100">
          <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" />
          <span>Academic Term: Fall 2026 • Week 10</span>
        </div>
      </div>

      {/* 7:5 / Split 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Reservation Form (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          {/* Form Header */}
          <div className="border-b border-slate-200/80 pb-5 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-[#0B1C30] tracking-tight">
                Book a Campus Space
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DAE2FD] text-[#131B2E]">
                Priority Form
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Submit your request for smart classrooms, auditoriums, and laboratory spaces.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Room Selector */}
            <div>
              <label
                htmlFor="space-select"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
              >
                Campus Space / Room <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  meeting_room
                </span>
                <select
                  id="space-select"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 appearance-none transition cursor-pointer"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Cap: {room.capacity}) &bull; Equipment: {room.equipment.join(", ")}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                  unfold_more
                </span>
              </div>
              {selectedRoomDetails && (
                <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#3525CD]">
                    info
                  </span>
                  <span>
                    Capacity: {selectedRoomDetails.capacity} seats &bull; Equipment:{" "}
                    {selectedRoomDetails.equipment.join(", ")}
                  </span>
                </p>
              )}
            </div>

            {/* 2. Event Title Input */}
            <div>
              <label
                htmlFor="event-title"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
              >
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                id="event-title"
                type="text"
                required
                placeholder="e.g., Guest Lecture Series in Quantum Systems"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
              />
            </div>

            {/* 3. Booking Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Booking Classification <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Exam Option (Restricted) */}
                <label
                  className={`cursor-pointer ${
                    !canBookExam ? "opacity-45 cursor-not-allowed" : ""
                  }`}
                  title={!canBookExam ? "Restricted to Faculty, Admin & Exam Cell" : "Priority 4"}
                >
                  <input
                    type="radio"
                    name="booking-type"
                    value="exam"
                    disabled={!canBookExam}
                    checked={type === "exam"}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">assignment</span>
                    <span>Exam (P4)</span>
                  </div>
                </label>

                {/* Class Option */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="booking-type"
                    value="class"
                    checked={type === "class"}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">school</span>
                    <span>Class (P3)</span>
                  </div>
                </label>

                {/* Lab Option */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="booking-type"
                    value="lab"
                    checked={type === "lab"}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">science</span>
                    <span>Lab (P2)</span>
                  </div>
                </label>

                {/* Event Option */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="booking-type"
                    value="event"
                    checked={type === "event"}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-orange-50 peer-checked:border-orange-500 peer-checked:text-orange-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">groups</span>
                    <span>Event (P1)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Date Picker */}
            <div>
              <label
                htmlFor="event-date"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
              >
                Reservation Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  calendar_month
                </span>
                <input
                  id="event-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
                />
              </div>
            </div>

            {/* 5. Time Pickers (Start & End) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="time-start"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                >
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    schedule
                  </span>
                  <input
                    id="time-start"
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="time-end"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"
                >
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    timelapse
                  </span>
                  <input
                    id="time-end"
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
                  />
                </div>
              </div>
            </div>

            {/* 6. Attendance & Equipment Preferences */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5">
                  <label
                    htmlFor="attendance"
                    className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1"
                  >
                    Expected Attendance
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      person
                    </span>
                    <input
                      id="attendance"
                      type="number"
                      min="1"
                      value={attendance}
                      onChange={(e) => setAttendance(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] transition"
                    />
                  </div>
                </div>

                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Required Equipment
                  </label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {["projector", "mic", "AC", "computers"].map((item) => {
                      const checked = selectedEquipment.includes(item);
                      return (
                        <label
                          key={item}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer select-none transition ${
                            checked
                              ? "bg-indigo-50 border-indigo-300 text-[#3525CD]"
                              : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleEquipmentToggle(item)}
                            className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] w-3 h-3 cursor-pointer"
                          />
                          <span className="capitalize">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Red Clash Alert Box */}
            {clashInfo.hasClash && (
              <div className="border border-red-400 bg-red-50 text-red-900 rounded-xl p-4 flex gap-3.5 items-start shadow-xs">
                <span className="material-symbols-outlined text-red-600 text-[24px] shrink-0 mt-0.5">
                  warning
                </span>
                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-sm text-red-900">
                    Schedule Clash Detected
                  </h3>
                  <p className="text-red-800">
                    This room is already reserved for:{" "}
                    <span className="font-semibold underline">
                      {clashInfo.bumpedTitles.join(", ")}
                    </span>
                    .
                  </p>
                  <div className="flex items-center gap-1.5 text-red-700 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>
                      {clashInfo.canBump
                        ? "Higher priority booking detected: bumping permitted."
                        : "Blocked: Equal or higher priority reservation already exists."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Orange Note Alert Box (Priority Bump Warning) */}
            {clashInfo.hasClash && clashInfo.canBump && (
              <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-xl p-4 flex gap-3.5 items-start">
                <span className="material-symbols-outlined text-amber-700 text-[24px] shrink-0 mt-0.5">
                  shield
                </span>
                <div className="space-y-1 text-xs">
                  <h3 className="font-bold text-sm text-amber-900">
                    Priority Override Active
                  </h3>
                  <p className="text-amber-800 font-medium">
                    This will bump:{" "}
                    <span className="font-bold">{clashInfo.bumpedTitles.join(", ")}</span>.
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    Your reservation has a higher priority rank ({TYPE_PRIORITY[type]} &gt;{" "}
                    {clashInfo.highestClashPriority}). The conflicting booking will be superseded upon confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (clashInfo.hasClash && !clashInfo.canBump)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#3525CD] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? "Submitting..." : "Submit Reservation Request"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT COLUMN: Smart Alternative Suggestions Panel (5 Cols) */}
        <aside className="lg:col-span-5 space-y-4">
          {/* Header Container */}
          <div className="bg-[#EFF4FF] p-5 rounded-2xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-[#0B1C30] leading-tight">
                  Smart Alternative Suggestions
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Spaces matching {attendance ? `${attendance}+ seats` : "your requirements"} on{" "}
                  <span className="font-semibold text-slate-700">{date}</span>.
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs font-semibold text-[#3525CD]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">tune</span>
                <span>Auto-filtered by availability</span>
              </span>
              <span className="text-slate-500 font-normal">
                {suggestions.length} {suggestions.length === 1 ? "match" : "matches"} found
              </span>
            </div>
          </div>

          {/* Suggestion Cards */}
          {loadingSuggestions ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <div className="w-7 h-7 border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Checking room schedules...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              <span className="material-symbols-outlined text-3xl text-slate-400 block mb-1">
                domain_disabled
              </span>
              No alternative rooms match the requested capacity and equipment window.
            </div>
          ) : (
            suggestions.map((roomItem, idx) => {
              const isCurrentlySelected = String(roomItem.id) === String(roomId);

              return (
                <article
                  key={roomItem.id}
                  className={`bg-white rounded-xl border p-4.5 transition-all duration-150 shadow-2xs group ${
                    isCurrentlySelected
                      ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                      : "border-slate-200 hover:border-[#4F46E5]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {idx === 0 ? "Optimal Match" : "Available Space"}
                        </span>
                      </div>
                      <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold text-slate-800 mt-1 group-hover:text-[#4F46E5] transition-colors">
                        {roomItem.name}
                      </h3>
                      <p className="text-xs text-slate-500">Academic Wing &bull; Free slot</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-base text-[#4F46E5] block leading-tight">
                        {roomItem.capacity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Capacity</span>
                    </div>
                  </div>

                  {/* Free Window & Equipment Chips */}
                  <div className="my-3 bg-slate-50 rounded-lg p-2.5 space-y-1.5 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="material-symbols-outlined text-[15px] text-[#3525CD]">
                          schedule
                        </span>
                        <span>Free Window:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {startTime} – {endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 flex-wrap">
                      {roomItem.equipment.map((eq) => (
                        <span
                          key={eq}
                          className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] text-slate-600 capitalize font-medium"
                        >
                          <span className="material-symbols-outlined text-[13px] text-[#4F46E5]">
                            check
                          </span>
                          <span>{eq}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Use this room button */}
                  <button
                    type="button"
                    onClick={() => {
                      setRoomId(String(roomItem.id));
                      setToastMessage(`Selected ${roomItem.name}!`);
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentlySelected
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : "bg-[#EFF4FF] text-[#3525CD] hover:bg-[#4F46E5] hover:text-white"
                    }`}
                  >
                    <span>{isCurrentlySelected ? "Currently Selected" : "Use this room"}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isCurrentlySelected ? "check" : "check_circle"}
                    </span>
                  </button>
                </article>
              );
            })
          )}
        </aside>
      </div>
    </div>
  );
}
