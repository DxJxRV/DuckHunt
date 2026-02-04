"use client";

import { useEffect, useRef } from "react";

export default function LandingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeSprite1Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite2Ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load plane sprites
    const sprite1 = new Image();
    const sprite2 = new Image();
    sprite1.src = "/sprites/plane-1.png";
    sprite2.src = "/sprites/plane-2.png";

    sprite1.onload = () => { planeSprite1Ref.current = sprite1; };
    sprite2.onload = () => { planeSprite2Ref.current = sprite2; };

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Game state
    let plane: { x: number; y: number; vx: number; vy: number; alive: boolean; spawnTime: number; catchTime: number } | null = null;
    let crosshair = { x: canvas.width / 2, y: canvas.height / 2 };
    let blackHole: { x: number; y: number; active: boolean; startTime: number } | null = null;
    let lastSpawn = 0;

    // Calculate if plane will exit soon
    function willExitSoon(p: any) {
      const margin = 100;
      const stepsToExit = Math.min(
        p.vx > 0 ? (canvas.width + margin - p.x) / p.vx : (p.x + margin) / -p.vx,
        p.vy > 0 ? (canvas.height + margin - p.y) / p.vy : (p.y + margin) / -p.vy
      );
      return stepsToExit < 60; // ~1 second at 60fps
    }

    // Spawn plane from random edge
    function spawnPlane() {
      const edge = Math.floor(Math.random() * 4);
      let x, y, vx, vy;

      const speed = 2.5 + Math.random() * 1.5;

      if (edge === 0) {
        x = Math.random() * canvas.width;
        y = -50;
        vx = (Math.random() - 0.5) * 3;
        vy = speed;
      } else if (edge === 1) {
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * 3;
      } else if (edge === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
        vx = (Math.random() - 0.5) * 3;
        vy = -speed;
      } else {
        x = -50;
        y = Math.random() * canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * 3;
      }

      const now = performance.now();
      plane = { x, y, vx, vy, alive: true, spawnTime: now, catchTime: now + 3000 + Math.random() * 2000 };
    }

    // Draw black hole (from game)
    function drawBlackHole(x: number, y: number, time: number) {
      // Outer glow
      const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 150);
      outerGlow.addColorStop(0, "rgba(138, 43, 226, 0.15)");
      outerGlow.addColorStop(0.5, "rgba(75, 0, 130, 0.08)");
      outerGlow.addColorStop(1, "rgba(138, 43, 226, 0)");

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(x, y, 150, 0, 2 * Math.PI);
      ctx.fill();

      // Spiral particles (30 for landing)
      for (let i = 0; i < 30; i++) {
        const angleOffset = (i * 2.4) + (Math.sin(i * 0.5) * 0.3);
        const angle = (time * 3 + angleOffset) % (Math.PI * 2);
        const distanceOffset = (i * 2.3) % 140;
        const distance = 140 - ((time * 80 + distanceOffset) % 140);
        const spiralOffset = Math.sin(distance / 20 + i * 0.1) * 12;

        const px = x + Math.cos(angle) * (distance + spiralOffset);
        const py = y + Math.sin(angle) * (distance + spiralOffset);
        const particleAlpha = (1 - (distance / 140)) * 0.6;
        const particleSize = 1 + (1 - distance / 140) * 2;

        ctx.beginPath();
        ctx.arc(px, py, particleSize, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(186, 85, 211, ${particleAlpha})`;
        ctx.fill();

        if (distance < 70) {
          ctx.beginPath();
          ctx.arc(px, py, particleSize * 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(255, 0, 255, ${particleAlpha * 0.2})`;
          ctx.fill();
        }
      }

      // Central vortex
      const vortexSize = 100 + Math.sin(time * 2) * 10;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, vortexSize);
      gradient.addColorStop(0, "rgba(138, 43, 226, 0.7)");
      gradient.addColorStop(0.2, "rgba(75, 0, 130, 0.5)");
      gradient.addColorStop(0.5, "rgba(138, 43, 226, 0.3)");
      gradient.addColorStop(0.8, "rgba(186, 85, 211, 0.15)");
      gradient.addColorStop(1, "rgba(138, 43, 226, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, vortexSize, 0, 2 * Math.PI);
      ctx.fill();

      // Core
      const coreSize = 15 + Math.sin(time * 5) * 5;
      ctx.beginPath();
      ctx.arc(x, y, coreSize, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 100, 255, ${0.7 + Math.sin(time * 7) * 0.3})`;
      ctx.fill();
    }

    // Animation loop
    function animate() {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn plane every 6-10 seconds
      if (!plane && !blackHole && now - lastSpawn > 6000 + Math.random() * 4000) {
        spawnPlane();
        lastSpawn = now;
      }

      // Update and draw plane
      if (plane && plane.alive) {
        // Move plane
        plane.x += plane.vx;
        plane.y += plane.vy;

        // Check if about to exit (perfect timing for catch)
        const shouldCatch = willExitSoon(plane);

        // Move crosshair - accelerate when it's time to catch
        const dx = plane.x - crosshair.x;
        const dy = plane.y - crosshair.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Speed up dramatically when it's time
        const speed = shouldCatch ? 0.15 : 0.03;
        crosshair.x += dx * speed;
        crosshair.y += dy * speed;

        // Activate black hole when caught (just before exit)
        if (shouldCatch && distance < 40 && !blackHole) {
          blackHole = { x: crosshair.x, y: crosshair.y, active: true, startTime: now };
        }

        // Remove if truly out of bounds
        if (
          plane.x < -200 || plane.x > canvas.width + 200 ||
          plane.y < -200 || plane.y > canvas.height + 200
        ) {
          plane = null;
          blackHole = null;
        } else {
          // Draw plane with sprite
          ctx.save();
          ctx.translate(plane.x, plane.y);
          const angle = Math.atan2(plane.vy, plane.vx);
          ctx.rotate(angle);

          const size = 84;
          const sprite = Math.floor(now / 100) % 2 === 0 ? planeSprite1Ref.current : planeSprite2Ref.current;

          if (sprite) {
            ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
          } else {
            // Fallback triangle
            ctx.fillStyle = "#ff6b6b";
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(-10, -10);
            ctx.lineTo(-10, 10);
            ctx.closePath();
            ctx.fill();
          }

          // Glow
          const glowSize = size * 0.8;
          const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
          glowGradient.addColorStop(0, "rgba(200, 220, 255, 0.3)");
          glowGradient.addColorStop(1, "rgba(200, 220, 255, 0)");

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(0, 0, glowSize, 0, 2 * Math.PI);
          ctx.fill();

          ctx.restore();
        }
      }

      // Draw crosshair (only when plane exists)
      if (plane) {
        const size = 20;
        const gap = 10;

        ctx.strokeStyle = "#ff6b6b";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(crosshair.x, crosshair.y - gap);
        ctx.lineTo(crosshair.x, crosshair.y - gap - size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(crosshair.x, crosshair.y + gap);
        ctx.lineTo(crosshair.x, crosshair.y + gap + size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(crosshair.x - gap, crosshair.y);
        ctx.lineTo(crosshair.x - gap - size, crosshair.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(crosshair.x + gap, crosshair.y);
        ctx.lineTo(crosshair.x + gap + size, crosshair.y);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(crosshair.x, crosshair.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Black hole physics and rendering
      if (blackHole && blackHole.active) {
        const time = now / 1000;
        drawBlackHole(blackHole.x, blackHole.y, time);

        // Apply gravity to plane
        if (plane) {
          const dx = blackHole.x - plane.x;
          const dy = blackHole.y - plane.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const force = 500 / (dist * dist);
            const maxForce = 2.0;
            const cappedForce = Math.min(force, maxForce);

            plane.vx += (dx / dist) * cappedForce;
            plane.vy += (dy / dist) * cappedForce;

            // Consume when very close
            if (dist < 10) {
              plane = null;
            }
          }
        }

        // Close black hole 1.5 seconds after consuming
        if (!plane && now - blackHole.startTime > 1500) {
          blackHole = null;
        }
      }

      requestAnimationFrame(animate);
    }

    // Start animation
    animate();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
