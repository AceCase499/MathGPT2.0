"use client"
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logofull.png';

export default function NewProblemPage() {
  //const navigate = useNavigate();

  const [mode, setMode] = useState('manual'); // manual | topic | lecture
  const [topic, setTopic] = useState('');
  const [lecture, setLecture] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [clarification, setClarification] = useState('');
  const [problemType, setProblemType] = useState('Algebra');
  const [autoTitle, setAutoTitle] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const lower = question.toLowerCase();
    if (lower.includes('derivative') || lower.includes('integral') || lower.includes('limit')) {
      setProblemType('Calculus');
      setAutoTitle('Calculus Problem');
    } else if (lower.includes('triangle') || lower.includes('angle') || lower.includes('circle')) {
      setProblemType('Geometry');
      setAutoTitle('Geometry Problem');
    } else if (lower.includes('mean') || lower.includes('median') || lower.includes('probability')) {
      setProblemType('Statistics');
      setAutoTitle('Statistics Problem');
    } else if (lower.match(/[a-z]/i) && lower.match(/=|x|y|\d/)) {
      setProblemType('Algebra');
      setAutoTitle('Algebra Problem');
    } else {
      setAutoTitle('');
    }
  }, [question]);

  const handleSave = () => {
    const newProblem = {
      type: problemType,
      question,
      answer,
      clarification,
      createdAt: new Date().toISOString(),
    };
    console.log('Saved:', newProblem);
    setShowModal(true);
  };

  const navBtnStyle = {
    background: 'white',
    border: '1px solid black',
    color: 'black',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginTop: '0.25rem',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    resize: 'vertical',
    backgroundColor: 'white',
    color: 'black',
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: 'white', color: 'black', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button style={navBtnStyle} onClick={() => window.location.href = '/lectures'}>Lectures</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/problems'}>Problems</button>
        </div>
        <button style={navBtnStyle} onClick={() => window.location.href = '/login'}>Login</button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '2rem', display: 'flex', overflowY: 'auto', justifyContent: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: '1500px' }}>
          <h2 style={{ marginBottom: '1rem' }}>{autoTitle || 'New Problem'}</h2>

          <label><strong>Select input mode:</strong></label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ ...inputStyle }}>
            <option value="manual">Manual</option>
            <option value="topic">Quiz on Topic</option>
            <option value="lecture">Quiz from Lecture</option>
          </select>

          {mode === 'topic' && (
            <>
              <label><strong>Enter topic:</strong></label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} style={inputStyle} placeholder="e.g. Derivatives" />
            </>
          )}

          {mode === 'lecture' && (
            <>
              <label><strong>Paste lecture content:</strong></label>
              <textarea value={lecture} onChange={(e) => setLecture(e.target.value)} rows={3} style={inputStyle} />
            </>
          )}

          <label><strong>Choose problem type:</strong></label>
          <select value={problemType} onChange={(e) => setProblemType(e.target.value)} style={inputStyle}>
            <option>Algebra</option>
            <option>Geometry</option>
            <option>Calculus</option>
            <option>Statistics</option>
          </select>

          <label><strong>Enter your question:</strong></label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is 2x + 3 = 7?"
            rows={4}
            style={inputStyle}
          />

          <label><strong>Your Answer:</strong></label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={3}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button style={navBtnStyle}>Hint</button>
            <button style={navBtnStyle}>Step-by-step</button>
          </div>

          <label><strong>Clarifying Questions:</strong></label>
          <textarea
            value={clarification}
            onChange={(e) => setClarification(e.target.value)}
            rows={2}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleSave} style={{ ...navBtnStyle, backgroundColor: 'blue', color: 'white' }}>Save</button>
            <button onClick={() => window.location.href = '/problems'} style={navBtnStyle}>Cancel</button>
          </div>

          {showModal && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              border: '2px solid #ccc',
              borderRadius: '8px',
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              <p>Would you like to:</p>
              <button
                style={{ ...navBtnStyle, marginTop: '0.5rem' }}
                onClick={() => { setShowModal(false); alert('Generating similar problem...') }}
              >
                Generate Similar Problem
              </button>
              <button
                style={{ ...navBtnStyle, marginTop: '0.5rem' }}
                onClick={() => { setShowModal(false); window.location.href = '/newproblem'; }}
              >
                Create New Problem
              </button>
              <button
                style={{ ...navBtnStyle, marginTop: '0.5rem' }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
