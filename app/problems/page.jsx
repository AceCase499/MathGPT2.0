"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import logo from "../../assets/images/logofull.png";
import MathSymbolKeyboard from "../components/mathkeyboard";

const STORAGE_KEY = "problems_v1";

function suggestTitle(input) {
  const lc = input.toLowerCase();
  if (/\d+x/.test(input)) return "Algebra Problem";
  if (/derivative|integral|limit/.test(lc)) return "Calculus Problem";
  if (/angle|triangle|circle/.test(lc)) return "Geometry Problem";
  return "General Problem";
}

export default function ProblemsPage() {
  const router = useRouter();

  // --- State ---
  const [problems, setProblems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const [questionInput, setQuestionInput] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [steps, setSteps] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [previewSymbol, setPreviewSymbol] = useState("");

  const [search, setSearch] = useState(""); // NEW

  // --- Derived ---
  const suggestedTitle = useMemo(() => suggestTitle(questionInput), [questionInput]);
  const selectedProblem = useMemo(
    () => problems.find((p) => p.id === selectedId) || null,
    [problems, selectedId]
  );

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
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setProblems(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  }, [problems]);

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

  const handleProblemClick = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleQuestionChange = useCallback((e) => {
    const input = e.target.value;
    setQuestionInput(input);
    setFinalAnswer("");
    setSteps("");
    setShowSteps(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!questionInput.trim()) {
      alert("Please enter a question first.");
      return;
    }

    const url = "https://mathgptdevs25.pythonanywhere.com/mathgpt/problem/answer_mode";
    const formData = new URLSearchParams();
    formData.append("question", questionInput);
    formData.append("student_id", "1"); // TODO: replace with real user id

    setLoadingAnswer(true);
    setFinalAnswer("");
    setSteps("");
    setShowSteps(false);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("Error:", data.error);
        alert(`Error: ${data.error}`);
        return;
      }

      setFinalAnswer(data.final_answer);
      setSteps(data.steps);

      const newProblem = {
        id: data.session_id,
        title: suggestedTitle || "New Problem",
        createdAt: new Date().toISOString().slice(0, 10),
        question: data.question,
        finalAnswer: data.final_answer,
        steps: data.steps,
      };

      setProblems((prev) => [newProblem, ...prev]);
      setSelectedId(data.session_id);
      setQuestionInput("");
    } catch (err) {
      console.error("Request failed:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAnswer(false);
    }
  }, [questionInput, suggestedTitle]);

  const buttonStyle = {
    background: "white",
    border: "1px solid black",
    color: "black",
    fontWeight: "bold",
    padding: "0.5rem 1rem",
    cursor: "pointer",
  };

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
      {/* Top Nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          borderBottom: "1px solid black",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={logo} alt="MathGPT Logo" style={{ height: "30px" }} />
          <button onClick={() => router.push("/lectures")} style={buttonStyle}>
            Lectures
          </button>
          <button onClick={() => router.push("/problemlist")} style={buttonStyle}>
            Problems
          </button>
        </div>
        <button onClick={() => router.push("/login")} style={buttonStyle}>
          Login
        </button>
      </div>

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
          <h2>My Problems</h2>
          <button
            style={{ ...buttonStyle, width: "100%", marginBottom: "1rem" }}
            onClick={() => router.push("/newproblem")}
          >
            New Problem
          </button>

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

          <ul style={{ listStyle: "none", padding: 0 }}>
            {filteredProblems.length === 0 && (
              <li style={{ color: "#777" }}>
                {problems.length === 0
                  ? "No problems yet. Create one!"
                  : "No matches."}
              </li>
            )}

            {filteredProblems.map((p) => (
              <li key={p.id} style={{ marginBottom: "1rem" }}>
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => handleRename(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(p.id)}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div
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
                        fontWeight: selectedId === p.id ? "bold" : "normal",
                      }}
                      onClick={() => handleProblemClick(p.id)}
                    >
                      {p.title}
                    </span>
                    <div
                      style={{ marginLeft: "0.5rem", display: "flex", gap: "0.25rem" }}
                    >
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setNewTitle(p.title);
                        }}
                        style={buttonStyle}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={buttonStyle}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
                <small>{p.createdAt}</small>
              </li>
            ))}
          </ul>

          <p style={{ marginTop: "1rem" }}>Select a problem to view details</p>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            backgroundColor: "white",
          }}
        >
          {/* Header stays sticky */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "white",
              padding: "1rem 0",
              borderBottom: "1px solid #eee",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#222" }}>
              Type a new question
            </h2>
          </div>

          {/* Problem view or new input */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflowY: "auto",
            }}
          >
            {!selectedProblem ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {/* Input area at bottom */}
                <div
                  style={{
                    width: "100%",
                    paddingTop: "1rem",
                    borderTop: "1px solid #eee",
                    backgroundColor: "white",
                    marginTop: "auto",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "1000px",
                      margin: "0 auto",
                      paddingBottom: "2rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() => setShowKeyboard((prev) => !prev)}
                        title="Toggle Math Keyboard"
                        style={{
                          border: "none",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "8px",
                          padding: "0.4rem 0.6rem",
                          fontSize: "1rem",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        ⌨️
                      </button>
                    </div>

                    {showKeyboard && (
                      <div style={{ marginBottom: "1rem" }}>
                        <MathSymbolKeyboard
                          onInsert={handleInsertSymbol}
                          previewSymbol={previewSymbol}
                        />
                      </div>
                    )}

                    <textarea
                      value={questionInput}
                      onChange={handleQuestionChange}
                      placeholder="Type your math question here..."
                      style={{
                        width: "100%",
                        minHeight: "100px",
                        padding: "1rem 1.25rem",
                        fontSize: "1rem",
                        fontFamily: "inherit",
                        border: "1px solid " + "#dcdcdc",
                        borderRadius: "12px",
                        backgroundColor: "#fcfcfc",
                        resize: "vertical",
                        outline: "none",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
                        marginBottom: "1rem",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {!!questionInput && (
                        <span style={{ fontWeight: "bold", color: "darkblue" }}>
                          {suggestedTitle}
                        </span>
                      )}

                      <button
                        onClick={handleGenerate}
                        disabled={loadingAnswer}
                        style={{
                          padding: "0.6rem 1.5rem",
                          borderRadius: "999px",
                          border: "none",
                          fontWeight: "bold",
                          background: loadingAnswer ? "#999" : "blue",
                          color: "white",
                          cursor: loadingAnswer ? "not-allowed" : "pointer",
                          fontSize: "1rem",
                        }}
                      >
                        {loadingAnswer ? "Generating..." : "Generate"}
                      </button>
                    </div>

                    {(finalAnswer || steps) && (
                      <div style={{ marginTop: "1.5rem" }}>
                        {finalAnswer && (
                          <>
                            <h3>Final answer</h3>
                            <p>{finalAnswer}</p>
                          </>
                        )}
                        {steps && (
                          <>
                            <button
                              onClick={() => setShowSteps((s) => !s)}
                              style={{ ...buttonStyle, marginTop: "0.5rem" }}
                            >
                              {showSteps ? "Hide steps" : "Show steps"}
                            </button>
                            {showSteps && (
                              <pre
                                style={{
                                  whiteSpace: "pre-wrap",
                                  padding: "0.75rem",
                                  border: "1px solid #eee",
                                  borderRadius: 6,
                                  marginTop: "0.5rem",
                                  backgroundColor: "#fafafa",
                                }}
                              >
                                {steps}
                              </pre>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
                <h2>{selectedProblem.title}</h2>
                <p>
                  <strong>Created:</strong> {selectedProblem.createdAt}
                </p>

                <h3>Question</h3>
                <p>{selectedProblem.question}</p>

                <h3>Final Answer</h3>
                <p>{selectedProblem.finalAnswer}</p>

                {selectedProblem.steps && (
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      onClick={() => setShowSteps((s) => !s)}
                      style={{ ...buttonStyle }}
                    >
                      {showSteps ? "Hide steps" : "Show steps"}
                    </button>
                    {showSteps && (
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          padding: "0.75rem",
                          border: "1px solid #eee",
                          borderRadius: 6,
                          marginTop: "0.5rem",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        {selectedProblem.steps}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
