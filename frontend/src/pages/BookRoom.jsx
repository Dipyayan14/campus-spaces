// src/pages/BookRoom.jsx
// Placeholder for the room booking and suggestion request form (implemented in Task 5).

import React from "react";

export default function BookRoom() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Book a Campus Room
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Request spaces for lectures, laboratory sessions, or club events.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 text-2xl mb-3">
          📝
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          Booking Request Form
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          The booking request form with room suggestions and clash detection will be rendered here.
        </p>
      </div>
    </div>
  );
}
