// src/pages/MaintenanceLog.jsx
// Facility maintenance log page with summary metrics, filter toolbar,
// and role-aware status updating (admin editable, faculty read-only).

import { useState, useEffect, useMemo } from "react";
import { getRooms, getMaintenanceLogs, updateMaintenanceStatus, subscribeToChanges } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

export default function MaintenanceLog() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rooms, setRooms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback toast
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = async () => {
    try {
      const [roomsData, logsData] = await Promise.all([
        getRooms(),
        getMaintenanceLogs(),
      ]);
      setRooms(roomsData);
      setLogs(logsData);
    } catch (err) {
      setError(err.message || "Failed to load maintenance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToChanges(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateMaintenanceStatus(id, newStatus);
      setToast({
        message: "Maintenance status updated.",
        type: "success",
      });
      await loadData();
    } catch (err) {
      setToast({
        message: err.message || "Failed to update maintenance status.",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute summary metric counts
  const summaryMetrics = useMemo(() => {
    const openCount = logs.filter((item) => item.status === "open").length;
    const inProgressCount = logs.filter((item) => item.status === "in_progress").length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const resolvedThisMonth = logs.filter((item) => {
      if (item.status !== "resolved") return false;
      const updated = new Date(item.updatedAt || item.reportedAt);
      return updated.getMonth() === currentMonth && updated.getFullYear() === currentYear;
    }).length;

    return {
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedThisMonth,
    };
  }, [logs]);

  // Filtered log list
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (selectedRoom !== "all" && String(item.roomId) !== String(selectedRoom)) {
        return false;
      }
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesIssue = item.issue.toLowerCase().includes(query);
        const matchesReporter = (item.reportedBy || "").toLowerCase().includes(query);
        if (!matchesIssue && !matchesReporter) return false;
      }
      return true;
    });
  }, [logs, selectedRoom, selectedStatus, searchQuery]);

  // Priority and Status badge helpers
  const getPriorityBadge = (priority) => {
    const styles = {
      high: "bg-red-50 border-red-200 text-red-700",
      medium: "bg-amber-50 border-amber-200 text-amber-700",
      low: "bg-slate-100 border-slate-200 text-slate-700",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${
          styles[priority] || styles.low
        }`}
      >
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: "bg-amber-50 border-amber-200 text-amber-700",
      in_progress: "bg-blue-50 border-blue-200 text-blue-700",
      resolved: "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
    const labels = {
      open: "Open",
      in_progress: "In progress",
      resolved: "Resolved",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
          styles[status] || styles.open
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* PAGE HEADER */}
      <PageHeader
        title="Maintenance log"
        subtitle="Track and resolve campus facility and equipment reports."
        badge={
          <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200">
            {summaryMetrics.open} open
          </span>
        }
      />

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-500">Open issues</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900">
              {summaryMetrics.open}
            </span>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
              Needs attention
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-500">In progress</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900">
              {summaryMetrics.inProgress}
            </span>
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-medium">
              Being serviced
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-500">Resolved this month</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900">
              {summaryMetrics.resolved}
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              Completed
            </span>
          </div>
        </div>
      </section>

      {/* FILTERS BAR */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <span className="material-symbols-outlined text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search issue or reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>

          {/* Room filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="h-8 bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-md px-2 focus:border-indigo-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-md px-2 focus:border-indigo-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Counter and reset */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-500">
          <span>{filteredLogs.length} issues</span>
          {(selectedRoom !== "all" || selectedStatus !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedRoom("all");
                setSelectedStatus("all");
                setSearchQuery("");
              }}
              className="text-indigo-600 font-medium hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* CONTENT: Table on Desktop, Cards on Mobile */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading maintenance log...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center text-xs text-red-700">
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center max-w-md mx-auto my-6 space-y-1">
          <p className="text-sm font-medium text-slate-800">
            No issues match your filters.
          </p>
          <p className="text-xs text-slate-500">
            Try clearing search keywords or selecting another room.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium">
                  <th className="py-3 px-4 w-40">Room</th>
                  <th className="py-3 px-4">Issue description</th>
                  <th className="py-3 px-3 w-24">Priority</th>
                  <th className="py-3 px-3 w-36">Status</th>
                  <th className="py-3 px-3 w-36">Reported by</th>
                  <th className="py-3 px-3 w-32">Reported on</th>
                  <th className="py-3 px-3 w-32">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((item) => {
                  const room = rooms.find((r) => String(r.id) === String(item.roomId));
                  const isUpdating = updatingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {room ? room.name : `Room ${item.roomId}`}
                      </td>

                      <td className="py-3.5 px-4 text-slate-800">
                        {item.issue}
                      </td>

                      <td className="py-3.5 px-3">
                        {getPriorityBadge(item.priority)}
                      </td>

                      <td className="py-3.5 px-3">
                        {isAdmin ? (
                          <select
                            value={item.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="h-7 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 px-2 focus:border-indigo-600 focus:outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        ) : (
                          getStatusBadge(item.status)
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">
                        {item.reportedBy}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        {formatDate(item.reportedAt)}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        {formatDate(item.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (Hidden on desktop) */}
          <div className="md:hidden space-y-3">
            {filteredLogs.map((item) => {
              const room = rooms.find((r) => String(r.id) === String(item.roomId));
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {room ? room.name : `Room ${item.roomId}`}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getPriorityBadge(item.priority)}
                    </div>
                  </div>

                  <p className="text-slate-800 font-medium">{item.issue}</p>

                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
                    <span>Reported by {item.reportedBy}</span>
                    <span>{formatDate(item.reportedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Status:</span>
                    {isAdmin ? (
                      <select
                        value={item.status}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="h-7 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 px-2 focus:border-indigo-600 focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : (
                      getStatusBadge(item.status)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

