"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddCourseModal from './AddCourseModal';

// Mock 课程数据
const mockCourses = [
  {
    id: 1,
    name: 'Algebra',
    grade: '8',
    teacher: 'Mr. Smith',
    topics: [
      {
        id: 1,
        name: 'Algebra',
        mastery: 70,
        image: '/public/logo-full.png',
        description: 'Algebra is the study of mathematical symbols and the rules for manipulating these symbols.',
        subtopics: [
          {
            id: 101,
            name: 'Linear Equations',
            mastery: 90,
            image: '/public/logo-icon.png',
            description: 'Linear equations are equations between two variables that give a straight line when plotted on a graph.',
          },
          {
            id: 102,
            name: 'Quadratic Equations',
            mastery: 60,
            image: '/public/logo-full.png',
            description: 'Quadratic equations are polynomial equations of degree 2.',
          },
          {
            id: 103,
            name: 'Polynomials',
            mastery: 40,
            image: '/public/logo-icon.png',
            description: 'A polynomial is an expression consisting of variables and coefficients.',
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Geometry',
    grade: '7',
    teacher: 'Ms. Lee',
    topics: [
      {
        id: 2,
        name: 'Geometry',
        mastery: 50,
        image: '/public/logo-icon.png',
        description: 'Geometry is concerned with questions of shape, size, relative position of figures, and the properties of space.',
        subtopics: [
          {
            id: 201,
            name: 'Triangles',
            mastery: 80,
            image: '/public/logo-full.png',
            description: 'A triangle is a polygon with three edges and three vertices.',
          },
          {
            id: 202,
            name: 'Circles',
            mastery: 30,
            image: '/public/logo-icon.png',
            description: 'A circle is a simple closed shape. It is the set of all points in a plane that are at a given distance from a given point, the centre.',
          },
        ],
      },
    ],
  },
];

// 进度条组件
function ProgressBar({ percent, className = '', style = {} }: { percent: number, className?: string, style?: React.CSSProperties }) {
  return (
    <div className={`h-10 bg-gray-200 rounded-full mt-2 mb-2 border border-white ${className}`} style={{ width: '100%', ...style }}>
      <div
        className="h-10 rounded-full"
        style={{ width: `${percent}%`, background: '#8431a7', borderRadius: 20 }}
      />
    </div>
  );
}

// 课程详情页（原有页面）
function CourseDetail({ course, onBack }: { course: any, onBack: () => void }) {
  const [selectedTopic, setSelectedTopic] = useState(course.topics[0]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<any>(null);
  const display = selectedSubtopic || selectedTopic;
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* header 只显示topic名称和大进度条，去掉紫色背景 */}
      <div className="w-full mt-24" style={{background: 'transparent'}}>
        <div className="flex flex-col items-center w-full">
          <div className="w-full flex flex-col items-center">
            <button
              onClick={onBack}
              className="mb-2 ml-2 text-[#8431a7] bg-white border border-[#8431a7] rounded-full px-4 py-1 font-semibold text-lg hover:bg-[#f3e8ff] hover:text-[#6a247e] transition"
              style={{alignSelf: 'flex-start'}}
            >
              ← Back
            </button>
            <div className="w-full bg-gray-50 rounded-lg flex flex-col items-center px-10 h-28 justify-center" style={{boxShadow: 'none', borderTop: 'none'}}>
              <div className="flex flex-col items-center w-full mb-2">
                <div className="flex items-center justify-center w-full mb-2">
                  <span className="font-medium text-2xl mr-3" style={{color: '#8431a7'}}>{selectedTopic.name}</span>
                  <span className="text-lg text-gray-500">{selectedTopic.mastery}%</span>
                </div>
                <div className="w-full mb-4">
                  <ProgressBar percent={selectedTopic.mastery} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-200 w-full"></div>
      <div className="flex flex-1">
        {/* subtopic进度条宽度加倍 */}
        <aside className="w-1/4 bg-gray-50 p-6 min-h-full">
          <h2 className="text-lg font-semibold mb-4">Subtopics</h2>
          <ul>
            {selectedTopic.subtopics.map((sub: any) => (
              <li
                key={sub.id}
                className={`mb-6 cursor-pointer rounded-lg p-2 transition ${selectedSubtopic?.id === sub.id ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
                onClick={() => setSelectedSubtopic(sub)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{sub.name}</span>
                  <span className="ml-2 text-sm text-gray-500">{sub.mastery}%</span>
                </div>
                <div className="w-full">
                  <ProgressBar percent={sub.mastery} />
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 p-10 flex flex-col items-center w-full border-l border-gray-200">
          <img src={display.image} alt={display.name} className="w-64 h-40 object-cover rounded shadow mb-6" />
          <div className="text-xl font-semibold mb-2">{display.name}</div>
          <div className="text-gray-700 mb-8 text-center max-w-xl">{display.description}</div>
          <div className="mt-auto w-full flex flex-col items-center">
            <div className="w-full bg-gray-100 rounded-xl shadow px-6 py-4 mb-4 flex flex-col sm:flex-row items-center justify-between max-w-full">
              <span className="text-lg text-gray-700 mb-2 sm:mb-0">Want to start a new lecture for this {selectedSubtopic ? 'subtopic' : 'topic'}?</span>
              <button
                className="bg-[#8431a7] text-white px-6 py-3 rounded-full text-lg font-bold shadow hover:bg-[#6a247e] transition"
                onClick={() => router.push('/lecture2')}
              >
                + New Lecture
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// 课程首页
export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative">
      {/* 右上角 Add Course 按钮，紧贴 profile icon 下方 */}
      <button
        className="bg-[#e5e7eb] text-[#333] px-6 py-2 rounded-full font-semibold shadow hover:bg-[#cbd5e1] transition text-lg absolute right-10 top-[100px] z-20"
        style={{ minWidth: 160 }}
        onClick={() => setShowAddModal(true)}
      >
        + Add a course
      </button>
      {showAddModal && <AddCourseModal onClose={() => setShowAddModal(false)} />}
      <div className="flex flex-1 w-full">
        {/* 左侧：Your Courses + 列表 */}
        <aside className="w-2/3 max-w-2xl p-10 pt-24">
          <div className="text-2xl font-bold text-[#8431a7] mb-6 mt-2">Your Courses</div>
          <ul>
            {mockCourses.map(course => (
              <li key={course.id} className="mb-6 p-4 rounded-lg border hover:shadow cursor-pointer flex items-center justify-between" onClick={() => setSelectedCourse(course)}>
                <div>
                  <div className="text-lg font-semibold" style={{color: '#8431a7'}}>{course.name}</div>
                  <div className="text-gray-600 text-sm mt-1">Grade: {course.grade} &nbsp; | &nbsp; Teacher: {course.teacher}</div>
                </div>
                <span className="text-gray-400">→</span>
              </li>
            ))}
          </ul>
        </aside>
        {/* 右侧空白占位 */}
        <main className="flex-1 flex flex-col items-center justify-start p-10"></main>
      </div>
    </div>
  );
} 