"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ChevronUp } from "lucide-react";
import { landingSections } from "@/lib/landing-sections";
import SectionBackground from "@/components/SectionBackground";
import SectionContent from "@/components/SectionContent";
import HandPreviewBox from "@/components/HandPreviewBox";
import MobileNavButton from "@/components/MobileNavButton";

// Import animation dynamically (client-only)
const LandingAnimation = dynamic(() => import("@/components/LandingAnimation"), {
  ssr: false,
});

const HandPreview = dynamic(() => import("@/components/HandPreview"), {
  ssr: false,
});

export default function Home() {
  const [handAngle, setHandAngle] = useState(0);
  const [isOK, setIsOK] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  // Listen to animation events
  useEffect(() => {
    const handleAnimationState = (e: CustomEvent) => {
      if (e.detail.angle !== undefined) setHandAngle(e.detail.angle);
      if (e.detail.isOK !== undefined) setIsOK(e.detail.isOK);
    };

    const handleCycleComplete = () => {
      setResetKey((prev) => prev + 1);
    };

    window.addEventListener("landingAnimationState" as any, handleAnimationState as any);
    window.addEventListener("animationCycleComplete" as any, handleCycleComplete);

    return () => {
      window.removeEventListener("landingAnimationState" as any, handleAnimationState as any);
      window.removeEventListener("animationCycleComplete" as any, handleCycleComplete);
    };
  }, []);

  // Intersection Observer for fade transitions
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-section-index") || "0");
            console.log(`[SECTION VISIBLE] Sección ${index} (${entry.target.id})`);
            setActiveSection(index);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "0px",
      }
    );

    const sections = document.querySelectorAll(".fullscreen-section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Mobile navigation
  const goToNextSection = () => {
    if (activeSection < landingSections.length - 1) {
      const nextSection = document.getElementById(`section-${activeSection + 1}`);
      nextSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToPrevSection = () => {
    if (activeSection > 0) {
      const prevSection = document.getElementById(`section-${activeSection - 1}`);
      prevSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        height: "100dvh",
        overflowY: "scroll",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
      }}
    >
      {/* Animated Canvas - Persists across all sections */}
      <LandingAnimation key={resetKey} activeSection={activeSection} />

      {/* Navbar - Fixed across all sections */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backdropFilter: "blur(20px) saturate(180%)",
          background: "rgba(10, 10, 10, 0.7)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1.2rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.3rem",
              fontFamily: "var(--font-body)",
              fontWeight: 800,
              letterSpacing: "0.02em",
              background: "linear-gradient(135deg, #ff6b6b, #feca57)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VoidHunter.com
          </div>

          <Link
            href="/tracking"
            style={{
              padding: "0.6rem 1.5rem",
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              backdropFilter: "blur(20px)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Play
          </Link>
        </div>
      </nav>

      {/* Fullscreen Sections */}
      {landingSections.map((section, index) => (
        <section
          key={section.id}
          id={`section-${index}`}
          data-section-index={index}
          className="fullscreen-section active"
          style={{
            height: "100dvh",
            scrollSnapAlign: "start",
            position: "relative",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          {/* Background for this section */}
          <SectionBackground config={section.background} />

          {/* Section content */}
          <SectionContent
            config={section.content}
            handPosition={section.handPosition}
            handPreviewBox={
              section.content.type === "tutorial" ? (
                <div
                  style={{
                    width: "min(280px, 30vw)",
                    aspectRatio: "16/9",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "30px",
                    padding: "1px",
                    backdropFilter: "blur(20px)",
                    overflow: "hidden",
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
                    <HandPreview targetAngle={handAngle} isOK={isOK} />
                  </div>
                </div>
              ) : null
            }
          />

          {/* Hand preview box - floating (solo en Hero) */}
          {section.content.type === "hero" && (
            <HandPreviewBox
              position={section.handPosition}
              targetAngle={handAngle}
              isOK={isOK}
              compact={false}
            />
          )}
        </section>
      ))}

      {/* Mobile Navigation Buttons */}
      <MobileNavButton
        onClick={goToNextSection}
        isLastSection={activeSection === landingSections.length - 1}
        currentHandPosition={landingSections[activeSection]?.handPosition || "bottom-right"}
      />

      {/* Mobile Up Button (slides 2, 3, 4) - positioned next to the down button */}
      {activeSection >= 1 && (
        <button
          onClick={goToPrevSection}
          className="mobile-nav-button-up"
          style={{
            position: "fixed",
            bottom: "1rem",
            [landingSections[activeSection]?.handPosition === "bottom-right" ? "left" : "right"]: "6rem",
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
            <ChevronUp size={32} strokeWidth={2.5} color="#feca57" />
          </div>
        </button>
      )}

      {/* Global styles for transitions */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .fullscreen-section.active {
          opacity: 1 !important;
          transform: scale(1) !important;
        }

        /* Scroll padding to account for navbar */
        html {
          scroll-padding-top: 80px;
        }

        /* Mobile Up Button styles */
        .mobile-nav-button-up {
          animation: subtleBounce 3s ease-in-out infinite;
        }

        .mobile-nav-button-up:active {
          transform: scale(0.9) !important;
        }

        /* Solo visible en mobile */
        @media (min-width: 768px) {
          .mobile-nav-button-up {
            display: none !important;
          }
        }

        /* Tutorial floating hand - solo visible en mobile */
        @media (min-width: 1024px) {
          .tutorial-floating-hand {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
