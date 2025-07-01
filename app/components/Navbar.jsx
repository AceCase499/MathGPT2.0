'use client';

import React from 'react';
import Link from 'next/link';

export default function Navbar({ isLoggedIn }) {
  return (
    <nav className="w-full z-10 bg-white shadow-lg fixed top-0 left-0 flex justify-between items-center px-6 py-4">
      <Link href="/" className="flex items-center space-x-2 cursor-pointer">
        <img src="/logo-icon.png" alt="MathGPT Logo" className="h-10 w-10" />
        <span className="text-xl font-bold text-gray-800">MathGPT</span>
      </Link>

    
      {!isLoggedIn && (
        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow"
          onClick={() => window.location.href = '/login'}
        >
          Log in
        </button>
      )}
    </nav>
  );
}
