"use client";

import dynamic from "next/dynamic";

const HandPreview = dynamic(() => import("@/components/HandPreview"), {
  ssr: false,
});

interface HandPreviewBoxProps {
  position: "bottom-right" | "bottom-left";
  targetAngle: number;
  isOK: boolean;
}

export default function HandPreviewBox({
  position,
  targetAngle,
  isOK,
}: HandPreviewBoxProps) {
  const positionStyles = position === "bottom-right"
    ? { bottom: "2rem", right: "2rem" }
    : { bottom: "2rem", left: "2rem" };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles,
        width: "min(400px, 40vw)",
        aspectRatio: "16/9",
        zIndex: 5,
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        padding: "1.5rem",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "12px",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <HandPreview targetAngle={targetAngle} isOK={isOK} />
      </div>
    </div>
  );
}
