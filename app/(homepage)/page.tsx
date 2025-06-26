'use client'

import Link from 'next/link'
import { useState } from 'react'

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4a2 2 0 110 4 2 2 0 010-4zm0 14c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" />
        </svg>
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
      <div className="w-full flex justify-center mt-8">
        <img
          src="/assets/images/mathgpt.png"
          alt="MathGPT"
          className="rounded-lg"
          style={{ width: '350px', height: '350px' }}
        />
      </div>

      {/* Message input */}
      <div className="w-full flex items-center justify-center mt-8">
        <div className="flex items-center border-2 border-gray-500 bg-black-300 rounded-full px-4 w-2/3">
          <label className="flex items-center cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleImageUpload}
            />
            <svg
              data-testid="geist-icon"
              height="24"
              strokeLinejoin="round"
              viewBox="0 0 16 16"
              width="24"
              style={{ color: 'currentColor', marginRight: '10px' }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.5 2.5H1.5V9.18933L2.96966 7.71967L3.18933 7.5H3.49999H6.63001H6.93933L6.96966 7.46967L10.4697 3.96967L11.5303 3.96967L14.5 6.93934V2.5ZM8.00066 8.55999L9.53034 10.0897L10.0607 10.62L9.00001 11.6807L8.46968 11.1503L6.31935 9H3.81065L1.53032 11.2803L1.5 11.3106V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H13.5C14.0523 13.5 14.5 13.0523 14.5 12.5V9.06066L11 5.56066L8.03032 8.53033L8.00066 8.55999ZM4.05312e-06 10.8107V12.5C4.05312e-06 13.8807 1.11929 15 2.5 15H13.5C14.8807 15 16 13.8807 16 12.5V9.56066L16.5607 9L16.0303 8.46967L16 8.43934V2.5V1H14.5H1.5H4.05312e-06V2.5V10.6893L-0.0606689 10.75L4.05312e-06 10.8107Z"
                fill="currentColor"
              ></path>
            </svg>
          </label>
          <form onSubmit={goToChat} className="w-full">
            <input
              type="text"
              placeholder="Message MathGPT"
              value={FirstChat}
              onChange={e => setMessage(e.target.value)}
              className="flex-grow bg-transparent border-transparent w-full"
            />
          </form>
          <button onClick={goToChat} className="ml-4">
            <svg
              data-testid="geist-icon"
              height="25"
              strokeLinejoin="round"
              viewBox="0 0 16 16"
              width="25"
              className="justify-end"
              style={{ color: 'currentColor' }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.25 7.25H4.5V8.75H5.25H9.43934L7.96967 10.2197L7.43934 10.75L8.5 11.8107L9.03033 11.2803L11.7803 8.53033C12.0732 8.23744 12.0732 7.76256 11.7803 7.46967L9.03033 4.71967L8.5 4.18934L7.43934 5.25L7.96967 5.78033L9.43934 7.25H5.25ZM8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8C14.5 11.5899 11.5899 14.5 8 14.5ZM0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8Z"
                fill="currentColor"
              ></path>
            </svg>
          </button>
          <button
            onClick={() => console.log('Microphone clicked')}
            className="ml-2"
          >
            <svg
              data-testid="geist-icon"
              height="25"
              strokeLinejoin="round"
              viewBox="0 0 16 16"
              width="25"
              className="justify-self-end"
              style={{ color: 'currentColor' }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.50098 1.5H7.50098C6.67255 1.5 6.00098 2.17157 6.00098 3V7C6.00098 7.82843 6.67255 8.5 7.50098 8.5H8.50098C9.32941 8.5 10.001 7.82843 10.001 7V3C10.001 2.17157 9.32941 1.5 8.50098 1.5ZM7.50098 0C5.84412 0 4.50098 1.34315 4.50098 3V7C4.50098 8.65685 5.84412 10 7.50098 10H8.50098C10.1578 10 11.501 8.65685 11.501 7V3C11.501 1.34315 10.1578 0 8.50098 0H7.50098ZM7.25098 13.2088V15.25V16H8.75098V15.25V13.2088C11.5607 12.8983 13.8494 10.8635 14.5383 8.18694L14.7252 7.46062L13.2726 7.08673L13.0856 7.81306C12.5028 10.0776 10.4462 11.75 8.00098 11.75C5.55572 11.75 3.49918 10.0776 2.91633 7.81306L2.72939 7.08673L1.27673 7.46062L1.46368 8.18694C2.15258 10.8635 4.44128 12.8983 7.25098 13.2088Z"
                fill="currentColor"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-4 mt-8">
        <a
            href="/topics"
            className="rounded-md px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-gray-500 text-gray-600 hover:text-white"
          >
            <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-gray-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
            <span className="relative text-gray-400 transition duration-300 group-hover:text-white ease">
              Math Topic Select
            </span>
          </a>
        <a
            href="learning_practice"
            className="rounded-md px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-gray-500 text-gray-600 hover:text-white"
          >
            <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-gray-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
            <span className="relative text-gray-400 transition duration-300 group-hover:text-white ease">
              Study
            </span>
          </a>
        <a
            href="#_"
            className="rounded-md px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-gray-500 text-gray-600 hover:text-white"
          >
            <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-gray-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
            <span className="relative text-gray-400 transition duration-300 group-hover:text-white ease">
              Graph
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
    </div>
  )
}
