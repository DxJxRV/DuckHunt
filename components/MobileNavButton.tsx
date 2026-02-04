"use client";

import { ChevronDown } from "lucide-react";

interface MobileNavButtonProps {
  onClick: () => void;
  isLastSection: boolean;
}

export default function MobileNavButton({
  onClick,
  isLastSection,
}: MobileNavButtonProps) {
  if (isLastSection) return null;

  return (
    <>
      <button
        onClick={onClick}
        className="mobile-nav-button"
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          padding: "1rem 2rem",
          background: "linear-gradient(135deg, #ff6b6b, #ff5252)",
          border: "2px solid #ff9f43",
          borderRadius: "50px",
          color: "white",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 8px 25px rgba(255, 107, 107, 0.5)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        Siguiente
        <ChevronDown size={20} />
      </button>

      {/* Bounce animation */}
      <style jsx global>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0) translateX(-50%);
          }
          50% {
            transform: translateY(-10px) translateX(-50%);
          }
        }

        .mobile-nav-button {
          animation: bounce 2s ease-in-out infinite;
        }

        .mobile-nav-button:active {
          transform: scale(0.95) translateX(-50%);
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
