"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@supabase/auth-helpers-react'
import { Pause } from 'lucide-react'
import { useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import dynamic from 'next/dynamic';
import Script from 'next/script';

// Declare MathJax global type
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
    };
  }
}


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
function GraphingTool({ value, onChange, disabled, func, showAnswer, questionText }: { value: Array<{x: number, y: number}>, onChange: (pts: Array<{x: number, y: number}>) => void, disabled: boolean, func?: (x: number) => number, showAnswer?: boolean, questionText?: string }) {
  const baseWidth = 300, baseHeight = 300;
  const [zoom, setZoom] = useState(1); // Zoom level: 1 = normal, 2 = zoomed in
  const width = baseWidth * zoom;
  const height = baseHeight * zoom;
  
  // Auto-detect drawing mode based on question text
  const isNumberLine = questionText?.toLowerCase().includes('number line');
  const isPointQuestion = questionText?.toLowerCase().includes('plot') || 
                          questionText?.toLowerCase().includes('point') || 
                          questionText?.toLowerCase().includes('mark') ||
                          questionText?.toLowerCase().includes('coordinate');
  
  const isLineQuestion = questionText?.toLowerCase().includes('y =') || 
                         questionText?.toLowerCase().includes('y=') ||
                         questionText?.toLowerCase().includes('function') ||
                         questionText?.toLowerCase().includes('draw the line') ||
                         questionText?.toLowerCase().includes('plot the line');
  
  // Determine appropriate grid size based on question type
  const getGridSize = () => {
    if (isNumberLine) return 40; // Larger grid for number line
    if (isPointQuestion) return 20; // Standard grid for point plotting
    if (isLineQuestion) return 30; // Medium grid for line drawing
    return 20; // Default grid size
  };
  
  const gridSize = getGridSize();
  
  // Only output debug information in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[GraphingTool] Mode detection:', {
      questionText,
      isNumberLine,
      isPointQuestion,
      isLineQuestion,
      gridSize
    });
  }
  const cellSize = baseWidth / gridSize; // Use baseWidth to keep cellSize constant regardless of zoom
  const centerX = gridSize / 2; // Center of the grid (x=0)
  const centerY = gridSize / 2; // Center of the grid (y=0)
  
  // Click handling is now done directly in the background rectangle onClick
  
  // Generate function curve points if func is provided and showAnswer is true
  const funcPoints = func && showAnswer ? Array.from({length: width}, (_, i) => {
    const mathX = (i / (cellSize * zoom)) - centerX;
    const mathY = func(mathX);
    const gridY = centerY - mathY;
    return { x: i, y: gridY * cellSize * zoom };
  }) : [];
  
  // Generate line points for user's drawn line - only for line questions
  const linePoints = (value.length >= 2 && isLineQuestion) ? value.map(pt => ({
    x: (pt.x + centerX) * cellSize * zoom,
    y: (centerY - pt.y) * cellSize * zoom
  })) : [];
  
  return (
    <div>
    <svg 
      width={width} 
      height={height} 
      style={{
        border: '1px solid #ccc', 
        background: '#f9f9f9', 
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'all'
      }} 
    >
      {/* Transparent background rectangle to ensure clicks work */}
      <rect 
        x="0" y="0" width={width} height={height} 
        fill="transparent" 
        style={{ pointerEvents: 'all' }}
        stroke="none"
        onClick={(e) => {
          e.stopPropagation();
          
          // Only output debug information in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log('[Background rect] Clicked at:', e.clientX, e.clientY);
            console.log('[Background rect] Component disabled:', disabled);
          }
          
          if (disabled) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Component is disabled, ignoring click');
            }
            return;
          }
          
          // Extract click coordinates
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          
          // Only output debug information in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log('Click coordinates:', { 
              clickX, 
              clickY, 
              rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
              svgSize: { width, height },
              cellSize,
              centerX,
              centerY
            });
          }
          
          // Convert to grid coordinates (account for zoom)
          const gridX = (clickX / zoom) / cellSize;
          const gridY = (clickY / zoom) / cellSize;
          
          // Convert to mathematical coordinates with better precision
          const mathX = Math.round((gridX - centerX) * 10) / 10; // Round to 1 decimal place
          let mathY = Math.round((centerY - gridY) * 10) / 10; // Round to 1 decimal place
          
          // For number line questions, snap y coordinate to 0
          if (isNumberLine) {
            mathY = 0;
          }
          
          // Debug coordinate conversion
          if (process.env.NODE_ENV === 'development') {
            console.log('Coordinate conversion debug:', {
              clickX, clickY,
              gridX, gridY,
              centerX, centerY,
              mathX, mathY,
              cellSize, zoom,
              isNumberLine
            });
            
            console.log('Mathematical coordinates:', { mathX, mathY, isNumberLine, gridX, gridY, centerX, centerY });
          }
          
          // Check if clicking on an existing point to remove it
          const clickedPointIndex = value.findIndex(pt => {
            const pointGridX = pt.x + centerX;
            const pointGridY = isNumberLine ? centerY : centerY - pt.y;
            const pointScreenX = pointGridX * cellSize * zoom;
            const pointScreenY = pointGridY * cellSize * zoom;
            // Use tolerance for click detection (adjust based on question type)
            const tolerance = isNumberLine ? 25 : 20; // Larger tolerance for number line
            const distance = Math.sqrt(Math.pow(pointScreenX - clickX, 2) + Math.pow(pointScreenY - clickY, 2));
            if (process.env.NODE_ENV === 'development') {
              console.log(`Point ${pt.x},${pt.y} screen: ${pointScreenX},${pointScreenY}, click: ${clickX},${clickY}, distance: ${distance}, tolerance: ${tolerance}`);
            }
            return distance < tolerance;
          });
          
          if (clickedPointIndex !== -1) {
            // Remove the clicked point
            const newPoints = value.filter((_, idx) => idx !== clickedPointIndex);
            onChange(newPoints);
            if (process.env.NODE_ENV === 'development') {
              console.log('Removed point at index:', clickedPointIndex);
            }
          } else {
            // Add new point if not clicking on existing point
            // Use tolerance for decimal coordinate comparison (adjust based on question type)
            const tolerance = isNumberLine ? 0.5 : 0.3; // Larger tolerance for number line
            const pointExists = value.some(pt => 
              Math.abs(pt.x - mathX) < tolerance && Math.abs(pt.y - mathY) < tolerance
            );
            
            if (!pointExists) {
              const newPoint = {x: mathX, y: mathY};
              onChange([...value, newPoint]);
              if (process.env.NODE_ENV === 'development') {
                console.log('Added new point:', newPoint, 'Total points now:', value.length + 1);
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('Point already exists at:', {x: mathX, y: mathY});
              }
            }
          }
          
          // Add visual feedback
          const svgElement = e.currentTarget.parentElement as unknown as SVGSVGElement;
          if (svgElement) {
            svgElement.style.background = '#e0e0e0';
            setTimeout(() => {
              svgElement.style.background = '#f9f9f9';
            }, 100);
          }
        }}
      />
      
      {isNumberLine ? (
        // Number line mode - only show horizontal line
        <>
          {/* Draw horizontal number line */}
          <line x1={0} y1={centerY * cellSize * zoom} x2={width} y2={centerY * cellSize * zoom} stroke="#888" strokeWidth={3} pointerEvents="none" />
          
          {/* Draw tick marks on number line */}
          {[...Array(gridSize + 1)].map((_, i) => {
            const coord = i - centerX;
            return (
              <g key={`tick-${i}`} pointerEvents="none">
                <line 
                  x1={i * cellSize * zoom} 
                  y1={centerY * cellSize * zoom - 5} 
                  x2={i * cellSize * zoom} 
                  y2={centerY * cellSize * zoom + 5} 
                  stroke="#666" 
                  strokeWidth={1} 
                />
                {/* Show more numbers for number line */}
                {(coord % 1 === 0) && (
                  <text x={i * cellSize * zoom} y={centerY * cellSize * zoom + 20} fontSize="12" fill="#333" textAnchor="middle">{coord}</text>
                )}
              </g>
            );
          })}
          
          {/* Number line label */}
          <text x={width - 20} y={centerY * cellSize * zoom - 10} fontSize="14" fill="#333" fontWeight="bold" pointerEvents="none">Number Line</text>
        </>
      ) : (
        // Regular coordinate grid mode
        <>
          {/* Draw grid */}
          {[...Array(gridSize + 1)].map((_, i) => (
            <g key={i} pointerEvents="none">
              <line x1={i * cellSize * zoom} y1={0} x2={i * cellSize * zoom} y2={height} stroke="#ddd" />
              <line x1={0} y1={i * cellSize * zoom} x2={width} y2={i * cellSize * zoom} stroke="#ddd" />
            </g>
          ))}
          
          {/* Draw axes at center */}
          <line x1={centerX * cellSize * zoom} y1={0} x2={centerX * cellSize * zoom} y2={height} stroke="#888" strokeWidth={2} pointerEvents="none" /> {/* y-axis */}
          <line x1={0} y1={centerY * cellSize * zoom} x2={width} y2={centerY * cellSize * zoom} stroke="#888" strokeWidth={2} pointerEvents="none" /> {/* x-axis */}
          
          {/* Axis labels */}
          <text x={width - 20} y={centerY * cellSize * zoom - 5} fontSize="12" fill="#333" pointerEvents="none">x</text>
          <text x={centerX * cellSize * zoom + 5} y={15} fontSize="12" fill="#333" pointerEvents="none">y</text>
        </>
      )}
        
        {/* Draw coordinate numbers - only show major coordinates (not in number line mode) */}
        {!isNumberLine && [...Array(gridSize + 1)].map((_, i) => {
          const coord = i - centerX;
          if (coord !== 0 && coord % 5 === 0) {
            return (
              <g key={`coord-${i}`} pointerEvents="none">
                <text x={i * cellSize * zoom + 2} y={centerY * cellSize * zoom + 15} fontSize="10" fill="#666">{coord}</text>
                <text x={centerX * cellSize * zoom - 15} y={height - i * cellSize * zoom + 5} fontSize="10" fill="#666">{coord}</text>
              </g>
            );
          }
          return null;
        })}
        
        {/* Draw user's line connecting points - only for line questions */}
        {linePoints.length >= 2 && isLineQuestion && (
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            points={linePoints.map(pt => `${pt.x},${pt.y}`).join(' ')}
            pointerEvents="none"
          />
        )}
        
      {/* Only show function curve if showAnswer is true */}
      {func && showAnswer && (
        <polyline
          fill="none"
          stroke="#f59e42"
          strokeWidth={2}
          points={funcPoints.map(pt => `${pt.x},${pt.y}`).join(' ')}
          pointerEvents="none"
        />
      )}
        
              {/* Draw points */}
        {value.map((pt, idx) => {
          const screenX = (pt.x + centerX) * cellSize * zoom;
          const screenY = isNumberLine ? centerY * cellSize * zoom : (centerY - pt.y) * cellSize * zoom;
          
          console.log(`Point ${idx} display:`, {
            mathCoords: pt,
            screenCoords: { x: screenX, y: screenY },
            centerX, centerY, cellSize,
            gridSize, zoom,
            isNumberLine
          });
          
          return (
            <circle 
              key={idx} 
              cx={screenX} 
              cy={screenY} 
              r={6} 
              fill="#2563eb"
              style={{ cursor: 'pointer' }}
              pointerEvents="all"
            />
          );
        })}
    </svg>
      <div className="mt-2 flex justify-center space-x-2">
        {/* Zoom controls */}
        <button
          onClick={() => {
            console.log('Zoom out clicked, current zoom:', zoom);
            setZoom(1);
          }}
          className={`p-2 rounded-lg transition-colors ${
            zoom === 1 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          disabled={disabled}
          title="Zoom Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
          </svg>
        </button>
        <button
          onClick={() => {
            console.log('Zoom in clicked, current zoom:', zoom);
            setZoom(2);
          }}
          className={`p-2 rounded-lg transition-colors ${
            zoom === 2 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          disabled={disabled}
          title="Zoom In"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
        </button>
        
        {/* Drawing mode indicator */}
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">
          {isNumberLine ? 'Click to Add Points on Number Line' : 
           isPointQuestion ? 'Click to Plot Points' :
           isLineQuestion ? 'Click to Draw Line Points' :
           'Click to Add Points'}
        </div>
      </div>
    </div>
  );
}



// Function to render LaTeX math expressions
function renderMathExpression(text: string | number): string {
  if (!text) return String(text || '');
  
  // Ensure input is a string
  const textStr = String(text);
  
  // Only output debug information in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[renderMathExpression] Original text:', textStr);
  }
  
  // Enhanced LaTeX processing
  let processedText = textStr
    // Convert \frac{numerator}{denominator} to simple fraction format
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    // Handle vectors and bold symbols
    .replace(/\\mathbf\{([^}]+)\}/g, '$1') // Remove \mathbf{} wrapper
    .replace(/\\vec\{([^}]+)\}/g, '$1') // Remove \vec{} wrapper
    .replace(/\\overrightarrow\{([^}]+)\}/g, '$1') // Remove \overrightarrow{} wrapper
    // Handle common math symbols
    .replace(/\\cdot/g, '×') // Replace \cdot with ×
    .replace(/\\times/g, '×') // Replace \times with ×
    .replace(/\\div/g, '÷') // Replace \div with ÷
    .replace(/\\pm/g, '±') // Replace \pm with ±
    .replace(/\\mp/g, '∓') // Replace \mp with ∓
    .replace(/\\leq/g, '≤') // Replace \leq with ≤
    .replace(/\\geq/g, '≥') // Replace \geq with ≥
    .replace(/\\neq/g, '≠') // Replace \neq with ≠
    .replace(/\\approx/g, '≈') // Replace \approx with ≈
    .replace(/\\infty/g, '∞') // Replace \infty with ∞
    .replace(/\\pi/g, 'π') // Replace \pi with π
    .replace(/\\theta/g, 'θ') // Replace \theta with θ
    .replace(/\\alpha/g, 'α') // Replace \alpha with α
    .replace(/\\beta/g, 'β') // Replace \beta with β
    .replace(/\\gamma/g, 'γ') // Replace \gamma with γ
    .replace(/\\delta/g, 'δ') // Replace \delta with δ
    .replace(/\\sum/g, '∑') // Replace \sum with ∑
    .replace(/\\prod/g, '∏') // Replace \prod with ∏
    .replace(/\\int/g, '∫') // Replace \int with ∫
    // Handle subscripts and superscripts
    .replace(/\^(\d+)/g, '^$1') // Keep superscripts
    .replace(/_(\d+)/g, '_$1') // Keep subscripts
    // Convert other LaTeX delimiters
    .replace(/\\\(/g, '')  // Remove \(
    .replace(/\\\)/g, '')  // Remove \)
    .replace(/\\\[/g, '')  // Remove \[
    .replace(/\\\]/g, '')  // Remove \]
    // Preserve actual dollar signs by escaping them temporarily
    .replace(/\$/g, 'DOLLAR_SIGN')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
    
  // Restore dollar signs
  processedText = processedText.replace(/DOLLAR_SIGN/g, '$');
  
  // Only output debug information in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[renderMathExpression] Processed text:', processedText);
    
    // Test: log if we have dollar signs in the result
    if (processedText.includes('$')) {
      console.log('[renderMathExpression] Found dollar signs in result:', processedText);
    }
  }
  
  return processedText;
}

// Function to clean up malformed LaTeX expressions
function cleanLatexExpression(text: string): string {
  if (!text) return text;
  
  // Only output debug information in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[cleanLatexExpression] Input:', text);
  }
  
  let cleaned = text
    // Fix common LaTeX formatting issues
    .replace(/\\text\{([^}]+)\}/g, '$1') // Remove \text{} wrapper
    .replace(/\\mathrm\{([^}]+)\}/g, '$1') // Remove \mathrm{} wrapper
    .replace(/\\left\(/g, '(') // Replace \left( with (
    .replace(/\\right\)/g, ')') // Replace \right) with )
    .replace(/\\left\[/g, '[') // Replace \left[ with [
    .replace(/\\right\]/g, ']') // Replace \right] with ]
    .replace(/\\cdot/g, '×') // Replace \cdot with ×
    .replace(/\\times/g, '×') // Replace \times with ×
    .replace(/\\div/g, '÷') // Replace \div with ÷
    .replace(/\\pm/g, '±') // Replace \pm with ±
    // Fix spacing issues
    .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 + $2') // Fix addition spacing
    .replace(/(\d+)\s*-\s*(\d+)/g, '$1 - $2') // Fix subtraction spacing
    .replace(/(\d+)\s*×\s*(\d+)/g, '$1 × $2') // Fix multiplication spacing
    .replace(/(\d+)\s*÷\s*(\d+)/g, '$1 ÷ $2') // Fix division spacing
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // Only output debug information in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[cleanLatexExpression] Output:', cleaned);
  }
  return cleaned;
}



// Function to parse numeric answers (supports fractions and decimals)
function parseNumericAnswer(answer: string | number): number {
  // Only output debug information in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseNumericAnswer] Input:', answer, 'Type:', typeof answer);
  }
  
  if (typeof answer === 'number') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[parseNumericAnswer] Number input, returning:', answer);
    }
    return answer;
  }
  
  if (typeof answer !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[parseNumericAnswer] Non-string input, converting to string');
    }
    answer = String(answer);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseNumericAnswer] Processing string:', answer);
  }
  
  // Handle fractions (e.g., "5/8", "3/4")
  const fractionMatch = answer.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    const result = numerator / denominator;
    if (process.env.NODE_ENV === 'development') {
      console.log('[parseNumericAnswer] Fraction detected:', answer, '=', result);
    }
    return result;
  }
  
  // Handle mixed numbers (e.g., "1 3/4", "2 1/2")
  const mixedNumberMatch = answer.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedNumberMatch) {
    const whole = parseInt(mixedNumberMatch[1]);
    const numerator = parseInt(mixedNumberMatch[2]);
    const denominator = parseInt(mixedNumberMatch[3]);
    const result = whole + (numerator / denominator);
    if (process.env.NODE_ENV === 'development') {
      console.log('[parseNumericAnswer] Mixed number detected:', answer, '=', result);
    }
    return result;
  }
  
  // Handle decimal numbers
  const decimalMatch = answer.match(/^-?\d*\.?\d+$/);
  if (decimalMatch) {
    const result = parseFloat(answer);
    if (process.env.NODE_ENV === 'development') {
      console.log('[parseNumericAnswer] Decimal detected:', answer, '=', result);
    }
    return result;
  }
  
  // Handle integers
  const integerMatch = answer.match(/^-?\d+$/);
  if (integerMatch) {
    const result = parseInt(answer);
    if (process.env.NODE_ENV === 'development') {
      console.log('[parseNumericAnswer] Integer detected:', answer, '=', result);
    }
    return result;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[parseNumericAnswer] No valid format detected, returning 0');
  }
  return 0;
}

// Function to convert answer to LaTeX format for backend compatibility
function convertToLatexFormat(answer: string | number): string {
  if (process.env.NODE_ENV === 'development') {
    console.log('[convertToLatexFormat] Input:', answer, 'Type:', typeof answer);
  }
  
  if (typeof answer === 'number') {
    return String(answer);
  }
  
  if (typeof answer !== 'string') {
    answer = String(answer);
  }
  
  // Handle fractions (e.g., "5/8" -> "\frac{5}{8}")
  const fractionMatch = answer.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = fractionMatch[1];
    const denominator = fractionMatch[2];
    const latexFormat = `\\frac{${numerator}}{${denominator}}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('[convertToLatexFormat] Fraction converted:', answer, '->', latexFormat);
    }
    return latexFormat;
  }
  
  // Handle mixed numbers (e.g., "1 3/4" -> "1\frac{3}{4}")
  const mixedNumberMatch = answer.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedNumberMatch) {
    const whole = mixedNumberMatch[1];
    const numerator = mixedNumberMatch[2];
    const denominator = mixedNumberMatch[3];
    const latexFormat = `${whole}\\frac{${numerator}}{${denominator}}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('[convertToLatexFormat] Mixed number converted:', answer, '->', latexFormat);
    }
    return latexFormat;
  }
  
  // For other formats, return as is
  if (process.env.NODE_ENV === 'development') {
    console.log('[convertToLatexFormat] No conversion needed, returning:', answer);
  }
  return answer;
}

async function fetchMicroLecture(question: string, answer: string): Promise<string> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mathgptdevs25.pythonanywhere.com';
  const feedbackUrl = `${apiBaseUrl}/skill_assessment/submit_feedback?ts=${Date.now()}`;
  
  try {
    const response = await fetch(feedbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.error('[fetchMicroLecture] HTTP error:', response.status, response.statusText);
      return "Unable to generate micro-lecture. Please try again.";
    }
    
    const data = await response.json();
    return data.micro_lecture || "No micro-lecture available.";
    
  } catch (error) {
    console.error('[fetchMicroLecture] Error:', error);
    return "Error generating micro-lecture. Please try again.";
  }
}

async function fetchDiagnosticQuestions(topic: string, grade: string = 'K-12', numQuestions: number = 3, student_id?: number) {
  console.log('[fetchDiagnosticQuestions] topic:', topic, 'grade:', grade, 'numQuestions:', numQuestions, 'student_id:', student_id);
  
      // Step 1: Generate diagnostic questions using diagnostic_test endpoint
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mathgptdevs25.pythonanywhere.com';
    const diagnosticUrl = `${apiBaseUrl}/skill_assessment/diagnostic_test?ts=${Date.now()}`;
  const diagnosticBody = JSON.stringify({ topic, grade, numQuestions, student_id });
  
  console.log('[fetchDiagnosticQuestions] Diagnostic URL:', diagnosticUrl);
  console.log('[fetchDiagnosticQuestions] Diagnostic body:', diagnosticBody);
  
  try {
    console.log('[fetchDiagnosticQuestions] Starting diagnostic fetch...');
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const diagnosticRes = await fetch(diagnosticUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: diagnosticBody,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });
    
    clearTimeout(timeoutId);
    
    console.log('[fetchDiagnosticQuestions] diagnostic fetch status:', diagnosticRes.status);
    console.log('[fetchDiagnosticQuestions] diagnostic fetch ok:', diagnosticRes.ok);
    
    if (!diagnosticRes.ok) {
      console.error('[fetchDiagnosticQuestions] Diagnostic HTTP error:', diagnosticRes.status, diagnosticRes.statusText);
      return { diagnosticData: {}, pickData: {} };
    }
    
    const diagnosticText = await diagnosticRes.text();
    console.log('[fetchDiagnosticQuestions] diagnostic raw text:', diagnosticText);
    
    let diagnosticData = {};
    try {
      diagnosticData = JSON.parse(diagnosticText);
      console.log('[fetchDiagnosticQuestions] parsed diagnostic data:', diagnosticData);
    } catch (e) {
      console.error('[fetchDiagnosticQuestions] diagnostic parse error:', e, 'text:', diagnosticText);
      return { diagnosticData: {}, pickData: {} };
    }
    
          // Step 2: Now fetch questions using pick_problem endpoint
      const pickUrl = `${apiBaseUrl}/skill_assessment/pick_problem?ts=${Date.now()}`;
    const pickBody = JSON.stringify({ student_id });
    
    console.log('[fetchDiagnosticQuestions] Pick URL:', pickUrl);
    console.log('[fetchDiagnosticQuestions] Pick body:', pickBody);
    
    const pickRes = await fetch(pickUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: pickBody,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });
    
    console.log('[fetchDiagnosticQuestions] pick fetch status:', pickRes.status);
    console.log('[fetchDiagnosticQuestions] pick fetch ok:', pickRes.ok);
    
    if (!pickRes.ok) {
      console.error('[fetchDiagnosticQuestions] Pick HTTP error:', pickRes.status, pickRes.statusText);
      return { diagnosticData: {}, pickData: {} };
    }
    
    const pickText = await pickRes.text();
    console.log('[fetchDiagnosticQuestions] pick raw text:', pickText);
    
    let pickData = {};
    try {
      pickData = JSON.parse(pickText);
      console.log('[fetchDiagnosticQuestions] parsed pick data:', pickData);
    } catch (e) {
      console.error('[fetchDiagnosticQuestions] pick parse error:', e, 'text:', pickText);
      return { diagnosticData: {}, pickData: {} };
    }
    
    // Return both diagnostic data (with count) and pick data
    return {
      diagnosticData,
      pickData
    };
    
  } catch (err: any) {
    console.error('[fetchDiagnosticQuestions] fetch error:', err);
    console.error('[fetchDiagnosticQuestions] error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    // Check if it's a timeout error
    if (err.name === 'AbortError') {
      console.error('[fetchDiagnosticQuestions] Request timed out after 30 seconds');
    }
    
    return { diagnosticData: {}, pickData: {} };
  }
}

export default function AssessmentEntry() {
  const { user } = useContext(AuthContext) as any;
  
  // Debug: Check if environment variable is loaded
  // API Base URL for debugging
  // console.log('[AssessmentEntry] API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
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
  const [isGeneratingLecture, setIsGeneratingLecture] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Wrong questions and corresponding micro lecture state
  const [wrongQuestions, setWrongQuestions] = useState<Array<{
    questionIndex: number;
    question: Question;
    studentAnswer: string;
    microLecture: string | null;
    isGenerating: boolean;
  }>>([]);
  const [currentWrongQuestionIndex, setCurrentWrongQuestionIndex] = useState(0);
  
  // Store all student answers for each question
  const [studentAnswers, setStudentAnswers] = useState<Array<{
    questionIndex: number;
    answer: string;
  }>>([]);

  // Change timer state to always be a number
  const [timer, setTimer] = useState(() => parseInt(settings.timePerItem) || 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. On assessment start, fetch personalization info and filter questions
  const [personalization, setPersonalization] = useState<{age?: number, grade?: string, topic?: string} | null>(null);
  const [topic] = useState(''); // Empty string to trigger grade-based multi-topic generation
  const [grade] = useState('K-12'); 
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  // Add total question count state
  const [totalQuestionCount, setTotalQuestionCount] = useState<number>(0);
  // Add answered questions count state
  const [answeredQuestionsCount, setAnsweredQuestionsCount] = useState<number>(0);

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
    if (!inAssessment || questions.length === 0 || currentIndex >= questions.length) return;
    setTimer(parseInt(settings.timePerItem) || 60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit or skip
          if (questions.length > 0 && currentIndex < questions.length) {
            const currentQuestion = questions[currentIndex];
            const hasAnswer = selectedOption !== null && selectedOption !== '';
            const hasConfidence = selectedConfidence !== null;
            const isGraphQuestion = currentQuestion?.type === 'graph';
            
            // For graph questions, only need selectedOption
            // For other questions, need both selectedOption and selectedConfidence
            if (hasAnswer && (isGraphQuestion || hasConfidence)) {
              handleSubmit();
            } else {
              // Skip: move to next question or finish assessment
              if (totalQuestionCount > 0 && answeredQuestionsCount >= totalQuestionCount) {
                // Reached question limit, finish assessment
                finishAssessment();
              } else if (currentIndex + 1 < questions.length) {
                // Move to next question
                setCurrentIndex(currentIndex + 1);
                setSelectedOption(null);
                setSelectedConfidence(null);
                setFeedback('');
                setLocked(false);
              } else {
                // No more questions available, finish assessment
                finishAssessment();
              }
            }
          } else {
            console.warn('[Timer] No questions available or invalid currentIndex, skipping auto-submit');
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
  useEffect(() => { 
    setGraphPoints([]); 
    // Also reset selectedOption for graph questions to ensure clean state
    if (questions[currentIndex] && questions[currentIndex].type === 'graph') {
      setSelectedOption(null);
    }
  }, [currentIndex, inAssessment]);

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
    
    // Collect all wrong questions
    const wrongQuestionsList: Array<{
      questionIndex: number;
      question: Question;
      studentAnswer: string;
      microLecture: string | null;
      isGenerating: boolean;
    }> = [];
    
    // Iterate through all answered questions to find wrong ones
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const isCorrect = correctnessArr[i];
      
      if (!isCorrect && question) {
        // Find stored student answer for this question
        const storedAnswer = studentAnswers.find(ans => ans.questionIndex === i);
        const studentAnswer = storedAnswer ? storedAnswer.answer : 'No answer recorded';
        
        wrongQuestionsList.push({
          questionIndex: i,
          question: question,
          studentAnswer: studentAnswer,
          microLecture: null,
          isGenerating: false
        });
      }
    }
    
    setWrongQuestions(wrongQuestionsList);
    setCurrentWrongQuestionIndex(0);
    
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
      const response = await fetchDiagnosticQuestions(topic, grade, Number(settings.numQuestions) || 3, user?.id);
      console.log('[handleTakeNow] Received response:', response);
      
      if (!response || Object.keys(response).length === 0) {
        console.error('[handleTakeNow] No response received');
        alert('Failed to fetch questions. Please try again.');
        return;
      }
      
      // Extract diagnostic data and question data
      const { diagnosticData, pickData } = response;
      
      // Set total question count
      if (diagnosticData && (diagnosticData as any).count) {
        setTotalQuestionCount((diagnosticData as any).count);
        console.log('[handleTakeNow] Total question count set to:', (diagnosticData as any).count);
      }
      
      // Check if assessment is completed
      if ((pickData as any).status === 'completed') {
        console.log('[handleTakeNow] Assessment completed');
        setShowSummary(true);
        setLoading(false);
        return;
      }
      
            // Only set total question count, don't preload all questions
      // Keep adaptive logic, get next question from backend each time
      
      // If no questions in diagnosticData, handle single question from pick_problem response
      if ((pickData as any).problem && (pickData as any).subtopic) {
        const problem = (pickData as any).problem;
        const subtopic = (pickData as any).subtopic;
        
        console.log('[handleTakeNow] Processing single problem:', problem);
        
        // Enhanced MCQ parsing with better error handling
        let correctIndex: number | undefined = undefined;
        if (problem.options && problem.correct_answer) {
          // Try exact string match first
          correctIndex = problem.options.indexOf(problem.correct_answer);
          
          // If not found, try case-insensitive match
          if (correctIndex === -1) {
            correctIndex = problem.options.findIndex(opt => 
              opt.toLowerCase() === problem.correct_answer.toLowerCase()
            );
          }
          
          // If still not found, try numeric comparison
          if (correctIndex === -1) {
            correctIndex = problem.options.findIndex(opt => {
              const optNum = parseFloat(opt);
              const answerNum = parseFloat(problem.correct_answer);
              return !isNaN(optNum) && !isNaN(answerNum) && optNum === answerNum;
            });
          }
        }
        
        console.log('[handleTakeNow] Enhanced MCQ parsing:', {
          question: problem.question,
          options: problem.options,
          correct_answer: problem.correct_answer,
          calculatedCorrectIndex: correctIndex,
          found: correctIndex !== -1,
          answerType: typeof problem.correct_answer,
          optionsTypes: problem.options?.map((opt: any) => typeof opt)
        });
        
        // Validate that we found the correct answer in options
        if (problem.options && problem.correct_answer && correctIndex === -1) {
          console.warn('[handleTakeNow] WARNING: Correct answer not found in options:', {
            correct_answer: problem.correct_answer,
            correctAnswerType: typeof problem.correct_answer,
            options: problem.options,
            optionsTypes: problem.options.map((opt: any) => typeof opt)
          });
        }
        
        // Determine question type based on content and backend type
        let questionType = 'numeric'; // default
        
        if (problem.options && Array.isArray(problem.options) && problem.options.length > 0) {
          questionType = 'mcq';
        } else if (typeof problem.type === 'string' && ['mcq', 'numeric', 'proof', 'graph'].includes(problem.type)) {
          questionType = problem.type;
        } else {
          // Infer type from question content
          const questionText = problem.question.toLowerCase();
          if (questionText.includes('explain') || questionText.includes('why') || questionText.includes('prove')) {
            questionType = 'proof';
          } else if (questionText.includes('plot') || questionText.includes('graph') || questionText.includes('number line')) {
            questionType = 'graph';
          } else if (problem.options && problem.options.length > 0) {
            questionType = 'mcq';
          } else {
            questionType = 'numeric';
          }
        }
        
        console.log('[handleTakeNow] Question type determination:', {
          question: problem.question,
          backendType: problem.type,
          inferredType: questionType,
          hasOptions: !!problem.options,
          optionsLength: problem.options?.length,
          answer: problem.correct_answer
        });
        
        // Extract main topic from subtopic (e.g., "Addition > Whole Numbers > Estimation" -> "Addition")
        const mainTopic = subtopic.split(' > ')[0];
        
        // Create question object for the single problem
        const questionObj = {
          id: problem.id, // Use the real problem ID from backend
          text: problem.question,
          type: questionType as 'mcq' | 'numeric' | 'proof' | 'graph',
          topic: mainTopic, // Use main topic instead of full subtopic
          difficulty: problem.difficulty,
          options: problem.options,
          correctIndex: correctIndex !== -1 ? correctIndex : undefined,
          answer: problem.correct_answer
        };
        
        console.log('[handleTakeNow] Created question object:', questionObj);
        setQuestions([questionObj]);
        
        // Initialize correctnessArr for the first question
        setCorrectnessArr([false]);
        
        setInAssessment(true);
      }
    } catch (e) {
      console.error('[handleTakeNow] Error:', e);
      alert('Failed to fetch questions. Please check your internet connection and try again.');
    }
    setLoading(false);
  };

  const handleRetake = async () => {
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
      setLocked(false);
      setTotalQuestionCount(0); // Reset total question count
      setAnsweredQuestionsCount(0); // Reset answered questions count
      
      // Reset wrong questions state
      setWrongQuestions([]);
      setCurrentWrongQuestionIndex(0);
      setStudentAnswers([]);
      
      // Reset correctnessArr
      setCorrectnessArr([]);
      
      // Clear questions array
      setQuestions([]);
      
      // Re-fetch questions for retake
      setLoading(true);
      try {
        const response = await fetchDiagnosticQuestions(topic, grade, Number(settings.numQuestions) || 3, user?.id);
        console.log('[handleRetake] Received response:', response);
        
        if (!response || Object.keys(response).length === 0) {
          console.error('[handleRetake] No response received');
          alert('Failed to fetch questions. Please try again.');
          return;
        }
        
        // Extract diagnostic data and question data
        const { diagnosticData, pickData } = response;
        
        // Set total question count
        if (diagnosticData && (diagnosticData as any).count) {
          setTotalQuestionCount((diagnosticData as any).count);
          console.log('[handleRetake] Total question count set to:', (diagnosticData as any).count);
        }
        
        // Check if assessment is completed
        if ((pickData as any).status === 'completed') {
          console.log('[handleRetake] Assessment completed');
          setShowSummary(true);
          setLoading(false);
          return;
        }
        
        // If no questions in diagnosticData, handle single question from pick_problem response
        if ((pickData as any).problem && (pickData as any).subtopic) {
          const problem = (pickData as any).problem;
          const subtopic = (pickData as any).subtopic;
          
          console.log('[handleRetake] Processing single problem:', problem);
          
          // Enhanced MCQ parsing with better error handling
          let correctIndex: number | undefined = undefined;
          if (problem.options && problem.correct_answer) {
            // Try exact string match first
            correctIndex = problem.options.indexOf(problem.correct_answer);
            
            // If not found, try case-insensitive match
            if (correctIndex === -1) {
              correctIndex = problem.options.findIndex(opt => 
                opt.toLowerCase() === problem.correct_answer.toLowerCase()
              );
            }
            
            // If still not found, try numeric comparison
            if (correctIndex === -1) {
              correctIndex = problem.options.findIndex(opt => {
                const optNum = parseFloat(opt);
                const answerNum = parseFloat(problem.correct_answer);
                return !isNaN(optNum) && !isNaN(answerNum) && optNum === answerNum;
              });
            }
          }
          
          console.log('[handleRetake] Enhanced MCQ parsing:', {
            question: problem.question,
            options: problem.options,
            correct_answer: problem.correct_answer,
            calculatedCorrectIndex: correctIndex,
            found: correctIndex !== -1,
            answerType: typeof problem.correct_answer,
            optionsTypes: problem.options?.map((opt: any) => typeof opt)
          });
          
          // Validate that we found the correct answer in options
          if (problem.options && problem.correct_answer && correctIndex === -1) {
            console.warn('[handleRetake] WARNING: Correct answer not found in options:', {
              correct_answer: problem.correct_answer,
              correctAnswerType: typeof problem.correct_answer,
              options: problem.options,
              optionsTypes: problem.options.map((opt: any) => typeof opt)
            });
          }
          
          // Determine question type based on content and backend type
          let questionType = 'numeric'; // default
          
          if (problem.options && Array.isArray(problem.options) && problem.options.length > 0) {
            questionType = 'mcq';
          } else if (problem.type === 'graph') {
            questionType = 'graph';
          } else if (problem.type === 'proof') {
            questionType = 'proof';
          } else if (problem.type === 'numeric') {
            questionType = 'numeric';
          }
          
          console.log('[handleRetake] Question type determination:', {
            question: problem.question,
            backendType: problem.type,
            inferredType: questionType,
            hasOptions: !!problem.options,
            optionsLength: problem.options?.length,
            answer: problem.correct_answer
          });
          
          // Extract main topic from subtopic (e.g., "Addition > Whole Numbers > Estimation" -> "Addition")
          const mainTopic = subtopic.split(' > ')[0];
          
          // Create question object for the single problem
          const questionObj = {
            id: problem.id, // Use the real problem ID from backend
            text: problem.question,
            type: questionType as 'mcq' | 'numeric' | 'proof' | 'graph',
            topic: mainTopic, // Use main topic instead of full subtopic
            difficulty: problem.difficulty,
            options: problem.options,
            correctIndex: correctIndex !== -1 ? correctIndex : undefined,
            answer: problem.correct_answer
          };
          
          console.log('[handleRetake] Created question object:', questionObj);
          setQuestions([questionObj]);
          
          // Initialize correctnessArr for the first question
          setCorrectnessArr([false]);
          
          setInAssessment(true);
        }
      } catch (e) {
        console.error('[handleRetake] Error:', e);
        alert('Failed to fetch questions. Please check your internet connection and try again.');
      }
      setLoading(false);
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
    // Prevent duplicate submissions
    if (locked) {
      console.log('[handleSubmit] Already submitting, ignoring duplicate click');
      return;
    }
    
    const currentQuestion = questions[currentIndex];
    
    // Check if currentQuestion exists before proceeding
    if (!currentQuestion) {
      console.warn('[handleSubmit] No current question found, skipping submit');
      return;
    }
    
    // For graph questions, we only need selectedOption (no confidence required)
    if (currentQuestion.type === 'graph' && selectedOption === null) return;
    // For non-graph questions, we need both selectedOption and selectedConfidence
    if (currentQuestion.type !== 'graph' && (selectedOption === null || selectedConfidence === null)) return;
    
    // Set locked immediately to prevent duplicate submissions
    setLocked(true);

    // Debug logging
    console.log('[handleSubmit] Debug info:', {
      questionType: currentQuestion.type,
      selectedOption: selectedOption,
      selectedOptionType: typeof selectedOption,
      selectedOptionIsArray: Array.isArray(selectedOption),
      graphPoints: graphPoints,
      graphPointsIsArray: Array.isArray(graphPoints),
      correctIndex: currentQuestion.correctIndex,
      correctIndexType: typeof currentQuestion.correctIndex,
      answer: currentQuestion.answer,
      answerType: typeof currentQuestion.answer,
      options: currentQuestion.options,
      questionText: currentQuestion.text
    });

    // Prepare student answer for backend validation
    let studentAnswer = '';
    if (currentQuestion.type === 'mcq') {
      // For MCQ, send the selected option text
      if (currentQuestion.options && typeof selectedOption === 'number') {
        studentAnswer = currentQuestion.options[selectedOption];
      } else {
        studentAnswer = String(selectedOption);
      }
    } else if (currentQuestion.type === 'numeric') {
      // For numeric, send the raw input
      studentAnswer = String(selectedOption);
    } else if (currentQuestion.type === 'proof') {
      // For proof, send the text answer
      studentAnswer = String(selectedOption);
    } else if (currentQuestion.type === 'graph') {
      // For graph, send the points as JSON string
      const userPoints = Array.isArray(selectedOption) ? selectedOption : Array.isArray(graphPoints) ? graphPoints : [];
      studentAnswer = JSON.stringify(userPoints);
    }

    console.log('[handleSubmit] Student answer prepared for backend:', {
      questionType: currentQuestion.type,
      studentAnswer,
      originalSelectedOption: selectedOption
    });
    
    // Store student answer for this question
    setStudentAnswers(prev => {
      const existing = prev.find(ans => ans.questionIndex === currentIndex);
      if (existing) {
        return prev.map(ans => 
          ans.questionIndex === currentIndex 
            ? { ...ans, answer: studentAnswer }
            : ans
        );
      } else {
        return [...prev, { questionIndex: currentIndex, answer: studentAnswer }];
      }
    });
    
    // Call backend to submit answer and get next question
    const submitAnswerAndGetNext = async () => {
      try {
        // Step 1: Get backend validation of the answer (except for graph questions)
        // console.log('[handleSubmit] API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mathgptdevs25.pythonanywhere.com';        
        let isCorrect = false;
        let correctAnswer = '';
        
        // For graph questions, use frontend validation
        if (currentQuestion.type === 'graph') {
          console.log('[handleSubmit] Using frontend validation for graph question');
          
          // Validate graph points against correct answer
          if (studentAnswer && typeof studentAnswer === 'string') {
            try {
              const userPoints = JSON.parse(studentAnswer);
              const correctPoints = currentQuestion.answer;
              const questionText = currentQuestion.text.toLowerCase();
              
              console.log('[handleSubmit] Graph validation:', {
                userPoints,
                correctPoints,
                questionText,
                userPointsLength: userPoints?.length,
                correctPointsType: typeof correctPoints,
                correctPointsIsArray: Array.isArray(correctPoints)
              });
              
              if (Array.isArray(userPoints) && userPoints.length > 0) {
                // Parse correct answer if it's a string
                let expectedPoints;
                if (typeof correctPoints === 'string') {
                  try {
                    expectedPoints = JSON.parse(correctPoints);
                  } catch (e) {
                    console.warn('[handleSubmit] Failed to parse correctPoints as JSON:', e);
                    expectedPoints = null;
                  }
                } else {
                  expectedPoints = correctPoints;
                }
                
                // Validate expectedPoints format
                if (!expectedPoints || !Array.isArray(expectedPoints) || expectedPoints.length === 0) {
                  console.warn('[handleSubmit] No valid expected points found:', {
                    expectedPoints,
                    correctPoints,
                    type: typeof expectedPoints
                  });
                  // If no valid expected points, require at least one user point
                  isCorrect = userPoints.length > 0;
                  correctAnswer = userPoints.length > 0 ? 'Points drawn (no specific answer expected)' : 'No points drawn';
                  console.log('[handleSubmit] Graph validation result (no expected points):', {
                    isCorrect,
                    correctAnswer,
                    userPointsCount: userPoints.length
                  });
                  // Continue to the rest of the validation logic
                }
                
                // Determine question type for appropriate validation
                const isNumberLine = questionText.includes('number line');
                const isPointQuestion = questionText.includes('plot') || 
                                      questionText.includes('point') || 
                                      questionText.includes('mark') ||
                                      questionText.includes('coordinate');
                const isLineQuestion = questionText.includes('y =') || 
                                     questionText.includes('y=') ||
                                     questionText.includes('function') ||
                                     questionText.includes('draw the line') ||
                                     questionText.includes('plot the line');
                
                console.log('[handleSubmit] Question type detection:', {
                  isNumberLine,
                  isPointQuestion,
                  isLineQuestion
                });
                
                // Different validation strategies based on question type
                // Only proceed if we have valid expected points
                if (expectedPoints && Array.isArray(expectedPoints) && expectedPoints.length > 0) {
                  if (isNumberLine) {
                    // Number line questions: check if points are on the correct positions
                    const tolerance = 0.5; // Allow some tolerance for number line
                    const correctPointsOnLine = userPoints.filter(userPoint => {
                      // For number line, y should be 0 (or close to 0)
                      const isOnLine = Math.abs(userPoint.y) <= tolerance;
                      const hasMatchingX = expectedPoints.some(expectedPoint => 
                        Math.abs(userPoint.x - expectedPoint[0]) <= tolerance
                      );
                      return isOnLine && hasMatchingX;
                    });
                    
                    isCorrect = correctPointsOnLine.length >= Math.min(expectedPoints.length, userPoints.length);
                    correctAnswer = `Expected points on number line: ${JSON.stringify(expectedPoints)}`;
                  } else if (isPointQuestion) {
                    // Point plotting questions: check if specific points are plotted correctly
                    const tolerance = 0.5;
                    const correctPoints = userPoints.filter(userPoint => 
                      expectedPoints.some(expectedPoint => 
                        Math.abs(userPoint.x - expectedPoint[0]) <= tolerance &&
                        Math.abs(userPoint.y - expectedPoint[1]) <= tolerance
                      )
                    );
                    
                    // Require at least 70% of expected points to be correct
                    const requiredCorrect = Math.ceil(expectedPoints.length * 0.7);
                    isCorrect = correctPoints.length >= requiredCorrect;
                    correctAnswer = `Expected points: ${JSON.stringify(expectedPoints)}`;
                  } else if (isLineQuestion) {
                    // Line/function questions: check if points form the correct line
                    const tolerance = 1.0; // More tolerance for line approximation
                    const correctPoints = userPoints.filter(userPoint => 
                      expectedPoints.some(expectedPoint => 
                        Math.abs(userPoint.x - expectedPoint[0]) <= tolerance &&
                        Math.abs(userPoint.y - expectedPoint[1]) <= tolerance
                      )
                    );
                    
                    // For line questions, require at least 2 points to be correct
                    isCorrect = correctPoints.length >= 2;
                    correctAnswer = `Expected line points: ${JSON.stringify(expectedPoints)}`;
                  } else {
                    // Generic graph question: use the original simple logic
                    const tolerance = 0.5;
                    const hasCorrectPoint = userPoints.some(userPoint => 
                      expectedPoints.some(expectedPoint => 
                        Math.abs(userPoint.x - expectedPoint[0]) <= tolerance &&
                        Math.abs(userPoint.y - expectedPoint[1]) <= tolerance
                      )
                    );
                    isCorrect = hasCorrectPoint;
                    correctAnswer = `Expected points: ${JSON.stringify(expectedPoints)}`;
                  }
                                  } else {
                    // If no valid expected points, require at least one user point
                    isCorrect = userPoints.length > 0;
                    correctAnswer = userPoints.length > 0 ? 'Points drawn (no specific answer expected)' : 'No points drawn';
                  }
                
                console.log('[handleSubmit] Graph validation result:', {
                  isCorrect,
                  correctAnswer,
                  userPointsCount: userPoints.length
                });
              } else {
                isCorrect = false;
                correctAnswer = 'No points drawn';
              }
            } catch (e) {
              console.error('[handleSubmit] Graph validation error:', e);
              isCorrect = false;
              correctAnswer = 'Invalid graph data';
            }
          } else {
            isCorrect = false;
            correctAnswer = 'No graph data provided';
          }
                } else {
          // For non-graph questions, use submit_answer route for validation
          const validationUrl = `${apiBaseUrl}/skill_assessment/submit_answer?ts=${Date.now()}`;
          // Send properly formatted answer for backend
          
          // Format answer based on question type
          let formattedAnswer: string = String(studentAnswer);
          if (currentQuestion.type === 'numeric') {
            // For numeric questions, try to convert to number string
            const numAnswer = parseFloat(String(studentAnswer));
            formattedAnswer = isNaN(numAnswer) ? String(studentAnswer) : String(numAnswer);
          } else if (currentQuestion.type === 'mcq') {
            // For MCQ, send the selected option text
            formattedAnswer = String(studentAnswer);
          } else if (currentQuestion.type === 'proof') {
            // For proof, send as string
            formattedAnswer = String(studentAnswer);
          }
          
          const validationBody = JSON.stringify({
            problem_id: currentQuestion.id,
            student_id: user?.id,
            answer: formattedAnswer
          });
          
          console.log('[handleSubmit] Original student answer:', studentAnswer);
          console.log('[handleSubmit] Validating answer with submit_answer:', validationBody);
          
          try {
            // Add timeout to validation fetch
            const validationController = new AbortController();
            const validationTimeoutId = setTimeout(() => validationController.abort(), 30000); // 30 second timeout
            
            const validationRes = await fetch(validationUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: validationBody,
              signal: validationController.signal,
              mode: 'cors',
              credentials: 'omit',
            });
            
            clearTimeout(validationTimeoutId);
            
            if (!validationRes.ok) {
              console.error('[handleSubmit] Answer validation failed:', validationRes.status, validationRes.statusText);
              
              // Try to get error details from response
              try {
                const errorText = await validationRes.text();
                console.error('[handleSubmit] Error response body:', errorText);
              } catch (e) {
                console.error('[handleSubmit] Could not read error response:', e);
              }
              
              // Adaptive assessment must use backend validation, cannot use frontend fallback
              throw new Error(`Backend validation failed: ${validationRes.status} ${validationRes.statusText}`);
            }
            
            const validationData = await validationRes.json();
            console.log('[handleSubmit] Answer validation response:', validationData);
            
            // Check backend response status
            if (validationData.status === 'terminated') {
              console.log('[handleSubmit] Assessment terminated by backend');
              
              // Use backend validation result if available, otherwise use frontend validation
              if (validationData.is_correct !== undefined) {
                // Backend provided validation result
                isCorrect = validationData.is_correct;
                console.log('[handleSubmit] Using backend validation result:', {
                  backendIsCorrect: validationData.is_correct,
                  validationData: validationData
                });
              } else {
                // Fallback to frontend validation
                console.log('[handleSubmit] Backend did not provide validation result, using frontend validation');
                if (currentQuestion.type === 'mcq') {
                  isCorrect = selectedOption === currentQuestion.correctIndex;
                  correctAnswer = currentQuestion.options?.[currentQuestion.correctIndex || 0] || '';
                } else if (currentQuestion.type === 'numeric') {
                  const userAnswer = parseNumericAnswer(studentAnswer);
                  const correctAnswerNum = parseNumericAnswer(currentQuestion.answer);
                  isCorrect = Math.abs(userAnswer - correctAnswerNum) < 0.01;
                  correctAnswer = String(currentQuestion.answer);
                } else if (currentQuestion.type === 'proof') {
                  // For proof questions, check if answer contains key concepts
                  const trimmedAnswer = studentAnswer.trim();
                  const hasMinimumLength = trimmedAnswer.length >= 20;
                  const hasMathematicalContent = /[a-zA-Z]/.test(trimmedAnswer) || /\d/.test(trimmedAnswer);
                  const hasExplanationKeywords = /\b(because|since|therefore|thus|hence|so|as|when|if|then|equals|sum|add|positive|negative|greater|less|zero|number|result)\b/i.test(trimmedAnswer);
                  
                  isCorrect = hasMinimumLength && hasMathematicalContent && hasExplanationKeywords;
                  correctAnswer = String(currentQuestion.answer);
                }
              }
              
              // Update correct count
              if (isCorrect) setCorrectCount((prev) => prev + 1);
              
              // Update answered questions count
              setAnsweredQuestionsCount(prev => prev + 1);
              
              // Update correctness array for terminated assessment
              setCorrectnessArr(arr => {
                const newArr = [...arr];
                newArr[currentIndex] = isCorrect;
                if (process.env.NODE_ENV === 'development') {
                  console.log('[CorrectnessArr] Updated for terminated assessment:', {
                    currentIndex,
                    isCorrect,
                    questionsLength: questions.length,
                    correctnessArrLength: arr.length,
                    newArrLength: newArr.length,
                    newArr: [...newArr],
                    answeredQuestionsCount: answeredQuestionsCount + 1,
                    currentQuestion: questions[currentIndex] ? {
                      id: questions[currentIndex].id,
                      topic: questions[currentIndex].topic,
                      text: questions[currentIndex].text
                    } : null
                  });
                }
                return newArr;
              });
              
              // Generate feedback message
              let feedbackText = '';
              if (isCorrect) {
                feedbackText = 'Correct!';
              } else {
                if (correctAnswer) {
                  feedbackText = `Incorrect. The correct answer is: ${renderMathExpression(correctAnswer)}`;
                } else {
                  feedbackText = 'Incorrect.';
                }
              }
              setFeedback(feedbackText);
              
              // Delay 2 seconds before jumping to summary page to let user see the result
              setTimeout(() => {
                console.log('[handleSubmit] Setting showSummary to true');
                setShowSummary(true);
                console.log('[handleSubmit] showSummary set to true');
              }, 2000);
              
              return; // Ensure return here, don't continue executing the following logic
            } else if (validationData.status === 'continue') {
              console.log('[handleSubmit] Backend returned continue status');
              // Continue to get next question
            } else {
              console.error('[handleSubmit] Unexpected backend response:', validationData);
              throw new Error('Unexpected backend response');
            }
          } catch (error) {
            console.error('[handleSubmit] Answer validation error:', error);
            // For adaptive system, if backend validation fails, we cannot continue
            // because backend needs to decide next question based on the answer
            setFeedback('Server error, unable to validate answer. Please refresh the page and try again.');
            return; // Return directly, do not continue to get next question
          }
        }
        
        // Update correct count if answer is correct
        if (isCorrect) setCorrectCount((prev) => prev + 1);
        
        // Update answered questions count
        setAnsweredQuestionsCount(prev => prev + 1);
        
        // Generate feedback with backend validation result
        let feedbackText = '';
        if (isCorrect) {
          feedbackText = 'Correct!';
        } else {
          if (correctAnswer) {
            feedbackText = `Incorrect. The correct answer is: ${renderMathExpression(correctAnswer)}`;
          } else if (currentQuestion.type === 'mcq' && currentQuestion.options && currentQuestion.correctIndex !== undefined) {
            const fallbackCorrectAnswer = currentQuestion.options[currentQuestion.correctIndex];
            feedbackText = `Incorrect. The correct answer is: ${renderMathExpression(fallbackCorrectAnswer)}`;
          } else if (currentQuestion.type === 'numeric' && currentQuestion.answer !== undefined) {
            const fallbackCorrectAnswer = String(currentQuestion.answer);
            feedbackText = `Incorrect. The correct answer is: ${renderMathExpression(fallbackCorrectAnswer)}`;
          } else if (currentQuestion.type === 'proof') {
            feedbackText = 'Incorrect. For proof questions, make sure your answer includes key concepts about even numbers and divisibility by 2.';
          } else if (currentQuestion.type === 'graph') {
            feedbackText = 'Incorrect. Please check your graph points carefully.';
          } else {
            feedbackText = 'Incorrect.';
          }
        }
        setFeedback(feedbackText);
        
        // Update correctness array
        setCorrectnessArr(arr => {
          const newArr = [...arr];
          newArr[currentIndex] = isCorrect;
          if (process.env.NODE_ENV === 'development') {
            console.log('[CorrectnessArr] Updated:', {
              currentIndex,
              isCorrect,
              questionsLength: questions.length,
              correctnessArrLength: arr.length,
              newArrLength: newArr.length,
              newArr: [...newArr],
              currentQuestion: questions[currentIndex] ? {
                id: questions[currentIndex].id,
                topic: questions[currentIndex].topic,
                text: questions[currentIndex].text
              } : null,
              allQuestions: questions.map((q, idx) => ({
                index: idx,
                id: q.id,
                topic: q.topic,
                text: q.text.substring(0, 50) + '...'
              }))
            });
          }
          return newArr;
        });
        
        // Step 2: Get next question using pick_problem
        const pickUrl = `${apiBaseUrl}/skill_assessment/pick_problem?ts=${Date.now()}`;
        const pickBody = JSON.stringify({ student_id: user?.id });
        
        console.log('[handleSubmit] Getting next question:', pickBody);
        
        // Add timeout to pick_problem fetch
        const pickController = new AbortController();
        const pickTimeoutId = setTimeout(() => pickController.abort(), 30000); // 30 second timeout
        
        const pickRes = await fetch(pickUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: pickBody,
          signal: pickController.signal,
        });
        
        clearTimeout(pickTimeoutId);
        
        if (!pickRes.ok) {
          console.error('[handleSubmit] Pick problem failed:', pickRes.status, pickRes.statusText);
          // If we can't get the next question, show a message but continue
          console.log('[handleSubmit] Continuing without next question due to server error');
        } else {
          const pickData = await pickRes.json();
          console.log('[handleSubmit] Pick problem response:', pickData);
          
          // Check if assessment is completed
          if (pickData.status === 'completed') {
            console.log('[handleSubmit] Assessment completed');
            setShowSummary(true);
            setLocked(false);
            return;
          }
          
          // Check if total question count limit is reached
          // Use answeredQuestionsCount because we've already answered the current question
          if (totalQuestionCount > 0 && answeredQuestionsCount >= totalQuestionCount) {
            console.log('[handleSubmit] Reached total question count limit:', totalQuestionCount, 'Answered:', answeredQuestionsCount);
            setShowSummary(true);
            setLocked(false);
            return;
          }
          
          // Process the new question if available
          if (pickData.problem && pickData.subtopic) {
            const problem = pickData.problem;
            const subtopic = pickData.subtopic;
            
            // Create new question object
            let correctIndex: number | undefined = undefined;
            if (problem.options && problem.correct_answer) {
              correctIndex = problem.options.indexOf(problem.correct_answer);
              if (correctIndex === -1) {
                correctIndex = problem.options.findIndex(opt => 
                  opt.toLowerCase() === problem.correct_answer.toLowerCase()
                );
              }
            }
            
            // Extract main topic from subtopic (e.g., "Addition > Whole Numbers > Estimation" -> "Addition")
            const mainTopic = subtopic.split(' > ')[0];
            
            const newQuestion = {
              id: problem.id, // Use the real problem ID from backend
              text: problem.question,
              type: problem.type as 'mcq' | 'numeric' | 'proof' | 'graph',
              topic: mainTopic, // Use main topic instead of full subtopic
              difficulty: problem.difficulty,
              options: problem.options,
              correctIndex: correctIndex !== -1 ? correctIndex : undefined,
              answer: problem.correct_answer
            };
            
            console.log('[handleSubmit] New question created:', newQuestion);
            setQuestions(prev => [...prev, newQuestion]);
            
            // Extend correctnessArr to match the new questions array length
            setCorrectnessArr(prev => {
              const newArr = [...prev];
              // Add a placeholder for the new question (will be updated when answered)
              newArr.push(false);
              if (process.env.NODE_ENV === 'development') {
                console.log('[CorrectnessArr] Extended for new question:', {
                  oldLength: prev.length,
                  newLength: newArr.length,
                  newArr: [...newArr]
                });
              }
              return newArr;
            });
            
            // Don't auto-navigate, wait for user to click Continue button
            setSelectedOption(null);
            // Don't clear feedback, let user see the result
          } else {
            // If no new question received, show completion message
            console.log('[handleSubmit] No new question received, assessment may be complete');
            setFeedback('Assessment completed. Thank you for participating!');
          }
        }
        
      } catch (error) {
        console.error('[handleSubmit] Error submitting answer and getting next question:', error);
        // Show user-friendly error message
        setFeedback('There was an issue with the server. Your answer has been saved using local validation.');
        // Reset locked state on error
        setLocked(false);
      }
    };
    
    // Call the function to submit answer and get next question
    submitAnswerAndGetNext();
    
    // Only set confidence for non-graph questions
    if (questions[currentIndex] && questions[currentIndex].type !== 'graph') {
      setConfidence(c => ({ ...c, [questions[currentIndex].id]: selectedConfidence }));
    }
  }

  const getProficiencyLabel = () => {
    const totalQuestions = totalQuestionCount > 0 ? totalQuestionCount : (currentIndex + 1);
    const percent = correctCount / totalQuestions;
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
    // Set loading state
    setIsGeneratingLecture(true);
    
    try {
      // Get the current question and student's answer for micro-lecture generation
      const currentQuestion = questions[currentIndex];
      if (!currentQuestion) {
        setMicroLectureAI("No question available for micro-lecture generation.");
        return;
      }
      
      // Get student's answer
      let studentAnswer = '';
      if (currentQuestion.type === 'mcq' && typeof selectedOption === 'number' && currentQuestion.options) {
        studentAnswer = currentQuestion.options[selectedOption];
      } else if (typeof selectedOption === 'string') {
        studentAnswer = selectedOption;
      } else if (Array.isArray(selectedOption)) {
        studentAnswer = JSON.stringify(selectedOption);
      } else {
        studentAnswer = 'No answer provided';
      }
      
      const aiLecture = await fetchMicroLecture(currentQuestion.text, studentAnswer);
      setMicroLectureAI(aiLecture);
    } catch (error) {
      console.error('[handleGenerateMicroLecture] Error:', error);
      setMicroLectureAI("Error generating micro-lecture. Please try again.");
    } finally {
      // Clear loading state
      setIsGeneratingLecture(false);
    }
  };

  // Generate micro lecture for wrong questions
  const handleGenerateWrongQuestionMicroLecture = async (wrongQuestionIndex: number) => {
    if (wrongQuestionIndex >= wrongQuestions.length) return;
    
    const wrongQuestion = wrongQuestions[wrongQuestionIndex];
    
    // Set generating state
    setWrongQuestions(prev => prev.map((q, i) => 
      i === wrongQuestionIndex ? { ...q, isGenerating: true } : q
    ));
    
    try {
      const aiLecture = await fetchMicroLecture(wrongQuestion.question.text, wrongQuestion.studentAnswer);
      
      // Update micro lecture
      setWrongQuestions(prev => prev.map((q, i) => 
        i === wrongQuestionIndex ? { ...q, microLecture: aiLecture, isGenerating: false } : q
      ));
    } catch (error) {
      console.error('[handleGenerateWrongQuestionMicroLecture] Error:', error);
      
      // Set error message
      setWrongQuestions(prev => prev.map((q, i) => 
        i === wrongQuestionIndex ? { 
          ...q, 
          microLecture: "Error generating micro-lecture. Please try again.", 
          isGenerating: false 
        } : q
      ));
    }
  };

  useEffect(() => {
    if (showSummary) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PerformanceByTopic] Calculating performance:', {
          questionsCount: questions.length,
          correctnessArrLength: correctnessArr.length,
          questions: questions.map((q, idx) => ({ 
            index: idx,
            id: q.id, 
            topic: q.topic, 
            text: q.text.substring(0, 50) + '...' 
          })),
          correctnessArr: correctnessArr.map((correct, idx) => ({
            index: idx,
            correct,
            questionId: questions[idx]?.id,
            questionTopic: questions[idx]?.topic
          }))
        });
      }
      
      const perf: {[topic: string]: {correct: number, total: number}} = {};
      const correctnessChecks: Array<{index: number, topic: string, correct: boolean, correctnessArrValue: any}> = [];
      
      questions.forEach((q, idx) => {
        if (!perf[q.topic]) perf[q.topic] = {correct: 0, total: 0};
        perf[q.topic].total += 1;
        
        // Safely check correctnessArr[idx], ensure index exists and value is true
        const isCorrect = idx < correctnessArr.length && correctnessArr[idx] === true;
        if (isCorrect) {
          perf[q.topic].correct += 1;
        }
        
        // Add detailed debug information
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PerformanceByTopic] Question ${idx}:`, {
            questionId: q.id,
            topic: q.topic,
            text: q.text.substring(0, 50) + '...',
            correctnessArrIndex: idx,
            correctnessArrLength: correctnessArr.length,
            correctnessArrValue: idx < correctnessArr.length ? correctnessArr[idx] : 'undefined',
            isCorrect,
            topicCorrect: perf[q.topic].correct,
            topicTotal: perf[q.topic].total
          });
        }
        
        correctnessChecks.push({
          index: idx,
          topic: q.topic,
          correct: isCorrect,
          correctnessArrValue: idx < correctnessArr.length ? correctnessArr[idx] : 'undefined'
        });
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PerformanceByTopic] Correctness checks:', correctnessChecks);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PerformanceByTopic] Calculated performance:', perf);
      }
      
      setPerformanceByTopic(perf);
    }
  }, [showSummary, questions, correctnessArr]);

  useEffect(() => { setShowHint(false); }, [currentIndex, inAssessment]);

  // Re-render MathJax when questions change or micro lecture updates
  useEffect(() => {
    const renderMath = () => {
      if (typeof window !== 'undefined' && window.MathJax && window.MathJax.typesetPromise) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Rendering MathJax');
        }
        try {
          window.MathJax.typesetPromise().catch(error => {
            console.warn('MathJax rendering failed:', error);
          });
        } catch (error) {
          console.warn('MathJax rendering failed:', error);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('MathJax not available, using custom fraction rendering');
        }
      }
    };
    
    // Use debouncing to avoid frequent re-rendering
    const timer = setTimeout(renderMath, 200);
    return () => clearTimeout(timer);
  }, [questions, currentIndex, !!microLectureAI]);

  // Reset selectedOption when question changes (for numeric inputs)
  useEffect(() => {
    if (questions[currentIndex]?.type === 'numeric') {
      setSelectedOption('');
    }
    // Reset graph points when question changes
    if (questions[currentIndex]?.type === 'graph') {
      setGraphPoints([]);
    }
  }, [currentIndex, questions]);

  const isTeacherOrAdmin = user && (user.user_type === 'teacher' || user.user_type === 'admin');

  const AssignAssessmentMock = dynamic(() => import('./AssignAssessmentMock'), { ssr: false });
  const StudentResultsMock = dynamic(() => import('./StudentResultsMock'), { ssr: false });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { 
    setMounted(true); 
  }, []);
  if (!mounted) return null;

  // console.log('questions for render:', questions);
  // console.log('MathJax available:', typeof window !== 'undefined' && window.MathJax);

  return (
    <div className="w-full flex flex-col min-h-screen bg-white">
      <style jsx>{`
        /* Fallback for when MathJax is not available */
        .math-fallback {
          font-family: 'Times New Roman', serif;
          font-style: italic;
        }
      `}</style>
      {/* MathJax Script */}
      <Script
        id="MathJax-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
              },
              options: {
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process'
              },
              startup: {
                pageReady: () => {
                  console.log('MathJax page ready');
                  return window.MathJax.startup.defaultPageReady();
                }
              }
            };
          `
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('MathJax loaded successfully');
          }
          if (window.MathJax && window.MathJax.typesetPromise) {
            // Delay execution to ensure DOM is updated
            setTimeout(() => {
              window.MathJax.typesetPromise().catch(error => {
                console.warn('MathJax typesetting failed:', error);
              });
            }, 100);
          }
        }}
        onError={() => {
          console.warn('MathJax failed to load, falling back to custom fraction rendering');
        }}
      />
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
            <div className="min-h-screen flex items-center justify-center pt-20">
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
            <div className="h-screen flex flex-col justify-center items-center w-full pt-20">
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
                        Question {currentIndex + 1} of {totalQuestionCount > 0 ? totalQuestionCount : '?'}
                      </h3>
                      <p 
                        className="mb-6 font-medium text-xl text-gray-700"
                        dangerouslySetInnerHTML={{ 
                          __html: renderMathExpression(questions[currentIndex].text) 
                        }}
                        style={{
                          '--fraction-color': '#374151'
                        } as React.CSSProperties}
                        onLoad={() => {
                          console.log('[Question text] Rendered question:', questions[currentIndex].text);
                          console.log('[Question text] Final rendered:', renderMathExpression(questions[currentIndex].text));
                        }}
                      />
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
                              <span dangerouslySetInnerHTML={{ 
                                __html: `${String.fromCharCode(65 + i)}. ${renderMathExpression(opt)}` 
                              }} />
                            </button>
                          ))}
                        </div>
                      )}

                      {questions[currentIndex].type === 'numeric' && (
                        <div className="mb-8">
                          <input
                            type="text"
                            value={typeof selectedOption === 'string' ? selectedOption : ''}
                            onChange={e => {
                              console.log('[Numeric input] onChange:', e.target.value);
                              setSelectedOption(e.target.value);
                              setSelectedConfidence(null); // Reset confidence when changing answer
                            }}
                            onKeyDown={e => {
                              console.log('[Numeric input] onKeyDown:', e.key, (e.target as HTMLInputElement).value);
                            }}
                            disabled={locked}
                            className="w-full px-6 py-4 rounded-lg border border-gray-300 shadow-md bg-white"
                            placeholder="Enter your answer (e.g., 1/2, 0.5, 2.5)"
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
                            onChange={pts => { 
                              setGraphPoints(pts); 
                              setSelectedOption(pts); 
                              setSelectedConfidence(null); 
                              console.log('[GraphingTool] User drew points:', pts);
                              console.log('[GraphingTool] Points type:', typeof pts, 'Is array:', Array.isArray(pts));
                            }}
                            disabled={locked}
                            func={
                              questions[currentIndex].text.includes('y = x^2') || questions[currentIndex].text.includes('y=x^2') ? (x => x * x) :
                              questions[currentIndex].text.includes('y = x + 2') || questions[currentIndex].text.includes('y=x+2') ? (x => x + 2) :
                              questions[currentIndex].text.includes('y = -x') || questions[currentIndex].text.includes('y=-x') ? (x => -x) :
                              undefined
                            }
                            showAnswer={false}
                            questionText={questions[currentIndex].text}
                          />
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
                          <span className="text-yellow-800 text-base font-medium" style={{lineHeight: '1.6'}} dangerouslySetInnerHTML={{ __html: renderMathExpression(questions[currentIndex].hint) }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show confidence buttons after an answer is selected, but before submit (not for graph questions) */}
                  {selectedOption !== null && selectedOption !== '' && !locked && questions[currentIndex]?.type !== 'graph' && (
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
                        disabled={(selectedOption === null || (selectedConfidence === null && questions[currentIndex]?.type !== 'graph')) || locked}
                        className="mt-8 w-72 py-3 rounded-full text-lg font-semibold shadow transition-all duration-150 border-2 bg-blue-600 text-white border-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                  {/* Show feedback in place of the button after submit */}
                  {locked && feedback && (
                    <div className="mt-8">
                      <div className={`font-medium text-lg mb-4 ${
                        feedback.startsWith('Correct!')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                      dangerouslySetInnerHTML={{ __html: feedback }}
                      />
                      <button
                        onClick={async () => {
                          setFeedback('');
                          setLocked(false);
                          
                                                     // Check if we need to get next question
                           const nextIndex = currentIndex + 1;
                           if (nextIndex >= questions.length) {
                             // Need to get next question
                            try {
                              const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mathgptdevs25.pythonanywhere.com';
                              const pickUrl = `${apiBaseUrl}/skill_assessment/pick_problem?ts=${Date.now()}`;
                              const pickBody = JSON.stringify({ student_id: user?.id });
                              
                              console.log('[Continue] Getting next question:', pickBody);
                              
                              const pickRes = await fetch(pickUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: pickBody,
                              });
                              
                                                             if (!pickRes.ok) {
                                 console.error('[Continue] Pick problem failed:', pickRes.status, pickRes.statusText);
                                 setFeedback('Unable to get next question. Please refresh the page and try again.');
                                 return;
                               }
                              
                              const pickData = await pickRes.json();
                              console.log('[Continue] Pick problem response:', pickData);
                              
                              // Check if completed
                              if (pickData.status === 'completed') {
                                console.log('[Continue] Assessment completed');
                                setShowSummary(true);
                                return;
                              }
                              
                              // Process new question
                              if (pickData.problem && pickData.subtopic) {
                                const problem = pickData.problem;
                                const subtopic = pickData.subtopic;
                                
                                                                 // Create new question object
                                 let correctIndex: number | undefined = undefined;
                                if (problem.options && problem.correct_answer) {
                                  correctIndex = problem.options.indexOf(problem.correct_answer);
                                  if (correctIndex === -1) {
                                    correctIndex = problem.options.findIndex(opt => 
                                      opt.toLowerCase() === problem.correct_answer.toLowerCase()
                                    );
                                  }
                                }
                                
                                                                                                 // Extract main topic from subtopic (e.g., "Addition > Whole Numbers > Estimation" -> "Addition")
                                const mainTopic = subtopic.split(' > ')[0];
                                
                                const newQuestion = {
                                  id: problem.id,
                                  text: problem.question,
                                  type: problem.type as 'mcq' | 'numeric' | 'proof' | 'graph',
                                  topic: mainTopic, // Use main topic instead of full subtopic
                                  difficulty: problem.difficulty,
                                  options: problem.options,
                                  correctIndex: correctIndex !== -1 ? correctIndex : undefined,
                                  answer: problem.correct_answer
                                };
                                
                                console.log('[Continue] New question created:', newQuestion);
                                setQuestions(prev => [...prev, newQuestion]);
                                
                                // Extend correctnessArr to match the new questions array length
                                setCorrectnessArr(prev => {
                                  const newArr = [...prev];
                                  // Add a placeholder for the new question (will be updated when answered)
                                  newArr.push(false);
                                  if (process.env.NODE_ENV === 'development') {
                                    console.log('[CorrectnessArr] Extended for new question (Continue):', {
                                      oldLength: prev.length,
                                      newLength: newArr.length,
                                      newArr: [...newArr]
                                    });
                                  }
                                  return newArr;
                                });
                                
                                setCurrentIndex(nextIndex);
                                setSelectedOption(null);
                                setLocked(false);
                                                             } else {
                                 // If no new question received, show completion message
                                 console.log('[Continue] No new question received, assessment may be complete');
                                 setShowSummary(true);
                                 setLocked(false);
                               }
                                                         } catch (error) {
                               console.error('[Continue] Error getting next question:', error);
                               setFeedback('Error getting next question. Please refresh the page and try again.');
                             }
                                                     } else {
                             // Directly navigate to next question
                             setCurrentIndex(nextIndex);
                             setSelectedOption(null);
                             setLocked(false);
                           }
                        }}
                        className="px-8 py-3 bg-blue-600 text-white rounded-full text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  {questions.length > 0 && currentIndex < questions.length && (
                    <div className="absolute top-4 right-4 text-lg font-semibold text-gray-700">
                      Time left: {timer}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSummary && !showMicroLecture && (
            <div className="min-h-screen flex flex-col justify-center items-center pt-20">
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
            <div className="min-h-screen flex flex-col justify-center items-center p-4 pt-20">
              <div className="p-8 max-w-4xl w-full bg-gray-100 shadow-xl rounded-lg text-center relative flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Wrong Questions Review</h2>
                
                {wrongQuestions.length === 0 ? (
                  <div className="text-center">
                    <p className="text-gray-600 text-lg mb-4">Congratulations! You have no wrong questions.</p>
                    <button onClick={() => router.push('/lecture2')} className="px-8 py-4 bg-green-600 text-white rounded-full text-lg font-medium">
                      Go to Lecture Page
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Wrong questions navigation */}
                    <div className="mb-6 flex flex-wrap justify-center gap-2">
                      {wrongQuestions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentWrongQuestionIndex(index)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentWrongQuestionIndex === index
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Wrong {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    {/* Current wrong question content */}
                    {wrongQuestions[currentWrongQuestionIndex] && (
                      <div className="w-full space-y-6">
                        {/* Question */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Question {currentWrongQuestionIndex + 1}:
                          </h3>
                          <div 
                            className="text-gray-700 text-left"
                            dangerouslySetInnerHTML={{ 
                              __html: renderMathExpression(wrongQuestions[currentWrongQuestionIndex].question.text) 
                            }}
                          />
                        </div>
                        
                        {/* Student answer */}
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h4 className="text-md font-semibold text-yellow-800 mb-2">Your Answer:</h4>
                          <p className="text-yellow-700">{wrongQuestions[currentWrongQuestionIndex].studentAnswer}</p>
                        </div>
                        
                        {/* Explanation */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Detailed Explanation:</h4>
                          {wrongQuestions[currentWrongQuestionIndex].microLecture ? (
                            <div 
                              className="text-gray-700 text-left"
                              dangerouslySetInnerHTML={{ 
                                __html: renderMathExpression(wrongQuestions[currentWrongQuestionIndex].microLecture) 
                              }}
                            />
                          ) : (
                            <div className="text-center">
                              <p className="text-gray-500 mb-4">No explanation generated yet</p>
                              <button 
                                onClick={() => handleGenerateWrongQuestionMicroLecture(currentWrongQuestionIndex)}
                                disabled={wrongQuestions[currentWrongQuestionIndex].isGenerating}
                                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-200 ${
                                  wrongQuestions[currentWrongQuestionIndex].isGenerating
                                    ? 'bg-blue-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
                                } text-white`}
                              >
                                {wrongQuestions[currentWrongQuestionIndex].isGenerating ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                  </div>
                                ) : (
                                  'Generate Explanation'
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Navigation buttons */}
                    <div className="flex justify-between items-center w-full mt-8">
                      <button
                        onClick={() => setCurrentWrongQuestionIndex(Math.max(0, currentWrongQuestionIndex - 1))}
                        disabled={currentWrongQuestionIndex === 0}
                        className={`px-6 py-3 rounded-lg text-lg font-medium ${
                          currentWrongQuestionIndex === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <span className="text-gray-600">
                        {currentWrongQuestionIndex + 1} / {wrongQuestions.length}
                      </span>
                      
                      <button
                        onClick={() => setCurrentWrongQuestionIndex(Math.min(wrongQuestions.length - 1, currentWrongQuestionIndex + 1))}
                        disabled={currentWrongQuestionIndex === wrongQuestions.length - 1}
                        className={`px-6 py-3 rounded-lg text-lg font-medium ${
                          currentWrongQuestionIndex === wrongQuestions.length - 1
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={() => router.push('/welcome')} 
                        className="px-6 py-3 bg-gray-600 text-white rounded-full text-lg font-medium hover:bg-gray-700"
                      >
                        Return Home
                      </button>
                      <button 
                        onClick={handleRetake} 
                        className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-medium hover:bg-blue-700"
                      >
                        Retake Assessment
                      </button>
                      <button 
                        onClick={() => router.push('/lecture2')} 
                        className="px-6 py-3 bg-green-600 text-white rounded-full text-lg font-medium hover:bg-green-700"
                      >
                        Go to Lecture Page
                      </button>
                    </div>
                  </>
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



