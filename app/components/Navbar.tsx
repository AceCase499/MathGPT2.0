'use client';

import { useSession } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import React from 'react';

export default function Navbar() {
  const session = useSession();
  const isLoggedIn = !!session;

  return (
    <nav className="w-full z-20 bg-gray-100 shadow-md fixed top-0 left-0 flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo-icon.png" alt="MathGPT Logo" className="h-10 w-10" />
          <span className="text-xl font-bold text-gray-800">MathGPT</span>
        </Link>

        {isLoggedIn && (
          <>
            <Link href="/lectures" className="text-gray-700 hover:text-black font-medium">Lectures</Link>
            <Link href="/newproblem" className="text-gray-700 hover:text-black font-medium">New Problem</Link>
          </>
        )}
      </div>

      <div>
        {isLoggedIn ? (
          <Link
            href="/profile"
            className="text-gray-700 hover:text-black text-lg"
            title="Go to Profile"
          >
            👤
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-white border border-gray-500 text-gray-700 rounded-full px-5 py-2 hover:bg-gray-100 transition text-sm font-medium shadow"
>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
