'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@supabase/auth-helpers-react'


interface Question {
 id: number
 text: string
 options: string[]
 correctIndex: number
}


const mockQuestions: Question[] = [
 { id: 1, text: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1 },
 { id: 2, text: 'What is 5 × 3?', options: ['8', '15', '10', '13'], correctIndex: 1 },
 { id: 3, text: 'What is √16?', options: ['2', '4', '8', '16'], correctIndex: 1 },
 { id: 4, text: 'What is 10 ÷ 2?', options: ['2', '5', '10', '12'], correctIndex: 1 },
 { id: 5, text: 'What is 3²?', options: ['6', '9', '12', '15'], correctIndex: 1 },
 { id: 6, text: 'What is 7 + 6?', options: ['11', '13', '14', '12'], correctIndex: 1 },
 { id: 7, text: 'What is 12 - 4?', options: ['6', '8', '10', '4'], correctIndex: 1 },
 { id: 8, text: 'What is 6 × 6?', options: ['36', '30', '12', '18'], correctIndex: 0 },
 { id: 9, text: 'What is 100 ÷ 25?', options: ['2', '3', '4', '5'], correctIndex: 2 },
 { id: 10, text: 'What is 9 + 10?', options: ['19', '21', '20', '15'], correctIndex: 0 },
]


export default function AssessmentEntry() {
 const router = useRouter()
 const session = useSession()


 const [showModal, setShowModal] = useState(false)
 const [assessmentTaken, setAssessmentTaken] = useState(false)
 const [inAssessment, setInAssessment] = useState(false)
 const [currentIndex, setCurrentIndex] = useState(0)
 const [selectedOption, setSelectedOption] = useState<number | null>(null)
 const [locked, setLocked] = useState(false)
 const [feedback, setFeedback] = useState('')
 const [correctCount, setCorrectCount] = useState(0)
 const [showSummary, setShowSummary] = useState(false)
 const [proficiencyLevel, setProficiencyLevel] = useState('')
 const [performanceAnalysis, setPerformanceAnalysis] = useState('')


 useEffect(() => {
   const taken = localStorage.getItem('assessment_taken') === 'true'
   setAssessmentTaken(taken)
   if (!taken) setShowModal(true)
 }, [])


 useEffect(() => {
   if (!session) return
   const taken = localStorage.getItem('assessment_taken') === 'true'
   if (!taken) setShowModal(true)
 }, [session])


 const handleTakeNow = () => {
   localStorage.setItem('assessment_taken', 'true')
   setAssessmentTaken(true)
   setShowModal(false)
   setInAssessment(true)
 }


 const handleSkip = () => {
   localStorage.setItem('assessment_taken', 'false')
   setShowModal(false)
 }


 const handleRetake = () => {
   const confirmRetake = confirm('This will erase your previous results and restart the assessment. Do you want to continue?')
   if (confirmRetake) {
     localStorage.setItem('assessment_taken', 'false')
     setAssessmentTaken(false)
     setInAssessment(true)
     setCurrentIndex(0)
     setFeedback('')
     setSelectedOption(null)
     setCorrectCount(0)
     setShowSummary(false)
   }
 }


 const currentQuestion = mockQuestions[currentIndex]


 const handleSubmit = () => {
   if (selectedOption === null) return
   setLocked(true)
   const isCorrect = selectedOption === currentQuestion.correctIndex
   if (isCorrect) setCorrectCount((prev) => prev + 1)
   setFeedback(isCorrect ? 'Correct!' : 'Incorrect')
   setTimeout(() => {
     if (currentIndex + 1 < mockQuestions.length) {
       setCurrentIndex(currentIndex + 1)
       setSelectedOption(null)
       setFeedback('')
       setLocked(false)
     } else {
       const label = getProficiencyLabel()
       setProficiencyLevel(label)
       const analysis = generatePerformanceAnalysis(label)
    setPerformanceAnalysis(analysis)
    localStorage.setItem('assessment_analysis', analysis)

       localStorage.setItem('assessment_level', label)
       setInAssessment(false)
       setShowSummary(true)
     }
   }, 1500)
 }


 const getProficiencyLabel = () => {
   const percent = correctCount / mockQuestions.length
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


 return (
   <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">


     {/* ----------------- MODAL ------------------- */}
     {showModal && (
       <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
         <div className="relative w-[90%] max-w-lg bg-white rounded-lg shadow-lg">
          
           {/* Header */}
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


           {/* Title + Math Symbols */}
           <div className="bg-gray-50 text-center px-6 py-4">
             <h3 className="text-xl font-semibold text-gray-900 mb-3">
               Want a personalized experience?
             </h3>
             <div className="text-4xl text-gray-700">
               ➕ ➖ ✖️ ➗
             </div>
           </div>


           {/* Body + Buttons */}
           <div className="bg-white text-center px-6 py-6 rounded-b-lg">
             <p className="text-[16px] text-gray-800 mb-6">
               Take a <span className="font-medium">quick math assessment</span> to match content to your level.
             </p>
             <div className="flex justify-center space-x-4">
               <button
                 onClick={handleSkip}
                 className="px-6 py-3 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-lg"
               >
                 Maybe Later
               </button>
               <button
                 onClick={handleTakeNow}
                 className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-lg"
               >
                 Take Assessment
               </button>
             </div>
           </div>
         </div>
       </div>
     )}


     {/* ----------------- MAIN CONTENT ------------------- */}
     {!inAssessment && !showSummary && (
       <div className="my-10">
         {!assessmentTaken ? (
           <button
             onClick={handleTakeNow}
             className="px-8 py-4 bg-green-600 text-white rounded-lg text-xl font-semibold"
           >
             Take Assessment
           </button>
         ) : (
           <button
             onClick={handleRetake}
             className="px-8 py-4 bg-yellow-500 text-white rounded-lg text-xl font-semibold"
           >
             Retake Assessment
           </button>
         )}
       </div>
     )}


     {/* ----------------- ASSESSMENT UI ------------------- */}
     {inAssessment && (
       <div className="p-8 max-w-xl w-full bg-white shadow-xl rounded-lg text-center">
         <h3 className="text-2xl font-medium mb-8 text-gray-800">
           Question {currentIndex + 1} of {mockQuestions.length}
         </h3>
         <p className="mb-6 font-medium text-xl text-gray-700">{currentQuestion.text}</p>
         <div className="space-y-4 mb-8">
           {currentQuestion.options.map((opt, i) => (
             <button
               key={i}
               disabled={locked}
               onClick={() => setSelectedOption(i)}
               className={`block w-full text-left px-6 py-4 rounded-lg border border-gray-300 shadow-md transition-colors ${
                 selectedOption === i ? 'bg-blue-100 text-gray-800' : 'bg-white text-gray-600 hover:bg-gray-100'
               }`}
             >
               {String.fromCharCode(65 + i)}. {opt}
             </button>
           ))}
         </div>
         <button
           onClick={handleSubmit}
           disabled={selectedOption === null || locked}
           className="mt-4 px-8 py-4 bg-blue-600 text-white rounded-lg disabled:opacity-50 text-lg"
         >
           Submit Answer
         </button>
         {feedback && <p className="mt-4 font-medium text-lg text-gray-600">{feedback}</p>}
       </div>
     )}


     {/* ----------------- SUMMARY ------------------- */}
     {showSummary && (
       <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-lg shadow-xl">
         <h2 className="text-3xl font-bold mb-4 text-gray-800">Assessment Complete</h2>
         <p className="mb-2 text-xl text-gray-700">Your proficiency level is:</p>
         <div className="text-4xl font-bold text-blue-600 mb-6">
           {proficiencyLevel}
         </div>
         <p className="text-lg text-gray-600 mb-6">{performanceAnalysis}</p>
         <button
           onClick={() => router.push('/courses/recommended')}
           className="px-8 py-4 bg-green-600 text-white text-lg font-medium rounded-lg"
         >
           Start Recommended Path
         </button>
       </div>
     )}
   </div>
 )
}


