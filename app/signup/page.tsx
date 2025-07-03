'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    district: '',
    age: '',
    user_type: '',
    subjects: '',
    teacher_id: '',
    tutor_id: '',
    grade: '',
    stored_chats: '',
    staring_assessment: '',
    current_subject: '',
    progress_percentage: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/create_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.text();
    setLoading(false);

    if (result.toLowerCase().includes('success')) {
      if (formData.user_type === 'student') {
        router.push('/dashboard/student');
      } else if (formData.user_type === 'tutor') {
        router.push('/dashboard/tutor');
      } else {
        router.push('/dashboard');
      }
    } else {
      alert(result);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4"
        >
        <br/><br/>
        <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>

        <div>
          <label className="block mb-1">Username</label>
          <input name="username" value={formData.username} onChange={handleChange} type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-sm mt-1 text-gray-500">Password must be at least 6 characters.</p>
        </div>

        <div>
          <label className="block mb-1">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block mb-1">District</label>
          <input name="district" value={formData.district} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block mb-1">Age</label>
          <input name="age" value={formData.age} onChange={handleChange} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block mb-1">User Type</label>
          <select
            name="user_type"
            value={formData.user_type}
            onChange={(e) => {
              handleChange(e);
              setUserType(e.target.value);
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700"
          >
            <option value="" disabled hidden>Select a type</option>
            <option value="tutor">Tutor</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {userType === 'tutor' && (
          <div>
            <label className="block mb-1">Subjects</label>
            <input name="subjects" value={formData.subjects} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        )}

        {userType === 'student' && (
          <div className="space-y-2">
            <input name="teacher_id" value={formData.teacher_id} onChange={handleChange} type="number" placeholder="Teacher ID" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input name="tutor_id" value={formData.tutor_id} onChange={handleChange} type="number" placeholder="Tutor ID" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input name="grade" value={formData.grade} onChange={handleChange} type="text" placeholder="Grade" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input name="stored_chats" value={formData.stored_chats} onChange={handleChange} type="text" placeholder="Stored Chats" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input name="staring_assessment" value={formData.staring_assessment} onChange={handleChange} type="number" placeholder="Starting Assessment" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input name="current_subject" value={formData.current_subject} onChange={handleChange} type="text" placeholder="Current Subject" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <input name="progress_percentage" value={formData.progress_percentage} onChange={handleChange} type="number" step="0.01" placeholder="Progress (%)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Log in</a>
        </p>
      </form>
    </div>
  );
}
