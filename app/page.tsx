"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          background: "linear-gradient(to right, #ff6b6b, #feca57)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        DuckHunt
      </h1>

      <p
        style={{
          fontSize: "1.25rem",
          color: "#aaaaaa",
          marginBottom: "2rem",
          maxWidth: "600px",
        }}
      >
        Hand tracking game powered by MediaPipe and Next.js. Use your hand gestures to aim and shoot!
      </p>

      <Link
        href="/tracking"
        style={{
          display: "inline-block",
          padding: "1rem 2rem",
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#ffffff",
          backgroundColor: "#ff6b6b",
          border: "none",
          borderRadius: "8px",
          textDecoration: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 6px rgba(255, 107, 107, 0.3)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#ff5252";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 12px rgba(255, 107, 107, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ff6b6b";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 6px rgba(255, 107, 107, 0.3)";
        }}
      >
        Start Tracking
      </Link>

      <div
        style={{
          marginTop: "3rem",
          padding: "1.5rem",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          maxWidth: "600px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            marginBottom: "1rem",
            color: "#feca57",
          }}
        >
          How to Play
        </h2>
        <ul
          style={{
            textAlign: "left",
            color: "#cccccc",
            lineHeight: "1.8",
            listStyle: "none",
            padding: 0,
          }}
        >
          <li>📷 Allow camera access</li>
          <li>✋ Open your palm to the camera</li>
          <li>🎯 Move your hand to aim</li>
          <li>✊ Close your fist to shoot</li>
          <li>🔥 See "FIRE!" when you hit</li>
        </ul>
      </div>
    </div>
  );
}
