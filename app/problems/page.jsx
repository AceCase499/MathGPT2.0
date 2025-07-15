"use client"
import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logofull.png';

const mockProblems = [
  { id: 1, title: 'Problem 1', createdAt: '2025-07-01', conversation: ['Q: What is 2x + 3 = 7?', 'A: x = 2'] },
  { id: 2, title: 'Problem 2', createdAt: '2025-06-28', conversation: ['Q: What is x^2 = 4?', 'A: x = ±2'] },
  { id: 3, title: 'Problem 3', createdAt: '2025-06-25', conversation: ['Q: Derivative of x^2?', 'A: 2x'] },
];

export default function ProblemsPage() {
  const [problems, setProblems] = useState(mockProblems);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [headerText, setHeaderText] = useState('Type a new question');
  const [questionInput, setQuestionInput] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [answerMode, setAnswerMode] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [explanation, setExplanation] = useState('');

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

  const simulateAnswerResponse = (question) => {
    if (question.includes('derivative')) {
      return {
        answer: '2x',
        explanation: 'The derivative of x² is 2x because d/dx[x^n] = n*x^(n-1).',
      };
    } else if (question.includes('2x + 3 = 7')) {
      return {
        answer: 'x = 2',
        explanation: 'Subtract 3 from both sides: 2x = 4, then divide by 2: x = 2.',
      };
    }
    return {
      answer: 'Final answer here',
      explanation: 'Detailed step-by-step explanation goes here.',
    };
  };

  const handleAnswerModeSubmit = () => {
    const { answer, explanation } = simulateAnswerResponse(questionInput);
    setFinalAnswer(answer);
    setExplanation(explanation);
    setShowAnswer(false);
  };

  const buttonStyle = {
    background: 'white',
    border: '1px solid black',
    color: 'black',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  };

  const selectedProblem = problems.find(p => p.id === selectedId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', backgroundColor: 'white', color: 'black', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button onClick={() => window.location.href = '/lecture'} style={buttonStyle}>Lectures</button>
          <button onClick={() => window.location.href = '/problemlist'} style={buttonStyle}>Problems</button>
        </div>
        <button onClick={() => window.location.href = '/login'} style={buttonStyle}>Login</button>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <div style={{ width: '300px', borderRight: '1px solid black', padding: '1rem', overflowY: 'auto', backgroundColor: 'white' }}>
          <h2>My Problems</h2>
          <button style={{ ...buttonStyle, width: '100%', marginBottom: '1rem' }} onClick={() => window.location.href = '/newproblem'}>New Problem</button>
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
                    <span style={{ cursor: 'pointer', flex: 1 }} onClick={() => handleProblemClick(p.id)}>{p.title}</span>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', overflowY: 'auto', backgroundColor: 'white' }}>
          {!selectedProblem ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, width: '100%' }}>
              {answerMode && finalAnswer && (
                <div style={{ marginBottom: '2rem', maxWidth: '1000px', alignSelf: 'center', width: '100%' }}>
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    style={{ padding: '0.5rem 1rem', fontWeight: 'bold', background: '#f1f1f1', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}
                  >{showAnswer ? 'Hide Final Answer' : 'Show Final Answer'}</button>
                  {showAnswer && (
                    <div style={{ backgroundColor: '#1e1e1e', color: '#f1f1f1', padding: '1rem 1.5rem', borderRadius: '8px', width: '100%', fontSize: '1.1rem', fontFamily: 'monospace', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      Final Answer: {finalAnswer}
                    </div>
                  )}
                  <div style={{ marginTop: '2rem', width: '100%', backgroundColor: '#fafafa', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', fontSize: '1rem', lineHeight: '1.6', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Step-by-Step Explanation</h3>
                    {explanation}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', maxWidth: '1000px', alignSelf: 'center', width: '100%' }}>
                <h2>{headerText}</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={answerMode} onChange={(e) => setAnswerMode(e.target.checked)} />
                  Answer Mode
                </label>
              </div>

              <div style={{ width: '100%', maxWidth: '1000px', alignSelf: 'center' }}>
                <textarea
                  value={questionInput}
                  onChange={handleQuestionChange}
                  placeholder="Type your math question here..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '1rem 1.25rem',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    border: '1px solid #dcdcdc',
                    borderRadius: '12px',
                    backgroundColor: '#fcfcfc',
                    resize: 'vertical',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                    marginBottom: '1rem'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {suggestedTitle && (
                    <span style={{ fontWeight: 'bold', color: 'darkblue' }}>{suggestedTitle}</span>
                  )}
                  <button
                    onClick={answerMode ? handleAnswerModeSubmit : () => alert('Submit pressed!')}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '999px', border: '1px solid blue', fontWeight: 'bold', background: 'blue', color: 'white', cursor: 'pointer' }}
                  >Submit</button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2>{selectedProblem.title}</h2>
              <p><strong>Created:</strong> {selectedProblem.createdAt}</p>
              <h3>Conversation</h3>
              <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
