// src/components/Navbar.jsx
// Main navigation bar with role-based link visibility, responsive mobile toggle,
// and current user profile with logout button.

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Approvals tab is only visible to faculty and admin
  const canAccessApprovals = user?.role === "faculty" || user?.role === "admin";

  // Active / inactive navlink styling helper
  const getNavLinkClass = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-lg text-sm font-medium transition duration-150 ${
      isActive
        ? "bg-indigo-50 text-indigo-700 shadow-xs"
        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
    }`;

  const getMobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-base font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
    }`;

  // Role display badge colors
  const roleBadgeColors = {
    student: "bg-emerald-50 text-emerald-700 border-emerald-200",
    club: "bg-purple-50 text-purple-700 border-purple-200",
    faculty: "bg-indigo-50 text-indigo-700 border-indigo-200",
    admin: "bg-amber-50 text-amber-700 border-amber-200",
    exam_cell: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const badgeStyle =
    roleBadgeColors[user?.role] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏫</span>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Campus <span className="text-indigo-600">Spaces</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 ml-6">
              <NavLink to="/" end className={getNavLinkClass}>
                Calendar
              </NavLink>
              <NavLink to="/book" className={getNavLinkClass}>
                Book a Room
              </NavLink>
              {canAccessApprovals && (
                <NavLink to="/approvals" className={getNavLinkClass}>
                  Approvals
                </NavLink>
              )}
            </div>
          </div>

          {/* Desktop User Profile & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800 leading-none">
                    {user.name}
                  </div>
                  <span
                    className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border mt-1 capitalize ${badgeStyle}`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileNavLinkClass}
          >
            Calendar
          </NavLink>
          <NavLink
            to="/book"
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileNavLinkClass}
          >
            Book a Room
          </NavLink>
          {canAccessApprovals && (
            <NavLink
              to="/approvals"
              onClick={() => setMobileMenuOpen(false)}
              className={getMobileNavLinkClass}
            >
              Approvals
            </NavLink>
          )}

          {user && (
            <div className="pt-3 border-t border-slate-200 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </div>
                  <span
                    className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border mt-0.5 capitalize ${badgeStyle}`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 px-3 text-center rounded-lg border border-red-200 text-red-600 bg-red-50 text-sm font-semibold hover:bg-red-100 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
