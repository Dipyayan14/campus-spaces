// src/components/Navbar.jsx
// SpaceSync top navigation with role-based links, notifications, quick reserve, and mobile drawer.

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Only venue administrators can review and manage booking approvals.
  const canAccessApprovals =
    user?.role === "venue_admin" || user?.role === "super_admin";

  // Keep legacy admin access for existing demo sessions.
  const canAccessInsights =
    user?.role === "super_admin" ||
    user?.role === "exam_cell" ||
    user?.role === "admin";

  const displayRole = (role = "") =>
    role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-[#0F172A] text-white sticky top-0 z-40 min-h-[68px] border-b border-slate-800/80 shadow-xs">
      <div className="w-full min-h-[68px] px-4 sm:px-8 flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Brand and desktop navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[20px]">
                domain
              </span>
            </div>

            <span className="font-bold text-lg text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              SpaceSync
            </span>
          </Link>

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

            {canAccessInsights && (
              <NavLink to="/insights" className={getNavLinkClass}>
                <span className="material-symbols-outlined text-[17px]">
                  analytics
                </span>
                <span>Insights</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-3">
          {/* Quick room search */}
          <div className="hidden lg:flex items-center relative">
            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-[18px]">
              search
            </span>

            <input
              type="text"
              placeholder="Quick find hall or room..."
              aria-label="Quick find hall or room"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  navigate("/book", {
                    state: { searchQuery: event.currentTarget.value },
                  });
                }
              }}
              className="bg-[#213145] border border-slate-700/60 text-white placeholder-slate-400 text-xs rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition"
            />
          </div>

          {/* Notifications popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle notifications"
              aria-expanded={notificationsOpen}
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>

              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0F172A]" />
            </button>

            {notificationsOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setNotificationsOpen(false)}
                />

                <div className="absolute right-0 top-full mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Close notifications"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-500 mt-2">
                    Check your reservations and explore available campus
                    spaces.
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate("/");
                      }}
                      className="text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                    >
                      <span className="material-symbols-outlined text-[17px] align-middle mr-2">
                        calendar_month
                      </span>
                      View Calendar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate("/book");
                      }}
                      className="text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                    >
                      <span className="material-symbols-outlined text-[17px] align-middle mr-2">
                        meeting_room
                      </span>
                      Book a Room
                    </button>

                    {canAccessApprovals && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate("/approvals");
                        }}
                        className="text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                      >
                        <span className="material-symbols-outlined text-[17px] align-middle mr-2">
                          task_alt
                        </span>
                        Review Booking Requests
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-3">
                    Live booking alerts will appear here when notifications are
                    connected.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Quick reserve */}
          <button
            type="button"
            onClick={() => navigate("/book")}
            className="hidden sm:flex bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold px-3.5 py-2 rounded-lg items-center gap-1.5 active:scale-[0.98] transition shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              add
            </span>
            <span>Quick Reserve</span>
          </button>

          {/* Profile and logout */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="relative flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-400/40">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>

                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0F172A]"
                  title={`Logged in as ${displayRole(user.role)}`}
                />
              </div>

              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-200 max-w-[120px] truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {displayRole(user.role)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-400 transition ml-1 px-1.5 py-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <span className="material-symbols-outlined text-[18px]">
                  logout
                </span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0F172A] px-4 pt-3 pb-5 space-y-2">
          <NavLink
            to="/"
            end
            onClick={closeMobileMenu}
            className={getMobileNavLinkClass}
          >
            Calendar
          </NavLink>

          <NavLink
            to="/book"
            onClick={closeMobileMenu}
            className={getMobileNavLinkClass}
          >
            Book Room
          </NavLink>

          {canAccessApprovals && (
            <NavLink
              to="/approvals"
              onClick={closeMobileMenu}
              className={getMobileNavLinkClass}
            >
              Approvals
            </NavLink>
          )}

          {canAccessInsights && (
            <NavLink
              to="/insights"
              onClick={closeMobileMenu}
              className={getMobileNavLinkClass}
            >
              Insights
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              navigate("/book");
            }}
            className="w-full mt-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              add
            </span>
            <span>Quick Reserve</span>
          </button>

          {user && (
            <div className="pt-3 border-t border-slate-800 mt-2 flex items-center justify-between">
              <div className="text-xs min-w-0">
                <span className="font-semibold text-slate-200 block truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {displayRole(user.role)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer ml-3"
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