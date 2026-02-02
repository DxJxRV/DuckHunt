"use client";

import dynamic from "next/dynamic";

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
      Loading hand tracker...
    </div>
  ),
});

export default function TrackingPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
      }}
    >
      <header
        style={{
          padding: "1rem 2rem",
          backgroundColor: "#1a1a1a",
          borderBottom: "2px solid #333",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            margin: 0,
            background: "linear-gradient(to right, #ff6b6b, #feca57)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Hand Tracking
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#888",
            margin: "0.5rem 0 0 0",
          }}
        >
          Open your palm to aim, close fist to shoot
        </p>
      </header>

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
