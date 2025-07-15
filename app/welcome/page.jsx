"use client"
export const dynamic = "force-dynamic";
//import { useContext} from 'react';
import Image from 'next/image'
import logo from '../../assets/images/logofull.png';
import { useRouter } from 'next/navigation';
//import { AuthContext } from "../context/AuthContext.js";

const HomePage = () => {
  //const { user, logout } = useContext(AuthContext);

  const navigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    alert("Log out successful")
    const router = useRouter();
    router.push("/")
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
      {/* Top Navigation Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button style={buttonStyle} onClick={() => navigate('/lecture2')}>Lectures</button>
          <button style={buttonStyle} onClick={() => navigate('/problems')}>Problems</button>
          <button style={buttonStyle} onClick={() => navigate('/assessment')}>Assessments</button>
        </div>
        <button
          onClick={()=>handleLogout}
          title="Profile / Logout"
          style={{
            backgroundColor: 'white',
            border: '1px solid black',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            fontSize: '1.5rem',
            color: 'black',
            cursor: 'pointer'
          }}
        >
          👤
        </button>
      </nav>

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
