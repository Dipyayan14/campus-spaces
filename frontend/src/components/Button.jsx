// src/components/Button.jsx
// Button component matching Stitch interactive states.

import React from "react";

const VARIANTS = {
  primary:
    "bg-[#4F46E5] hover:bg-[#3525CD] text-white shadow-2xs focus:ring-[#4F46E5]/30 active:scale-[0.98]",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs focus:ring-slate-200 active:scale-[0.98]",
  outline:
    "bg-transparent hover:bg-indigo-50 border border-[#4F46E5] text-[#4F46E5] active:scale-[0.98]",
  danger:
    "bg-[#FEF2F2] hover:bg-red-100 text-[#DC2626] border border-red-200 active:scale-[0.98]",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
};

const SIZES = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-xs font-semibold",
  lg: "px-5 py-2.5 text-sm font-semibold",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[17px]">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
