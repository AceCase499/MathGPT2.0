import React, { useState } from 'react';

export default function AddCourseModal({ onClose }: { onClose: () => void }) {
  const [courseCode, setCourseCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [grade, setGrade] = useState('');
  const [location, setLocation] = useState('');
  const [noteType, setNoteType] = useState('');

  if (showCreate) {
    return (
      <div className="fixed inset-0 z-50 min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: "url('/background.png')" }}>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4 flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">×</button>
          <button onClick={() => setShowCreate(false)} className="absolute top-4 left-4 text-[#8431a7] text-lg font-bold hover:underline">← Back</button>
          <h2 className="text-2xl font-bold text-center mb-6 text-[#8431a7]">Create a New Course</h2>
          {/* Top row: Grade and Location */}
          <div className="flex w-full gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className={
                  "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 " +
                  (grade === "" ? "text-gray-400" : "text-gray-900")
                }
              >
                <option value="">Select grade</option>
                <option value="K-5">K-5</option>
                <option value="6-8">6-8</option>
                <option value="9-12">9-12</option>
                <option value="College">College</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={
                  "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 " +
                  (location === "" ? "text-gray-400" : "text-gray-900")
                }
              >
                <option value="">Select location</option>
                <option value="Online">Online</option>
                <option value="In-person">In-person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <button
            className="w-full mt-2 mb-6 py-3 bg-[#8431a7] hover:bg-[#6a247e] text-white font-semibold rounded-full shadow transition-all text-lg"
          >
            Add
          </button>
          {/* Divider with 'or' */}
          <div className="flex items-center w-full my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-400 font-semibold">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          {/* Select notes type */}
          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select</label>
            <select
              value={noteType}
              onChange={e => setNoteType(e.target.value)}
              className={
                "w-full border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 " +
                (noteType === "" ? "text-gray-400" : "text-gray-900")
              }
            >
              <option value="">Select course type</option>
              <option value="ACT Math">ACT Math</option>
              <option value="Competition Math">Competition Math</option>
              <option value="AP Classes">AP Classes</option>
              <option value="College Courses">College Courses</option>
              <option value="SAT Math">SAT Math</option>
              <option value="IB Math">IB Math</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            className="w-full py-3 bg-[#8431a7] hover:bg-[#6a247e] text-white font-semibold rounded-full shadow transition-all text-lg"
          >
            Add
          </button>
        </div>
      </div>
    );
  }

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
          <button
            type="button"
            className="w-full bg-gray-100 text-[#8431a7] px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-200 transition"
            onClick={() => setShowCreate(true)}
          >
            Create New Course
          </button>
        </form>
      </div>
    </div>
  );
} 