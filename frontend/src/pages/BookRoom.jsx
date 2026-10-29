
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRooms, getBookings, createBooking } from "../api";
import { checkBookingClash, TYPE_PRIORITY } from "../utils/clash";
import Toast from "../components/Toast";

export default function BookRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("event");

  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [attendance, setAttendance] = useState(40);
  const [selectedEquipment, setSelectedEquipment] = useState(["projector"]);

  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canBookExam = [
    "exam_cell",
    "faculty",
    "admin",
    "venue_admin",
    "super_admin",
  ].includes(String(user?.role || "").toLowerCase());

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [roomsData, bookingsData] = await Promise.all([
          getRooms(),
          getBookings(),
        ]);

        if (cancelled) return;

        setRooms(roomsData);
        setExistingBookings(bookingsData);

        if (roomsData.length > 0) {
          setRoomId((currentRoomId) =>
            currentRoomId || String(roomsData[0].id)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err.message ||
              "Failed to load campus facilities. Check that the backend is running."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const startDateTime = useMemo(() => {
    if (!date || !startTime) return null;
    return `${date}T${startTime}`;
  }, [date, startTime]);

  const endDateTime = useMemo(() => {
    if (!date || !endTime) return null;
    return `${date}T${endTime}`;
  }, [date, endTime]);

  const clashInfo = useMemo(() => {
    if (!roomId || !startDateTime || !endDateTime) {
      return {
        hasClash: false,
        clashingBookings: [],
        canBump: false,
        bumpedTitles: [],
      };
    }

    return checkBookingClash(
      {
        roomId,
        type,
        start: startDateTime,
        end: endDateTime,
      },
      existingBookings
    );
  }, [
    roomId,
    type,
    startDateTime,
    endDateTime,
    existingBookings,
  ]);

  const isTimeValid = useMemo(() => {
    return Boolean(startTime && endTime && startTime < endTime);
  }, [startTime, endTime]);

  const handleEquipmentToggle = (item) => {
    setSelectedEquipment((previous) =>
      previous.includes(item)
        ? previous.filter((equipment) => equipment !== item)
        : [...previous, item]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (loading) {
      setErrorMessage("Campus facilities are still loading. Please wait.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Event title is required.");
      return;
    }

    if (!roomId) {
      setErrorMessage("Please select a room.");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a reservation date.");
      return;
    }

    if (!isTimeValid) {
      setErrorMessage("End time must be strictly after start time.");
      return;
    }

    if (Number(attendance) < 1) {
      setErrorMessage("Expected attendance must be at least 1.");
      return;
    }

    const selectedRoomDetails = rooms.find(
      (room) => String(room.id) === String(roomId)
    );

    if (
      selectedRoomDetails &&
      Number(attendance) > Number(selectedRoomDetails.capacity)
    ) {
      setErrorMessage(
        `This room holds ${selectedRoomDetails.capacity} people. Reduce attendance or select a larger room.`
      );
      return;
    }

    if (clashInfo.hasClash) {
      setErrorMessage(
        "This room has a conflicting booking. Please choose another room or time. Existing bookings cannot be automatically overwritten."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await createBooking({
        roomId: Number(roomId),
        title: title.trim(),
        type,
        start: startDateTime,
        end: endDateTime,
        requestedBy: user?.name || "Campus Member",
      });

      // Read the newly saved booking from the real backend.
      const latestBookings = await getBookings();
      setExistingBookings(latestBookings);

      setToastMessage("Reservation request submitted successfully!");

      window.setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to submit booking. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const selectedRoomDetails = rooms.find(
    (room) => String(room.id) === String(roomId)
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 font-['Inter',sans-serif]">
      <Toast
        message={toastMessage}
        type="success"
        onClose={() => setToastMessage("")}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hover:text-[#4F46E5] transition flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              home
            </span>
            <span>Spaces Portal</span>
          </button>

          <span className="text-slate-300">/</span>
          <span>Reservations</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">
            New Space Booking
          </span>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-semibold bg-[#EFF4FF] px-3 py-1 rounded-full text-[#3525CD] border border-indigo-100">
          <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" />
          <span>Academic Term: Fall 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 items-start">
        <section className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <div className="border-b border-slate-200/80 pb-5 mb-6">
            <div className="flex items-center justify-between gap-3">
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

          {loading && (
            <div className="mb-5 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs">
              Loading campus facilities...
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  disabled={loading || rooms.length === 0}
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 appearance-none transition cursor-pointer disabled:bg-slate-100"
                >
                  {rooms.length === 0 && (
                    <option value="">No rooms available</option>
                  )}

                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Cap: {room.capacity}) • Equipment:{" "}
                      {(room.equipment || []).join(", ")}
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
                    Capacity: {selectedRoomDetails.capacity} seats • Equipment:{" "}
                    {(selectedRoomDetails.equipment || []).join(", ")}
                  </span>
                </p>
              )}
            </div>

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
                maxLength={150}
                placeholder="e.g., Guest Lecture Series in Quantum Systems"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Booking Classification <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label
                  className={`cursor-pointer ${!canBookExam ? "opacity-45 cursor-not-allowed" : ""}`}
                  title={
                    !canBookExam
                      ? "Restricted to Faculty, Admin & Exam Cell"
                      : "Priority 4"
                  }
                >
                  <input
                    type="radio"
                    name="booking-type"
                    value="exam"
                    disabled={!canBookExam}
                    checked={type === "exam"}
                    onChange={(event) => setType(event.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">
                      assignment
                    </span>
                    <span>Exam (P4)</span>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="booking-type"
                    value="class"
                    checked={type === "class"}
                    onChange={(event) => setType(event.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">
                      school
                    </span>
                    <span>Class (P3)</span>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="booking-type"
                    value="lab"
                    checked={type === "lab"}
                    onChange={(event) => setType(event.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">
                      science
                    </span>
                    <span>Lab (P2)</span>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="booking-type"
                    value="event"
                    checked={type === "event"}
                    onChange={(event) => setType(event.target.value)}
                    className="sr-only peer"
                  />
                  <div className="h-10 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition peer-checked:bg-orange-50 peer-checked:border-orange-500 peer-checked:text-orange-700 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[17px]">
                      groups
                    </span>
                    <span>Event (P1)</span>
                  </div>
                </label>
              </div>
            </div>

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
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
                />
              </div>
            </div>

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
                    onChange={(event) => setStartTime(event.target.value)}
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
                    onChange={(event) => setEndTime(event.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition"
                  />
                </div>
              </div>
            </div>

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
                      max={selectedRoomDetails?.capacity || undefined}
                      value={attendance}
                      onChange={(event) => setAttendance(event.target.value)}
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
                    Conflicting booking:{" "}
                    <span className="font-semibold underline">
                      {clashInfo.bumpedTitles.join(", ")}
                    </span>
                  </p>

                  <p className="text-red-700">
                    Choose another room or time. Existing bookings cannot be
                    automatically overwritten.
                  </p>
                </div>
              </div>
            )}

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
                disabled={
                  loading ||
                  isSubmitting ||
                  (clashInfo.hasClash && !clashInfo.canBump)
                }
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#3525CD] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {isSubmitting
                    ? "Submitting..."
                    : "Submit Reservation Request"}
                </span>

                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
