"use client";
import React, { useState, useEffect } from 'react';
import logo from '../../assets/images/logofull.png';

export default function NewProblemPage() {
  const BASE_URL = "https://mathgptdevs25.pythonanywhere.com";

  const [quizType, setQuizType] = useState('');
  const [topic, setTopic] = useState('');
  const [lectureSessionId, setLectureSessionId] = useState('1');
  const [problemType, setProblemType] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [answer, setAnswer] = useState('');
  const [clarification, setClarification] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [lectureArchive, setLectureArchive] = useState(null);
  const [updatingLecture, tggUpdating] = useState(false);
  const [inputEnabled, ttginp] = useState(true);
  const [showContinueLecture, tggLecture] = useState(false);

  const navBtnStyle = {
    background: 'white',
    border: '1px solid black',
    color: 'black',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginTop: '0.25rem',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: 'black',
  };

  const handleClick = (type) => {
    setQuizType(type);
    setSubmitted(false);
    setGeneratedQuestion('');
    setAnswer('');
    setClarification('');
    setExplanation('');
    setShowAnswerModal(false);
  };

  const buildFormData = (obj) => {
    const form = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => form.append(k, v));
    return form.toString();
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        student_id: '3',
        mode: quizType,
      };

      if (quizType === 'topic') {
        if (!topic.trim()) return alert('Enter a topic.');
        payload.topic = topic;
      } else if (quizType === 'lecture') {
        payload.lecture_session_id = lectureSessionId;
      }

      const res = await fetch(`${BASE_URL}/mathgpt/problem/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: buildFormData(payload),
      });

      const contentType = res.headers.get("Content-Type");
      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        alert("Problem generation failed.");
        return;
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setGeneratedQuestion(data.question);
        setCorrectAnswer(data.solution || '');
        localStorage.setItem('current_session_id', data.session_id);
        setSubmitted(true);
      } else {
        throw new Error('Expected JSON response');
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Could not start problem session.");
    }
  };

  const handleAnswerSubmit = async () => {
    const session_id = localStorage.getItem('current_session_id');
    if (!session_id) return alert("No session ID found.");

    try {
      const res = await fetch(`${BASE_URL}/mathgpt/problem/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: buildFormData({ session_id, answer }),
      });

      const contentType = res.headers.get("Content-Type");
      if (!res.ok) {
        const text = await res.text();
        console.error("Answer error:", text);
        alert("Evaluation failed.");
        return;
      }

      if (contentType.includes("application/json")) {
        const data = await res.json();
        setExplanation(data.feedback);
        setShowAnswerModal(true);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      console.error("Answer submit error:", err);
      alert("Unable to evaluate answer.");
    }
  };

  const handleClarifySubmit = async () => {
    const session_id = localStorage.getItem('current_session_id');
    if (!session_id) return alert("No session available.");

    try {
      const res = await fetch(`${BASE_URL}/mathgpt/problem/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: buildFormData({ session_id }),
      });

      const contentType = res.headers.get("Content-Type");
      if (!res.ok) {
        const text = await res.text();
        console.error("Hint error:", text);
        alert("Could not fetch hint.");
        return;
      }

      if (contentType.includes("application/json")) {
        const data = await res.json();
        setExplanation(data.hint);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      console.error("Hint fetch error:", err);
      alert("Error fetching hint.");
    }
  };

  const loadFromDB = async () => {
    ttginp(false);
    tggUpdating(true);

    const form = new FormData();
    form.append("student_id", "3");
    form.append("mydata", "mystring");

    try {
      const res = await fetch(`${BASE_URL}/mathgpt/newproblem`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      setLectureArchive(data);
      tggLecture(true);
    } catch (err) {
      console.error("Load from DB failed", err);
      alert("Failed to load from DB.");
    }

    ttginp(true);
    tggUpdating(false);
  };

  useEffect(() => {
    return () => localStorage.removeItem('current_session_id');
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: 'white', color: 'black', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button style={navBtnStyle} onClick={() => window.location.href = '/lectures'}>Lectures</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/problems'}>Problems</button>
        </div>
        <button style={navBtnStyle} onClick={() => window.location.href = '/login'}>Login</button>
      </div>

      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '900px', margin: '0 auto' }}>
        <h2>Start a New Problem</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <button
            style={{ ...navBtnStyle, backgroundColor: 'orange', color: 'white' }}
            onClick={loadFromDB}
            disabled={!inputEnabled || updatingLecture}
          >
            {updatingLecture ? 'Loading from DB...' : 'Load From DB'}
          </button>

          {showContinueLecture && (
            <button
              style={{ ...navBtnStyle, backgroundColor: 'green', color: 'white', marginLeft: '1rem' }}
              onClick={() => {
                console.log("Loaded lecture:", lectureArchive);
                alert("Continue with: " + JSON.stringify(lectureArchive));
              }}
            >
              Continue Lecture
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button style={navBtnStyle} onClick={() => handleClick('topic')}>Quiz on Topic</button>
          <button style={navBtnStyle} onClick={() => handleClick('lecture')}>Quiz on Lecture</button>
        </div>

        {quizType === 'topic' && (
          <div>
            <label><strong>Enter Topic:</strong></label>
            <input type="text" placeholder="e.g. Derivatives" value={topic} onChange={(e) => setTopic(e.target.value)} style={inputStyle} />
            <label><strong>Select Problem Type:</strong></label>
            <select value={problemType} onChange={(e) => setProblemType(e.target.value)} style={inputStyle}>
              <option value="">Select one</option>
              <option value="Algebra">Algebra</option>
              <option value="Geometry">Geometry</option>
              <option value="Calculus">Calculus</option>
              <option value="Statistics">Statistics</option>
            </select>
          </div>
        )}

        {quizType === 'lecture' && (
          <div>
            <label><strong>Select Lecture Session:</strong></label>
            <select value={lectureSessionId} onChange={(e) => setLectureSessionId(e.target.value)} style={inputStyle}>
              <option value="1">Lecture 1</option>
              <option value="2">Lecture 2</option>
              <option value="3">Lecture 3</option>
            </select>
          </div>
        )}

        {quizType && (
          <button
            style={{ ...navBtnStyle, backgroundColor: 'blue', color: 'white', marginBottom: '2rem' }}
            onClick={handleSubmit}
            disabled={(quizType === 'topic' && (!topic.trim() || !problemType))}
          >
            Submit
          </button>
        )}

        {submitted && (
          <div>
            <h3>Generated Question:</h3>
            <p style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
              {generatedQuestion}
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button style={navBtnStyle} onClick={handleClarifySubmit}>Hint</button>
              <button style={navBtnStyle} onClick={handleClarifySubmit}>Step-by-step</button>
            </div>

            <label><strong>Your Answer:</strong></label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} style={inputStyle} placeholder="Type your answer here..." rows={3} />
            <div style={{ marginBottom: '1.5rem' }}>
              <button onClick={handleAnswerSubmit} style={{ ...navBtnStyle, backgroundColor: '#4CAF50', color: 'white' }}>
                Submit Answer
              </button>
            </div>

            <label><strong>Clarifying Questions:</strong></label>
            <textarea value={clarification} onChange={(e) => setClarification(e.target.value)} style={inputStyle} placeholder="Ask a clarifying question..." rows={2} />
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={handleClarifySubmit} style={{ ...navBtnStyle, backgroundColor: '#777', color: 'white' }}>
                Submit Clarification
              </button>
            </div>

            {explanation && (
              <div style={{ marginTop: '1rem', backgroundColor: '#eef', padding: '1rem', borderRadius: '4px' }}>
                <strong>Explanation:</strong> {explanation}
              </div>
            )}
          </div>
        )}

        {showAnswerModal && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            border: '2px solid #ccc',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ color: 'green' }}>✅ Answer Submitted!</h3>
            <p>{explanation}</p>
            <button style={{ ...navBtnStyle, marginTop: '0.5rem' }} onClick={() => setShowAnswerModal(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
