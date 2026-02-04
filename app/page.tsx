"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import animation dynamically (client-only)
const LandingAnimation = dynamic(() => import("@/components/LandingAnimation"), {
  ssr: false,
});

const HandPreview = dynamic(() => import("@/components/HandPreview"), {
  ssr: false,
});

export default function Home() {
  const [showTrailer, setShowTrailer] = useState(false);
  const [handAngle, setHandAngle] = useState(0);
  const [isOK, setIsOK] = useState(false);

  // Listen to animation events
  useEffect(() => {
    const handleAnimationState = (e: CustomEvent) => {
      if (e.detail.angle !== undefined) setHandAngle(e.detail.angle);
      if (e.detail.isOK !== undefined) setIsOK(e.detail.isOK);
    };

    window.addEventListener('landingAnimationState' as any, handleAnimationState as any);
    return () => window.removeEventListener('landingAnimationState' as any, handleAnimationState as any);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Animated Canvas */}
      <LandingAnimation />

      {/* Background */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background: "#0a0a0a",
      }}>
        {/* Blobs */}
        <div style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          top: "-10%",
          left: "-10%",
          background: "radial-gradient(circle, #ff6b6b, transparent)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.3,
        }} />
        <div style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          bottom: "-10%",
          right: "-10%",
          background: "radial-gradient(circle, #feca57, transparent)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.3,
        }} />
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          top: "40%",
          left: "50%",
          background: "radial-gradient(circle, #8a2be2, transparent)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.3,
        }} />
      </div>

      {/* Navbar */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px) saturate(180%)",
        background: "rgba(10, 10, 10, 0.7)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1.2rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #ff6b6b, #feca57)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>VOID HUNTER</div>

          <Link href="/tracking" style={{
            padding: "0.5rem 1.5rem",
            background: "linear-gradient(135deg, #ff6b6b, #ff5252)",
            borderRadius: "20px",
            color: "white",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
          }}>Play</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "6rem 2rem 4rem",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
          width: "100%",
        }}>
          <div>
            <h1 style={{
              fontSize: "4.5rem",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              color: "white",
            }}>
              Controla la gravedad <br />
              <span style={{
                background: "linear-gradient(135deg, #ff6b6b, #feca57, #ff9f43)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>con tu mano.</span>
            </h1>

            <p style={{
              fontSize: "1.3rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}>
              Apunta con tus dedos. Haz OK. Abre un agujero negro.
            </p>

            <div style={{
              display: "flex",
              gap: "0.8rem",
              marginBottom: "2.5rem",
              flexWrap: "wrap",
            }}>
              <div style={{
                padding: "0.5rem 1rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                fontSize: "0.85rem",
                color: "rgba(255, 255, 255, 0.8)",
              }}>Sin controles</div>
              <div style={{
                padding: "0.5rem 1rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                fontSize: "0.85rem",
                color: "rgba(255, 255, 255, 0.8)",
              }}>Partidas rápidas</div>
              <div style={{
                padding: "0.5rem 1rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                fontSize: "0.85rem",
                color: "rgba(255, 255, 255, 0.8)",
              }}>Caos instantáneo</div>
            </div>

            <div style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}>
              <Link href="/tracking" style={{
                padding: "1rem 2.5rem",
                background: "linear-gradient(135deg, #ff6b6b, #ff5252)",
                border: "2px solid #ff9f43",
                borderRadius: "12px",
                color: "white",
                fontWeight: 700,
                fontSize: "1.1rem",
                textDecoration: "none",
                boxShadow: "0 8px 25px rgba(255, 107, 107, 0.4)",
                display: "inline-block",
              }}>Jugar ahora</Link>
            </div>

            <p style={{
              fontSize: "0.85rem",
              color: "rgba(255, 255, 255, 0.5)",
            }}>Requiere cámara • Juega en segundos</p>
          </div>

          {/* Hand Tutorial Preview */}
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{
              aspectRatio: "16/9",
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              <HandPreview targetAngle={handAngle} isOK={isOK} />
            </div>
          </div>
        </div>
      </section>

      {/* How to Play */}
      <section style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "6rem 2rem",
      }}>
        <h2 style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: "3rem",
          background: "linear-gradient(135deg, white, rgba(255, 255, 255, 0.6))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>Cómo se juega</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
        }}>
          <div style={{
            padding: "2.5rem 2rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.2rem" }}>🎯</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.8rem", color: "#feca57" }}>Apunta</h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>Mueve la retícula con tu mano.</p>
          </div>

          <div style={{
            padding: "2.5rem 2rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.2rem" }}>👌</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.8rem", color: "#feca57" }}>OK = Vacío</h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>Haz OK para fijar el agujero negro.</p>
          </div>

          <div style={{
            padding: "2.5rem 2rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.2rem" }}>🌀</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.8rem", color: "#feca57" }}>Atrae aviones</h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>Júntalos y trágatelos.</p>
          </div>
        </div>
      </section>

      {/* Viral */}
      <section style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "4rem 2rem 6rem",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}>
          <div style={{
            padding: "3rem 2.5rem",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            backdropFilter: "blur(30px)",
            textAlign: "center",
          }}>
            <h3 style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ff6b6b, #feca57)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Supera tu score</h3>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>Cada partida es más rápida y caótica</p>
            <a href="#leaderboard" style={{ color: "#feca57", textDecoration: "none", fontWeight: 600 }}>Ver leaderboard →</a>
          </div>

          <div style={{
            padding: "3rem 2.5rem",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            backdropFilter: "blur(30px)",
            textAlign: "center",
          }}>
            <h3 style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ff6b6b, #feca57)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Comparte tu run</h3>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>Reta a tus compas y hazlos sufrir</p>
            <a href="#discord" style={{ color: "#feca57", textDecoration: "none", fontWeight: 600 }}>Discord →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "3rem 2rem",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        color: "rgba(255, 255, 255, 0.4)",
      }}>
        <p>Built with chaos • Powered by hand tracking AI</p>
        <div style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          marginTop: "1.5rem",
        }}>
          <a href="#" style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none" }}>Discord</a>
          <a href="#" style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none" }}>Twitter</a>
          <a href="#" style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none" }}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
