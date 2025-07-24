  "use client";
  import React, { useState } from 'react';
  import logo from '../../assets/images/logofull.png';
  import MathSymbolKeyboard from '../symbolkeyboard/page';

  export default function ProblemsPage() {
    const [problems, setProblems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [headerText] = useState('Type a new question');
    const [questionInput, setQuestionInput] = useState('');
    const [suggestedTitle, setSuggestedTitle] = useState('');
    const [finalAnswer, setFinalAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [showStepButton, setShowStepButton] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [loadingAnswer, setLoadingAnswer] = useState(false);
    const [previewSymbol, setPreviewSymbol] = useState('');
    const [showKeyboard, setShowKeyboard] = useState(false);

    const handleInsertSymbol = (symbol) => {
      setQuestionInput(prev => prev + ' ' + symbol);
      setPreviewSymbol(symbol);
    };

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

    const handleQuestionChange = (e) => {
      const input = e.target.value;
      setQuestionInput(input);
      setFinalAnswer('');
      setExplanation('');
      setShowStepButton(false);
      setShowExplanation(false);

      if (/\d+x/.test(input)) setSuggestedTitle('Algebra Problem');
      else if (/derivative|integral|limit/.test(input.toLowerCase())) setSuggestedTitle('Calculus Problem');
      else if (/angle|triangle|circle/.test(input.toLowerCase())) setSuggestedTitle('Geometry Problem');
      else setSuggestedTitle('General Problem');
    };

    const handleGenerate = async () => {
      if (!questionInput.trim()) {
        alert("Please enter a question first.");
        return;
      }

      const url = "https://mathgptdevs25.pythonanywhere.com/mathgpt/problem/answer_mode";
      const formData = new URLSearchParams();
      formData.append("question", questionInput);
      formData.append("student_id", "1");

      setLoadingAnswer(true);
      setFinalAnswer('');
      setExplanation('');
      setShowStepButton(false);
      setShowExplanation(false);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Error:", data.error);
          alert(`Error: ${data.error}`);
        } else {
          setFinalAnswer(data.final_answer);
          setExplanation(data.steps);
          setShowStepButton(true);

          const newProblem = {
            id: data.session_id,
            title: suggestedTitle || "New Problem",
            createdAt: new Date().toISOString().slice(0, 10),
            conversation: [
              `Q: ${data.question}`,
              `A: ${data.final_answer}`
            ]
          };

          setProblems(prev => [newProblem, ...prev]);
          setSelectedId(data.session_id);
          setQuestionInput('');
        }
      } catch (err) {
        console.error("Request failed:", err);
        alert(`Error: ${err.message}`);
      } finally {
        setLoadingAnswer(false);
      }
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
        {/* Top Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
            <button onClick={() => window.location.href = '/lecture'} style={buttonStyle}>Lectures</button>
            <button onClick={() => window.location.href = '/problemlist'} style={buttonStyle}>Problems</button>
          </div>
          <button onClick={() => window.location.href = '/login'} style={buttonStyle}>Login</button>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
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

          {/* Right panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backgroundColor: 'white' }}>
            {/* Header stays sticky */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'white',
              padding: '1rem 0',
              borderBottom: '1px solid #eee',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#222' }}>{headerText}</h2>
            </div>

            {/* Problem view or new input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
              {!selectedProblem ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  {/* Input area at bottom */}
                  <div style={{
                    width: '100%',
                    paddingTop: '1rem',
                    borderTop: '1px solid #eee',
                    backgroundColor: 'white',
                    marginTop: 'auto'
                  }}>
                    <div style={{
                      maxWidth: '1000px',
                      margin: '0 auto',
                      paddingBottom: '2rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                        <button
                          onClick={() => setShowKeyboard(prev => !prev)}
                          title="Toggle Math Keyboard"
                          style={{
                            border: 'none',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '8px',
                            padding: '0.4rem 0.6rem',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          ⌨️
                        </button>
                      </div>

                      {showKeyboard && (
                        <div style={{ marginBottom: '1rem' }}>
                          <MathSymbolKeyboard onInsert={handleInsertSymbol} previewSymbol={previewSymbol} />
                        </div>
                      )}

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
                          onClick={handleGenerate}
                          disabled={loadingAnswer}
                          style={{
                            padding: '0.6rem 1.5rem',
                            borderRadius: '999px',
                            border: 'none',
                            fontWeight: 'bold',
                            background: 'blue',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                        >
                          {loadingAnswer ? 'Generating...' : 'Generate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
                  <h2>{selectedProblem.title}</h2>
                  <p><strong>Created:</strong> {selectedProblem.createdAt}</p>
                  <h3>Conversation</h3>
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
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
      </div>
    );
  }
