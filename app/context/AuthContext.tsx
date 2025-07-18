"use client";

import React, { createContext, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: any;
  equation: string | null;
  login: (userData: any) => void;
  storeEquation: (equationStr: string) => void;
  deleteEquation: () => void;
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
      const storedUser = sessionStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const [equation, setEquation] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem("Equation");
    }
    return null;
  });

  const login = (userData: any) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    setEquation(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("Equation");
      router.push('/');
    }
  };

  const storeEquation = (equationStr: string) => {
    setEquation(equationStr);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("Equation", equationStr);
    }
  };

  const deleteEquation = () => {
    setEquation(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("Equation");
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
      const storedEq = sessionStorage.getItem("Equation");
      if (storedEq) setEquation(storedEq);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, equation, login, logout, storeEquation, deleteEquation }}>
      {children}
    </AuthContext.Provider>
  );
};
