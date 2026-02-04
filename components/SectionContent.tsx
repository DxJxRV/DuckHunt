import Link from "next/link";
import dynamic from "next/dynamic";
import type { Section } from "@/lib/landing-sections";

const ShieldAngelGif = dynamic(() => import("@/components/ShieldAngelGif"), {
  ssr: false,
});

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
    return (
      <>
        {/* DESKTOP LAYOUT */}
        <div className="tutorial-container-desktop">
        {/* SECCIÓN SUPERIOR: 75vh - Título y GIF */}
        <div className="tutorial-top">
          <div className="tutorial-top-content">
            {/* Título */}
            <div className="tutorial-title-wrapper">
              <h2 className="tutorial-title">{config.title}</h2>
            </div>

            {/* GIF */}
            {config.tutorialGif && (
              <div className="tutorial-gif-wrapper">
                {config.tutorialGif.startsWith("component:") ? (
                  config.tutorialGif === "component:ShieldAngelGif" ? (
                    <div style={{ width: "100%", aspectRatio: "16/9" }}>
                      <ShieldAngelGif />
                    </div>
                  ) : null
                ) : (
                  <div className="tutorial-gif-placeholder">
                    <span style={{ fontSize: "3rem", opacity: 0.3 }}>🎬</span>
                    <p style={{ opacity: 0.5, marginTop: "1rem", fontSize: "0.85rem" }}>
                      Tutorial GIF
                      <br />
                      <small>({config.tutorialGif})</small>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          {/* SECCIÓN INFERIOR: 25vh - Banda dividida (mano | texto) */}
          <div className="tutorial-bottom">
            {/* Lado izquierdo: Espacio para mano (25%) */}
            <div className="bottom-hand-space"></div>

            {/* Lado derecho: Texto (75%) */}
            <div className="bottom-text">
              <p className="tutorial-description-desktop">{config.description}</p>
            </div>
          </div>
        </div>

        {/* MOBILE LAYOUT - Completamente separado */}
        <div className="tutorial-container-mobile">
          <div className="mobile-title-section">
            <h2 className="tutorial-title-mobile">{config.title}</h2>
          </div>

          {config.tutorialGif && (
            <div className="mobile-gif-section">
              {config.tutorialGif.startsWith("component:") ? (
                config.tutorialGif === "component:ShieldAngelGif" ? (
                  <div style={{ width: "100%", aspectRatio: "16/9" }}>
                    <ShieldAngelGif />
                  </div>
                ) : null
              ) : (
                <div className="tutorial-gif-placeholder">
                  <span style={{ fontSize: "3rem", opacity: 0.3 }}>🎬</span>
                  <p style={{ opacity: 0.5, marginTop: "1rem", fontSize: "0.85rem" }}>
                    Tutorial GIF
                    <br />
                    <small>({config.tutorialGif})</small>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mobile-text-section">
            <p className="tutorial-description-mobile">{config.description}</p>
          </div>
        </div>

        <style jsx>{`
          /* DESKTOP LAYOUT - Solo visible en desktop */
          .tutorial-container-desktop {
            position: relative;
            zIndex: 10;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }

          @media (max-width: 1024px) {
            .tutorial-container-desktop {
              display: none !important; /* Ocultar en mobile */
            }
          }

          /* MOBILE LAYOUT - Solo visible en mobile */
          .tutorial-container-mobile {
            display: none; /* Oculto por defecto (desktop) */
          }

          @media (max-width: 1024px) {
            .tutorial-container-mobile {
              display: block !important;
              position: relative;
              z-index: 10;
              padding: 7rem 2rem 3rem;
            }

            .mobile-title-section {
              text-align: center;
              margin-bottom: 2.5rem;
            }

            .mobile-gif-section {
              padding: 0 1rem;
              margin-bottom: 2.5rem;
            }

            .mobile-text-section {
              padding: 0 1.5rem;
              text-align: center;
            }

            .tutorial-title-mobile {
              font-family: var(--font-heading);
              font-size: 32px;
              font-weight: 400;
              line-height: 1.3;
              letter-spacing: 0.02em;
              color: white;
              margin: 0;
            }

            .tutorial-description-mobile {
              font-family: var(--font-body);
              font-size: 1.5rem;
              font-weight: 600;
              color: #feca57;
              line-height: 1.4;
              margin: 0;
            }
          }

          @media (max-width: 768px) {
            .tutorial-container-mobile {
              padding: 6.5rem 1.5rem 1.5rem !important;
            }

            .mobile-title-section {
              margin-bottom: 2rem;
            }

            .mobile-gif-section {
              margin-bottom: 2rem;
            }

            .tutorial-title-mobile {
              font-size: 32px !important; /* Mantener 32px en mobile pequeño */
            }

            .tutorial-description-mobile {
              font-size: 1.4rem !important;
            }
          }

          /* Sección superior: 75vh */
          .tutorial-top {
            flex: 3; /* 75% del espacio */
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8rem 5rem 1rem; /* Padding interior consistente */
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
          }

          .tutorial-top-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            align-items: center;
            width: 100%;
          }

          .tutorial-title-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .tutorial-gif-wrapper {
            width: 100%; /* Force full width */
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Sección inferior: 25vh - Banda dividida horizontalmente */
          .tutorial-bottom {
            flex: 1; /* 25% del espacio vertical */
            display: grid;
            grid-template-columns: 1fr 3fr; /* Mano 25% | Texto 75% */
            align-items: center;
            padding: 0 5rem 2rem; /* Padding interior consistente */
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
          }

          .bottom-hand-space {
            display: flex;
            align-items: center;
            justify-content: center; /* Centrado horizontal */
          }

          .bottom-text {
            display: flex;
            align-items: center;
            justify-content: center; /* Centrado horizontal */
            padding: 0 2rem;
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

          .tutorial-description-desktop {
            font-family: var(--font-body);
            font-size: 1.5rem; /* Reducido para banda compacta */
            font-weight: 600;
            color: #feca57; /* Amarillo para texto explicativo */
            line-height: 1.4;
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

        `}</style>
      </>
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
