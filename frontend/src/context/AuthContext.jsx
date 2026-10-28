// src/context/AuthContext.jsx
// Manages authentication state for Campus Spaces.
// Stores current user { id, name, role } in localStorage so state persists across page refreshes.
// Defaults to null so unauthenticated users must sign in.

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize user state from localStorage or null (no default seeded user)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("campus_spaces_user");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error("Failed to load user from localStorage", err);
      return null;
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
