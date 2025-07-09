'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { emit } from 'process';
import { useState } from 'react';


export default function LoginPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(3);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    //console.log(`${email}\n${password}`)
    if(attempts > 0){
      setAttempts(attempts - 1)
    } else{
      alert("The system has activated a user lockout.\nPlease try again later.")
      return
    }
    
    // Basic input validation
    /* if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    } */
    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const form = new FormData();
    Object.entries({username: username, password: password}).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/login', {
      method: 'POST',
      body: form, // no need for headers; browser sets correct Content-Type
    });

    const result = await response.text(); // Read plain text response
    alert(result)

    if (result.includes("Invalid username or password")){
      setLoading(false)
    }
    if (result.includes("Login successful")){
      alert("Welcome back to MathGPT!")
      router.push('/welcome');
    }

    //const { error } = await supabase.auth.signInWithPassword({ email, password });
    /* if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        alert('Incorrect email or password. Please try again.');
      } else {
        alert(`Login failed: ${error.message}`);
      }
    } else {
      router.push('/dashboard');
    } */
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Log In</h2>
        {attempts == 0 && (
          <h2 className="text-xl italic mb-4 text-center" style={{color: "red"}}>Too many login attempts.  Please try again later.</h2>)}

        <label className="block mb-2 text-sm font-medium">Username</label>
        <input
          type="text"
          disabled={!(attempts > 0)}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md"
          required
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          type="password"
          disabled={!(attempts > 0)}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        <p className="text-center text-sm mt-4">
  Don’t have an account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
</p>

      </form>
    </div>
  );
}
