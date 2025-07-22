"use client";

import React, { createContext, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: any;
  login: (userData: any) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { AuthContextType };

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const login = (userData) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      alert("logout successful")
      router.push('/');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = sessionStorage.getItem("user");
      if (!stored) {
        stored = localStorage.getItem("user");
        if (stored) sessionStorage.setItem("user", stored);
      }
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
