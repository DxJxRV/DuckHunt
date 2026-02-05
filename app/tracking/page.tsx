"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Home, Pause, Play } from "lucide-react";
import { useState } from "react";

// Import HandTracker dynamically with SSR disabled
const HandTracker = dynamic(() => import("@/components/HandTracker"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        color: "#feca57",
      }}
    >
      Loading battlefield...
    </div>
  ),
});

export default function TrackingPage() {
  const [isPaused, setIsPaused] = useState(false);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
      }}
      className="tracking-page"
    >
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: "80px",
          backdropFilter: "blur(20px) saturate(180%)",
          background: "rgba(10, 10, 10, 0.7)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.5rem 0.5rem",
          gap: "2rem",
        }}
      >
        {/* Pause/Resume Button */}
        <button
          onClick={togglePause}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#feca57",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          title={isPaused ? "Resume Game" : "Pause Game"}
        >
          {isPaused ? <Play size={24} /> : <Pause size={24} />}
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logo/Title - Vertical - Clickable */}
        <Link
          href="/"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "1.2rem",
            fontWeight: "bold",
            background: "linear-gradient(to bottom, #ff6b6b, #feca57)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.1em",
            textDecoration: "none",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          title="Back to Home"
        >
          VoidHunter.com
        </Link>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HandTracker isPausedProp={isPaused} />
      </main>

      {/* Responsive styles */}
      <style jsx global>{`
        /* No-scroll for tracking page only */
        html, body {
          overscroll-behavior: none;
          overflow: hidden;
        }

        /* Tablet and small desktop */
        @media (max-width: 900px) and (orientation: landscape) {
          .sidebar {
            width: 50px !important;
            padding: 1rem 0.3rem !important;
            gap: 1.5rem !important;
          }

          .sidebar a[title="Back to Home"] {
            width: 42px !important;
            height: 42px !important;
          }

          .sidebar a[title="Back to Home"] :global(svg) {
            width: 20px !important;
            height: 20px !important;
          }
        }

        /* Mobile landscape */
        @media (max-width: 700px) and (orientation: landscape) {
          .sidebar {
            width: 35px !important;
            padding: 0.5rem 0.2rem !important;
            gap: 1rem !important;
          }

          .sidebar a {
            font-size: 0.7rem !important;
          }

          .sidebar a[title="Back to Home"] {
            width: 35px !important;
            height: 35px !important;
          }

          .sidebar a[title="Back to Home"] :global(svg) {
            width: 18px !important;
            height: 18px !important;
          }
        }

        /* Very small mobile */
        @media (max-width: 500px) and (orientation: landscape) {
          .sidebar {
            width: 30px !important;
            padding: 0.4rem 0.15rem !important;
          }

          .sidebar a {
            font-size: 0.6rem !important;
            letter-spacing: 0.05em !important;
          }

          .sidebar a[title="Back to Home"] {
            width: 30px !important;
            height: 30px !important;
          }
        }

        /* Fullscreen support */
        @media (orientation: landscape) {
          .tracking-page {
            height: 100vh;
            overflow: hidden;
          }

          main {
            height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
