// src/components/Navbar.jsx
// Matches the Stitch Campus Spaces Top Navigation Bar (Deep Slate #0F172A, 68px height)
// Includes role-based links, search field, quick reserve button, user profile badge, and mobile drawer.

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

  const getNavLinkClass = ({ isActive }) =>
    `pb-1 flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150 ${
      isActive
        ? "text-white border-b-2 border-[#4F46E5]"
        : "text-slate-400 hover:text-white border-b-2 border-transparent"
    }`;

  const getMobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-sm font-semibold transition ${
      isActive
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
    }`;

  return (
    <header className="bg-[#0F172A] text-white sticky top-0 z-40 h-[68px] border-b border-slate-800/80 shadow-xs">
      <div className="w-full h-[68px] px-4 sm:px-8 flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Brand Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[20px]">domain</span>
            </div>
            <span className="font-bold text-lg text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Campus Spaces
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={getNavLinkClass}>
              <span className="material-symbols-outlined text-[17px]">
                calendar_month
              </span>
              <span>Calendar</span>
            </NavLink>

            <NavLink to="/book" className={getNavLinkClass}>
              <span className="material-symbols-outlined text-[17px]">
                meeting_room
              </span>
              <span>Book Room</span>
            </NavLink>

            {canAccessApprovals && (
              <NavLink to="/approvals" className={getNavLinkClass}>
                <span className="material-symbols-outlined text-[17px]">
                  task_alt
                </span>
                <span>Approvals</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3">
          {/* Quick Find Search */}
          <div className="hidden lg:flex items-center relative">
            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Quick find hall or room..."
              className="bg-[#213145] border border-slate-700/60 text-white placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition"
            />
          </div>

          {/* Campus Switcher Menu */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-200 text-xs font-medium bg-[#1E293B]/60">
            <span className="material-symbols-outlined text-[16px] text-indigo-400">
              domain
            </span>
            <span>North Science Quad</span>
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              arrow_drop_down
            </span>
          </div>

          {/* Notification Bell */}
          <div className="relative p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#0F172A]" />
          </div>

          {/* Primary Quick Reserve Button */}
          <button
            type="button"
            onClick={() => navigate("/book")}
            className="hidden sm:flex bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold px-3.5 py-2 rounded-lg items-center gap-1.5 active:scale-[0.98] transition shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Quick Reserve</span>
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="relative flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-400/40">
                  {user.name.charAt(0)}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0F172A]"
                  title={`Logged in as ${user.role}`}
                />
              </div>

              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-200 max-w-[120px] truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {user.role.replace("_", " ")}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-400 transition ml-1 px-1.5 py-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Sign out"
              >
                <span className="material-symbols-outlined text-[18px]">
                  logout
                </span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0F172A] px-4 pt-3 pb-5 space-y-2">
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
            Book Room
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

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/book");
            }}
            className="w-full mt-2 bg-[#4F46E5] text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Quick Reserve</span>
          </button>

          {user && (
            <div className="pt-3 border-t border-slate-800 mt-2 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-400 capitalize">
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
