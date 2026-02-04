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
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "6rem 2rem",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: handPosition === "bottom-right" ? "50%" : "100%",
            marginLeft: handPosition === "bottom-left" ? "auto" : 0,
            marginRight: handPosition === "bottom-right" ? "auto" : 0,
          }}
        >
          <h1
            style={{
              fontSize: "4.5rem",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              color: "white",
            }}
          >
            {config.title}
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #ff6b6b, #feca57, #ff9f43)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {config.titleGradient}
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.3rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            {config.description}
          </p>

          {config.features && (
            <div
              style={{
                display: "flex",
                gap: "0.8rem",
                marginBottom: "2.5rem",
                flexWrap: "wrap",
              }}
            >
              {config.features.map((feature, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  {feature}
                </div>
              ))}
            </div>
          )}

          {config.cta && (
            <div style={{ marginBottom: "1.5rem" }}>
              <Link
                href={config.cta.href}
                style={{
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
                }}
              >
                {config.cta.text}
              </Link>
            </div>
          )}

          {config.meta && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              {config.meta}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Cards layout (secciones de tutorial/features)
  if (config.type === "cards" && config.cards) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "6rem 2rem",
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
