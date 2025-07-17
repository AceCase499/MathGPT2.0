'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

export default function LogoutButton() {
  const { logout } = useContext(AuthContext) as any;
  const router = useRouter();

  const handleLogout = () => {
    logout(); // This clears sessionStorage and updates AuthContext
    router.push('/login'); // Optional: in case you want to always redirect to login
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
    >
      Log Out
    </button>
  );
}
