"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { landingSections } from "@/lib/landing-sections";
import SectionBackground from "@/components/SectionBackground";
import SectionContent from "@/components/SectionContent";
import HandPreviewBox from "@/components/HandPreviewBox";
import MobileNavButton from "@/components/MobileNavButton";

// Import animation dynamically (client-only)
const LandingAnimation = dynamic(() => import("@/components/LandingAnimation"), {
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
            setActiveSection(index);
            entry.target.classList.add("active");
          } else {
            entry.target.classList.remove("active");
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "-10% 0px",
      }
    );

    document.querySelectorAll(".fullscreen-section").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Mobile navigation
  const goToNextSection = () => {
    if (activeSection < landingSections.length - 1) {
      const nextSection = document.getElementById(`section-${activeSection + 1}`);
      nextSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "scroll",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
      }}
    >
      {/* Animated Canvas - Persists across all sections */}
      <LandingAnimation key={resetKey} />

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
              fontWeight: 700,
              background: "linear-gradient(135deg, #ff6b6b, #feca57)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VOID HUNTER
          </div>

          <Link
            href="/tracking"
            style={{
              padding: "0.5rem 1.5rem",
              background: "linear-gradient(135deg, #ff6b6b, #ff5252)",
              borderRadius: "20px",
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
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
          className="fullscreen-section"
          style={{
            height: "100vh",
            scrollSnapAlign: "start",
            position: "relative",
            opacity: 0,
            transform: "scale(0.95)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          {/* Background for this section */}
          <SectionBackground config={section.background} />

          {/* Section content */}
          <SectionContent
            config={section.content}
            handPosition={section.handPosition}
          />

          {/* Hand preview box (alternating position) */}
          <HandPreviewBox
            position={section.handPosition}
            targetAngle={handAngle}
            isOK={isOK}
          />
        </section>
      ))}

      {/* Mobile Navigation Button */}
      <MobileNavButton
        onClick={goToNextSection}
        isLastSection={activeSection === landingSections.length - 1}
      />

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
      `}</style>
    </div>
  );
}
