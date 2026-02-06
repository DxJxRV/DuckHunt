"use client";

import { useState, useRef, useEffect } from "react";

interface ArcadeNameInputProps {
  onSubmit: (name: string) => void;
  score: number;
}

const MAX_LENGTH = 10;

export default function ArcadeNameInput({ onSubmit, score }: ArcadeNameInputProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedSlot, setFocusedSlot] = useState(0);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update focused slot based on name length
  useEffect(() => {
    setFocusedSlot(Math.min(name.length, MAX_LENGTH - 1));
  }, [name]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length > 0) {
      onSubmit(trimmedName);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase, allow only A-Z, 0-9, space, limit to MAX_LENGTH
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .substring(0, MAX_LENGTH);
    setName(value);
  };

  // Pad name with spaces to show all 10 slots
  const displayChars = (name + " ".repeat(MAX_LENGTH)).substring(0, MAX_LENGTH).split("");

  return (
    <>
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 2000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "2.5rem",
          background: "rgba(10, 10, 10, 0.95)",
          border: "2px solid #feca57",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
          zIndex: 2001,
          maxWidth: "90%",
          width: "min(500px, 90vw)",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "clamp(1rem, 4vw, 1.5rem)",
            color: "#feca57",
            textAlign: "center",
            marginBottom: "0.5rem",
          }}
        >
          NEW HIGH SCORE!
        </h2>

        {/* Score */}
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
            color: "#00ff88",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          {score}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Hidden input for actual typing */}
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleChange}
            maxLength={MAX_LENGTH}
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          {/* Visual 10-slot display */}
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              marginBottom: "1rem",
              cursor: "text",
            }}
          >
            {displayChars.map((char, index) => (
              <div
                key={index}
                style={{
                  width: "45px",
                  height: "60px",
                  border: index === focusedSlot ? "3px solid #feca57" : "2px solid #555",
                  borderRadius: "8px",
                  background: index === focusedSlot
                    ? "rgba(254, 202, 87, 0.1)"
                    : index < name.length
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "1.5rem",
                  color: index < name.length ? "#ffffff" : "#333",
                  transition: "all 0.2s ease",
                }}
              >
                {char === " " && index >= name.length ? "_" : char}
              </div>
            ))}
          </div>

          {/* Character count */}
          <p
            style={{
              fontFamily: "'Oxanium', sans-serif",
              fontSize: "0.75rem",
              color: "#888",
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            {name.length}/{MAX_LENGTH} caracteres · Escribe tu nombre
          </p>

          {/* Submit button */}
          <button
            type="submit"
            disabled={name.trim().length === 0}
            style={{
              width: "100%",
              padding: "1rem",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "0.8rem",
              background: name.trim().length > 0
                ? "linear-gradient(135deg, #00ff88, #00cc6a)"
                : "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "15px",
              color: name.trim().length > 0 ? "#0a0a0a" : "#555",
              cursor: name.trim().length > 0 ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (name.trim().length > 0) {
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            SUBMIT
          </button>
        </form>
      </div>
    </>
  );
}
