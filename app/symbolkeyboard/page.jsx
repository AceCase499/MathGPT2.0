import React, { useState } from "react";

const MATH_SYMBOLS = {
  Greek: ["α", "β", "γ", "δ", "ε", "θ", "λ", "μ", "π", "σ", "φ", "Ω"],
  Operators: ["+", "−", "×", "÷", "=", "≠", "<", ">", "≤", "≥"],
  Symbols: ["√", "∫", "∑", "∞", "∂", "∇", "≈", "≅", "∈", "∉", "∅", "∃", "∀"],
  Trigonometry: ["\\sin", "\\cos", "\\tan", "\\cot", "\\sec", "\\csc"],
  Fractions: ["½", "⅓", "¼", "¾", "⅔", { label: "Fraction Builder", type: "dynamic-fraction" }],
};

export default function MathKeyboard({ onInsert }) {
  const [showFractionBuilder, setShowFractionBuilder] = useState(false);
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenominator] = useState("");

  const handleFractionInsert = () => {
    if (numerator && denominator) {
      const latex = `\\frac{${numerator}}{${denominator}}`;
      onInsert?.(latex);
      setNumerator("");
      setDenominator("");
      setShowFractionBuilder(false);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow max-w-lg w-full mx-auto space-y-4 text-sm">
      <h2 className="text-lg font-semibold text-zinc-800">Math Symbols</h2>

      {showFractionBuilder && (
        <div className="bg-zinc-50 p-3 border border-blue-200 rounded-lg shadow-inner flex flex-col gap-2">
          <div className="text-zinc-700 font-medium text-xs">Build a Fraction</div>
          <div className="flex items-center gap-2">
            <input
              className="border px-2 py-1 rounded w-1/2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="Numerator"
              value={numerator}
              onChange={(e) => setNumerator(e.target.value)}
            />
            <span className="text-zinc-500 text-xs">/</span>
            <input
              className="border px-2 py-1 rounded w-1/2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="Denominator"
              value={denominator}
              onChange={(e) => setDenominator(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleFractionInsert}
              className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition"
            >
              Insert
            </button>
            <button
              onClick={() => setShowFractionBuilder(false)}
              className="bg-zinc-200 text-xs px-3 py-1 rounded hover:bg-zinc-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {Object.entries(MATH_SYMBOLS).map(([category, symbols]) => (
        <div key={category}>
          <div className="text-zinc-600 text-xs font-semibold mb-1">{category}</div>
          <div className="flex flex-wrap gap-1">
            {symbols.map((symbol, idx) =>
              typeof symbol === "string" ? (
                <button
                  key={idx}
                  onClick={() => onInsert?.(symbol)}
                  className="bg-zinc-100 text-base px-2 py-1 rounded hover:bg-emerald-100 transition shadow-sm"
                >
                  {symbol.replace(/\\/, "")}
                </button>
              ) : (
                <button
                  key={idx}
                  onClick={() => setShowFractionBuilder(true)}
                  className="text-xs bg-emerald-100 px-2 py-1 rounded hover:bg-emerald-200 transition text-emerald-800 shadow-sm"
                >
                  {symbol.label}
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
