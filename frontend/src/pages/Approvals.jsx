// src/pages/Approvals.jsx
// Pixel-accurate implementation matching the Stitch Approvals design (approvals_campus_spaces).
// Includes Pending Requests queue with approve/reject actions, History & Audit Log tab,
// search and role filters, toast notifications, and friendly empty states.

import React, { useState, useEffect, useMemo } from "react";
import { getRooms, getBookings, approveBooking, rejectBooking } from "../api";
import Toast from "../components/Toast";
import Badge from "../components/Badge";

export default function Approvals() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active tab: "pending" | "history"
  const [activeTab, setActiveTab] = useState("pending");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Toast feedback
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      const [roomsData, bookingsData] = await Promise.all([
        getRooms(),
        getBookings(),
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action handlers
  const handleApprove = async (id, title) => {
    setActionLoadingId(id);
    try {
      await approveBooking(id);
      setToast({
        message: `Booking "${title}" approved successfully!`,
        type: "success",
      });
      await loadData();
    } catch (err) {
      setToast({
        message: err.message || "Failed to approve booking.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id, title) => {
    setActionLoadingId(id);
    try {
      await rejectBooking(id);
      setToast({
        message: `Booking "${title}" has been rejected.`,
        type: "info",
      });
      await loadData();
    } catch (err) {
      setToast({
        message: err.message || "Failed to reject booking.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered lists
  const pendingList = useMemo(() => {
    return bookings.filter((b) => b.status === "pending");
  }, [bookings]);

  const historyList = useMemo(() => {
    return bookings.filter((b) => b.status === "approved" || b.status === "rejected");
  }, [bookings]);

  const displayedItems = useMemo(() => {
    const list = activeTab === "pending" ? pendingList : historyList;

    return list.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesRequester = (item.requestedBy || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesRequester) return false;
      }

      // Role filter
      if (roleFilter !== "all") {
        if (roleFilter === "student" && item.type !== "event") return false;
        if (roleFilter === "faculty" && item.type !== "class" && item.type !== "lab") return false;
        if (roleFilter === "exam_cell" && item.type !== "exam") return false;
      }

      return true;
    });
  }, [activeTab, pendingList, historyList, searchQuery, roleFilter]);

  // Format date time helper
  const formatDateTime = (startStr, endStr) => {
    if (!startStr) return "N/A";
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeStr = `${start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })} – ${
      end
        ? end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : ""
    }`;
    return `${dateStr} &bull; ${timeStr}`;
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 font-['Inter',sans-serif]">
      {/* Toast Feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <span>Campus Administration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-800 font-bold">Reservations Management</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-[#0B1C30] tracking-tight">
            Reservation Approvals &amp; Review
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review, authorize, or decline incoming department reservation petitions and academic space allocations.
          </p>
        </div>

        {/* Quick Summary Stats Strip */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xs">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Pending Review
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold text-slate-800">
                {pendingList.length} {pendingList.length === 1 ? "Request" : "Requests"}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Auto-Approved Today
              </span>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold text-slate-800">
                {bookings.filter((b) => b.status === "approved").length} Slots
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS BAR */}
      <div className="border-b border-slate-200/80 flex items-center justify-between mb-6">
        <div className="flex items-center gap-6 -mb-px">
          {/* Pending Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 pb-3.5 border-b-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "pending"
                ? "border-[#4F46E5] text-[#3525CD]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              pending_actions
            </span>
            <span>Pending Requests ({pendingList.length})</span>
            {pendingList.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#4F46E5] text-white">
                Action Required
              </span>
            )}
          </button>

          {/* History Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 pb-3.5 border-b-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "history"
                ? "border-[#4F46E5] text-[#3525CD]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>History &amp; Audit Log ({historyList.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pb-2 text-xs text-slate-400 font-medium">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>Role-Authorized Queue</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-6 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Applicant Name or Title */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <span className="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search request title or applicant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition"
            />
          </div>

          {/* Filter by Role Buttons */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                roleFilter === "all"
                  ? "bg-white shadow-2xs text-[#3525CD] font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("student")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                roleFilter === "student"
                  ? "bg-white shadow-2xs text-[#3525CD] font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("faculty")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                roleFilter === "faculty"
                  ? "bg-white shadow-2xs text-[#3525CD] font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Classes/Labs
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("exam_cell")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                roleFilter === "exam_cell"
                  ? "bg-white shadow-2xs text-[#3525CD] font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Exams
            </button>
          </div>
        </div>

        {/* Filter Reset */}
        <div className="flex items-center justify-between lg:justify-end gap-3 text-xs">
          <span className="text-slate-400">
            Showing <strong className="text-slate-700">{displayedItems.length}</strong> items
          </span>
          {(searchQuery || roleFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
              }}
              className="text-[#3525CD] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ITEMS LIST */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading requests...</p>
        </div>
      ) : displayedItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs max-w-xl mx-auto my-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-2xs">
            ✓
          </div>
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-slate-800">
            {activeTab === "pending"
              ? "No pending requests. All clear!"
              : "No reservation history matches your filters."}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "pending"
              ? "All department and student space allocation petitions have been authorized or resolved."
              : "Try adjusting your search query or role filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedItems.map((item) => {
            const roomObj = rooms.find((r) => String(r.id) === String(item.roomId));
            const isActing = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    {/* Badges & ID */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={item.type} dot={true}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500 text-xs">
                        {item.status === "pending"
                          ? "Pending Review"
                          : item.status === "approved"
                          ? "Approved Record"
                          : "Declined"}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        REQ-{String(item.id).slice(-4)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-[#0B1C30] mb-1">
                      {item.title}
                    </h2>

                    {/* Requester */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <span className="material-symbols-outlined text-[16px] text-[#4F46E5]">
                        account_circle
                      </span>
                      <span className="font-semibold text-slate-800">{item.requestedBy}</span>
                      <span>&bull; Campus Member</span>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Reserved Facility
                        </span>
                        <span className="font-semibold text-slate-800">
                          {roomObj ? roomObj.name : `Room ${item.roomId}`}
                        </span>
                        {roomObj && (
                          <span className="text-slate-400 text-[11px] block">
                            Capacity: {roomObj.capacity} &bull; {roomObj.equipment.join(", ")}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Scheduled Window
                        </span>
                        <span
                          className="font-medium text-slate-700"
                          dangerouslySetInnerHTML={{
                            __html: formatDateTime(item.start, item.end),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions for Pending Requests */}
                  {activeTab === "pending" ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleReject(item.id, item.title)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleApprove(item.id, item.title)}
                        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#3525CD] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        <span>{isActing ? "Processing..." : "Approve Allocation"}</span>
                      </button>
                    </div>
                  ) : (
                    /* Audit status badge */
                    <div className="shrink-0">
                      {item.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <span>✓</span> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-bold">
                          <span>✕</span> Declined
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
