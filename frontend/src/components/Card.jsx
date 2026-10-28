// src/components/Card.jsx
// Surface container card matching the Stitch Academic UI standards.

import React from "react";

export default function Card({ children, className = "", p = "p-5", ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-2xs ${p} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
