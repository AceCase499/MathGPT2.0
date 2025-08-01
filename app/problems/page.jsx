"use client";
import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import MathSymbolKeyboard from "../components/mathkeyboard";
import { AuthContext } from "../context/AuthContext";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const STORAGE_KEY = "problems_v1";

function suggestTitle(input) {
  const lc = input.toLowerCase();
  if (/\d+x/.test(input)) return "Algebra Problem";
  if (/derivative|integral|limit/.test(lc)) return "Calculus Problem";
  if (/angle|triangle|circle/.test(lc)) return "Geometry Problem";
  return "General Problem";
}

export default function ProblemsPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  // --- State ---
  const [problems, setProblems] = useState([{}]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const [questionInput, setQuestionInput] = useState("");
  const [steps, setSteps] = useState("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [previewSymbol, setPreviewSymbol] = useState("");
  const [selectedProblem, setSelectedProblem] = useState({});
  const [search, setSearch] = useState(""); // NEW

  // --- Derived ---
  const suggestedTitle = useMemo(() => suggestTitle(questionInput), [questionInput]);
  /* const selectedProblem = useMemo(
    () => problems.find((p) => p.id === selectedId) || null,
    [problems, selectedId]
  ); */

  // NEW: filtered list (title or question)
  const filteredProblems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.question?.toLowerCase().includes(q)
    );
  }, [problems, search]);

  // --- Persistence ---
  useEffect(() => {
    //alert(`${user?.id}, ${user?.username}`)
    loadLectureList()
    //console.log(selectedProblem)

    /* try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setProblems(saved);
    } catch {
      // ignore
    } */
  }, []);

/*   useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  }, [problems]); */

  // --- Handlers ---
  const handleInsertSymbol = useCallback((symbol) => {
    setQuestionInput((prev) => prev + " " + symbol);
    setPreviewSymbol(symbol);
  }, []);

  const handleDelete = useCallback(
    (id) => {
      if (!window.confirm("Delete this problem?")) return;
      setProblems((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId]
  );

  const handleRename = useCallback(
    (id) => {
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: newTitle || p.title } : p))
      );
      setEditingId(null);
      setNewTitle("");
    },
    [newTitle]
  );

  const handleProblemClick = useCallback((prob) => {
    setSelectedId((prev) => (prev === prob.session_id ? null : prob.session_id));
    setSelectedProblem(prob)
  }, []);

  const buttonStyle = {
    background: "white",
    border: "1px solid black",
    color: "black",
    fontWeight: "bold",
    padding: "0.5rem 1rem",
    cursor: "pointer",
  };

  async function loadLectureList(){
    const form = new FormData();
    Object.entries({ student_id: user?.id }).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/problem/list', {
      method: 'POST',
      body: form
    });
    const data = await response.json();   
    console.log(data) 
    setProblems(data)
  }

  async function MarkDone(){
    const pid = selectedProblem.session_id
    if (!pid){
      alert("ID not found")
      return
    }
    const form = new FormData();
    Object.entries({ session_id: pid }).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await fetch('https://mathgptdevs25.pythonanywhere.com/mathgpt/problem/complete', {
      method: 'POST',
      body: form
    });
    const data = await response.json();   
    alert(data.message) 
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "white",
        color: "black",
        overflow: "hidden",
      }}
    >

      {/* Main content */}
      <div style={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "300px",
            borderRight: "1px solid black",
            padding: "1rem",
            overflowY: "auto",
            backgroundColor: "white",
          }}
        >
          <button
            style={{ ...buttonStyle, width: "100%", marginBottom: "1rem" }}
            onClick={() => router.push("/newproblem")}
          >
            New Problem
          </button>
          <h2 className="font-bold">My Problems</h2>

          {/* NEW: search bar */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems…"
            style={{
              width: "100%",
              padding: "0.4rem 0.6rem",
              marginBottom: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />

            {filteredProblems.length === 0 && (
              <p style={{ color: "#777" }}>
                {problems.length === 0
                  ? "No problems yet. Create one!"
                  : "No matches."}
              </p>
            )}

            {filteredProblems.map((prob, index) => (
              <div key={prob.session_id} style={{ marginBottom: "1rem" }}>
                {editingId === prob.session_id ? (
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => handleRename(prob.session_id)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(prob.session_id)}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div
                    key={prob.session_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        cursor: "pointer",
                        flex: 1,
                        fontWeight: selectedId === prob.session_id ? "bold" : "normal",
                      }}
                      onClick={() => handleProblemClick(prob)}
                    >
                      {prob.title}
                    </span>
                    <div
                      style={{ marginLeft: "0.5rem", display: "flex", gap: "0.25rem" }}
                    >
                      <button
                        onClick={() => {
                          setEditingId(prob.session_id);
                          setNewTitle(prob.title);
                        }}
                        style={buttonStyle}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(prob.session_id)}
                        style={buttonStyle}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
                <small>{prob.createdAt}</small>
              </div>
            ))}


          <p style={{ marginTop: "1rem" }}>Select a problem to view details</p>
        </div>

        {/* Right panel */}
        <div className="h-[100%] pt-18"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            backgroundColor: "white",
          }}
        >

          {/* Problem view or new input */}
          {selectedProblem != {} && 
          <div className='min-h-max'>
            <p className="font-bold text-xl flex px-4 justify-end pt-5">{"Date created: "+selectedProblem.created_at}</p>
            <p className="flex justify-end px-4">{selectedProblem.is_done == false ? "⚙️Not marked as Done":"✅Marked as Done"}</p>
            <p className="font-extrabold text-3xl flex justify-center pt-5 underline underline-offset-2">{selectedProblem.title}</p>
            <p className=" italic text-xl flex justify-center pt-2">{`(${selectedProblem.topic}, ${selectedProblem.subtopic})`}</p>
            <p className="flex justify-center pt-4">Math Problem Goes Here</p>
            <div className="flex justify-center h-max pt-10">
              <div className="min-h-max min-w-max pb-15">
                <p className="text-3xl font-extrabold">Your Answer</p>
                <p className="rounded-2xl bg-amber-100 p-5 h-max w-max">{"Your answer will go here"}</p>
              </div>
              <div className="min-h-max min-w-max">
                <p className="text-3xl font-extrabold">Your Assistant's Answer</p>
                <p className="rounded-2xl bg-slate-100 p-5 min-h-max min-w-max">{"Your assistant's answer will go here"}</p>
              </div>
            </div>
            {selectedProblem.is_done == false && 
              <button onClick={MarkDone} className="border cursor-pointer text-xl p-3 bg-green-300 ">
                ✅ Mark as Done</button>}
              <button onClick={()=>router.push("/newproblem")} className="border cursor-pointer text-xl p-3 bg-gray-200 ">
                Start a new Problem</button>
          </div>}
          
        </div>
      </div>
    </div>
  );
}
