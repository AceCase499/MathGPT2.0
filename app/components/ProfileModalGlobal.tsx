"use client";
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfileModalGlobal() {
  const { user } = useContext(AuthContext) as any;
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem('PRIV-05_profile');
      const skipped = localStorage.getItem('PRIV-05_profile_skip');
      const shown = sessionStorage.getItem('profile_modal_shown');
      if (!saved && !skipped && !shown) {
        setShowPrompt(true);
        sessionStorage.setItem('profile_modal_shown', '1');
      }
    }
  }, [user]);

  const handleYes = () => {
    setShowPrompt(false);
    router.push('/profilepage');
  };

  const handleNo = () => {
    localStorage.setItem('PRIV-05_profile_skip', '1');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-xl text-center animate-fade-in-card relative">
        <div className="text-5xl mb-4 select-none" aria-hidden>🎨</div>
        <h2 className="text-3xl font-extrabold mb-3 text-gray-900">Personalize your experience?</h2>
        <p className="mb-8 text-gray-500 text-lg">Personalizing helps us recommend better content and track your progress.</p>
        <div className="flex justify-center gap-8 mt-8">
          <button
            onClick={handleYes}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full font-bold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
            style={{ whiteSpace: 'nowrap' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 2a7 7 0 0 0-7 7c0 2.386 1.32 4.434 3.25 5.5V17a2 2 0 0 0 2 2h1.5a2 2 0 0 0 2-2v-2.5C17.68 13.434 19 11.386 19 9a7 7 0 0 0-7-7Zm1.5 15a.5.5 0 0 1-.5.5H11a.5.5 0 0 1-.5-.5v-1h3v1Zm-1.5-3c-2.757 0-5-2.243-5-5a5 5 0 1 1 10 0c0 2.757-2.243 5-5 5Z"/></svg>
            Yes, personalize
          </button>
          <button
            onClick={handleNo}
            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-full font-bold text-lg shadow hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 whitespace-nowrap"
            style={{ whiteSpace: 'nowrap' }}
          >
            No, maybe later
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.3s; }
        @keyframes fadeInCard {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-card { animation: fadeInCard 0.4s; }
      `}</style>
    </div>
  );
}
