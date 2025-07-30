"use client"
export const dynamic = "force-dynamic";
import Image from 'next/image'
import logo from '../../assets/images/logofull.png';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const navigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const buttonClass = "bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-10 py-5 rounded-xl shadow-lg transition text-lg m-0";

  return (
    <div style={{ minHeight: '100vh', color: 'black', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Main Body */}
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/logo-full.png" alt="MathGPT Full Logo" width={480} height={150} priority />
          </div>

          <div style={{ display: 'flex', gap: '2.8rem', marginTop: '2.5rem' }}>
            <button onClick={() => navigate('/courses')} className={buttonClass}>Courses</button>
            <button onClick={() => navigate('/lecture2')} className={buttonClass}>New Lecture</button>
            <button onClick={() => navigate('/newproblem')} className={buttonClass}>New Problem</button>
            <button onClick={() => navigate('/assessment')} className={buttonClass}>Take an Assessment Quiz</button>
            <button onClick={handleLogout} className={buttonClass}>Logout</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
