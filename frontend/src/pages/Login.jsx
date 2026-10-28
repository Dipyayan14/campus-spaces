// src/pages/Login.jsx
// Pixel-accurate implementation matching the Stitch Login design (login_campus_spaces).
// Includes ambient structural background grid, top operational bar,
// full input form with icons, and 1-click test persona quick-launch buttons.

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDemoUsers } from "../api";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [rememberMe, setRememberMe] = useState(true);
  const [demoPersonas, setDemoPersonas] = useState([]);
  const [error, setError] = useState("");

  const fromPath = location.state?.from || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(fromPath, { replace: true });
    }
  }, [user, navigate, fromPath]);

  // Load demo personas from api.js
  useEffect(() => {
    async function loadPersonas() {
      try {
        const personas = await getDemoUsers();
        setDemoPersonas(personas);
      } catch (err) {
        console.error("Failed to load demo personas", err);
      }
    }
    loadPersonas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError("");

    const loggedUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
      role: role,
    };

    login(loggedUser);
    navigate(fromPath, { replace: true });
  };

  const handleQuickLogin = (persona) => {
    login(persona);
    navigate(fromPath, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FF] text-[#0B1C30] antialiased">
      {/* Top Branding & Status Bar */}
      <header className="bg-[#0F172A] text-white h-[68px] w-full border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 z-20">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[20px]">domain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-white">
                Campus Spaces
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                v2.4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">help_center</span>
              <span>Helpdesk</span>
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-2 text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Network Operational</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Canvas with Ambient Background */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-[#F8F9FF] to-[#EFF4FF]">
        {/* Ambient Grid Pattern */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#c7c4d8_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none"
          aria-hidden="true"
        />

        <div className="w-full max-w-lg relative z-10">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10 backdrop-blur-xs">
            {/* Header & Branding */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF4FF] text-[#3525CD] text-[11px] font-semibold border border-indigo-100 mb-3">
                <span className="material-symbols-outlined text-[15px]">school</span>
                <span>University Facility Portal</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl font-bold text-[#0B1C30] tracking-tight">
                Campus Spaces
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-xs mx-auto">
                Reserve halls, research labs, and smart classrooms effortlessly.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Mitchell"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition"
                  />
                </div>
              </div>

              {/* Institutional Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Institutional Email / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="id@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition"
                  />
                </div>
              </div>

              {/* Campus Role Dropdown */}
              <div>
                <label
                  htmlFor="userRole"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Campus Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <select
                    id="userRole"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] appearance-none transition cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="club">Club Coordinator</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                    <option value="exam_cell">Exam Cell</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                  </div>
                </div>
              </div>

              {/* Checkbox & Help Link */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500">
                    Remember me on this workstation
                  </span>
                </label>
                <span className="text-xs text-[#4F46E5] hover:underline cursor-pointer">
                  Institutional SSO?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#4F46E5] hover:bg-[#3525CD] text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-lg shadow-sm active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">
                  Quick "Sign in as..." Test Persona
                </span>
              </div>
            </div>

            {/* 1-Click Test Persona Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoPersonas.map((persona) => {
                const iconMap = {
                  student: "local_library",
                  club: "groups",
                  faculty: "psychology",
                  admin: "admin_panel_settings",
                  exam_cell: "assignment_turned_in",
                };
                const icon = iconMap[persona.role] || "person";
                const isExamCell = persona.role === "exam_cell";

                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handleQuickLogin(persona)}
                    className={`group p-2 rounded-lg border border-slate-200 hover:border-[#4F46E5]/60 bg-slate-50/60 hover:bg-[#EFF4FF] text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isExamCell ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-md bg-[#EFF4FF] text-[#3525CD] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-[#3525CD] transition-colors flex items-center justify-between">
                        <span className="capitalize">{persona.role.replace("_", " ")}</span>
                        <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                          chevron_right
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">{persona.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 mt-5">
            Campus Spaces &bull; Higher Education Facility Planning & Management
          </p>
        </div>
      </main>
    </div>
  );
}
