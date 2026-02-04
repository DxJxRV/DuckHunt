"use client";

import { ChevronDown } from "lucide-react";

interface MobileNavButtonProps {
  onClick: () => void;
  isLastSection: boolean;
  currentHandPosition: "bottom-right" | "bottom-left";
}

export default function MobileNavButton({
  onClick,
  isLastSection,
  currentHandPosition,
}: MobileNavButtonProps) {
  if (isLastSection) return null;

  // Position opposite to hand
  const buttonSide = currentHandPosition === "bottom-right" ? "left" : "right";

  return (
    <>
      <button
        onClick={onClick}
        className="mobile-nav-button"
        style={{
          position: "fixed",
          bottom: "1rem",
          [buttonSide]: "1rem",
          zIndex: 50,
          padding: "0.8rem",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
          cursor: "pointer",
          width: "80px",
          height: "80px",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <ChevronDown size={32} strokeWidth={2.5} color="#feca57" />
        </div>
      </button>

      {/* Subtle bounce animation */}
      <style jsx global>{`
        @keyframes subtleBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .mobile-nav-button {
          animation: subtleBounce 3s ease-in-out infinite;
        }

        .mobile-nav-button:active {
          transform: scale(0.9) !important;
        }

        /* Solo visible en mobile */
        @media (min-width: 768px) {
          .mobile-nav-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
