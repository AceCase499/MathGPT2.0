'use client'

import { useState } from 'react'
import Image from 'next/image'
import Navbar from './components/Navbar'

export default function Home() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    userType: '',
    district: '',
  })

  const handleRegister = async () => {
    try {
      console.log("Registering user (simulated):", formData)
      await new Promise(resolve => setTimeout(resolve, 500))
      alert('Registration simulated successfully!')
    } catch (err) {
      alert('Registration failed: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white text-gray-900">
      <Navbar/>

      <section className="mt-60 flex flex-col items-center text-center">
        <Image src="/logo-full.png" alt="MathGPT Full Logo" width={480} height={150} priority />
      </section>
      <section className="w-full max-w-6xl mx-auto mt-40 px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
  {[
    { title: 'About MathGPT', desc: '...' },
    { title: 'Features', desc: '...' },
    { title: 'Reviews', desc: '...' },
  ].map(({ title, desc }, idx) => (
    <div key={idx} className="bg-gray-100 p-8 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  ))}
</section>

<section className="mt-20 w-full max-w-6xl mx-auto px-6 mb-24">
  <div className="bg-gray-100 p-12 min-h-[300px] rounded-lg shadow text-center flex flex-col justify-center">
    <h2 className="text-3xl font-semibold mb-6">About Us</h2>
    <hr className="border-t border-gray-300 mb-6 mx-auto w-1/2" />
    <p className="text-gray-700 text-lg">We are committed to helping students master mathematics...</p>
  </div>
</section>



      <section className="w-full max-w-md mt-16 px-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Register</h2>
        <input
          className="border p-2 my-2 w-full"
          placeholder="Email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          className="border p-2 my-2 w-full"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
        />
        <input
          className="border p-2 my-2 w-full"
          placeholder="Name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          className="border p-2 my-2 w-full"
          placeholder="Age"
          value={formData.age}
          onChange={e => setFormData({ ...formData, age: e.target.value })}
        />
        <input
          className="border p-2 my-2 w-full"
          placeholder="User Type"
          value={formData.userType}
          onChange={e => setFormData({ ...formData, userType: e.target.value })}
        />
        <input
          className="border p-2 my-2 w-full"
          placeholder="District"
          value={formData.district}
          onChange={e => setFormData({ ...formData, district: e.target.value })}
        />
        <button
          onClick={handleRegister}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Register (Simulated)
        </button>
      </section>

      <footer className="mt-20 text-sm text-gray-500 py-6">
        &copy; {new Date().getFullYear()} MathGPT. All rights reserved.
      </footer>
    </div>
  )
}