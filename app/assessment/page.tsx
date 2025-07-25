"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@supabase/auth-helpers-react'
import { Pause } from 'lucide-react'
import { useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import dynamic from 'next/dynamic';


interface Question {
  id: number
  text: string
  options?: string[] // Only for MCQ
  correctIndex?: number // Only for MCQ
  answer?: number | string // For numeric/proof
  type: 'mcq' | 'numeric' | 'proof' | 'graph'
  topic: string // For strengths/gaps analysis
  hint?: string // For hints
  difficulty?: string
}



// Add GraphingTool component above the main AssessmentEntry function
function GraphingTool({ value, onChange, disabled, func, showAnswer }: { value: Array<{x: number, y: number}>, onChange: (pts: Array<{x: number, y: number}>) => void, disabled: boolean, func?: (x: number) => number, showAnswer?: boolean }) {
  const width = 300, height = 300, gridSize = 10;
  const cellSize = width / gridSize;
  function handleGridClick(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    if (disabled) return;
    const rect = (e.target as SVGSVGElement).getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / width) * gridSize);
    const y = gridSize - 1 - Math.floor(((e.clientY - rect.top) / height) * gridSize);
    if (!value.some(pt => pt.x === x && pt.y === y)) {
      onChange([...value, {x, y}]);
    }
  }
  // Generate function curve points if func is provided and showAnswer is true
  const funcPoints = func && showAnswer ? Array.from({length: width}, (_, i) => {
    const x = (i / cellSize) - 0.5;
    const y = func(x);
    return { x: i, y: height - ((y + 0.5) * cellSize) };
  }) : [];
  return (
    <svg width={width} height={height} style={{border: '1px solid #ccc', background: '#f9f9f9', cursor: disabled ? 'not-allowed' : 'pointer'}} onClick={handleGridClick}>
      {/* Draw grid */}
      {[...Array(gridSize + 1)].map((_, i) => (
        <g key={i}>
          <line x1={i * cellSize} y1={0} x2={i * cellSize} y2={height} stroke="#ddd" />
          <line x1={0} y1={i * cellSize} x2={width} y2={i * cellSize} stroke="#ddd" />
        </g>
      ))}
      {/* Draw axes */}
      <line x1={0} y1={height - cellSize/2} x2={width} y2={height - cellSize/2} stroke="#888" strokeWidth={2} /> {/* x-axis */}
      <line x1={cellSize/2} y1={0} x2={cellSize/2} y2={height} stroke="#888" strokeWidth={2} /> {/* y-axis */}
      {/* Axis labels */}
      <text x={width - 20} y={height - cellSize/2 - 5} fontSize="12" fill="#333">x</text>
      <text x={cellSize/2 + 5} y={15} fontSize="12" fill="#333">y</text>
      {/* Only show function curve if showAnswer is true */}
      {func && showAnswer && (
        <polyline
          fill="none"
          stroke="#f59e42"
          strokeWidth={2}
          points={funcPoints.map(pt => `${pt.x},${pt.y}`).join(' ')}
        />
      )}
      {/* Draw points */}
      {value.map((pt, idx) => (
        <circle key={idx} cx={(pt.x + 0.5) * cellSize} cy={height - (pt.y + 0.5) * cellSize} r={8} fill="#2563eb" />
      ))}
    </svg>
  );
}


async function fetchMicroLecture(strengths: string[], gaps: string[]): Promise<string> {
  return Promise.resolve(
    "This is a mock micro-lecture. Practice makes perfect! Focus on your weak topics and review your strengths regularly."
  );
}

async function fetchDiagnosticQuestions(topic: string, grade: string = 'K-12', numQuestions: number = 3, student_id?: number) {
  console.log('[fetchDiagnosticQuestions] topic:', topic, 'grade:', grade, 'numQuestions:', numQuestions, 'student_id:', student_id);
  try {
    const res = await fetch(
      `https://mathgptdevs25.pythonanywhere.com/skill_assessment/pick_problem?ts=${Date.now()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, grade, numQuestions, student_id }),
      }
    );
    console.log('[fetchDiagnosticQuestions] fetch status:', res.status);
    const text = await res.text();
    console.log('[fetchDiagnosticQuestions] raw text:', text);

   // ------------------------------------------
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```[\s\n]*$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/```[\s\n]*$/, '').trim();
    }
    console.log('[fetchDiagnosticQuestions] cleanText:', cleanText);
    // ------------------------------------------

    let diagnostic = {};
    try {
      diagnostic = JSON.parse(cleanText);
      console.log('[fetchDiagnosticQuestions] parsed diagnostic:', diagnostic);
    } catch (e) {
      console.error('[fetchDiagnosticQuestions] parse error:', e, 'cleanText:', cleanText);
    }
    return diagnostic;
  } catch (err) {
    console.error('[fetchDiagnosticQuestions] fetch error:', err);
    return {};
  }
}

export default function AssessmentEntry() {
  const { user } = useContext(AuthContext) as any;
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user, router]);

  const [showModal, setShowModal] = useState(true) // Show the modal by default
  const [assessmentTaken, setAssessmentTaken] = useState(false)
  const [inAssessment, setInAssessment] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | string | Array<{x: number, y: number}> | null>(null);
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [proficiencyLevel, setProficiencyLevel] = useState('')
  const [performanceAnalysis, setPerformanceAnalysis] = useState('')
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [skippedAssessment, setSkippedAssessment] = useState(false)
  const [settings, setSettings] = useState({
    difficultyCurve: 'normal',
    timePerItem: '60', // string for input
    hintAvailable: true,
    stopRulePrecision: '0.8', // string for input
    numQuestions: '15', // Added for number of questions
  });
  const [settingsWarning, setSettingsWarning] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [confidence, setConfidence] = useState<Record<number, 'sure' | 'unsure' | null>>({});
  const [performanceByTopic, setPerformanceByTopic] = useState<{[topic: string]: {correct: number, total: number}}>({});
  // Add state for selected confidence for the current question
  const [selectedConfidence, setSelectedConfidence] = useState<'sure' | 'unsure' | null>(null);
  const [showMicroLecture, setShowMicroLecture] = useState(false);
  const [showGoNext, setShowGoNext] = useState(false);
  const [microLectureAI, setMicroLectureAI] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Change timer state to always be a number
  const [timer, setTimer] = useState(() => parseInt(settings.timePerItem) || 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. On assessment start, fetch personalization info and filter questions
  const [personalization, setPersonalization] = useState<{age?: number, grade?: string, topic?: string} | null>(null);
  const [topic] = useState('Addition'); 
  const [grade] = useState('K-12'); 
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Add state for graph points:
  const [graphPoints, setGraphPoints] = useState<Array<{x: number, y: number}>>([]);
  const [correctnessArr, setCorrectnessArr] = useState<boolean[]>([]);

  useEffect(() => {
    // All browser-dependent logic is inside useEffect
    if (typeof window !== 'undefined') {
      // Fetch personalization info (FERPA/COPPA: do not store PII in localStorage in production)
      const profile = localStorage.getItem('PRIV-05_profile'); // RBAC: Only accessible to student/teacher
      if (profile) {
        setPersonalization(JSON.parse(profile));
      }
      // Fetch teacher-selected questions if available
      const teacherQuestions = localStorage.getItem('PRIV-05_teacher_questions'); // RBAC: Only accessible to teacher
      if (teacherQuestions) {
        try {
          const parsed = JSON.parse(teacherQuestions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
            return;
          }
        } catch {}
      }
      // Otherwise, filter mockQuestions by personalization
      if (profile) {
        const { age, grade, topic } = JSON.parse(profile);
        let filtered = questions; //
        if (topic) filtered = filtered.filter(q => q.topic === topic);
        // Optionally filter by age/grade if questions have such metadata
        setQuestions(filtered);
      } else {
        setQuestions(questions); 
      }
    }
  }, []);

  // Listen for skippedAssessment state updates
  useEffect(() => {
    if (skippedAssessment) {
      // setShowModal(false) // When assessment is skipped, close the modal
    }
  }, [skippedAssessment])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const taken = localStorage.getItem('assessment_taken') === 'true';
      setAssessmentTaken(taken);
      const skipped = localStorage.getItem('assessment_skipped') === 'true';
      setSkippedAssessment(skipped);
      if (!taken && !skipped) setShowModal(true);

      const savedProgress = localStorage.getItem('assessment_progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setCurrentIndex(parsed.currentIndex || 0);
        setCorrectCount(parsed.correctCount || 0);
        setSelectedOption(parsed.selectedOption ?? null);
        setInAssessment(parsed.inAssessment || false);
      }

      console.log("Assessment skipped status on load:", skippedAssessment);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assessment_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    console.log("Modal state changed:", showModal)
  }, [showModal])

  // When moving to a new question, reset selectedConfidence
  useEffect(() => {
    setSelectedConfidence(null);
  }, [currentIndex, inAssessment]);

  // When settings.timePerItem changes (or on assessment start), update timer as a number
  useEffect(() => {
    if (!inAssessment) return;
    setTimer(parseInt(settings.timePerItem) || 60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit or skip
          if (selectedOption !== null && selectedConfidence !== null) {
            handleSubmit();
          } else {
            // Skip: move to next question
            if (currentIndex + 1 < questions.length) {
              setCurrentIndex(currentIndex + 1);
              setSelectedOption(null);
              setSelectedConfidence(null);
              setFeedback('');
              setLocked(false);
            } else {
              finishAssessment();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, inAssessment, settings.timePerItem]);

  // Reset graphPoints on question change:
  useEffect(() => { setGraphPoints([]); }, [currentIndex, inAssessment]);

  // Helper: Wilson score interval for binomial proportion
  function wilsonScoreInterval(correct: number, total: number, z = 1.96) {
    if (total === 0) return {low: 0, high: 1, width: 1};
    const phat = correct / total;
    const denom = 1 + z*z/total;
    const centre = phat + z*z/(2*total);
    const adj = z * Math.sqrt((phat*(1-phat) + z*z/(4*total)) / total);
    const low = (centre - adj) / denom;
    const high = (centre + adj) / denom;
    return {low, high, width: high - low};
  }

  // After finishAssessment or in the summary logic, schedule spaced review items
  function scheduleSpacedReview() {
    // Find low-confidence or low-performance topics/questions
    const lowConfidenceIds = Object.entries(confidence)
      .filter(([_, val]) => val === 'unsure')
      .map(([id]) => Number(id));
    // Calculate performance by topic
    const perf: {[topic: string]: {correct: number, total: number}} = {};
    questions.forEach((q, idx) => {
      if (!perf[q.topic]) perf[q.topic] = {correct: 0, total: 0};
      perf[q.topic].total += 1;
      // For now, use correctCount as a stub; ideally, track per-question correctness
    });
    const lowPerfTopics = Object.entries(perf)
      .filter(([_, {correct, total}]) => total > 0 && correct / total < 0.4)
      .map(([topic]) => topic);
    // Select up to 5 unique review items (by question or topic)
    const reviewItems = [];
    for (const id of lowConfidenceIds) {
      const q = questions.find(q => q.id === id);
      if (q && !reviewItems.find(item => item.id === q.id)) {
        reviewItems.push({ id: q.id, text: q.text, topic: q.topic });
      }
      if (reviewItems.length >= 5) break;
    }
    for (const topic of lowPerfTopics) {
      if (!reviewItems.find(item => item.topic === topic)) {
        const q = questions.find(q => q.topic === topic);
        if (q) reviewItems.push({ id: q.id, text: q.text, topic: q.topic });
      }
      if (reviewItems.length >= 5) break;
    }
    // Assign review dates within 7 days
    const now = Date.now();
    const spacedReviews = reviewItems.slice(0, 5).map((item, idx) => ({
      ...item,
      due: new Date(now + (idx + 1) * (7 * 24 * 60 * 60 * 1000) / 5).toISOString()
    }));
    // Store in localStorage (or backend in future)
    localStorage.setItem('PRIV-05_spaced_review', JSON.stringify(spacedReviews));
    // TODO: Integrate with backend for FERPA/COPPA compliance
  }

  // 2. Store Strengths & Gaps Summary in teacher dashboard after assessment
  function storeStrengthsGapsSummary(perfByTopic: {[topic: string]: {correct: number, total: number}}) {
    // FERPA/COPPA: Only store summary, not PII
    // RBAC: Only accessible to teacher
    const summary = Object.entries(perfByTopic).map(([topic, {correct, total}]) => {
      const percent = (correct / total) * 100;
      return { topic, percent, band: percent >= 70 ? 'Strength' : percent < 40 ? 'Gap' : 'Average' };
    });
    localStorage.setItem('PRIV-05_teacher_dashboard', JSON.stringify(summary));
    // TODO: Integrate with backend for secure teacher dashboard
  }

  // Helper: Finish assessment and write proficiency band
  function finishAssessment() {
    setInAssessment(false);
    setShowSummary(true);
    // Write proficiency band to PRIV-05_progress within 1s (FERPA/COPPA: summary only)
    setTimeout(() => {
      localStorage.setItem('PRIV-05_progress', proficiencyLevel); // RBAC: Only accessible to student/teacher
    }, 500);
    // Schedule spaced review
    scheduleSpacedReview();
    // Store strengths & gaps summary for teacher
    storeStrengthsGapsSummary(performanceByTopic);
  }

  // Improved handleSkip: ensure correct state after click
  const handleSkip = () => {
    // FERPA/COPPA: Only store skip status, not PII
    console.log("handleSkip triggered")
    localStorage.setItem('assessment_taken', 'false');
    localStorage.setItem('assessment_skipped', 'true');
    setAssessmentTaken(false);
    setSkippedAssessment(true);
  
    setTimeout(() => {
      setShowModal(false) // Hide modal
      router.push('/welcome') // Add this line to redirect
    }, 0)
  }

  const handleTakeNow = async () => {
    localStorage.setItem('assessment_taken', 'true');
    setAssessmentTaken(true);
    setShowModal(false);
    setCurrentIndex(0);
    setSelectedOption(null);
    setSelectedConfidence(null);
    setFeedback('');
    setLocked(false);
    setShowSummary(false);
    setPerformanceByTopic({});
    setShowMicroLecture(false);
    setShowGoNext(false);

    setLoading(true);
    try {
      const diagnostic = await fetchDiagnosticQuestions(topic, grade, Number(settings.numQuestions) || 3, user?.id);
      const qList = [];
      let id = 1;
      Object.entries(diagnostic).forEach(([subtopic, arrOrObj]) => {
        if (Array.isArray(arrOrObj)) {
          arrOrObj.forEach((q) => {
            if (q && q.question) {
              qList.push({
                id: id++,
                text: q.question,
                type: typeof q.type === 'string' && ['mcq', 'numeric', 'proof', 'graph'].includes(q.type)
                  ? q.type
                  : q.options
                    ? 'mcq'
                    : 'numeric',
                topic: subtopic,
                difficulty: q.difficulty,
                options: q.options,
                correctIndex: q.correctIndex,
                answer: q.answer
              });
            }
          });
        } else if (arrOrObj && typeof arrOrObj === 'object' && (arrOrObj as any).question) {
          // Support single question object
          const q = arrOrObj as any;
          qList.push({
            id: id++,
            text: q.question,
            type: typeof q.type === 'string' && ['mcq', 'numeric', 'proof', 'graph'].includes(q.type)
              ? q.type
              : q.options
                ? 'mcq'
                : 'numeric',
            topic: subtopic,
            difficulty: q.difficulty,
            options: q.options,
            correctIndex: q.correctIndex,
            answer: q.answer
          });
        }
      });
      console.log('[handleTakeNow] qList:', qList);
      setQuestions(qList);
      setInAssessment(true); 
    } catch (e) {
      alert('Failed to fetch questions');
    }
    setLoading(false);
  };

  const handleRetake = () => {
    const confirmRetake = confirm('This will erase your previous results and restart the assessment. Do you want to continue?');
    if (confirmRetake) {
      localStorage.removeItem('assessment_progress');
      setAssessmentTaken(false);
      setInAssessment(true);
      setCurrentIndex(0);
      setFeedback('');
      setSelectedOption(null);
      setSelectedConfidence(null);
      setCorrectCount(0);
      setShowSummary(false);
      setPerformanceByTopic({});
      setShowMicroLecture(false);
      setShowGoNext(false);
    }
  }

  const handlePause = () => {
    setInAssessment(false)
    setShowPauseModal(true)
  }

  const handleResume = () => {
    setShowPauseModal(false)
    setInAssessment(true)
  }

  // Submit answer
  const handleSubmit = () => {
    if (selectedOption === null || selectedConfidence === null) return;
    setLocked(true);

    const currentQuestion = questions[currentIndex];

    let isCorrect = false;
    if (currentQuestion.type === 'mcq') {
      isCorrect = selectedOption === currentQuestion.correctIndex;
    } else if (currentQuestion.type === 'numeric') {
      isCorrect = Number(selectedOption) === currentQuestion.answer;
    } else if (currentQuestion.type === 'proof') {
      // Improved: check for key phrases
      if (typeof selectedOption === 'string') {
        const answerLower = selectedOption.toLowerCase();
        isCorrect =
          answerLower.includes('even') &&
          (answerLower.includes('sum') || answerLower.includes('add')) &&
          (answerLower.includes('multiple of 2') || answerLower.includes('divisible by 2') || answerLower.includes('2k'));
      } else {
        isCorrect = false;
      }
    } else if (currentQuestion.type === 'graph') {
      isCorrect = Array.isArray(graphPoints) && graphPoints.length > 0; // Accept any plotted points as correct for now
    }

    if (isCorrect) setCorrectCount((prev) => prev + 1);
    setFeedback(isCorrect ? 'Correct!' : 'Incorrect');

    setTimeout(() => {
      // Calculate Wilson interval
      const total = currentIndex + 1;
      const correct = isCorrect ? correctCount + 1 : correctCount;
      const wilson = wilsonScoreInterval(correct, total);
      // Termination criteria
      if (wilson.width < 0.06 || currentIndex + 1 >= questions.length) {
        // Set proficiency level before finishing
        const label = getProficiencyLabel();
        setProficiencyLevel(label);
        const analysis = generatePerformanceAnalysis(label);
        setPerformanceAnalysis(analysis);
        localStorage.setItem('assessment_analysis', analysis);
        localStorage.setItem('assessment_level', label);
        localStorage.removeItem('assessment_progress');
        finishAssessment();
      } else {
        if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1)
        setSelectedOption(null)
        setFeedback('')
        setLocked(false)
      } else {
          finishAssessment();
        }
      }
    }, 1500)
    setConfidence(c => ({ ...c, [questions[currentIndex].id]: selectedConfidence }));
    setCorrectnessArr(arr => {
      const newArr = [...arr];
      newArr[currentIndex] = isCorrect;
      return newArr;
    });
  }

  const getProficiencyLabel = () => {
    const percent = correctCount / questions.length
    if (percent === 1) return 'Advanced'
    if (percent >= 0.66) return 'Intermediate'
    return 'Beginner'
  }

  const generatePerformanceAnalysis = (level: string) => {
    if (level === 'Advanced') {
      return 'Excellent performance! You excel at basic math operations and have mastered complex calculations.'
    } else if (level === 'Intermediate') {
      return 'Good job! You have a solid understanding of basic math but could improve in more complex topics like multiplication and division.'
    } else {
      return 'You need more practice in basic math operations. Focus on improving your skills in addition, subtraction, and multiplication.'
    }
  }

  // Generate microLecture from performanceAnalysis or a default string
  const microLecture = performanceAnalysis
    ? (performanceAnalysis.length > 120 ? performanceAnalysis.slice(0, 120) : performanceAnalysis)
    : 'Great job! Here is a quick tip: Practice makes perfect. Keep working on your math skills!';

  // Micro-Lecture generation logic: no longer use performanceAnalysis, generate dynamically on Yes click
  const handleGenerateMicroLecture = async () => {
    // Get gaps and topics
    const strengths = Object.entries(performanceByTopic).filter(([_, {correct, total}]) => total > 0 && (correct / total) * 100 >= 70).map(([topic]) => topic);
    const gaps = Object.entries(performanceByTopic).filter(([_, {correct, total}]) => total > 0 && (correct / total) * 100 < 40).map(([topic]) => topic);
    const aiLecture = await fetchMicroLecture(strengths, gaps);
    setMicroLectureAI(aiLecture);
  };

  useEffect(() => {
    if (showSummary) {
      const perf: {[topic: string]: {correct: number, total: number}} = {};
      questions.forEach((q, idx) => {
        if (!perf[q.topic]) perf[q.topic] = {correct: 0, total: 0};
        perf[q.topic].total += 1;
        if (correctnessArr[idx]) perf[q.topic].correct += 1;
      });
      setPerformanceByTopic(perf);
    }
  }, [showSummary]);

  useEffect(() => { setShowHint(false); }, [currentIndex, inAssessment]);

  const isTeacherOrAdmin = user && (user.user_type === 'teacher' || user.user_type === 'admin');

  const AssignAssessmentMock = dynamic(() => import('./AssignAssessmentMock'), { ssr: false });
  const StudentResultsMock = dynamic(() => import('./StudentResultsMock'), { ssr: false });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  console.log('questions for render:', questions);

  return (
    <div className="w-full flex flex-col min-h-screen bg-white">
      {/* Loading overlay */}
      {loading && !showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200 bg-opacity-70">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center border border-blue-100">
            <svg className="animate-spin mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="4" strokeDasharray="60" strokeDashoffset="20"/>
            </svg>
            <div className="text-lg font-semibold text-gray-800 mb-2">Generating your assessment...</div>
            <div className="text-gray-600 text-base text-center">This may take up to 20 seconds. Please wait while we prepare personalized questions for you.</div>
          </div>
        </div>
      )}
    
      {settingsLoaded && isTeacherOrAdmin && (
        <div className="flex flex-1 flex-col items-center justify-center min-h-screen w-full">
          <div className="p-8 max-w-xl w-full bg-gray-100 shadow-xl rounded-xl flex flex-col items-center justify-center text-center my-12">
            <h2 className="text-lg font-bold mb-2">Assessment Settings (Teacher/Admin)</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                const timePerItemNum = Number(settings.timePerItem);
                if (settings.timePerItem === '' || isNaN(timePerItemNum) || timePerItemNum <= 0) {
                  setSettingsWarning('Please enter a valid time per item (must be a positive number).');
                  return;
                }
                if (!settings.numQuestions) {
                  setSettingsWarning('Please select the number of questions.');
                  return;
                }
                setSettingsWarning('');
                localStorage.setItem('assessment_settings', JSON.stringify({
                  ...settings,
                  timePerItem: timePerItemNum,
                  numQuestions: settings.numQuestions,
                }));
                alert('Settings saved!');
              }}
              className="space-y-4 w-full"
            >
              <div>
                <label className="block font-medium">Difficulty Curve:</label>
                <select
                  value={settings.difficultyCurve}
                  onChange={e => setSettings(s => ({ ...s, difficultyCurve: e.target.value }))}
                  className="border border-gray-300 bg-white rounded-lg shadow-sm px-2 py-1 w-48"
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Time per Item (seconds):</label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={settings.timePerItem}
                  onChange={e => setSettings(s => ({ ...s, timePerItem: e.target.value }))}
                  className="border border-gray-300 bg-white rounded-lg shadow-sm px-2 py-1 w-48"
                />
                {settings.timePerItem === '' && (
                  <div className="text-red-600 text-sm mt-1">Please enter a value for time per item.</div>
                )}
              </div>
              <div>
                <label className="block font-medium">Hint Available:</label>
                <input
                  type="checkbox"
                  checked={settings.hintAvailable}
                  onChange={e => setSettings(s => ({ ...s, hintAvailable: e.target.checked }))}
                  className="ml-2"
                />
              </div>
              <div>
                <label className="block font-medium">Number of Questions:</label>
                <select
                  value={settings.numQuestions || '15'}
                  onChange={e => setSettings(s => ({ ...s, numQuestions: e.target.value }))}
                  className="border border-gray-300 bg-white rounded-lg shadow-sm px-2 py-1 w-48"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
                <div className="text-gray-600 text-xs mt-1">
                  15 questions is recommended for most users.
                </div>
                {(!settings.numQuestions) && (
                  <div className="text-red-600 text-sm mt-1">Please select the number of questions.</div>
                )}
              </div>
              {settingsWarning && (
                <div className="text-red-600 text-sm mt-2">{settingsWarning}</div>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-full"
              >
                Save Settings
              </button>
            </form>
            <div className="mt-4 text-gray-500 text-sm">
              Questions are generated dynamically for each student based on these settings.
            </div>

          
            <hr className="my-8 w-full border-gray-300" />

  
            <AssignAssessmentMock />


            <hr className="my-8 w-full border-gray-300" />


            <StudentResultsMock />
          </div>
        </div>
      )}

    
      {!isTeacherOrAdmin && (
        <>
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
              <div className="relative w-[90%] max-w-lg bg-white rounded-lg shadow-lg">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <img src="/logo-icon.png" alt="MathGPT Logo" className="h-8 w-8" />
                    <span className="text-lg font-semibold text-gray-800">
                      MathGPT Skill Assessment
                    </span>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-gray-500 hover:text-gray-800 text-xl"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="bg-gray-50 text-center px-6 py-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Want a personalized experience?
                  </h3>
                  <div className="text-4xl text-gray-700">➕ ➖ ✖️ ➗</div>
                </div>
                <div className="bg-white text-center px-6 py-6 rounded-b-lg">
                  <p className="text-[16px] text-gray-800 mb-6">
                    Take a <span className="font-medium">quick math assessment</span> to match content to your level.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleSkip}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-full text-lg text-gray-800"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={handleTakeNow}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-lg text-white"
                    >
                      Take Assessment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {skippedAssessment && !inAssessment && !showSummary && !showModal && (
            <div className="min-h-screen flex items-center justify-center">
              <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to MathGPT</h2>
                <p className="text-gray-700 mb-6">
                  You can take the skill assessment anytime to get a personalized experience.
                </p>
                <button
                  onClick={handleTakeNow}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg"
                >
                  Take Assessment
                </button>
              </div>
            </div>
          )}

          {inAssessment && (
            <div className="min-h-screen flex flex-col justify-center items-center w-full">
              <div className="w-full max-w-xl flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-xl shadow text-center mb-6 py-3">
                  <div className="text-2xl text-black">Skill Assessment</div>
                </div>
                <div className="p-8 w-full bg-gray-100 shadow-xl rounded-lg text-center relative pb-4 min-h-[400px] flex flex-col justify-center">
                  <button
                    onClick={handlePause}
                    className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
                    title="Pause Assessment"
                  >
                    <Pause size={24} />
                  </button>
                  {questions.length > 0 && currentIndex < questions.length ? (
                    <>
                      <h3 className="text-2xl font-medium mb-8 text-gray-800">
                        Question {currentIndex + 1} of {questions.length}
                      </h3>
                      <p className="mb-6 font-medium text-xl text-gray-700">{questions[currentIndex].text}</p>
                      {questions[currentIndex].type === 'mcq' && questions[currentIndex].options && (
                        <div className="space-y-4 mb-8">
                          {questions[currentIndex].options.map((opt, i) => (
                            <button
                              key={i}
                              disabled={locked}
                              onClick={() => {
                                setSelectedOption(i);
                                setSelectedConfidence(null); // Reset confidence when changing answer
                              }}
                              className={`w-full text-left px-6 py-4 rounded-lg border-2 shadow-md transition-colors bg-white flex items-center ${
                                selectedOption === i
                                  ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {/* No emoji for selected option */}
                              {String.fromCharCode(65 + i)}. {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {questions[currentIndex].type === 'numeric' && (
                        <div className="mb-8">
                          <input
                            type="number"
                            value={typeof selectedOption === 'number' ? selectedOption : ''}
                            onChange={e => {
                              setSelectedOption(Number(e.target.value));
                              setSelectedConfidence(null); // Reset confidence when changing answer
                            }}
                            disabled={locked}
                            className="w-full px-6 py-4 rounded-lg border border-gray-300 shadow-md bg-white"
                            placeholder="Enter your answer"
                          />
                        </div>
                      )}

                      {questions[currentIndex].type === 'proof' && (
                        <div className="mb-8">
                          <textarea
                            value={typeof selectedOption === 'string' ? selectedOption : ''}
                            onChange={e => {
                              setSelectedOption(e.target.value);
                              setSelectedConfidence(null); // Reset confidence when changing answer
                            }}
                            disabled={locked}
                            className="w-full px-6 py-4 rounded-lg border border-gray-300 shadow-md bg-white"
                            placeholder="Enter your proof step by step"
                            rows={5}
                          />
                        </div>
                      )}

                      {questions[currentIndex].type === 'graph' && (
                        <div className="mb-8 bg-white rounded-lg p-4 border border-gray-300 shadow-md">
                          <GraphingTool
                            value={graphPoints}
                            onChange={pts => { setGraphPoints(pts); setSelectedOption(pts); setSelectedConfidence(null); }}
                            disabled={locked}
                            func={questions[currentIndex].text.includes('y = x^2') ? (x => x * x) : undefined}
                            showAnswer={false}
                          />
                          <div className="mt-2 text-sm text-gray-500">Click on the grid to plot points for your answer.</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Loading questions...</div>
                  )}

                  {settings.hintAvailable && questions[currentIndex]?.hint && (
                    <div className="mt-4 flex flex-col items-center">
                      <button
                        onClick={() => setShowHint(true)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-400 text-white font-semibold shadow-lg transition-all duration-150 hover:bg-yellow-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300 ${showHint ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={showHint}
                        style={{ fontSize: '1.1rem' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 2a7 7 0 0 0-7 7c0 2.386 1.32 4.434 3.25 5.5V17a2 2 0 0 0 2 2h1.5a2 2 0 0 0 2-2v-2.5C17.68 13.434 19 11.386 19 9a7 7 0 0 0-7-7Zm1.5 15a.5.5 0 0 1-.5.5H11a.5.5 0 0 1-.5-.5v-1h3v1Zm-1.5-3c-2.757 0-5-2.243-5-5a5 5 0 1 1 10 0c0 2.757-2.243 5-5 5Z"/></svg>
                        Show Hint
                      </button>
                      {showHint && (
                        <div className="mt-4 w-full max-w-md mx-auto flex items-start gap-3 bg-yellow-50 border-l-4 border-yellow-400 shadow-md rounded-lg p-4 animate-fade-in">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#facc15" d="M12 2a7 7 0 0 0-7 7c0 2.386 1.32 4.434 3.25 5.5V17a2 2 0 0 0 2 2h1.5a2 2 0 0 0 2-2v-2.5C17.68 13.434 19 11.386 19 9a7 7 0 0 0-7-7Zm1.5 15a.5.5 0 0 1-.5.5H11a.5.5 0 0 1-.5-.5v-1h3v1Zm-1.5-3c-2.757 0-5-2.243-5-5a5 5 0 1 1 10 0c0 2.757-2.243 5-5 5Z"/></svg>
                          <span className="text-yellow-800 text-base font-medium" style={{lineHeight: '1.6'}}>{questions[currentIndex].hint}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show confidence buttons after an answer is selected, but before submit */}
                  {selectedOption !== null && !locked && (
                    <div className="mt-6 flex justify-center space-x-6">
                      <button
                        onClick={() => setSelectedConfidence('sure')}
                        className={`w-32 px-0 py-2 rounded-full text-base font-semibold shadow transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          selectedConfidence === 'sure'
                            ? 'bg-green-600 text-white border-green-700 scale-105'
                            : 'bg-white text-green-700 border-green-500 hover:bg-green-50 hover:scale-105'
                        }`}
                        disabled={selectedConfidence === 'sure'}
                      >
                        <span className="inline-block align-middle mr-1">✔️</span> Sure
                      </button>
                      <button
                        onClick={() => setSelectedConfidence('unsure')}
                        className={`w-32 px-0 py-2 rounded-full text-base font-semibold shadow transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                          selectedConfidence === 'unsure'
                            ? 'bg-yellow-500 text-white border-yellow-600 scale-105'
                            : 'bg-white text-yellow-700 border-yellow-400 hover:bg-yellow-50 hover:scale-105'
                        }`}
                        disabled={selectedConfidence === 'unsure'}
                      >
                        <span className="inline-block align-middle mr-1">❓</span> Not Sure
                      </button>
                    </div>
                  )}

                  {/* Show Submit button only if not locked and no feedback yet */}
                  {(!locked && feedback === '') && (
                    <div className="flex justify-center w-full">
                      <button
                        onClick={handleSubmit}
                        disabled={selectedOption === null || selectedConfidence === null || locked}
                        className="mt-8 w-72 py-3 rounded-full text-lg font-semibold shadow transition-all duration-150 border-2 bg-blue-600 text-white border-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                  {/* Show feedback in place of the button after submit */}
                  {locked && feedback && (
                    <div className={`mt-8 font-medium text-lg ${
                      feedback === 'Correct!'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {feedback}
                    </div>
                  )}
                  <div className="absolute top-4 right-4 text-lg font-semibold text-gray-700">
                    Time left: {timer}s
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSummary && !showMicroLecture && (
            <div className="min-h-screen flex flex-col justify-center items-center">
              <div className="bg-gray-100 rounded-lg shadow-md p-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Strengths & Gaps Summary</h2>
                <p className="text-gray-700 mb-6 text-center">
                  Here are the topics where you performed best (Strengths) and those that need more practice (Gaps):
                </p>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-700 mb-2">Strengths (≥ 70%)</h3>
                  <ul>
                    {Object.entries(performanceByTopic).filter(([_, {correct, total}]) => total > 0 && (correct / total) * 100 >= 70).map(([topic, {correct, total}]) => (
                      <li key={topic} className="text-green-700">{topic}: {(correct / total * 100).toFixed(0)}%</li>
                    ))}
                    {Object.entries(performanceByTopic).filter(([_, {correct, total}]) => total > 0 && (correct / total) * 100 >= 70).length === 0 && (
                      <li className="text-gray-500">No strengths identified yet.</li>
                    )}
                  </ul>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Gaps (&lt; 40%)</h3>
                  <ul>
                    {Object.entries(performanceByTopic).filter(([_, {correct, total}]) => total > 0 && (correct / total) * 100 < 40).map(([topic, {correct, total}]) => (
                      <li key={topic} className="text-red-700">{topic}: {(correct / total * 100).toFixed(0)}%</li>
                    ))}
                    {Object.entries(performanceByTopic).filter(([_, {correct, total}]) => total > 0 && (correct / total) * 100 < 40).length === 0 && (
                      <li className="text-gray-500">No major gaps identified.</li>
                    )}
                  </ul>
                </div>
                <div className="flex flex-nowrap justify-center gap-6 mt-4 w-full overflow-x-auto">
                  <button onClick={() => setShowMicroLecture(true)} className="px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-medium">Continue</button>
                  <button onClick={handleRetake} className="px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-medium">Retake Assessment</button>
                  <button onClick={() => router.push('/welcome')} className="px-8 py-4 bg-gray-200 hover:bg-gray-300 rounded-full text-lg font-medium">Return Home</button>
                </div>
              </div>
            </div>
          )}

          {showSummary && showMicroLecture && (
            <div className="min-h-screen flex flex-col justify-center items-center">
              <div className="p-8 max-w-xl w-full bg-gray-100 shadow-xl rounded-lg text-center relative flex flex-col items-center">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Micro-Lecture</h2>
                <p className="mb-6 text-gray-700">{microLectureAI ?? microLecture}</p>
                <p className="mb-6 text-gray-900 font-semibold">Do you have a question?</p>
                <div className="flex justify-center gap-6 w-full">
                  <button onClick={() => setShowGoNext(true)} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-full text-lg text-gray-800">No</button>
                  <button onClick={async () => { await handleGenerateMicroLecture(); setShowGoNext(true); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-lg text-white">Yes</button>
                </div>
                {showGoNext && (
                  <div className="flex flex-col items-center mt-6 gap-4 w-full">
                  
                    <button onClick={() => router.push('/lecture2')} className="px-8 py-4 bg-green-600 text-white rounded-full text-lg font-medium">Go to Lecture Page</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {showPauseModal && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl text-center px-6 py-8 max-w-sm w-full">
                <h2 className="text-2xl font-bold mb-4">Assessment Paused</h2>
                <p className="text-gray-700 mb-6">Do you want to resume now?</p>
                <div className="flex justify-center space-x-4">
                  <button onClick={handleResume} className="px-6 py-3 bg-blue-600 text-white rounded-full">Resume</button>
                  <button onClick={() => setShowPauseModal(false)} className="px-6 py-3 bg-gray-300 rounded-full text-gray-800">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
