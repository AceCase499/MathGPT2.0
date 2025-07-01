'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import LogoutButton from '../components/LogoutButton'; // update path as needed

export default function DashboardPage() {
  const session = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Protect the route
  useEffect(() => {
    if (session === null) {
      router.push('/login');
    } else if (session !== undefined) {
      setLoading(false);
    }
  }, [session]);

  // First render, session still undefined
  if (session === undefined || loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }
  if (session === null) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Dashboard</h1>
      <p className="mb-6">
        You are logged in as <strong>{session.user.email}</strong>
      </p>
      <LogoutButton />
    </div>
  );
}
