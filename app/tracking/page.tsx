"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Home, Pause, Play, Maximize, Minimize, Smartphone, Undo, Redo } from "lucide-react";
import { useState, useEffect } from "react";
import { withBasePath } from "@/lib/basePath";

// Import HandTracker dynamically with SSR disabled
const HandTracker = dynamic(() => import("@/components/HandTracker"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        color: "#feca57",
      }}
    >
      Loading battlefield...
    </div>
  ),
});

export default function TrackingPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const toggleFullscreen = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.log("Fullscreen not available");
    }
  };

  // Detect fullscreen changes
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
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

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
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
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logo/Title - Vertical - Clickable */}
        <Link
          href="/"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "1.8rem",
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

      {/* iOS PWA Instructions Modal */}
      {showIOSInstructions && (
        <>
          {/* Dark overlay */}
          <div
            onClick={() => setShowIOSInstructions(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 2000,
            }}
          />
          {/* Modal content - Landscape optimized */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "1.5rem 2rem",
              background: "rgba(10, 10, 10, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              backdropFilter: "blur(20px)",
              zIndex: 2001,
              maxWidth: "85%",
              maxHeight: "85vh",
              width: "min(700px, 85vw)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Title */}
            <h3 style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "0.9rem",
              color: "#ff6b6b",
              margin: 0,
              textAlign: "center",
            }}>
              iOS no soporta fullscreen 😔
            </h3>
            <p style={{
              fontFamily: "'Oxanium', sans-serif",
              fontSize: "0.7rem",
              color: "#feca57",
              margin: "0.3rem 0 0 0",
              textAlign: "center",
              lineHeight: "1.4",
            }}>
              Si te gusta el juego y quieres experimentar la pantalla completa, puedes instalar la app, no tarda ni 10 segundos
            </p>

            {/* Steps - Horizontal layout */}
            <div style={{
              display: "flex",
              gap: "1.5rem",
              alignItems: "flex-start",
            }}>
              {/* Step 1 */}
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.8rem",
              }}>
                <div style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "0.7rem",
                  color: "#ff6b6b",
                }}>
                  1. PRESIONA SHARE
                </div>
                <img
                  src={withBasePath("/images/share.jpeg")}
                  alt="Share button"
                  style={{
                    width: "100%",
                    maxWidth: "200px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
                <p style={{
                  fontFamily: "'Oxanium', sans-serif",
                  fontSize: "0.7rem",
                  color: "#888",
                  margin: 0,
                  textAlign: "center",
                }}>
                  En la barra de Safari
                </p>
              </div>

              {/* Step 2 */}
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.8rem",
              }}>
                <div style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "0.7rem",
                  color: "#ff6b6b",
                }}>
                  2. AGREGAR A INICIO
                </div>
                <img
                  src={withBasePath("/images/agregar-al-inicio.jpeg")}
                  alt="Add to home screen"
                  style={{
                    width: "100%",
                    maxWidth: "200px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
                <p style={{
                  fontFamily: "'Oxanium', sans-serif",
                  fontSize: "0.7rem",
                  color: "#888",
                  margin: 0,
                  textAlign: "center",
                }}>
                  Busca esta opción en el menú
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowIOSInstructions(false)}
              style={{
                padding: "0.7rem",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                backdropFilter: "blur(20px)",
                color: "#feca57",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            >
              ENTENDIDO
            </button>
          </div>
        </>
      )}

      {/* Responsive styles */}
      <style jsx global>{`
        /* No-scroll for tracking page only */
        html, body {
          overscroll-behavior: none;
          overflow: hidden;
        }

        /* Mobile base (all mobile sizes including landscape) */
        @media (max-width: 1280px) {
          .sidebar a[title="Back to Home"] {
            font-size: 1.5rem !important;
          }
        }

        /* Tablet and small desktop */
        @media (max-width: 900px) and (orientation: landscape) {
          .sidebar {
            width: 50px !important;
            padding: 1rem 0.3rem !important;
            gap: 1.5rem !important;
          }

          .sidebar a[title="Back to Home"] {
            font-size: 1.35rem !important;
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

          .sidebar a[title="Back to Home"] {
            font-size: 1rem !important;
            letter-spacing: 0.05em !important;
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

          .sidebar a[title="Back to Home"] {
            font-size: 0.8rem !important;
            letter-spacing: 0.03em !important;
          }
        }

        /* Fullscreen support */
        @media (orientation: landscape) {
          .tracking-page {
            height: 100dvh;
            overflow: hidden;
          }

          main {
            height: 100dvh;
          }
        }
      `}</style>
    </div>
  );
}
