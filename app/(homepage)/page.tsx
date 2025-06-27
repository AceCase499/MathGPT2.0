'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

export default function HomePage() {
  const [FirstChat, setMessage] = useState('')
  const [UploadedImage, setUploadedImage] = useState<string | null>(null)

  async function goToChat(e: React.FormEvent) {
    e.preventDefault() // Prevent form default behavior
    window.location.href = `/newchat?FirstChat=${encodeURIComponent(FirstChat)}`
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      {/* Header with sign-in button */}
      <div className="w-full flex justify-end items-center space-x-4 p-4">
        <a
            href="/login"
            className="rounded-md px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-gray-500 text-gray-600 hover:text-white"
          >
            <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-gray-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
            <span className="relative text-gray-400 transition duration-300 group-hover:text-white ease">
              Sign In
            </span>
          </a>
      </div>

      {/* Main image */}
      <div className="flex justify-center mt-8">
        <p className='text-4xl font-bold text-amber-400'>Learn Something New With MathGPT 2.0!</p>
        <br/><br/>
        {/* <Image
          src="../assets/images/mathgpt.png"
          alt="MathGPT"
          width={300}
          height={300}
          className="rounded-lg"
          style={{ width: '350px', height: '350px' }}
        /> */}
        <div style={{width: "25vw", height: "25vw"}} className='rounded-full bg-gradient-to-r from-violet-600 to-indigo-600'></div>
      </div>

      {/* Message input */}
      <div className="w-full flex items-center justify-center mt-8">
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-4 mt-8">
        <a
            href="/fetest"
            className="rounded-md px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-gray-500 text-gray-600 hover:text-white"
          >
            <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-gray-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
            <span className="relative text-gray-400 transition duration-300 group-hover:text-white ease">
              Get Started
            </span>
          </a>
      </div>

      {/* Display uploaded image */}
      {UploadedImage && (
        <div className="mt-8">
          <img
            src={UploadedImage}
            alt="Uploaded"
            className="rounded-lg"
            style={{ width: '400px', height: '400px' }} // Adjust the width and height as needed
          />
        </div>
      )}
      <br/><br/><br/>
      <p className='pb-10 text-4xl font-bold text-amber-400'>Engage with fast and thoughtful AI Math Tutor that Tracks and Supports Your Growth!</p>
      <div></div>
      <a
            href="/login"
            className="rounded-md px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-gray-500 text-gray-600 hover:text-white"
          >
            <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-gray-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
            <span className="relative text-gray-400 transition duration-300 group-hover:text-white ease">
              View Plans
            </span>
          </a>
    </div>
  )
}
