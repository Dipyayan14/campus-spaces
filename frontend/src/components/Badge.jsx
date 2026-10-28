// src/components/Badge.jsx
// Standardized status and category badges matching Stitch tokens.

import React from "react";

const VARIANTS = {
  exam: "bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]",
  class: "bg-[#EFF6FF] border-[#DBEAFE] text-[#2563EB]",
  lab: "bg-[#ECFDF5] border-[#D1FAE5] text-[#059669]",
  event: "bg-[#FFF7ED] border-[#FFEDD5] text-[#EA580C]",
  approved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  pending: "bg-amber-50 border-amber-200 text-amber-700 border-dashed",
  rejected: "bg-red-50 border-red-200 text-red-700",
  indigo: "bg-[#EFF4FF] border-[#C7C4D866] text-[#3525CD]",
  slate: "bg-slate-100 border-slate-200 text-slate-700",
};

export default function Badge({ variant = "slate", dot = false, dotColor, children, className = "" }) {
  const style = VARIANTS[variant] || VARIANTS.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColor ||
            (variant === "exam"
              ? "bg-[#DC2626]"
              : variant === "class"
              ? "bg-[#2563EB]"
              : variant === "lab"
              ? "bg-[#059669]"
              : variant === "event"
              ? "bg-[#EA580C]"
              : variant === "approved"
              ? "bg-emerald-500"
              : variant === "pending"
              ? "bg-amber-500"
              : "bg-slate-400")
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
