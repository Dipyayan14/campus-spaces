// src/pages/Calendar.jsx
// Pixel-accurate implementation matching the Stitch Campus Spaces Calendar design.
// Includes custom view switcher, date range controls, room filter, color legend,
// FullCalendar v7 integration with custom event cards, Today's Occupancy sidebar widget,
// and real-time Pending Requests queue.

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import {
  getRooms,
  getBookings,
  getMaintenanceLogs,
  subscribeToChanges,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useNow } from "../hooks/useNow";
import {
  getRoomOccupancy,
  getRoomStatus,
  getCampusSummary,
} from "../utils/occupancy";

// Visual token mapping matching Stitch design specs exactly
const TYPE_SPECS = {
  exam: {
    label: "Exam (Strict / Priority 1)",
    shortLabel: "EXAM",
    priorityBadge: "PRIORITY 1",
    bg: "#FEF2F2",
    border: "#DC2626",
    text: "#991B1B",
    tagBg: "#DC2626",
    tagText: "#FFFFFF",
    legendPill: "bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]",
    dot: "bg-[#DC2626]",
  },
  class: {
    label: "Class / Lecture (Priority 2)",
    shortLabel: "CLASS",
    bg: "#EFF6FF",
    border: "#2563EB",
    text: "#1E40AF",
    tagBg: "rgba(255, 255, 255, 0.7)",
    tagText: "#2563EB",
    legendPill: "bg-[#EFF6FF] border-[#DBEAFE] text-[#2563EB]",
    dot: "bg-[#2563EB]",
  },
  lab: {
    label: "Lab Session (Priority 3)",
    shortLabel: "LAB",
    bg: "#ECFDF5",
    border: "#059669",
    text: "#065F46",
    tagBg: "#059669",
    tagText: "#FFFFFF",
    legendPill: "bg-[#ECFDF5] border-[#D1FAE5] text-[#059669]",
    dot: "bg-[#059669]",
  },
  event: {
    label: "Club / Event (Priority 4)",
    shortLabel: "EVENT",
    bg: "#FFF7ED",
    border: "#EA580C",
    text: "#9A3412",
    tagBg: "#EA580C",
    tagText: "#FFFFFF",
    legendPill: "bg-[#FFF7ED] border-[#FFEDD5] text-[#EA580C]",
    dot: "bg-[#EA580C]",
  },
};

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const alertMessage = location.state?.error;

  const { user } = useAuth();
  const now = useNow(30000);
  const canAccessMaintenance =
    user?.role === "faculty" ||
    user?.role === "venue_admin" ||
    user?.role === "super_admin" ||
    user?.role === "admin";

  const calendarRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter controls
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [includePending, setIncludePending] = useState(true);
  const [activeView, setActiveView] = useState("timeGridWeek");
  const [currentDateTitle, setCurrentDateTitle] = useState(() =>
    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  );

  // Event modal state
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load rooms, bookings and maintenance logs through centralized api.js service
  const loadData = useCallback(async () => {
    try {
      const [roomsData, bookingsData, logsData] = await Promise.all([
        getRooms(),
        getBookings(),
        getMaintenanceLogs(),
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
      setMaintenanceLogs(logsData);
    } catch (err) {
      setError(err.message || "Failed to load campus schedule. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToChanges(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Sync toolbar title when view changes
  const updateTitleFromCalendar = (arg) => {
    if (arg?.view?.title) {
      setCurrentDateTitle(arg.view.title);
    } else if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      setCurrentDateTitle(api.view.title);
    }
  };

  // View switch handlers
  const handleViewChange = (viewName) => {
    setActiveView(viewName);
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(viewName);
      updateTitleFromCalendar();
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
      updateTitleFromCalendar();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
      updateTitleFromCalendar();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.today();
      updateTitleFromCalendar();
    }
  };

  // Filter bookings for calendar display
  const calendarEvents = useMemo(() => {
    return bookings
      .filter((b) => b.status !== "rejected") // Rejected bookings are hidden
      .filter((b) => (includePending ? true : b.status === "approved"))
      .filter((b) =>
        selectedRoom === "all" ? true : String(b.roomId) === String(selectedRoom)
      )
      .map((b) => {
        const room = rooms.find((r) => String(r.id) === String(b.roomId));
        const type = b.type || "event";
        const isPending = b.status === "pending";
        const spec = TYPE_SPECS[type] || TYPE_SPECS.event;

        return {
          id: String(b.id),
          title: b.title,
          start: b.start,
          end: b.end,
          backgroundColor: isPending ? "#FFFFFF" : spec.bg,
          borderColor: isPending ? "#94A3B8" : spec.border,
          textColor: spec.text,
          classNames: isPending ? ["fc-event-pending"] : [],
          extendedProps: {
            roomId: b.roomId,
            roomName: room ? room.name : `Room ${b.roomId}`,
            roomCapacity: room?.capacity,
            roomEquipment: room?.equipment || [],
            type: b.type,
            status: b.status,
            requestedBy: b.requestedBy || "Campus Member",
          },
        };
      });
  }, [bookings, rooms, selectedRoom, includePending]);

  // Custom FullCalendar Event Block Layout (Stitch exact layout)
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const { roomName, type, status, requestedBy, roomCapacity } = event.extendedProps;
    const isPending = status === "pending";
    const spec = TYPE_SPECS[type] || TYPE_SPECS.event;

    // Format start/end time
    const startObj = event.start;
    const endObj = event.end;
    const timeStr = startObj
      ? `${startObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${
          endObj ? endObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : ""
        }`
      : "";

    if (isPending) {
      return (
        <div className="w-full h-full p-2 border-l-4 border-dashed border-[#94A3B8] bg-white rounded-md flex flex-col justify-between overflow-hidden cursor-pointer select-none leading-tight">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-[11px] text-slate-800 truncate">
                {event.title}
              </span>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                [PENDING]
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              {roomName}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono truncate">{timeStr}</span>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full p-2 border-l-4 rounded-md flex flex-col justify-between overflow-hidden cursor-pointer select-none leading-tight"
        style={{
          borderLeftColor: spec.border,
          backgroundColor: spec.bg,
          color: spec.text,
        }}
      >
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[11px] truncate">{event.title}</span>
            <span
              className="text-[9px] font-semibold px-1 py-0.2 rounded shrink-0 shadow-2xs"
              style={{ backgroundColor: spec.tagBg, color: spec.tagText }}
            >
              {roomName.length > 10 ? roomName.slice(0, 10) + "..." : roomName}
            </span>
          </div>

          <span className="text-[10px] block truncate opacity-90 mt-0.5">
            {requestedBy} • {timeStr}
          </span>
        </div>

        {/* Bottom metadata */}
        <div className="flex items-center justify-between text-[9px] opacity-85 mt-1">
          <span className="flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[11px]">groups</span>
            <span>Cap: {roomCapacity || "—"}</span>
          </span>
          {type === "exam" && (
            <span className="font-bold px-1 bg-red-600 text-white rounded text-[8px]">
              LOCKED
            </span>
          )}
        </div>
      </div>
    );
  };

  // Occupancy metrics calculations for the right sidebar
  const pendingRequests = useMemo(() => {
    return bookings.filter((b) => b.status === "pending");
  }, [bookings]);

  const formattedUpdatedTime = useMemo(() => {
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [now]);

  const campusSummary = useMemo(() => {
    return getCampusSummary(rooms, bookings, now);
  }, [rooms, bookings, now]);

  const openMaintenanceCount = useMemo(() => {
    return maintenanceLogs.filter(
      (m) => m.status === "open" || m.status === "in_progress"
    ).length;
  }, [maintenanceLogs]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-5 flex flex-col gap-4 font-['Inter',sans-serif]">
      {/* Role restriction alert flash banner */}
      {alertMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center space-x-3 text-xs font-medium">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <span>{alertMessage}</span>
        </div>
      )}

      {/* PAGE HEADER BAR: Title, Live Status, and Toolbar Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B1C30] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                Campus Reservation Schedule
              </h1>
              <span className="bg-[#DAE2FD] text-[#131B2E] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Academic Term 1
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Real-time scheduling grid, room concurrency and instructional reservations.
            </p>
          </div>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Day / Week / Month Segment Button */}
          <div className="bg-[#EFF4FF] border border-slate-200/80 p-1 rounded-lg flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleViewChange("timeGridDay")}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                activeView === "timeGridDay"
                  ? "bg-white text-[#3525CD] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("timeGridWeek")}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                activeView === "timeGridWeek"
                  ? "bg-white text-[#3525CD] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("dayGridMonth")}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                activeView === "dayGridMonth"
                  ? "bg-white text-[#3525CD] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month
            </button>
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center gap-1 bg-[#EFF4FF] border border-slate-200/80 rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Range"
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <span className="material-symbols-outlined text-[#3525CD] text-[16px]">
                calendar_today
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {currentDateTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNext}
              title="Next Range"
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            Today
          </button>
        </div>
      </div>

      {/* FILTERS & ACTION TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Room Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Room:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] cursor-pointer"
            >
              <option value="all">All Spaces</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} (Cap. {room.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Facility Filter */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Facility:</span>
            <select className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] cursor-pointer">
              <option>All Buildings & Wings</option>
              <option>Science Complex</option>
              <option>Main Academic Quad</option>
              <option>Engineering Block</option>
            </select>
          </div>

          {/* Include Pending Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none border-l border-slate-200 pl-3">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
              className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs text-slate-600 font-medium">
              Include Pending Approvals
            </span>
          </label>
        </div>

        {/* New Reservation Action */}
        <button
          type="button"
          onClick={() => navigate("/book")}
          className="bg-[#4F46E5] hover:bg-[#3525CD] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-[0.98] transition shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>+ New Reservation</span>
        </button>
      </div>

      {/* COLOR LEGEND BAR */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="material-symbols-outlined text-[15px] text-slate-400">
            palette
          </span>
          <span>Reservation Classification:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Exam Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span>Exam (Strict / Priority 1)</span>
          </div>

          {/* Class Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>Class / Lecture (Priority 2)</span>
          </div>

          {/* Lab Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>Lab Session (Priority 3)</span>
          </div>

          {/* Event Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#EA580C] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span>Club / Event (Priority 4)</span>
          </div>

          {/* Pending Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-dashed border-[#777587] text-[#464555] text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 border border-slate-300" />
            <span>Pending Review (Lighter shade)</span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SCHEDULE GRID & OCCUPANCY METRICS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left Side: Schedule Calendar (9 Columns on XL) */}
        <div className="xl:col-span-9 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="py-28 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-9 h-9 border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-semibold text-slate-700">
                Loading campus schedule...
              </div>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-2">
              <span className="material-symbols-outlined text-red-500 text-3xl">
                error
              </span>
              <div className="text-sm font-semibold text-slate-800">
                Unable to load reservations
              </div>
              <p className="text-xs text-red-600 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#3525CD] transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-[720px] p-2">
              <FullCalendar
                ref={calendarRef}
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  classicThemePlugin,
                ]}
                initialView="timeGridWeek"
                // Opens to current week by default
                headerToolbar={false} // Handled by our custom Stitch header toolbar
                events={calendarEvents}
                eventContent={renderEventContent}
                eventClick={(info) => {
                  setSelectedEvent(info.event);
                }}
                datesSet={updateTitleFromCalendar}
                slotMinTime="08:00:00"
                slotMaxTime="18:00:00"
                allDaySlot={false}
                height="auto"
                nowIndicator={true}
                expandRows={true}
              />
            </div>
          )}
        </div>

        {/* Right Side: Occupancy Metrics & Pending Action Queue (3 Columns on XL) */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Today's Occupancy Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-[#0B1C30]">
                Today's Occupancy
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">
                  Updated {formattedUpdatedTime}
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Radial Donut Progress */}
            <div className="flex items-center gap-3 bg-[#F8F9FF] p-3 rounded-lg border border-slate-100">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Track */}
                  <path
                    className="text-slate-200 stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3.5"
                  />
                  {/* Fill */}
                  <path
                    className="text-[#4F46E5] stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray={`${campusSummary.activePercent}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-800">
                    {campusSummary.activePercent}%
                  </span>
                  <span className="text-[7px] text-slate-400 font-bold uppercase">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  Campus Concurrency
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {campusSummary.activeNow.length} active bookings confirmed.
                </p>
                {campusSummary.trendPercent === null ? (
                  <span className="text-[10px] text-slate-400 font-medium inline-block mt-0.5">
                    No data for last week
                  </span>
                ) : campusSummary.trendPercent > 0 ? (
                  <span className="text-[10px] text-emerald-600 font-bold inline-block mt-0.5">
                    +{campusSummary.trendPercent}% vs last week
                  </span>
                ) : campusSummary.trendPercent < 0 ? (
                  <span className="text-[10px] text-red-600 font-bold inline-block mt-0.5">
                    {campusSummary.trendPercent}% vs last week
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold inline-block mt-0.5">
                    0% vs last week
                  </span>
                )}
              </div>
            </div>

            {/* Key Facilities Utilization Breakdown */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Key Facilities Utilization
              </span>

              {rooms.map((room) => {
                const pct = getRoomOccupancy(room, bookings, now);
                const statusText = getRoomStatus(room, bookings, now);
                const barColor =
                  pct < 50 ? "#10B981" : pct <= 80 ? "#F59E0B" : "#EF4444";

                return (
                  <div key={room.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {room.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                      <span className="shrink-0">Cap: {room.capacity} seats</span>
                      <span
                        className="truncate max-w-[170px] text-right font-medium text-slate-600"
                        title={statusText}
                      >
                        {statusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {canAccessMaintenance && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Facility Maintenance - {openMaintenanceCount} open
                </span>
                <a
                  href="/maintenance-log"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#4F46E5] hover:underline text-[11px]"
                >
                  View Log
                </a>
              </div>
            )}
          </div>

          {/* Pending Requests Queue Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  pending_actions
                </span>
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-[#0B1C30]">
                  Pending Requests
                </h3>
              </div>
              <span className="w-5 h-5 rounded-full bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Reservations awaiting faculty or facilities approval.
            </p>

            <div className="space-y-2 pt-1">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No pending requests.
                </div>
              ) : (
                pendingRequests.map((req) => {
                  const r = rooms.find((rm) => String(rm.id) === String(req.roomId));
                  return (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-[#F8F9FF] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-800 truncate">
                          {req.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#3525CD] bg-indigo-50 px-1 py-0.5 rounded shrink-0">
                          {r ? r.name.slice(0, 10) : `Room ${req.roomId}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {req.start ? req.start.replace("T", " • ") : "Scheduled"}
                      </span>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => navigate("/approvals")}
                          className="flex-1 py-1 rounded bg-[#4F46E5] hover:bg-[#3525CD] text-white text-[11px] font-semibold transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEvent({
                              title: req.title,
                              startStr: req.start,
                              endStr: req.end,
                              extendedProps: {
                                roomId: req.roomId,
                                roomName: r ? r.name : `Room ${req.roomId}`,
                                roomCapacity: r?.capacity,
                                roomEquipment: r?.equipment,
                                type: req.type,
                                status: req.status,
                                requestedBy: req.requestedBy || "Campus Member",
                              },
                            });
                          }}
                          className="px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-white text-[11px] font-semibold transition cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EVENT DETAILS POPUP MODAL */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${
                    TYPE_SPECS[selectedEvent.extendedProps.type]?.legendPill ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {TYPE_SPECS[selectedEvent.extendedProps.type]?.shortLabel ||
                    selectedEvent.extendedProps.type}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Table */}
            <div className="space-y-2.5 text-xs border-y border-slate-100 py-3.5">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">
                  Facility
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedEvent.extendedProps.roomName}
                  {selectedEvent.extendedProps.roomCapacity && (
                    <span className="text-[11px] text-slate-500 font-normal block">
                      Capacity: {selectedEvent.extendedProps.roomCapacity} seats
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">
                  Scheduled Time
                </span>
                <span className="text-slate-700 font-medium text-right">
                  {selectedEvent.startStr
                    ? selectedEvent.startStr.replace("T", " • ")
                    : "—"}{" "}
                  {selectedEvent.endStr
                    ? `– ${selectedEvent.endStr.split("T")[1]}`
                    : ""}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">
                  Status
                </span>
                {selectedEvent.extendedProps.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                    ✓ Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-dashed border-amber-300 font-semibold text-[11px]">
                    ⏳ Pending Review
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">
                  Requested By
                </span>
                <span className="text-slate-800 font-medium">
                  {selectedEvent.extendedProps.requestedBy}
                </span>
              </div>

              {selectedEvent.extendedProps.roomEquipment?.length > 0 && (
                <div className="pt-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Room Equipment
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.extendedProps.roomEquipment.map((eq) => (
                      <span
                        key={eq}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
