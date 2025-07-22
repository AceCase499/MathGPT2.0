"use client";
import { useState } from 'react';

// Mock student results data
const mockResults = [
  { id: 1, name: 'Alice Zhang', score: 92, date: '2024-06-01' },
  { id: 2, name: 'Bob Li', score: 78, date: '2024-06-02' },
  { id: 3, name: 'Charlie Wang', score: 85, date: '2024-06-03' },
];

export default function StudentResultsMock() {
  const [selected, setSelected] = useState<number|null>(null);
  const student = mockResults.find(s => s.id === selected);
  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-2 text-left">Student Results</h3>
      <ul className="mb-4 text-left">
        {mockResults.map(s => (
          <li key={s.id} className="mb-2">
            <button className={`underline text-blue-700 hover:text-blue-900 ${selected===s.id?'font-bold':''}`} onClick={()=>setSelected(s.id)}>{s.name}</button>
            <span className="ml-2 text-gray-600">{s.score} / 100</span>
            <span className="ml-2 text-gray-400 text-xs">({s.date})</span>
          </li>
        ))}
      </ul>
      {student && (
        <div className="bg-white rounded shadow p-4 mb-2">
          <div className="font-semibold mb-1">{student.name}'s Details</div>
          <div>Score: <span className="font-bold">{student.score}</span></div>
          <div>Date: {student.date}</div>
          <div className="mt-2 text-xs text-gray-500">(Mock data. In production, show per-question breakdown, time, etc.)</div>
        </div>
      )}
    </div>
  );
} 