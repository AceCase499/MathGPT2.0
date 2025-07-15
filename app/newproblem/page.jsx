"use client";
//export const dynamic = "force-dynamic";
import React, { useState } from 'react';
import logo from '../../assets/images/logofull.png';

export default function NewProblemPage() {
  const [quizType, setQuizType] = useState('');
  const [topic, setTopic] = useState('');
  const [lecture, setLecture] = useState('');
  const [problemType, setProblemType] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('42'); // Placeholder
  const [answer, setAnswer] = useState('');
  const [clarification, setClarification] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [InpEnabled, ttginp] = useState(true);

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
    resize: 'vertical',
    backgroundColor: 'white',
    color: 'black',
    opacity: 1,
    transition: 'opacity 0.5s ease',
  };

  const fadeInStyle = {
    animation: 'fadeIn 0.5s ease',
  };

  const slideInStyle = {
    animation: 'slideIn 0.5s ease',
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

  const handleSubmit = () => {
    const source = quizType === 'lecture' ? lecture : topic;
    const type = problemType || 'General';
    const fakeQuestion = `What is the answer to the ultimate question of life, the universe, and everything?`;
    setGeneratedQuestion(fakeQuestion);
    setCorrectAnswer('42');
    setSubmitted(true);
  };

  const handleAnswerSubmit = () => {
    if (answer.trim() === correctAnswer.trim()) {
      setShowAnswerModal(true);
    } else {
      alert('Try again! That answer is not quite right.');
    }
  };

  const handleClarifySubmit = () => {
    setExplanation(`Sure! Here's a hint: the answer to everything is often jokingly referred to as "42".`);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: 'white', color: 'black', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        button:hover {
          background-color: #f0f0f0 !important;
        }
      `}</style>

      {/* Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button style={navBtnStyle} onClick={() => window.location.href = '/lectures'}>Lectures</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/problems'}>Problems</button>
        </div>
        <button style={navBtnStyle} onClick={() => window.location.href = '/login'}>Login</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '900px', margin: '0 auto' }}>
        <h2>Start a New Problem</h2>

        {/* Quiz Type Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button style={navBtnStyle} onClick={() => handleClick('topic')}>Quiz on Topic</button>
          <button style={navBtnStyle} onClick={() => handleClick('lecture')}>Quiz on Lecture</button>
        </div>

        {/* Topic Input */}
        {quizType === 'topic' && (
          <div style={fadeInStyle}>
            <label><strong>Enter Topic:</strong></label>
            <input
              type="text"
              placeholder="e.g. Derivatives"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={inputStyle}
            />
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

        {/* Lecture Input */}
        {quizType === 'lecture' && (
          <div style={fadeInStyle}>
            <label><strong>Paste Lecture Content:</strong></label>
            <textarea
              value={lecture}
              onChange={(e) => setLecture(e.target.value)}
              placeholder="Paste lecture notes here..."
              rows={4}
              style={inputStyle}
            />
          </div>
        )}

        {/* Submit Button */}
        {quizType && (
          <button
            style={{ ...navBtnStyle, backgroundColor: 'blue', color: 'white', marginBottom: '2rem' }}
            onClick={handleSubmit}
            disabled={
              (quizType === 'topic' && (!topic.trim() || !problemType)) ||
              (quizType === 'lecture' && !lecture.trim())
            }
          >
            Submit
          </button>
        )}

        {/* Question Interaction Section */}
        {submitted && (
          <div style={slideInStyle}>
            <h3>Generated Question:</h3>
            <p style={{ padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
              {generatedQuestion}
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button style={navBtnStyle}>Hint</button>
              <button style={navBtnStyle}>Step-by-step</button>
            </div>

            {/* Answer */}
            <label><strong>Your Answer:</strong></label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={inputStyle}
              placeholder="Type your answer here..."
              rows={3}
            />
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={handleAnswerSubmit}
                style={{ ...navBtnStyle, backgroundColor: '#4CAF50', color: 'white' }}
              >
                Submit Answer
              </button>
            </div>

            {/* Clarification */}
            <label><strong>Clarifying Questions:</strong></label>
            <textarea
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
              style={inputStyle}
              placeholder="Ask a clarifying question..."
              rows={2}
            />
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={handleClarifySubmit}
                style={{ ...navBtnStyle, backgroundColor: '#777', color: 'white' }}
              >
                Submit Clarification
              </button>
            </div>

            {/* Explanation Result */}
            {explanation && (
              <div style={{ marginTop: '1rem', backgroundColor: '#eef', padding: '1rem', borderRadius: '4px' }}>
                <strong>Explanation:</strong> {explanation}
              </div>
            )}
          </div>
        )}

        {/* Correct Modal */}
        {showAnswerModal && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            border: '2px solid #ccc',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ color: 'green' }}>✅ Correct!</h3>
            <p>Would you like to:</p>
            <button
              style={{ ...navBtnStyle, marginTop: '0.5rem' }}
              onClick={() => {
                setShowAnswerModal(false);
                alert('Generating similar problem...');
              }}
            >
              Generate Similar Question
            </button>
            <button
              style={{ ...navBtnStyle, marginTop: '0.5rem' }}
              onClick={() => {
                setShowAnswerModal(false);
                alert('Saved successfully!');
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
