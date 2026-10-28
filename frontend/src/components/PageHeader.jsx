// src/components/PageHeader.jsx
// Standard page header with breadcrumb, title, subtitle, and action controls.

import React from "react";

export default function PageHeader({
  breadcrumb,
  title,
  subtitle,
  badge,
  actions,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80 ${className}`}
    >
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
            {breadcrumb}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl sm:text-2xl font-bold text-[#0B1C30] tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
