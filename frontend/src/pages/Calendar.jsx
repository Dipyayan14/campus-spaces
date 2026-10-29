import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getRooms, getBookings } from "../api";

const ADMIN_ROLES = ["venue_admin", "super_admin"];

const TYPE_SPECS = {
  exam: {
    label: "Exam",
    bg: "#FEF2F2",
    border: "#DC2626",
    text: "#991B1B",
  },
  class: {
    label: "Class / Lecture",
    bg: "#EFF6FF",
    border: "#2563EB",
    text: "#1E40AF",
  },
  lab: {
    label: "Lab Session",
    bg: "#ECFDF5",
    border: "#059669",
    text: "#065F46",
  },
  event: {
    label: "Club / Event",
    bg: "#FFF7ED",
    border: "#EA5800",
    text: "#9A3412",
  },
};

function getCurrentUserRole() {
  try {
    for (const key of Object.keys(localStorage)) {
      const value = localStorage.getItem(key);
      if (!value) continue;

      try {
        const parsed = JSON.parse(value);
        const role = parsed?.role || parsed?.user?.role;
        if (typeof role === "string") return role.toLowerCase();
      } catch {
        // Ignore unrelated storage values.
      }
    }
  } catch {
    // Storage may be unavailable.
  }

  return null;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPeriodRange(period, referenceDate = new Date()) {
  const current = new Date(referenceDate);
  let start = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate()
  );
  let end = new Date(start);

  if (period === "day") {
    end.setDate(end.getDate() + 1);
  } else if (period === "week") {
    const offset = start.getDay() === 0 ? -6 : 1 - start.getDay();
    start.setDate(start.getDate() + offset);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else {
    start = new Date(current.getFullYear(), current.getMonth(), 1);
    end = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return { start, end };
}

function Detail({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 text-right break-words">
        {children}
      </span>
    </div>
  );
}

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();

  const canManageApprovals = ADMIN_ROLES.includes(getCurrentUserRole());

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [includePending, setIncludePending] = useState(true);
  const [scheduleView, setScheduleView] = useState("week");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [occupancyPeriod, setOccupancyPeriod] = useState("today");
  const [lastUpdated, setLastUpdated] = useState(null);

  const showPending = canManageApprovals && includePending;

  const refreshData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const [roomData, bookingData] = await Promise.all([
        getRooms(),
        getBookings(),
      ]);

      setRooms(Array.isArray(roomData) ? roomData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err?.message ||
          "Could not load bookings. Check that the backend is running."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) await refreshData(true);
    };

    load();

    const timer = window.setInterval(() => {
      if (mounted) refreshData(false);
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [refreshData]);

  const moveDate = (direction) => {
    setReferenceDate((previous) => {
      const next = new Date(previous);

      if (direction === "today") return new Date();

      if (scheduleView === "day") {
        next.setDate(next.getDate() + direction);
      } else if (scheduleView === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }

      return next;
    });
  };

  const visibleBookings = useMemo(() => {
    const { start, end } = getPeriodRange(scheduleView, referenceDate);

    return bookings
      .filter((booking) => booking.status !== "rejected")
      .filter((booking) =>
        canManageApprovals
          ? showPending || booking.status === "approved"
          : booking.status === "approved"
      )
      .filter((booking) =>
        selectedRoom === "all"
          ? true
          : String(booking.roomId) === String(selectedRoom)
      )
      .filter((booking) => {
        if (!booking.start || !booking.end) return false;

        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);

        return (
          !Number.isNaN(bookingStart.getTime()) &&
          !Number.isNaN(bookingEnd.getTime()) &&
          bookingStart < end &&
          bookingEnd > start
        );
      })
      .map((booking) => {
        const room = rooms.find(
          (item) => String(item.id) === String(booking.roomId)
        );

        const type = String(booking.type || "event").toLowerCase();
        const spec = TYPE_SPECS[type] || TYPE_SPECS.event;

        return {
          ...booking,
          type,
          typeLabel: spec.label,
          colorSpec: spec,
          roomName: room?.name || `Room ${booking.roomId ?? "unknown"}`,
          roomCapacity: room?.capacity,
          roomEquipment: room?.equipment || [],
          requestedBy: booking.requestedBy || "Campus Member",
        };
      })
      .sort((a, b) => {
        const dateDifference =
          new Date(a.start).getTime() - new Date(b.start).getTime();

        if (dateDifference !== 0) return dateDifference;

        return String(a.title || "").localeCompare(String(b.title || ""));
      });
  }, [
    bookings,
    rooms,
    selectedRoom,
    showPending,
    canManageApprovals,
    scheduleView,
    referenceDate,
  ]);

  const groupedBookings = useMemo(() => {
    const groups = new Map();

    visibleBookings.forEach((booking) => {
      const key = new Date(booking.start).toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(booking);
    });

    return Array.from(groups.entries());
  }, [visibleBookings]);

  const pendingRequests = useMemo(
    () =>
      canManageApprovals
        ? bookings.filter((booking) => booking.status === "pending")
        : [],
    [bookings, canManageApprovals]
  );

  const occupancy = useMemo(() => {
    const { start, end } = getPeriodRange(occupancyPeriod);
    const byRoom = new Map();

    rooms.forEach((room) => byRoom.set(String(room.id), []));

    bookings
      .filter((booking) => booking.status === "approved")
      .forEach((booking) => {
        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);

        if (
          Number.isNaN(bookingStart.getTime()) ||
          Number.isNaN(bookingEnd.getTime()) ||
          bookingStart >= end ||
          bookingEnd <= start
        ) {
          return;
        }

        const key = String(booking.roomId);
        if (!byRoom.has(key)) byRoom.set(key, []);

        byRoom.get(key).push({
          ...booking,
          start: bookingStart,
          end: bookingEnd,
        });
      });

    for (const list of byRoom.values()) {
      list.sort((a, b) => a.start - b.start);
    }

    const occupiedRooms = [...byRoom.values()].filter(
      (list) => list.length > 0
    ).length;

    const totalBookings = [...byRoom.values()].reduce(
      (sum, list) => sum + list.length,
      0
    );

    return {
      byRoom,
      occupiedRooms,
      totalBookings,
      percentage: rooms.length
        ? Math.round((occupiedRooms / rooms.length) * 100)
        : 0,
      rangeLabel:
        occupancyPeriod === "today"
          ? "Today"
          : occupancyPeriod === "week"
            ? "This week"
            : start.toLocaleDateString([], {
                month: "long",
                year: "numeric",
              }),
    };
  }, [rooms, bookings, occupancyPeriod]);

  const dateHeading = useMemo(() => {
    if (scheduleView === "day") return formatDate(referenceDate);

    if (scheduleView === "month") {
      return referenceDate.toLocaleDateString([], {
        month: "long",
        year: "numeric",
      });
    }

    const { start, end } = getPeriodRange("week", referenceDate);
    const lastDay = new Date(end);
    lastDay.setDate(lastDay.getDate() - 1);

    return `${start.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })} – ${lastDay.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }, [scheduleView, referenceDate]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-5 flex flex-col gap-4">
      <style>{`
        .spacesync-booking-card {
          transition: box-shadow 150ms ease, transform 150ms ease;
        }
        .spacesync-booking-card:hover {
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.10);
          transform: translateY(-1px);
        }
      `}</style>

      {location.state?.error && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          {location.state.error}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
          <button
            type="button"
            onClick={() => refreshData(true)}
            className="ml-3 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1C30]">
              Campus Reservation Schedule
            </h1>
            <span className="bg-indigo-100 text-indigo-900 text-xs font-semibold px-2.5 py-1 rounded-full">
              SpaceSync AI
            </span>
          </div>

          <p className="text-slate-500 text-xs mt-1">
            Every reservation appears on its own row for easier reading.
          </p>

          <p className="text-slate-400 text-xs mt-1">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()} · Auto-refresh every 5 seconds`
              : "Loading schedule…"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            ["day", "Day"],
            ["week", "Week"],
            ["month", "Month"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScheduleView(value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                scheduleView === value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => moveDate(-1)}
            className="px-3 py-2 border rounded-lg text-sm"
            aria-label="Previous period"
          >
            ‹
          </button>

          <span className="text-xs font-bold text-slate-800 text-center min-w-32">
            {dateHeading}
          </span>

          <button
            type="button"
            onClick={() => moveDate(1)}
            className="px-3 py-2 border rounded-lg text-sm"
            aria-label="Next period"
          >
            ›
          </button>

          <button
            type="button"
            onClick={() => moveDate("today")}
            className="px-3 py-2 border rounded-lg text-xs font-semibold"
          >
            Today
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="calendar-room"
            className="text-xs font-semibold text-slate-600"
          >
            Filter by room
          </label>

          <select
            id="calendar-room"
            value={selectedRoom}
            onChange={(event) => setSelectedRoom(event.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2"
          >
            <option value="all">All Spaces</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} · Capacity {room.capacity}
              </option>
            ))}
          </select>

          {canManageApprovals && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includePending}
                onChange={(event) => setIncludePending(event.target.checked)}
              />
              Show pending requests
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate("/book")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg"
        >
          + New Reservation
        </button>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2 shadow-sm">
        <span className="text-xs font-semibold text-slate-500 mr-1">
          Booking types:
        </span>

        {Object.entries(TYPE_SPECS).map(([type, spec]) => (
          <span
            key={type}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{
              color: spec.text,
              background: spec.bg,
              borderColor: spec.border,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: spec.border }}
            />
            {spec.label}
          </span>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <section className="xl:col-span-9 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Booking Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sorted by date and start time. Simultaneous bookings are
                displayed on separate rows.
              </p>
            </div>

            <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
              {visibleBookings.length} booking(s)
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500">
              Loading campus schedule…
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-semibold text-slate-800">
                No bookings for this period
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Try another date, choose All Spaces, or create a reservation.
              </p>
              <button
                type="button"
                onClick={() => navigate("/book")}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Create a booking
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedBookings.map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <div className="sticky top-0 z-10 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      {dateLabel}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {items.length} reservation(s)
                    </p>
                  </div>

                  <div className="space-y-3">
                    {items.map((booking) => {
                      const spec =
                        TYPE_SPECS[booking.type] || TYPE_SPECS.event;
                      const pending = booking.status === "pending";

                      return (
                        <button
                          type="button"
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className="spacesync-booking-card w-full text-left rounded-xl border p-4 sm:p-5"
                          style={{
                            background: pending ? "#FFFBEB" : spec.bg,
                            borderColor: pending ? "#F59E0B" : spec.border,
                            borderLeftWidth: 5,
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className="text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full"
                                  style={{
                                    background: "#FFFFFF",
                                    color: spec.text,
                                    border: `1px solid ${spec.border}`,
                                  }}
                                >
                                  {spec.label}
                                </span>

                                <span
                                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                                  style={{
                                    background: pending ? "#FEF3C7" : "#FFFFFF",
                                    color: pending ? "#92400E" : "#166534",
                                    border: `1px solid ${
                                      pending ? "#F59E0B" : "#86EFAC"
                                    }`,
                                  }}
                                >
                                  {pending ? "Pending approval" : "Approved"}
                                </span>
                              </div>

                              <h3
                                className="text-base sm:text-lg font-bold break-words"
                                style={{ color: spec.text }}
                              >
                                {booking.title || "Untitled booking"}
                              </h3>

                              <p className="text-sm font-semibold text-slate-700 mt-2 break-words">
                                <span className="mr-1">📍</span>
                                {booking.roomName}
                              </p>
                            </div>

                            <div className="sm:min-w-40 sm:text-right">
                              <p className="text-sm font-bold text-slate-800">
                                {formatTime(booking.start)}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                to {formatTime(booking.end)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-200/80">
                            <p className="text-xs text-slate-600 break-words">
                              <span className="font-semibold">Booked by:</span>{" "}
                              {booking.requestedBy}
                            </p>

                            {booking.roomCapacity != null && (
                              <p className="text-xs text-slate-600">
                                <span className="font-semibold">
                                  Room capacity:
                                </span>{" "}
                                {booking.roomCapacity} people
                              </p>
                            )}

                            <p className="text-xs text-slate-600">
                              <span className="font-semibold">Booking ID:</span>{" "}
                              {booking.id}
                            </p>

                            <p className="text-xs text-indigo-700 font-semibold">
                              Click to view full details →
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="xl:col-span-3 flex flex-col gap-4">
          <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-bold text-sm text-slate-900">
                Room Occupancy
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                Live · 5s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                ["today", "Today"],
                ["week", "This Week"],
                ["month", "This Month"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOccupancyPeriod(value)}
                  className={`py-2 rounded-md text-[10px] font-semibold ${
                    occupancyPeriod === value
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 mt-3">
              {occupancy.rangeLabel}
            </p>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg mt-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `conic-gradient(#4F46E5 ${
                    occupancy.percentage * 3.6
                  }deg, #E2E8F0 0deg)`,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-800">
                    {occupancy.percentage}%
                  </span>
                </div>
              </div>

              <div className="text-xs min-w-0">
                <p className="font-semibold text-slate-800">
                  Confirmed occupancy
                </p>
                <p className="text-slate-500 mt-1">
                  {occupancy.occupiedRooms} of {rooms.length} rooms have
                  approved bookings.
                </p>
                <p className="text-slate-500 mt-1">
                  {occupancy.totalBookings} approved booking(s)
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Room schedule
              </h3>

              {rooms.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No rooms returned by the API.
                </p>
              ) : (
                rooms.map((room) => {
                  const roomBookings =
                    occupancy.byRoom.get(String(room.id)) || [];

                  return (
                    <div
                      key={room.id}
                      className="border-b border-slate-100 pb-3 last:border-0"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {room.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Cap. {room.capacity}
                        </span>
                      </div>

                      {roomBookings.length === 0 ? (
                        <p className="text-[10px] text-slate-400 mt-1">
                          No approved bookings in this period
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {roomBookings.map((booking, index) => {
                            const spec =
                              TYPE_SPECS[booking.type] || TYPE_SPECS.event;

                            return (
                              <div
                                key={`${room.id}-${booking.id ?? index}`}
                                className="rounded-md p-2"
                                style={{
                                  background: spec.bg,
                                  borderLeft: `3px solid ${spec.border}`,
                                }}
                              >
                                <p
                                  className="text-[11px] font-semibold break-words"
                                  style={{ color: spec.text }}
                                >
                                  {booking.title}
                                </p>
                                <p className="text-[10px] text-slate-600 mt-1">
                                  {spec.label}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {formatTime(booking.start)} –{" "}
                                  {formatTime(booking.end)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-3">
              Only approved bookings count toward occupancy.
            </p>
          </section>

          {canManageApprovals && (
            <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-slate-900">
                  Pending Requests
                </h2>
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mt-1">
                Reservations awaiting approval.
              </p>

              {pendingRequests.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">
                  No pending requests.
                </p>
              ) : (
                <div className="space-y-2 mt-3">
                  {pendingRequests.map((request) => {
                    const room = rooms.find(
                      (item) => String(item.id) === String(request.roomId)
                    );
                    const spec =
                      TYPE_SPECS[request.type] || TYPE_SPECS.event;

                    return (
                      <div
                        key={request.id}
                        className="p-3 rounded-lg border border-amber-200 bg-amber-50 space-y-1"
                      >
                        <p className="text-xs font-bold text-slate-800">
                          {request.title}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          Room: {room?.name || `Room ${request.roomId}`}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {spec.label}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {request.requestedBy || "Campus Member"}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/approvals")}
                          className="w-full mt-2 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        >
                          Review Request
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </aside>
      </div>

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  {selectedBooking.typeLabel}
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-2 break-words">
                  {selectedBooking.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-800 text-xl"
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 border-y border-slate-100 py-4">
              <Detail label="Booked room">
                {selectedBooking.roomName}
              </Detail>

              <Detail label="Booking type">
                {selectedBooking.typeLabel}
              </Detail>

              <Detail label="Date">
                {formatDate(selectedBooking.start)}
              </Detail>

              <Detail label="Start time">
                {formatTime(selectedBooking.start)}
              </Detail>

              <Detail label="End time">
                {formatTime(selectedBooking.end)}
              </Detail>

              <Detail label="Status">
                <span
                  className={
                    selectedBooking.status === "approved"
                      ? "text-emerald-700 font-semibold"
                      : "text-amber-700 font-semibold"
                  }
                >
                  {selectedBooking.status === "approved"
                    ? "Approved"
                    : selectedBooking.status === "pending"
                      ? "Pending Review"
                      : selectedBooking.status}
                </span>
              </Detail>

              <Detail label="Requested by">
                {selectedBooking.requestedBy}
              </Detail>

              {selectedBooking.roomCapacity != null && (
                <Detail label="Room capacity">
                  {selectedBooking.roomCapacity} people
                </Detail>
              )}

              {selectedBooking.roomEquipment?.length > 0 && (
                <Detail label="Room equipment">
                  <div className="flex flex-wrap justify-end gap-1">
                    {selectedBooking.roomEquipment.map((equipment) => (
                      <span
                        key={equipment}
                        className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px]"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </Detail>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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