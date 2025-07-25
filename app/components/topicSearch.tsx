"use client"
import React from 'react'
import { useState, useContext, useEffect } from 'react'
import { AuthContext } from "../context/AuthContext";
import "../chatFormat.css"

export default function LectureHome(){
    const [proficiency, setProficiency] = useState(65);
    const [InputText, setInputText] = useState('')
    const [queryResults, setQueryResults] = useState([{Topic: "abc", Subtopics: ["x","y","z"]}])

    const mathTopics = [
  {Topic: "Algebra", 
    Subtopics: [
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
  ]},
  {Topic: "Geometry", 
    Subtopics: [
    "Types of angles (acute, obtuse, right)",
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
  ]},
  {Topic: "Calculus",
    Subtopics: [
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
  ]},
  {Topic: "Statistics",
    Subtopics: [
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
  ]},
];

  useEffect(() => {
    searchMathTopics(InputText)
  }, [InputText]);

function searchMathTopics(inp) {
  const query = inp.toLowerCase().trim();
  if (query === "") return;

  // First: search subtopics
  const subtopicMatches = mathTopics
    .map(({ Topic, Subtopics }) => {
      const matchingSubtopics = Subtopics.filter(sub =>
        sub.toLowerCase().includes(query)
      );
      return matchingSubtopics.length > 0 ? { Topic, Subtopics: matchingSubtopics } : null;
    })
    .filter(Boolean);

  if (subtopicMatches.length > 0) {
    setQueryResults(subtopicMatches);
    return;
  }

  // Second: fallback to matching topics by name
  const topicMatches = mathTopics
    .filter(({ Topic }) => Topic.toLowerCase().includes(query));

  if (topicMatches.length > 0) {
    setQueryResults(topicMatches); // This already includes Subtopics
  } else {
    setQueryResults([
      {
        Topic: "No Results",
        Subtopics: ["Try searching something else"],
      },
    ]);
  }
}
    
    
  return (
    <div className='text-2xl'>
        <div className='p-20'>
          <input value={InputText} placeholder='enter a topic' onChange={e => setInputText(e.target.value)}/>
          {InputText.trim() !== "" && queryResults.map((obj, index) => (
            <div key={index}>
              <p className="font-bold mt-4">{obj.Topic}</p>
              <div style={{ height: 2, backgroundColor: "gray", marginBottom: 8 }}></div>
              {obj.Subtopics.map((sub, subIndex) => (
                <p key={subIndex}>{sub}</p>
              ))}
            </div>
          ))}
        </div>
    </div>
  )
}