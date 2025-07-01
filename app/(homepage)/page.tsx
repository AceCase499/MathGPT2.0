'use client'

import Image from "next/image"
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-white text-gray-900">

      
      <section className="mt-20 flex flex-col items-center text-center">
        <Image src="/assets/images/logofull.png" alt="MathGPT Full Logo" width={320} height={80} priority />
        <p className="mt-4 text-xl font-medium text-gray-700">MathGPT, your best math tutor</p>
      </section>

      
      <section className="w-full max-w-3xl mt-20 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-2">About Us</h2>
        <hr className="border-t border-gray-300 mb-4" />
        <p className="text-gray-700">...</p>
      </section>

      
      <section className="w-full max-w-5xl mt-12 px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="bg-gray-100 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">About MathGPT</h3>
          <p className="text-gray-600">...</p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Features</h3>
          <p className="text-gray-600">...</p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Reviews</h3>
          <p className="text-gray-600">...</p>
        </div>
      </section>

      
      <footer className="mt-20 text-sm text-gray-500 py-6">
        &copy; {new Date().getFullYear()} MathGPT. All rights reserved.
      </footer>
    </div>
  )
}