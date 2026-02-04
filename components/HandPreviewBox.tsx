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
  // Center horizontally in quadrant (left 25% or right 25% of screen)
  const positionStyles =
    position === "bottom-right"
      ? { bottom: "2rem", left: "75%", transform: "translateX(-50%)" }
      : { bottom: "2rem", left: "25%", transform: "translateX(-50%)" };

  return (
    <>
      <div
        className="hand-preview-box"
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

      {/* Mobile responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .hand-preview-box {
            width: 85vw !important;
            max-width: 350px !important;
            bottom: 6rem !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
        }
      `}</style>
    </>
  );
}
