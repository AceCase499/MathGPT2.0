"use client";

import React, { createContext, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedUser = sessionStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const login = (userData) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("user");
      alert("logout successful")
      router.push('/');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
