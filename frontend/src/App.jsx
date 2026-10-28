// src/App.jsx
// Main application router with authentication guards, role-based route protection,
// and protected layout with the sticky Navbar.

import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Calendar from "./pages/Calendar";
import BookRoom from "./pages/BookRoom";
import Approvals from "./pages/Approvals";
import Insights from "./pages/Insights";

/**
 * ProtectedLayout:
 * Requires user to be logged in. If not authenticated, redirects to /login.
 * Wraps authenticated pages in the common Navbar and layout container.
 */
function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save attempted URL to redirect back after signing in
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col text-[#0B1C30]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * RoleRoute:
 * Protects specific routes (like /approvals or /insights) by checking the user's role.
 * Unauthorized roles are redirected back to "/" with an error notice.
 */
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ error: "You don't have access to that page." }}
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Calendar />} />
        <Route path="/book" element={<BookRoom />} />
        <Route
          path="/approvals"
          element={
            <RoleRoute allowedRoles={["faculty", "admin"]}>
              <Approvals />
            </RoleRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <RoleRoute allowedRoles={["admin", "exam_cell"]}>
              <Insights />
            </RoleRoute>
          }
        />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}