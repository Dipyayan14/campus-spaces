// src/pages/Login.jsx
// Handles user authentication via custom name & role selection,
// or via 1-click quick-sign-in demo persona buttons for presentation judges.

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDemoUsers } from "../api";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [demoPersonas, setDemoPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine redirection target (defaults to homepage)
  const fromPath = location.state?.from || "/";

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate(fromPath, { replace: true });
    }
  }, [user, navigate, fromPath]);

  // Load demo personas from api.js for quick sign in
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

  // Handle standard form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setLoading(true);

    const loggedUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      role: role,
    };

    login(loggedUser);
    navigate(fromPath, { replace: true });
  };

  // Quick 1-click login using a preset demo persona
  const handleQuickLogin = (persona) => {
    login(persona);
    navigate(fromPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-3xl shadow-lg shadow-indigo-100 mb-3">
            🏫
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Campus Spaces
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Room and event booking system for our campus
          </p>
        </div>

        {/* Main login card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Sign In to your Account
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name input */}
            <div>
              <label
                htmlFor="user-name"
                className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
              >
                Your Full Name
              </label>
              <input
                id="user-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>

            {/* Role dropdown */}
            <div>
              <label
                htmlFor="user-role"
                className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1"
              >
                Campus Role
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="student">Student</option>
                <option value="club">Club / Society</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Administrator</option>
                <option value="exam_cell">Exam Cell</option>
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                Or quick test as
              </span>
            </div>
          </div>

          {/* Quick Sign-In Persona Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {demoPersonas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleQuickLogin(persona)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-medium text-slate-700 group-hover:text-indigo-900">
                    {persona.name}
                  </span>
                  <span className="block text-[11px] text-slate-400 capitalize">
                    {persona.role.replace("_", " ")}
                  </span>
                </div>
                <span className="text-xs text-indigo-600 font-semibold group-hover:translate-x-0.5 transition transform">
                  Login &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info for hackathon presentation */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Campus Spaces &bull; Room & Event Booking Portal
        </p>
      </div>
    </div>
  );
}
