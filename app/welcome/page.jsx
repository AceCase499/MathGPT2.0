"use client"
import React from 'react';
import Image from 'next/image'
import logo from '../../assets/images/logofull.png';

const HomePage = () => {
  const navigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    console.log('Logged out');
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
          <button style={buttonStyle} onClick={() => navigate('/lectures')}>Lectures</button>
          <button style={buttonStyle} onClick={() => navigate('/problems')}>Problems</button>
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
            <button onClick={() => navigate('/lectures/new')} style={buttonStyle}>New Lecture</button>
            <button onClick={() => navigate('/problems/new')} style={buttonStyle}>New Problem</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
