import React from 'react'

const NavigationBar = () => {
    const navigate = (path) => {
        window.location.href = path;
    };

    const handleLogout = () => {
        console.log('Logged out');
    };

  return (
    <div>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0rem', backgroundColor: '#808080' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
              <span style={{ color: 'blue', fontSize: '1.5rem' }}>×</span>
              <span style={{ color: 'red', fontSize: '1.5rem' }}>−</span>
              <span style={{ color: 'yellow', fontSize: '1.5rem' }}>+</span>
              <span style={{ color: 'magenta', fontSize: '1.5rem' }}>÷</span>
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
    </div>
  )
}

export default NavigationBar