"use client"
import React, { useState } from "react";

const mockCourses = [
  {
    name: "Algebra I",
    dueDate: "2025-08-15",
    topic: "Equations",
    subtopics: ["Linear Equations", "Quadratic Equations"],
    active: true,
  },
  {
    name: "Geometry Basics",
    dueDate: "2025-09-01",
    topic: "Shapes",
    subtopics: ["Triangles", "Angles"],
    active: false,
  },
];

export default function MathCoursesPage() {
  const [courses, setCourses] = useState(mockCourses);
  const [newCourse, setNewCourse] = useState({
    name: "",
    topic: "",
    subtopic: "",
    active: false,
    district: "",
    student: "",
  });
  const [showModal, setShowModal] = useState(false);

  const handleAddCourse = () => {
    setCourses([
      ...courses,
      {
        name: newCourse.name,
        dueDate: new Date().toISOString().split("T")[0],
        topic: newCourse.topic,
        subtopics: [newCourse.subtopic],
        active: newCourse.active,
      },
    ]);
    setShowModal(false);
  };

  return (
    <div className="py-20 px-6">
      <h1 className="text-3xl font-bold mb-6">Your Math Courses</h1>

        

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div onClick={() => setShowModal(true)} className="cursor-pointer rounded-2xl p-4 bg-linear-to-r from-cyan-500 to-blue-500">
            <p className="text-white text-xl font-extrabold"> Create a Course  +</p>
        </div>
        {courses.map((course, index) => (
          <div key={index} className="border rounded-2xl shadow p-4">
            <h2 className="text-xl font-semibold mb-2">{course.name}</h2>
            <p><strong>Due:</strong> {course.dueDate}</p>
            <p><strong>Topic:</strong> {course.topic}</p>
            <p><strong>Subtopics:</strong> {course.subtopics.slice(0, 2).join(", ")}</p>
            <div className="flex items-center gap-2 mt-2">
              <label htmlFor={`toggle-${index}`} className="font-medium">Active</label>
              <input
                id={`toggle-${index}`}
                type="checkbox"
                checked={course.active}
                readOnly
                className="w-5 h-5"
              />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex overflow-y-scroll items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-[70%] h-[90%]">
            <h2 className="text-2xl font-bold mb-4">Create Math Course</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course Name"
                className="w-full border rounded px-3 py-2"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Math Topic"
                className="w-full border rounded px-3 py-2"
                value={newCourse.topic}
                onChange={(e) => setNewCourse({ ...newCourse, topic: e.target.value })}
              />
              <input
                type="text"
                placeholder="Math Subtopic"
                className="w-full border rounded px-3 py-2"
                value={newCourse.subtopic}
                onChange={(e) => setNewCourse({ ...newCourse, subtopic: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <label htmlFor="active-toggle" className="font-medium">Active</label>
                <input
                  id="active-toggle"
                  type="checkbox"
                  checked={newCourse.active}
                  onChange={(e) => setNewCourse({ ...newCourse, active: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

                <label className="font-medium">Assign This Course to Students</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={newCourse.district}
                onChange={(e) => setNewCourse({ ...newCourse, district: e.target.value })}
              >
                <option value="">Select School District</option>
                <option value="north-district">North District</option>
                <option value="east-district">East District</option>
                <option value="south-district">South District</option>
              </select>

              <input
                type="text"
                placeholder="Search for student"
                className="w-full border rounded px-3 py-2"
                value={newCourse.student}
                onChange={(e) => setNewCourse({ ...newCourse, student: e.target.value })}
              />

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCourse}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
