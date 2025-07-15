"use client"
//export const dynamic = "force-dynamic";
import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logofull.png';

const mockProblems = [
  { id: 1, title: 'Problem 1', createdAt: '2025-07-01', conversation: ['Q: What is 2x + 3 = 7?', 'A: x = 2'] },
  { id: 2, title: 'Problem 2', createdAt: '2025-06-28', conversation: ['Q: What is x^2 = 4?', 'A: x = ±2'] },
  { id: 3, title: 'Problem 3', createdAt: '2025-06-25', conversation: ['Q: Derivative of x^2?', 'A: 2x'] },
];

export default function ProblemsPage() {
  //const navigate = useNavigate();
  const [problems, setProblems] = useState(mockProblems);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [headerText, setHeaderText] = useState('Type a new question');
  const [questionInput, setQuestionInput] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');

  const handleDelete = (id) => {
    if (window.confirm('Delete this problem?')) {
      setProblems(problems.filter(p => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleRename = (id) => {
    setProblems(problems.map(p => p.id === id ? { ...p, title: newTitle } : p));
    setEditingId(null);
  };

  const handleProblemClick = (id) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  const selectedProblem = problems.find(p => p.id === selectedId);

  const handleEditHeader = () => {
    const newHeader = prompt('Enter new header title:', headerText);
    if (newHeader !== null) setHeaderText(newHeader);
  };

  const handleQuestionChange = (e) => {
    const input = e.target.value;
    setQuestionInput(input);
    if (/\d+x/.test(input)) setSuggestedTitle('Algebra Problem');
    else if (/derivative|integral|limit/.test(input.toLowerCase())) setSuggestedTitle('Calculus Problem');
    else if (/angle|triangle|circle/.test(input.toLowerCase())) setSuggestedTitle('Geometry Problem');
    else setSuggestedTitle('General Problem');
  };

  const buttonStyle = {
    background: 'white',
    border: '1px solid black',
    color: 'black',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', backgroundColor: 'white', color: 'black', overflow: 'hidden' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button onClick={() => window.location.href = '/lecture'} style={buttonStyle}>Lectures</button>
          <button onClick={() => window.location.href = '/problemlist'} style={buttonStyle}>Problems</button>
        </div>
        <button onClick={() => window.location.href = '/login'} style={buttonStyle}>Login</button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '300px', borderRight: '1px solid black', padding: '1rem', overflowY: 'auto', backgroundColor: 'white' }}>
          <h2>My Problems</h2>
          <button style={{ ...buttonStyle, width: '100%', marginBottom: '1rem' }} onClick={() => window.location.href = '/newproblem'}>
            New Problem
          </button>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {problems.map(p => (
              <li key={p.id} style={{ marginBottom: '1rem' }}>
                {editingId === p.id ? (
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => handleRename(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(p.id)}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => handleProblemClick(p.id)}
                    >
                      {p.title}
                    </span>
                    <div style={{ marginLeft: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => { setEditingId(p.id); setNewTitle(p.title); }} style={buttonStyle}>✏️</button>
                      <button onClick={() => handleDelete(p.id)} style={buttonStyle}>🗑️</button>
                    </div>
                  </div>
                )}
                <small>{p.createdAt}</small>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '1rem' }}>Select a problem to view conversation</p>
        </div>

        {/* Main View */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', backgroundColor: 'white' }}>
          {!selectedProblem ? (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {headerText}
                <button onClick={handleEditHeader} style={buttonStyle}>✏️</button>
                <button onClick={() => setHeaderText('')} style={buttonStyle}>delete</button>
              </h2>

              <div style={{
                width: '95%',
                maxWidth: '100%',
                height: '900px',
                border: '2px solid red',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <textarea
                  value={questionInput}
                  onChange={handleQuestionChange}
                  placeholder="e.g. What is the derivative of x^2?"
                  style={{
                    width: '98%',
                    height: '800px',
                    padding: '1rem',
                    fontSize: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    resize: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                />
                {suggestedTitle && (
                  <p style={{ fontWeight: 'bold', marginTop: '1rem' }}>
                    Generated Title: <span style={{ color: 'darkblue' }}>{suggestedTitle}</span>
                  </p>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #eee',
                  paddingTop: '1rem'
                }}>
                  <span style={{ fontFamily: 'cursive', fontWeight: 'bold', fontSize: '1.2rem', color: '#c00' }}>
                    Math GPT
                  </span>
                  <button
                    onClick={() => alert('Submit pressed!')}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '999px',
                      border: '1px solid blue',
                      fontWeight: 'bold',
                      background: 'blue',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2>{selectedProblem.title}</h2>
              <p><strong>Created:</strong> {selectedProblem.createdAt}</p>
              <h3>Conversation</h3>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}>
                {selectedProblem.conversation.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
