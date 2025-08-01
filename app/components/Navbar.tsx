'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Link from 'next/link';
import React from 'react';
import {Sparkles, UserRound } from "lucide-react"

export default function Navbar() {
  const { user } = useContext(AuthContext) as any;
  const [mounted, setMounted] = useState(false);
  const [updatingLS, ttgUpdateLS] = useState(false);
  const [learningStyle, setLearningStyle] = useState('Auto'); // Default value

  useEffect(() => {
    setMounted(true);
    if (user){
      getLStyle()
    }
  }, []);

  //console.log('Navbar user:', user);

  if (!mounted) {
    return null;
  }

  const isLoggedIn = !!user;

  async function getLStyle(){
    ttgUpdateLS(!updatingLS)
    const form = new FormData();
    Object.entries({student_id: user?.id}).forEach(([key, value]) => {
      form.append(key, value);
    });
    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/get_learning_style', {
      method: 'POST',
      body: form
    });

    const data = await response.json();
    alert("Style set to "+data.learning_style)
    setLearningStyle(data.learning_style)
    ttgUpdateLS(!updatingLS)
  }

  async function handleLStyle(LStyle){
    ttgUpdateLS(!updatingLS)
    setLearningStyle(LStyle)
    const form = new FormData();
    Object.entries({student_id: user?.id, learning_style: LStyle}).forEach(([key, value]) => {
      form.append(key, value);
    });
    
    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/update_learning_style', {
      method: 'POST',
      body: form
    });

    const data = await response.json();
    alert(data.message)
    ttgUpdateLS(!updatingLS)
  }

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
            <select name="ls" disabled={updatingLS} value={learningStyle} onChange={e=>handleLStyle(e.target.value)}>
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
