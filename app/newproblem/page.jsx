"use client";
import React, { useState, useEffect, useContext } from 'react';
import logo from '../../assets/images/logofull.png';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function NewProblemPage() {
  const { user } = useContext(AuthContext) || {};
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user, router]);

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
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [hinting, setHinting] = useState(false);

  const navBtnStyle = {
    background: 'white',
    border: '1px solid black',
    color: 'black',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const spinner = <span className="spinner" />;

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '6px',
  };

  const panelStyle = {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    height: 'calc(100vh - 60px)',
  };

  const buildFormData = (obj) => {
    const form = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => form.append(k, v));
    return form.toString();
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        student_id: '3',
        mode: quizType,
      };

      if (quizType === 'topic') {
        if (!topic.trim()) return alert('Enter a topic.');
        payload.topic = topic;
      } else {
        payload.lecture_session_id = lectureSessionId;
      }

      const res = await fetch(`${BASE_URL}/mathgpt/problem/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: buildFormData(payload),
      });

      const data = await res.json();
      setGeneratedQuestion(data.question);
      setCorrectAnswer(data.solution || '');
      localStorage.setItem('current_session_id', data.session_id);
      setSubmitted(true);
    } catch (err) {
      alert("Error generating problem.");
    }
    setLoading(false);
  };

  const handleAnswerSubmit = async () => {
    setAnswering(true);
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

      const data = await res.json();
      setExplanation(data.feedback);
      setShowAnswerModal(true);
    } catch (err) {
      alert("Error submitting answer.");
    }
    setAnswering(false);
  };

  const handleClarifySubmit = async () => {
    setHinting(true);
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

      const data = await res.json();
      setExplanation(data.hint);
    } catch (err) {
      alert("Error fetching hint.");
    }
    setHinting(false);
  };

  useEffect(() => {
    return () => localStorage.removeItem('current_session_id');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fafafa' }}>
      <style>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ccc;
          border-top: 2px solid #333;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Top Navbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid black',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button style={navBtnStyle} onClick={() => window.location.href = '/lectures'}>Lectures</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/problems'}>Problems</button>
        </div>
        <button style={navBtnStyle} onClick={() => window.location.href = '/login'}>Login</button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexGrow: 1 }}>
        <div style={{ ...panelStyle, width: '35%', backgroundColor: '#ffffff', borderRight: '1px solid #ddd' }}>
          <h2>🧠 Quiz Setup</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button style={navBtnStyle} onClick={() => handleClick('topic')}>Quiz on Topic</button>
            <button style={navBtnStyle} onClick={() => handleClick('lecture')}>Quiz on Lecture</button>
             <button style={navBtnStyle} onClick={() => window.location.href = '/problems'}>Go to Problem Page</button>
          </div>

          {quizType === 'topic' && (
            <>
              <label><strong>Topic:</strong></label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} style={inputStyle} />
              <label><strong>Problem Type:</strong></label>
              <select value={problemType} onChange={e => setProblemType(e.target.value)} style={inputStyle}>
                <option value="">Select one</option>
                <option value="Algebra">Algebra</option>
                <option value="Geometry">Geometry</option>
                <option value="Calculus">Calculus</option>
                <option value="Statistics">Statistics</option>
              </select>
            </>
          )}

          {quizType === 'lecture' && (
            <>
              <label><strong>Lecture Session:</strong></label>
              <select value={lectureSessionId} onChange={(e) => setLectureSessionId(e.target.value)} style={inputStyle}>
                <option value="1">Lecture 1</option>
                <option value="2">Lecture 2</option>
                <option value="3">Lecture 3</option>
              </select>
            </>
          )}

          {quizType && (
            <button
              style={{ ...navBtnStyle, backgroundColor: 'blue', color: 'white', marginTop: '1rem' }}
              onClick={handleSubmit}
              disabled={loading || (quizType === 'topic' && (!topic.trim() || !problemType))}
            >
              {loading ? <>Generating... {spinner}</> : "Generate Problem"}
            </button>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ ...panelStyle, flexGrow: 1 }}>
          <h2>📘 Work Area</h2>
          {submitted ? (
            <>
              <div style={{ padding: '1rem', backgroundColor: '#f0f8ff', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '1.5rem' }}>
                <strong>Question:</strong>
                <p>{generatedQuestion}</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button style={navBtnStyle} onClick={handleClarifySubmit} disabled={hinting}>
                  {hinting ? <>Hinting... {spinner}</> : "💡 Hint"}
                </button>
                <button style={navBtnStyle} onClick={handleClarifySubmit}>📈 Step-by-step</button>
              </div>

              <label><strong>Your Answer:</strong></label>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ ...inputStyle, minHeight: '80px' }} />
              <button
                style={{ ...navBtnStyle, backgroundColor: '#4CAF50', color: 'white', marginBottom: '1.5rem' }}
                onClick={handleAnswerSubmit}
                disabled={answering}
              >
                {answering ? <>Submitting... {spinner}</> : "✅ Submit Answer"}
              </button>

              <label><strong>Clarifying Question:</strong></label>
              <textarea value={clarification} onChange={(e) => setClarification(e.target.value)} style={{ ...inputStyle, minHeight: '60px' }} />
              <button style={{ ...navBtnStyle, backgroundColor: '#777', color: 'white' }} onClick={handleClarifySubmit}>
                ❓ Submit Clarification
              </button>

              {explanation && (
                <div style={{ marginTop: '1.5rem', backgroundColor: '#eef', padding: '1rem', borderRadius: '6px' }}>
                  <strong>Explanation:</strong>
                  <p>{explanation}</p>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontStyle: 'italic', color: '#777' }}>← Use the left panel to generate a problem to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}
