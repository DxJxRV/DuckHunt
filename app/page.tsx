"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div
      className="landing-page"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
      }}
    >
      <h1
        style={{
          fontSize: "4rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          background: "linear-gradient(to right, #ff6b6b, #feca57, #ff9f43)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 40px rgba(255, 107, 107, 0.3)",
        }}
      >
        VOID HUNTER
      </h1>

      <p
        style={{
          fontSize: "1.5rem",
          color: "#feca57",
          marginBottom: "0.5rem",
          maxWidth: "700px",
          fontWeight: "600",
        }}
      >
        Hand-Powered Cosmic Defense
      </p>

      <p
        style={{
          fontSize: "1rem",
          color: "#aaaaaa",
          marginBottom: "2.5rem",
          maxWidth: "650px",
          lineHeight: "1.6",
        }}
      >
        An enemy factory spawns fighter planes to destroy your celestial shield.
        Use your hand to create a black hole and consume them before they drain your life force.
      </p>

      <Link
        href="/tracking"
        style={{
          display: "inline-block",
          padding: "1.2rem 2.5rem",
          fontSize: "1.3rem",
          fontWeight: "700",
          color: "#ffffff",
          background: "linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)",
          border: "2px solid #ff9f43",
          borderRadius: "12px",
          textDecoration: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 6px 20px rgba(255, 107, 107, 0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
          e.currentTarget.style.boxShadow = "0 10px 30px rgba(255, 107, 107, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 107, 107, 0.4)";
        }}
      >
        🚀 ENTER BATTLEFIELD
      </Link>

      <div
        style={{
          marginTop: "4rem",
          padding: "2rem",
          backgroundColor: "rgba(26, 26, 30, 0.8)",
          border: "2px solid #333",
          borderRadius: "12px",
          maxWidth: "700px",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            fontSize: "1.8rem",
            marginBottom: "1.5rem",
            color: "#ff9f43",
            fontWeight: "bold",
          }}
        >
          ⚔️ How to Play
        </h2>
        <ul
          style={{
            textAlign: "left",
            color: "#cccccc",
            lineHeight: "2",
            listStyle: "none",
            padding: 0,
            fontSize: "1.05rem",
          }}
        >
          <li style={{ marginBottom: "0.8rem" }}>
            <strong style={{ color: "#feca57" }}>📷 Camera:</strong> Grant camera access to begin
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong style={{ color: "#feca57" }}>🤚 Right Hand:</strong> Controls aiming direction
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong style={{ color: "#feca57" }}>✊ Left Fist:</strong> Close to activate VOID (black hole)
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong style={{ color: "#feca57" }}>🛡️ Shield:</strong> Your celestial guardian - protect it at all costs
          </li>
          <li style={{ marginBottom: "0.8rem" }}>
            <strong style={{ color: "#feca57" }}>🏭 Factory:</strong> Destroy all 20 spawned planes to win
          </li>
          <li>
            <strong style={{ color: "#feca57" }}>⚠️ Survive:</strong> Don't let your HP reach zero
          </li>
        </ul>
      </div>

      <div
        style={{
          marginTop: "2rem",
          fontSize: "0.85rem",
          color: "#666",
        }}
      >
        Powered by MediaPipe AI · Built with Next.js · Real-time Hand Tracking
      </div>

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .landing-page {
            padding: 1.5rem !important;
          }

          .landing-page h1 {
            font-size: 2.5rem !important;
          }

          .landing-page p {
            font-size: 1rem !important;
          }

          .landing-page a {
            font-size: 1.1rem !important;
            padding: 1rem 2rem !important;
          }

          .landing-page > div {
            max-width: 90% !important;
            padding: 1.5rem !important;
          }

          .landing-page ul li {
            font-size: 0.95rem !important;
            margin-bottom: 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .landing-page {
            padding: 1rem !important;
          }

          .landing-page h1 {
            font-size: 2rem !important;
          }

          .landing-page h2 {
            font-size: 1.3rem !important;
          }

          .landing-page p {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
}
