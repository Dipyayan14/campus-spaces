// src/App.jsx
// SpaceSync router with authentication, role-based access, Navbar, and chatbot.

import React from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import SpaceSyncChatbot from "./components/SpaceSyncChatbot";

// Pages
import Login from "./pages/Login";
import Calendar from "./pages/Calendar";
import BookRoom from "./pages/BookRoom";
import Approvals from "./pages/Approvals";
import Insights from "./pages/Insights";
import MaintenanceLog from "./pages/MaintenanceLog";

/**
 * Requires authentication and provides the shared application layout.
 */
function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col text-[#0B1C30]">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Available on all authenticated pages */}
      <SpaceSyncChatbot />
    </div>
  );
}

/**
 * Prevents users without the required role from opening protected routes.
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

        {/* Only Venue Admin and Super Admin can manage approvals */}
        <Route
          path="/approvals"
          element={
            <RoleRoute
              allowedRoles={["venue_admin", "super_admin"]}
            >
              <Approvals />
            </RoleRoute>
          }
        />

        {/* Insights for Super Admin and Exam Cell.
            Legacy admin role is retained for existing demo sessions. */}
        <Route
          path="/insights"
          element={
            <RoleRoute
              allowedRoles={["super_admin", "exam_cell", "admin"]}
            >
              <Insights />
            </RoleRoute>
          }
        />

        {/* Maintenance log for Faculty, Venue Admin, and Super Admin */}
        <Route
          path="/maintenance-log"
          element={
            <RoleRoute allowedRoles={["faculty", "venue_admin", "super_admin", "admin"]}>
              <MaintenanceLog />
            </RoleRoute>
          }
        />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
