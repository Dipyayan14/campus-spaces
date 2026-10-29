// src/pages/Insights.jsx
// SpaceSync Campus Utilization & Space Insights.
// Pending approval information is restricted to authorized admins.

import React, { useState, useEffect, useMemo } from "react";
import { getRooms, getBookings } from "../api";

const ADMIN_ROLES = ["venue_admin", "super_admin"];

function getCurrentUserRole() {
  try {
    for (const key of Object.keys(localStorage)) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const value = JSON.parse(raw);

        if (
          value &&
          typeof value === "object" &&
          typeof value.role === "string"
        ) {
          return value.role;
        }
      } catch {
        // Ignore unrelated localStorage values.
      }
    }
  } catch {
    // Storage may be unavailable.
  }

  return null;
}

const DAYS = [
  { key: 1, name: "Monday" },
  { key: 2, name: "Tuesday" },
  { key: 3, name: "Wednesday" },
  { key: 4, name: "Thursday" },
  { key: 5, name: "Friday" },
  { key: 6, name: "Saturday" },
];

export default function Insights() {
  const canManageApprovals = ADMIN_ROLES.includes(
    getCurrentUserRole()
  );

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [roomsData, bookingsData] = await Promise.all([
          getRooms(),
          getBookings(),
        ]);

        if (mounted) {
          setRooms(roomsData);
          setBookings(bookingsData);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message || "Failed to load space insights."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate analytics from reservation records.
  const analytics = useMemo(() => {
    const approved = bookings.filter(
      (booking) => booking.status === "approved"
    );

    const totalBookings = bookings.length;

    const pendingCount = bookings.filter(
      (booking) => booking.status === "pending"
    ).length;

    let totalHours = 0;

    const roomHoursMap = {};
    const roomDayHoursMap = {};

    approved.forEach((booking) => {
      const start = new Date(booking.start);
      const end = new Date(booking.end);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        return;
      }

      const durationHours =
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60);

      totalHours += durationHours;

      const roomId = String(booking.roomId);

      roomHoursMap[roomId] =
        (roomHoursMap[roomId] || 0) + durationHours;

      const dayIndex = start.getDay();
      const key = `${roomId}_${dayIndex}`;

      roomDayHoursMap[key] =
        (roomDayHoursMap[key] || 0) + durationHours;
    });

    let busiestRoomId = null;
    let maxHours = 0;

    Object.entries(roomHoursMap).forEach(([roomId, hours]) => {
      if (hours > maxHours) {
        maxHours = hours;
        busiestRoomId = roomId;
      }
    });

    const busiestRoom =
      rooms.find(
        (room) => String(room.id) === String(busiestRoomId)
      ) || rooms[0] || null;

    const operatingCapacityHours = Math.max(
      rooms.length * 10 * 5,
      1
    );

    const avgUtilization = Math.min(
      Math.round(
        (totalHours / operatingCapacityHours) * 100
      ),
      100
    );

    return {
      avgUtilization,
      totalHours: Math.round(totalHours * 10) / 10,
      totalBookings,
      pendingCount,
      busiestRoom,
      busiestHours: maxHours,
      roomDayHoursMap,
    };
  }, [rooms, bookings]);

  const getCellHeatmapStyle = (percentage) => {
    if (percentage === 0) {
      return {
        bg: "bg-slate-100 text-slate-500 border border-slate-200/60",
        label: "0%",
      };
    }

    if (percentage < 35) {
      return {
        bg: "bg-[#D8E2FF] text-[#001A42] font-semibold",
        label: `${percentage}%`,
      };
    }

    if (percentage < 70) {
      return {
        bg: "bg-[#818CF8] text-white font-bold",
        label: `${percentage}%`,
      };
    }

    if (percentage < 90) {
      return {
        bg: "bg-[#4F46E5] text-white font-bold",
        label: `${percentage}%`,
      };
    }

    return {
      bg: "bg-[#0F172A] text-white font-bold",
      label: `${percentage}%`,
    };
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          Loading campus insights...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">
            Unable to load campus insights
          </p>
          <p className="mt-1">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-[#4F46E5] px-4 py-2 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 font-['Inter',sans-serif]">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <span>Campus Administration</span>

            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>

            <span className="text-[#3525CD] font-bold">
              Space Analytics &amp; Optimization
            </span>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-[#0B1C30] tracking-tight">
            Campus Utilization &amp; Space Insights
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Room scheduling, utilization, and capacity benchmarks
            across academic facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-300 rounded-lg px-3.5 py-2 flex items-center gap-2 shadow-sm text-xs font-semibold text-slate-800">
            <span className="material-symbols-outlined text-[#4F46E5] text-[18px]">
              calendar_today
            </span>

            <span>Fall Semester 2026</span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-white border border-[#4F46E5] text-[#4F46E5] hover:bg-indigo-50 text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">
              download
            </span>

            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* TOP ANALYTICS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* CARD 1: UTILIZATION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Average Utilization Rate
              </span>

              <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#3525CD]">
                <span className="material-symbols-outlined text-[18px]">
                  timelapse
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl sm:text-4xl font-bold text-[#0B1C30]">
                {analytics.avgUtilization}%
              </span>
            </div>

            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#4F46E5] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${analytics.avgUtilization}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-slate-500 text-xs">
            <span className="material-symbols-outlined text-[15px] text-[#4F46E5]">
              schedule
            </span>

            <span>
              Calculated from approved reservation durations.
            </span>
          </div>
        </div>

        {/* CARD 2: TOTAL HOURS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Hours Scheduled
              </span>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF4FF] text-[#3525CD]">
                {analytics.totalBookings} total bookings
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl sm:text-4xl font-bold text-[#0B1C30]">
                {analytics.totalHours} hrs
              </span>
            </div>

            {/* Pending count is admin-only. */}
            {canManageApprovals && (
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  {analytics.pendingCount} pending requests
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-slate-500 text-xs">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">
              verified
            </span>

            <span>
              Hours are calculated from approved bookings.
            </span>
          </div>
        </div>

        {/* CARD 3: BUSIEST ROOM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Highest Demand Facility
              </span>

              <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <span className="material-symbols-outlined text-[18px]">
                  trending_up
                </span>
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[#0B1C30] truncate">
                {analytics.busiestRoom?.name || "No room data"}
              </h2>

              <p className="text-xs text-slate-500">
                Seating Capacity:{" "}
                {analytics.busiestRoom?.capacity ?? "—"} seats
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Approved booking hours
            </span>

            <span className="font-bold text-[#4F46E5]">
              {Math.round(analytics.busiestHours * 10) / 10} hrs
            </span>
          </div>
        </div>
      </section>

      {/* WEEKLY HEATMAP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-[#0B1C30]">
              Weekly Concurrency Heatmap Matrix
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Room scheduling density calculated from approved
              reservation records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Density:
            </span>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
              <span>0%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#D8E2FF] inline-block" />
              <span>Low</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#818CF8] inline-block" />
              <span>Medium</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#4F46E5] inline-block" />
              <span>High</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#0F172A] inline-block" />
              <span>Very high</span>
            </div>
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No room data is available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <th className="py-3 px-4 w-60">
                    Facility &amp; Space
                  </th>

                  {DAYS.map((day) => (
                    <th
                      key={day.key}
                      className="py-3 px-3 text-center"
                    >
                      {day.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-slate-900">
                        {room.name}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Capacity: {room.capacity}
                        {" • "}
                        {(room.equipment || [])
                          .slice(0, 2)
                          .join(", ")}
                      </div>
                    </td>

                    {DAYS.map((day) => {
                      const key = `${room.id}_${day.key}`;
                      const actualHours =
                        analytics.roomDayHoursMap[key] || 0;

                      // One operating day is assumed to be 10 hours.
                      const occupancyPct = Math.min(
                        Math.round((actualHours / 10) * 100),
                        100
                      );

                      const style =
                        getCellHeatmapStyle(occupancyPct);

                      return (
                        <td
                          key={day.key}
                          className="p-2 text-center"
                        >
                          <div
                            className={`h-11 rounded-lg flex items-center justify-center text-xs shadow-sm ${style.bg}`}
                            title={`${room.name} on ${day.name}: ${occupancyPct}% based on ${actualHours.toFixed(1)} approved booking hours`}
                          >
                            {style.label}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}