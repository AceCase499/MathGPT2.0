'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation
    if (
      password.length < 6 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      alert(
        'Password must be at least 6 characters and contain uppercase, lowercase, and a number.'
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      alert(`Signup failed: ${error.message}`);
    } else {
      alert('Signup successful! Please check your email.');
      router.push('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>

        {/* Email */}
        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md"
          required
        />

        {/* Password with eye icon */}
        <label className="block mb-2 text-sm font-medium">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Password Rules */}
        <div className="text-sm mt-3 space-y-1">
          <p
            className={
              password.length === 0
                ? 'text-gray-400'
                : password.length >= 6
                ? 'text-green-600'
                : 'text-red-500'
            }
          >
            • At least 6 characters
          </p>
          <p
            className={
              password.length === 0
                ? 'text-gray-400'
                : /[a-z]/.test(password)
                ? 'text-green-600'
                : 'text-red-500'
            }
          >
            • Contains a lowercase letter
          </p>
          <p
            className={
              password.length === 0
                ? 'text-gray-400'
                : /[A-Z]/.test(password)
                ? 'text-green-600'
                : 'text-red-500'
            }
          >
            • Contains an uppercase letter
          </p>
          <p
            className={
              password.length === 0
                ? 'text-gray-400'
                : /\d/.test(password)
                ? 'text-green-600'
                : 'text-red-500'
            }
          >
            • Contains a number
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
