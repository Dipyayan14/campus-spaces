// src/pages/Approvals.jsx
// Placeholder for booking approvals management (implemented in Task 6).
// Restricted to faculty and admin roles.

import React from "react";

export default function Approvals() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Booking Approvals
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review, approve, or reject pending room booking requests.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 text-2xl mb-3">
          ✅
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          Approvals Management Dashboard
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Pending requests review with one-click approve/reject actions will be rendered here.
        </p>
      </div>
    </div>
  );
}
