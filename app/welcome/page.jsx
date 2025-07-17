"use client"
export const dynamic = "force-dynamic";
//import { useContext} from 'react';
import Image from 'next/image'
import logo from '../../assets/images/logofull.png';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
//import { AuthContext } from "../context/AuthContext.js";

const HomePage = () => {
  //const { user, logout } = useContext(AuthContext);
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const navigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    logout();
    alert("Log out successful");
    router.push("/");
  };

  const buttonStyle = {
    background: 'white',
    border: '1px solid black',
    color: 'black',
    fontWeight: 'bold',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontFamily: "'Arial', sans-serif",
  };

  return (
    <div style={{ minHeight: '100vh', color: 'black', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Main Body */}
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Image src="/logo-full.png" alt="MathGPT Full Logo" width={220} height={220} priority />
            <h1 style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: '7rem',
              color: 'black',
              margin: 0
            }}>
              GPT
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <button onClick={() => navigate('/lecture2')} style={buttonStyle}>New Lecture</button>
            <button onClick={() => navigate('/newproblem')} style={buttonStyle}>New Problem</button>
            <button onClick={() => navigate('/assessment')} style={buttonStyle}>Take an Assessment Quiz</button>
            {/* <button onClick={()=> alert(user.id)} style={buttonStyle}>Try Me</button> */}
            <button onClick={handleLogout} style={buttonStyle}>Logout</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
