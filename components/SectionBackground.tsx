interface SectionBackgroundProps {
  config: {
    type: "illustration" | "gradient";
    image?: string;
    gradient?: string;
  };
}

export default function SectionBackground({ config }: SectionBackgroundProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "#0a0a0a", // Fallback color
      }}
    >
      {/* Ilustración de fondo (si existe) */}
      {config.image && (
        <img
          src={config.image}
          alt="Background scene"
          loading="lazy"
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.4,
            filter: "blur(2px)",
          }}
        />
      )}

      {/* Gradient overlay */}
      {config.gradient && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: config.gradient,
            opacity: config.image ? 0.7 : 1, // Más opaco si hay imagen debajo
          }}
        />
      )}
    </div>
  );
}
