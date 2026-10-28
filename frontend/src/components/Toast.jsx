// src/components/Toast.jsx
// Floating feedback toast notification.

import React from "react";

export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const typeStyles = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-900",
    error: "bg-red-50 border-red-300 text-red-900",
    info: "bg-indigo-50 border-indigo-300 text-indigo-900",
    warning: "bg-amber-50 border-amber-300 text-amber-900",
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
    warning: "warning",
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-slideUp">
      <div
        className={`p-3.5 rounded-xl border shadow-lg flex items-center justify-between gap-3 text-xs font-semibold ${typeStyles[type]}`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">
            {icons[type]}
          </span>
          <span>{message}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
