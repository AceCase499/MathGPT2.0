'use client';

import {React, useContext} from 'react';
import Link from 'next/link';
//import { AuthContext } from "../context/AuthContext.js";

export default function Navbar({ isLoggedIn }) {
  //const { user, logout } = useContext(AuthContext);
  return (
    <nav className="w-full z-10 bg-white shadow-lg fixed top-0 left-0 flex justify-between items-center px-6 py-4">
      <Link href="/" className="flex items-center space-x-2 cursor-pointer">
        <img src="/logo-icon.png" alt="MathGPT Logo" className="h-10 w-10" />
        <span className="text-xl font-bold text-gray-800">MathGPT</span>
      </Link>

    
      {/* !user?.id */true ? (
        <button
          className="bg-blue-600 cursor-pointer text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow"
          onClick={() => window.location.href = '/login'}
        >
          Log in
        </button>
      ):(
        <button
          className="bg-blue-600 cursor-pointer text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow"
          onClick={logout}
        >
          Log out
        </button>
      )}
    </nav>
  );
}
