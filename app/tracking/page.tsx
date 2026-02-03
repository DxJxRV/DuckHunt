"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Home } from "lucide-react";

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
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "80px",
          backgroundColor: "#1a1a1a",
          borderRight: "2px solid #333",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.5rem 0.5rem",
          gap: "2rem",
        }}
      >
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
            marginBottom: "1rem",
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
          VOID HUNTER
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Back to Home */}
        <Link
          href="/"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            border: "2px solid #ff6b6b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: "#ff6b6b",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 107, 107, 0.3)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Back to Home"
        >
          <Home size={24} />
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
        <HandTracker />
      </main>
    </div>
  );
}
