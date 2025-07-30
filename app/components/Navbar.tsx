'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Link from 'next/link';
import React from 'react';
import {Sparkles, UserRound } from "lucide-react"

export default function Navbar() {
  const { user } = useContext(AuthContext) as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('Navbar user:', user);

  if (!mounted) {
    return null;
  }

  const isLoggedIn = !!user;

  return (
    <nav className="w-full z-20 bg-gray-100 shadow-md fixed top-0 left-0 flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo-icon.png" alt="MathGPT Logo" className="h-10 w-10" />
          <span className="text-xl font-bold text-gray-800">MathGPT</span>
        </Link>

        {isLoggedIn && (
          <>
            <Link href="/courses" className="text-gray-700 hover:text-black font-medium">Courses</Link>
            <Link href="/lecture2" className="text-gray-700 hover:text-black font-medium">Lectures</Link>
            <Link href="/newproblem" className="text-gray-700 hover:text-black font-medium">New Problem</Link>
          </>
        )}
      </div>

      <div>
        {/* Debug: show user info */}
        {/* <span style={{color:'red',fontSize:10}}>{user ? JSON.stringify(user) : 'no user'}</span> */}
        
        {isLoggedIn ? (
          <div className='flex items-center space-x-4'>
          <div className='flex items-center bg-slate-300 p-2 rounded-xl'>
            <Sparkles size={24}/>
            <p className='font-bold'>Learning Style:</p>
            <select name="ls">
              <option value="Auto">Auto</option>
              <option value="Audio">Audio</option>
              <option value="Visual">Visual</option>
            </select>
          </div>
          <Link
            href="/profile2"
            className="text-gray-700 hover:text-black text-lg"
            title="Go to Profile"
          >
            <UserRound size={24}/>
          </Link>
        </div>
          
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
