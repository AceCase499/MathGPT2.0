"use client";
import React, { useState, useEffect, useContext } from 'react';
import logo from '../../assets/images/logofull.png';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function NewProblemPage() {
  const { user } = useContext(AuthContext) || {};
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      //router.replace('/');
    } else {
      loadLectureList();
    }
    loadLectureList();
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
  const [LectureArchive, setLectureArchive] = useState([]);

  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [stepping, setStepping] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const [subtopic, setSubtopic] = useState('');
  const [useManualTopic, setUseManualTopic] = useState(false);

  // ====== Image demo state (frontend only) ======
  const [imageUrl, setImageUrl] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  // Replace with your own local file in /public if you want:
  const TEST_IMAGE_URL = 'https://placehold.co/600x400?text=Demo+Diagram';

  const NEED_IMAGE_KEYWORDS = [
    'diagram', 'graph', 'plot', 'triangle', 'circle', 'geometry', 'figure',
    'draw', 'sketch', 'parabola', 'coordinate', 'axis', 'axes', 'shape'
  ];

  const needsImage = (text = '') =>
    NEED_IMAGE_KEYWORDS.some(kw => text.toLowerCase().includes(kw));

  // No backend – just show a placeholder after a short delay
  const generateImageIfNeeded = (questionText) => {
    if (!needsImage(questionText)) {
      setImageUrl('');
      return;
    }
    setGeneratingImage(true);
    setTimeout(() => {
      setImageUrl(TEST_IMAGE_URL);
      setGeneratingImage(false);
    }, 600); // fake latency for demo
  };

  // ====== TTS (Text-to-Speech) ======
  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!supportsTTS) return;

    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.cancel();
      synth.onvoiceschanged = null;
    };
  }, [supportsTTS]);

  const toReadable = (text = "") =>
    text
      .replace(/\$+/g, "")
      .replace(/\\\[(.*?)\\\]/gs, "$1")
      .replace(/\\\((.*?)\\\)/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_#>`~]/g, "");

  const speak = (text) => {
    if (!supportsTTS || !text) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(toReadable(text));
    utter.voice = voices.find((v) => v.lang?.startsWith("en")) || voices[0] || null;
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synth.speak(utter);
  };

  const stopSpeaking = () => {
    if (!supportsTTS) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  // ====== /TTS ======

  const subtopicOptions = {
    Algebra: [
      "Simplifying expressions",
      "Solving linear equations",
      "Distributive property",
      "Evaluating expressions",
      "Graphing lines",
      "Slope-intercept form (y=mx+b)",
      "Solving inequalities",
      "Systems of linear inequalities",
      "Factoring quadratics",
      "Quadratic formula",
      "Graphing parabolas",
      "Completing the square",
    ],
    Geometry: [
      "Types of angles (acute, obtuse)",
      "Triangle congruence (SSS, SAS)",
      "Pythagorean theorem",
      "Similar triangles",
      "Parallel lines & transversals",
      "Properties of quadrilaterals",
      "Polygon interior angles",
      "Perimeter calculations",
      "Diagonals in polygons",
      "Circle theorems",
      "Arc length & sector area",
      "Chord properties",
      "Equations of circles",
    ],
    Calculus: [
      "Power rule",
      "Product/quotient rule",
      "Chain rule",
      "Implicit differentiation",
      "Tangent lines",
      "Optimization problems",
      "Related rates",
      "Curve sketching",
      "Substitution method",
      "Definite integrals",
      "Area under curves",
      "Fundamental Theorem of Calculus",
    ],
    Statistics: [
      "Sample spaces",
      "Addition/multiplication rules",
      "Independent vs. dependent events",
      "Conditional probability",
      "Binomial distribution",
      "Normal distribution (z-scores)",
      "Expected value",
      "Poisson distribution",
      "Null/alternative hypotheses",
      "p-values",
      "t-tests",
      "Type I/II errors",
    ],
  };

  async function loadLectureList() {
    const form = new FormData();
    Object.entries({ student_id: user?.id }).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/lectures', {
      method: 'POST',
      body: form
    });
    const data = await response.json();
    setLectureArchive(data);
  }

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

  const copyToClipboard = (text) => {
    if (!text) return alert("Nothing to copy!");
    navigator.clipboard.writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch(() => alert("Failed to copy."));
  };

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

  const spinner = <span className="spinner" />;

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
    setImageUrl('');
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildFormData(payload),
      });

      const data = await res.json();
      setGeneratedQuestion(data.question);
      setCorrectAnswer(data.solution || '');
      localStorage.setItem('current_session_id', data.session_id);
      setSubmitted(true);

      // purely frontend demo:
      generateImageIfNeeded(data.question);
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildFormData({ session_id }),
      });

      const data = await res.json();
      setExplanation(data.hint);
    } catch (err) {
      alert("Error fetching hint.");
    }
    setHinting(false);
  };

  const handleStepSubmit = async () => {
    setStepping(true);
    const session_id = localStorage.getItem('current_session_id');
    if (!session_id) return alert("No session available.");

    try {
      const res = await fetch(`${BASE_URL}/mathgpt/problem/solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildFormData({ session_id }),
      });

      const data = await res.json();
      setExplanation(data.solution);
    } catch (err) {
      alert("Error fetching step-by-step solution.");
    }
    setStepping(false);
  };

  const handleDeleteSession = async () => {
    const session_id = localStorage.getItem('current_session_id');
    if (!session_id) return alert("No session to delete.");
    const confirm = window.confirm("Are you sure you want to delete this session?");
    if (!confirm) return;

    try {
      const res = await fetch(`${BASE_URL}/mathgpt/problem/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildFormData({ session_id }),
      });

      const data = await res.json();
      alert(data.message || "Session deleted.");
      localStorage.removeItem('current_session_id');
      setGeneratedQuestion('');
      setAnswer('');
      setExplanation('');
      setSubmitted(false);
      setImageUrl('');
    } catch (err) {
      alert("Error deleting session.");
    }
  };

  const handleMarkComplete = () => {
    const session_id = localStorage.getItem('current_session_id');
    if (!session_id) return alert("No session to save.");
    setShowSaveModal(true);
    setNewTitle(topic || 'Untitled Problem');
  };

  const handleRenameAndComplete = async () => {
    const session_id = localStorage.getItem('current_session_id');
    if (!session_id) return alert("No session to rename.");

    try {
      await fetch(`${BASE_URL}/mathgpt/problem/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildFormData({ session_id, new_title: newTitle }),
      });

      await fetch(`${BASE_URL}/mathgpt/problem/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildFormData({ session_id }),
      });

      alert("Session renamed and marked as complete.");
      setShowSaveModal(false);
    } catch (err) {
      alert("Error renaming or completing session.");
    }
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

      {/* Navbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '1rem',
        borderBottom: '1px solid black', backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: '30px' }} />
          <button style={navBtnStyle} onClick={() => window.location.href = '/lectures'}>Lectures</button>
          <button style={navBtnStyle} onClick={() => window.location.href = '/problems'}>Problems</button>
        </div>
        <button style={navBtnStyle} onClick={() => window.location.href = '/login'}>Login</button>
      </div>

      {/* Main Area */}
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
              <label><strong>Problem Type:</strong></label>
              <select
                value={problemType}
                onChange={(e) => {
                  setProblemType(e.target.value);
                  setUseManualTopic(false);
                  setSubtopic('');
                  setTopic('');
                }}
                style={inputStyle}
              >
                <option value="">Select one</option>
                <option value="Algebra">Algebra</option>
                <option value="Geometry">Geometry</option>
                <option value="Calculus">Calculus</option>
                <option value="Statistics">Statistics</option>
              </select>

              {problemType && (
                <>
                  <label><strong>Choose Topic Method:</strong></label>
                  <div style={{ marginBottom: '1rem' }}>
                    <label>
                      <input
                        type="radio"
                        checked={!useManualTopic}
                        onChange={() => {
                          setUseManualTopic(false);
                          setTopic('');
                        }}
                      /> Choose from subtopics
                    </label>
                    <label style={{ marginLeft: '1rem' }}>
                      <input
                        type="radio"
                        checked={useManualTopic}
                        onChange={() => {
                          setUseManualTopic(true);
                          setSubtopic('');
                        }}
                      /> Type your own topic
                    </label>
                  </div>

                  {!useManualTopic && (
                    <>
                      <label><strong>Select Subtopic:</strong></label>
                      <select
                        value={subtopic}
                        onChange={(e) => {
                          setSubtopic(e.target.value);
                          setTopic(e.target.value);
                        }}
                        style={inputStyle}
                      >
                        <option value="">Select a subtopic</option>
                        {(subtopicOptions[problemType] || []).map((item, index) => (
                          <option key={index} value={item}>{item}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {useManualTopic && (
                    <>
                      <label><strong>Enter Topic:</strong></label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        style={inputStyle}
                        placeholder="Type your own topic..."
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}

          {quizType === 'lecture' && (
            <>
              <label><strong>Lecture Session:</strong></label>
              <select value={lectureSessionId} onChange={(e) => setLectureSessionId(e.target.id)} style={inputStyle}>
                {LectureArchive.map((lec, index) => (
                  <option id={lec.lecture_id.toString()} value={[lec.topic, lec.subtopic]}>{lec.title}</option>
                ))}
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

        <div style={{ ...panelStyle, flexGrow: 1 }}>
          <h2>📘 Work Area</h2>
          {submitted ? (
            <>
              <div style={{
                padding: '1rem', backgroundColor: '#f0f8ff',
                border: '1px solid #ccc', borderRadius: '6px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Question:</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => copyToClipboard(generatedQuestion)}
                      style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      📋 Copy
                    </button>
                    {supportsTTS && (
                      <>
                        <button
                          onClick={() => speak(generatedQuestion)}
                          style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                          disabled={!generatedQuestion}
                        >
                          🔊 Read
                        </button>
                        {isSpeaking && (
                          <button
                            onClick={stopSpeaking}
                            style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                          >
                            ⏹ Stop
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {generatedQuestion}
                </ReactMarkdown>

                {/* Image block (frontend demo only) */}
                {generatingImage && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Generating picture...</span> {spinner}
                  </div>
                )}

                {!generatingImage && imageUrl && (
                  <div style={{ marginTop: '1rem' }}>
                    <img
                      src={imageUrl}
                      alt="Problem illustration (demo)"
                      style={{ maxWidth: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                    />
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        style={{ ...navBtnStyle, fontSize: '0.85rem' }}
                        onClick={() => generateImageIfNeeded(generatedQuestion)}
                      >
                        🔁 Regenerate Picture
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button style={navBtnStyle} onClick={handleClarifySubmit} disabled={hinting}>
                  {hinting ? <>Hinting... {spinner}</> : "💡 Hint"}
                </button>
                <button style={navBtnStyle} onClick={handleStepSubmit} disabled={stepping}>
                  {stepping ? <>Solving... {spinner}</> : "📈 Step-by-step"}
                </button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Explanation:</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => copyToClipboard(explanation)} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                        📋 Copy
                      </button>
                      {supportsTTS && (
                        <>
                          <button
                            onClick={() => speak(explanation)}
                            style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                            disabled={!explanation}
                          >
                            🔊 Read
                          </button>
                          {isSpeaking && (
                            <button
                              onClick={stopSpeaking}
                              style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                            >
                              ⏹ Stop
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {explanation}
                  </ReactMarkdown>
                </div>
              )}

              {generatedQuestion && explanation && (
                <div style={{ marginTop: '1rem' }}>
                  <button onClick={() => copyToClipboard(`Question: ${generatedQuestion}\n\nExplanation: ${explanation}`)}
                    style={{
                      backgroundColor: '#0070f3',
                      color: 'white',
                      padding: '0.6rem 1.2rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    📎 Copy All
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  style={{ ...navBtnStyle, borderColor: '#4CAF50', color: '#4CAF50' }}
                  onClick={handleMarkComplete}
                >
                  ✅ Save
                </button>
                <button
                  style={{ ...navBtnStyle, borderColor: '#cc0000', color: '#cc0000' }}
                  onClick={handleDeleteSession}
                >
                  🗑️ Delete
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontStyle: 'italic', color: '#777' }}>← Use the left panel to generate a problem to get started.</p>
          )}
        </div>
      </div>

      {/* Rename & Save Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
            minWidth: '300px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h3>Name Your Problem</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                style={{ ...navBtnStyle, backgroundColor: '#4CAF50', color: 'white' }}
                onClick={handleRenameAndComplete}
              >
                Rename & Save
              </button>
              <button
                style={{ ...navBtnStyle, backgroundColor: '#ccc', color: 'black' }}
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
