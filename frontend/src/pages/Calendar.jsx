// src/pages/Calendar.jsx
// Placeholder for the FullCalendar schedule view (implemented in Task 4).
// Displays flash error alert if redirected here due to role restrictions.

import React from "react";
import { useLocation } from "react-router-dom";

export default function Calendar() {
  const location = useLocation();
  const alertMessage = location.state?.error;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Role restriction alert banner */}
      {alertMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center space-x-3 text-sm font-medium animate-fadeIn">
          <span className="text-lg">⚠️</span>
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Campus Room Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View room reservations, classes, labs, and campus events.
          </p>
        </div>
      </div>

      {/* Placeholder content card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 text-2xl mb-3">
          📅
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          Calendar View
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          The interactive FullCalendar with room filter and priority indicators will be rendered here.
        </p>
      </div>
    </div>
  );
}
