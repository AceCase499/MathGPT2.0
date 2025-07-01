"use client"
import React from 'react';
//import LogoPic from '*/assets/mathgpt.png';

const HomePage = () => {
  const navigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    console.log('Logged out');
  };
  
  return (
    <div style={{ minHeight: '100vh', color: 'white' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0rem', backgroundColor: '#374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontSize: '1rem' }}>
            <button onClick={() => navigate('/')} style={{
              background: 'none',
              border: '5px solid white',
              borderRadius: '0.5rem',
              padding: '0rem',
              cursor: 'pointer'
              }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 3fr',
            gap: '0rem'
            }}>
              <span style={{ color: 'blue', fontSize: '2rem' }}>×</span>
              <span style={{ color: 'red', fontSize: '2rem' }}>−</span>
              <span style={{ color: 'yellow', fontSize: '2rem' }}>+</span>
              <span style={{ color: 'magenta', fontSize: '2rem' }}>÷</span>
            </div>
            </button>
          </div>
          <button onClick={() => navigate('/lectures')} style={{ 
            fontFamily: "'Permanent Marker', cursive", fontSize: '1.25rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>Lectures</button>
          <button onClick={() => navigate('/problems')} style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '1.25rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>Problems</button>
        </div>
        <div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#4b5563',
              padding: '1rem',
              borderRadius: '50%',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
             title="Profile / Logout"
            >
              👤
          </button>
        </div>
      </nav>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* <img src={LogoPic} style={{ width: '500px' }} /> */}
            <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '11rem' }}>GPT</h1>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '-4rem' }}>
            <button onClick={() => navigate('/lecture')} style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '1.5rem', padding: '1rem 2.5rem', border: '2px solid black', borderRadius: '0.5rem', backgroundColor: 'white', color: 'black', cursor: 'pointer' }}>New Lecture</button>
            <button onClick={() => navigate('/problems/new')} style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '1.5rem', padding: '1rem 2.5rem', border: '2px solid black', borderRadius: '0.5rem', backgroundColor: 'white', color: 'black', cursor: 'pointer' }}>New Problem</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
