// src/context/AuthContext.jsx
// Manages authentication state for Campus Spaces.
// Stores current user { id, name, role } in localStorage so state persists across page refreshes.

import React, { createContext, useContext, useState, useEffect } from "react";

// Predefined default persona so the app is instantly usable without a mandatory login step
const DEFAULT_USER = {
  id: "u3",
  name: "Prof. Ananya Sen",
  role: "faculty",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize user state from localStorage or fallback to default faculty member
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("campus_spaces_user");
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch (err) {
      console.error("Failed to load user from localStorage", err);
      return DEFAULT_USER;
    }
  });

  // Sync user state changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("campus_spaces_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("campus_spaces_user");
    }
  }, [user]);

  // Login handler
  const login = (userData) => {
    setUser(userData);
  };

  // Logout handler
  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for convenient consumption across components & pages
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
