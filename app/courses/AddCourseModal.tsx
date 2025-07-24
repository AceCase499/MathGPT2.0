import React, { useState } from 'react';

export default function AddCourseModal({ onClose }: { onClose: () => void }) {
  const [courseCode, setCourseCode] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4 flex flex-col items-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">×</button>
        <h2 className="text-2xl font-bold text-center mb-4 text-[#8431a7]">Let's add a course!</h2>
        <form className="w-full flex flex-col items-center gap-6">
          <div className="flex w-full gap-2">
            <input
              type="text"
              placeholder="Course code"
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md text-lg focus:outline-none bg-white"
            />
            <button type="button" className="bg-[#8431a7] text-white px-6 py-2 rounded-r-md font-semibold text-lg hover:bg-[#6a247e] transition">Add</button>
          </div>
          <div className="flex items-center w-full my-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="mx-4 text-gray-400 font-semibold">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          <button type="button" className="w-full bg-gray-100 text-[#8431a7] px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-200 transition">Create New Course</button>
        </form>
      </div>
    </div>
  );
} 