import Link from "next/link";
import type { Section } from "@/lib/landing-sections";

interface SectionContentProps {
  config: Section["content"];
  handPosition: "bottom-right" | "bottom-left";
}

export default function SectionContent({
  config,
  handPosition,
}: SectionContentProps) {
  // Hero layout (primera sección)
  if (config.type === "hero") {
    return (
      <div
        className="hero-container"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "8rem 2rem 2rem", // Top padding for navbar + extra space
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div className="hero-content">
          <h1 className="hero-title">
            {config.title}
            <br />
            <span className="hero-title-gradient">{config.titleGradient}</span>
          </h1>

          <p className="hero-description">{config.description}</p>

          {config.features && (
            <div className="hero-features">
              {config.features.map((feature, i) => (
                <div key={i} className="feature-chip">
                  {feature}
                </div>
              ))}
            </div>
          )}

          {config.cta && (
            <div style={{ marginBottom: "1.5rem" }}>
              <Link href={config.cta.href} className="hero-cta">
                {config.cta.text}
              </Link>
            </div>
          )}

          {config.meta && <p className="hero-meta">{config.meta}</p>}
        </div>

        <style jsx>{`
          .hero-content {
            max-width: ${handPosition === "bottom-right" ? "50%" : "100%"};
            margin-left: ${handPosition === "bottom-left" ? "auto" : "0"};
            margin-right: ${handPosition === "bottom-right" ? "auto" : "0"};
          }

          .hero-title {
            font-family: var(--font-heading);
            font-size: clamp(2.5rem, 5vw, 3.5rem);
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: 0.02em;
            margin-bottom: 1.5rem;
            color: white;
          }

          .hero-title-gradient {
            font-family: var(--font-body);
            font-size: clamp(2.5rem, 5vw, 3.5rem); /* Mismo tamaño que título */
            font-weight: 900;
            line-height: 1.3;
            background: linear-gradient(135deg, #ff6b6b, #feca57, #ff9f43);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .hero-description {
            font-family: var(--font-body);
            font-size: 1.3rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 2rem;
            line-height: 1.7;
          }

          .hero-features {
            display: flex;
            gap: 0.8rem;
            margin-bottom: 2.5rem;
            flex-wrap: wrap;
          }

          .feature-chip {
            font-family: var(--font-heading);
            padding: 0.6rem 1.2rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 0.6rem;
            letter-spacing: 0.05em;
            color: rgba(255, 255, 255, 0.9);
          }

          .hero-cta {
            font-family: var(--font-heading);
            padding: 1rem 2.5rem;
            background: linear-gradient(135deg, #ff6b6b, #ff5252);
            border: 2px solid #ff9f43;
            border-radius: 12px;
            color: white;
            font-size: 0.9rem;
            letter-spacing: 0.05em;
            text-decoration: none;
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
            display: inline-block;
          }

          .hero-meta {
            font-family: var(--font-body);
            font-size: 0.85rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.6);
          }

          /* Mobile responsive */
          @media (max-width: 768px) {
            .hero-container {
              padding: 7rem 1.5rem 7rem !important;
              min-height: 100vh !important;
              justify-content: flex-start !important;
            }

            .hero-content {
              max-width: 100% !important;
              margin: 0 !important;
            }

            .hero-title {
              font-size: 2rem;
              margin-bottom: 1rem !important;
            }

            .hero-title-gradient {
              font-size: 2rem !important;
            }

            .hero-description {
              font-size: 1.1rem;
              margin-bottom: 1.5rem !important;
            }

            .hero-features {
              margin-bottom: 1.5rem !important;
            }

            .hero-cta {
              font-size: 0.75rem;
              padding: 0.8rem 2rem;
            }

            .feature-chip {
              font-size: 0.5rem;
              padding: 0.5rem 1rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // Tutorial layout (slides de aprendizaje)
  if (config.type === "tutorial") {
    // 4 quadrants layout (CONSISTENTE, no alterna)
    // Top-left: Título | Top-right: GIF
    // Bottom-left: Espacio mano | Bottom-right: Texto

    return (
      <div
        className="tutorial-container"
        style={{
          position: "relative",
          zIndex: 10,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "3rem",
          padding: "8rem 4rem 4rem",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {/* TOP LEFT: Título */}
        <div className="quadrant-title">
          <h2 className="tutorial-title">{config.title}</h2>
        </div>

        {/* TOP RIGHT: GIF */}
        {config.tutorialGif && (
          <div className="quadrant-gif">
            <div className="tutorial-gif-placeholder">
              <span style={{ fontSize: "3rem", opacity: 0.3 }}>🎬</span>
              <p style={{ opacity: 0.5, marginTop: "1rem", fontSize: "0.85rem" }}>
                Tutorial GIF
                <br />
                <small>({config.tutorialGif})</small>
              </p>
            </div>
          </div>
        )}

        {/* BOTTOM LEFT: Espacio para mano (HandPreviewBox maneja su posición) */}
        <div className="quadrant-hand-space"></div>

        {/* BOTTOM RIGHT: Texto descripción */}
        <div className="quadrant-text">
          <p className="tutorial-description">{config.description}</p>
        </div>

        <style jsx>{`
          /* Quadrant styles */
          .quadrant-title {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1rem;
          }

          .quadrant-gif {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .quadrant-text {
            display: flex;
            align-items: flex-start; /* Align to top */
            justify-content: center;
            padding: 2rem;
            padding-top: 3rem; /* Extra top padding */
          }

          .quadrant-hand-space {
            /* Espacio reservado para HandPreviewBox */
          }

          .tutorial-title {
            font-family: var(--font-heading);
            font-size: clamp(2rem, 4vw, 3.5rem);
            font-weight: 400;
            line-height: 1.3;
            letter-spacing: 0.02em;
            color: white;
            margin: 0;
          }

          .tutorial-description {
            font-family: var(--font-body);
            font-size: 2rem;
            font-weight: 600;
            color: #feca57; /* Amarillo para texto explicativo */
            line-height: 1.6;
            margin: 0;
          }

          .tutorial-gif-placeholder {
            width: 100%;
            height: 100%;
            max-height: 400px;
            aspect-ratio: 16/9;
            background: rgba(255, 255, 255, 0.05);
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.9rem;
            text-align: center;
            position: relative;
            z-index: 60; /* Por encima de aviones (z:50) */
          }

          /* Adaptive based on viewport dimensions */

          /* Short screens (less vertical space) */
          @media (max-height: 800px) {
            .tutorial-container {
              padding: 7rem 4rem 2rem !important;
              gap: 2rem !important;
            }

            .tutorial-title {
              font-size: clamp(1.8rem, 3.5vw, 2.8rem) !important;
            }

            .tutorial-description {
              font-size: 1.5rem !important;
            }

            .tutorial-gif-placeholder {
              max-height: 300px !important;
            }
          }

          @media (max-height: 650px) {
            .tutorial-container {
              padding: 6rem 3rem 2rem !important;
              gap: 1.5rem !important;
              grid-template-rows: auto auto !important; /* Flexible rows */
            }

            .tutorial-title {
              font-size: clamp(1.5rem, 3vw, 2.2rem) !important;
            }

            .tutorial-description {
              font-size: 1.2rem !important;
            }

            .tutorial-gif-placeholder {
              max-height: 200px !important;
            }

            .quadrant-text {
              padding: 1rem !important;
              padding-top: 1.5rem !important;
            }
          }

          /* Narrow screens (less horizontal space) */
          @media (max-width: 1400px) {
            .tutorial-container {
              padding: 8rem 3rem 4rem !important;
              gap: 2.5rem !important;
            }

            .tutorial-title {
              font-size: clamp(1.8rem, 3.5vw, 3rem) !important;
            }

            .tutorial-description {
              font-size: 1.8rem !important;
            }
          }

          @media (max-width: 1200px) {
            .tutorial-container {
              padding: 7rem 2.5rem 3rem !important;
              gap: 2rem !important;
            }

            .tutorial-title {
              font-size: clamp(1.6rem, 3.2vw, 2.5rem) !important;
            }

            .tutorial-description {
              font-size: 1.5rem !important;
            }

            .tutorial-gif-placeholder {
              max-height: 350px !important;
            }
          }

          /* Combo: narrow AND short (landscape tablets, small laptops) */
          @media (max-width: 1200px) and (max-height: 700px) {
            .tutorial-container {
              padding: 6rem 2rem 2rem !important;
              gap: 1.5rem !important;
              grid-template-rows: auto auto !important;
            }

            .tutorial-title {
              font-size: clamp(1.4rem, 2.8vw, 2rem) !important;
            }

            .tutorial-description {
              font-size: 1.2rem !important;
            }

            .tutorial-gif-placeholder {
              max-height: 220px !important;
            }
          }

          /* Mobile responsive - 3 vertical rows */
          @media (max-width: 1024px) {
            .tutorial-container {
              grid-template-columns: 1fr !important;
              grid-template-rows: auto auto auto !important; /* 3 rows: título, GIF, texto */
              gap: 2.5rem !important;
              padding: 7rem 2rem 2rem !important; /* Less bottom padding */
            }

            .quadrant-title {
              text-align: center;
              padding: 0 1rem;
            }

            .quadrant-gif {
              padding: 0 1rem;
            }

            .quadrant-text {
              padding: 0 1.5rem;
              text-align: center;
              align-items: center !important; /* Center vertically in mobile */
              padding-top: 0 !important;
            }

            .tutorial-title {
              font-size: 2.5rem;
            }

            .tutorial-description {
              font-size: 1.5rem;
            }

            .tutorial-gif-placeholder {
              max-height: 300px !important;
            }

            .quadrant-hand-space {
              display: none; /* Hide grid space, hand is position absolute */
            }
          }

          @media (max-width: 768px) {
            .tutorial-container {
              gap: 2rem !important;
              padding: 6.5rem 1.5rem 1.5rem !important;
            }

            .tutorial-title {
              font-size: 2rem;
            }

            .tutorial-description {
              font-size: 1.2rem;
            }

            .tutorial-gif-placeholder {
              max-height: 250px !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Cards layout (fallback legacy)
  if (config.type === "cards" && config.cards) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "8rem 2rem 6rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <h2
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "3rem",
            background:
              "linear-gradient(135deg, white, rgba(255, 255, 255, 0.6))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {config.title}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            maxWidth: "900px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {config.cards.map((card, i) => (
            <div
              key={i}
              style={{
                padding: "2.5rem 2rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.2rem" }}>
                {card.emoji}
              </div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "0.8rem",
                  color: "#feca57",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
