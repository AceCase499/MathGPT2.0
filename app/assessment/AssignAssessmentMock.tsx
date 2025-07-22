"use client";
import { useState } from 'react';

// Mock student data
const mockStudents = [
  { id: 1, name: 'Alice Zhang' },
  { id: 2, name: 'Bob Li' },
  { id: 3, name: 'Charlie Wang' },
];

export default function AssignAssessmentMock() {
  const [selected, setSelected] = useState<number[]>([]);
  const handleToggle = (id: number) => {
    setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  };
  const handleAssign = () => {
    alert(`Assigned assessment to: ${mockStudents.filter(s => selected.includes(s.id)).map(s => s.name).join(', ') || 'none'}`);
  };
  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-2 text-left">Assign Assessment to Students</h3>
      <ul className="mb-4 text-left">
        {mockStudents.map(s => (
          <li key={s.id} className="flex items-center mb-2">
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => handleToggle(s.id)} className="mr-2" />
            <span>{s.name}</span>
          </li>
        ))}
      </ul>
      <button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded-full disabled:opacity-50" disabled={selected.length === 0}>
        Assign Assessment
      </button>
    </div>
  );
} 