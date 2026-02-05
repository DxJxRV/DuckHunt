"use client";

import { useRef, useEffect } from "react";

export default function BlackHoleTutorialGif() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handPointRef = useRef<HTMLImageElement | null>(null);
  const handOkRef = useRef<HTMLImageElement | null>(null);
  const planeSprite1Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite2Ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation state
    let handX = 0;
    let handY = 0;
    let handGesture = "point"; // "point" or "ok"
    let handTransition = 0; // 0-1 for crossfade
    let crosshairX = 0;
    let crosshairY = 0;
    let planeX = 0;
    let planeY = 0;
    let blackHoleActive = false;
    let blackHoleOpacity = 0;

    let animationStartTime = 0;
    let animationFrameId: number;

    // Load sprites
    const loadSprites = async () => {
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      };

      const [hPoint, hOk, p1, p2] = await Promise.all([
        loadImage("/sprites/hand-point.png"),
        loadImage("/sprites/hand-ok.png"),
        loadImage("/sprites/plane-1.png"),
        loadImage("/sprites/plane-2.png"),
      ]);

      handPointRef.current = hPoint;
      handOkRef.current = hOk;
      planeSprite1Ref.current = p1;
      planeSprite2Ref.current = p2;
    };

    // Responsive canvas sizing
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Initial positions
      handX = canvas.width * 0.2; // Left side (20%)
      handY = canvas.height / 2;
      crosshairX = canvas.width * 0.7;
      crosshairY = canvas.height / 2;
      planeX = canvas.width * 0.1;
      planeY = canvas.height / 2;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Lerp helper
    function lerp(start: number, end: number, t: number): number {
      return start + (end - start) * t;
    }

    // Draw crosshair
    function drawCrosshair(x: number, y: number) {
      if (!ctx) return;

      const size = 15;
      const gap = 7.5;

      ctx.strokeStyle = "#feca57";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      // Draw 4 lines
      ctx.beginPath();
      ctx.moveTo(x, y - gap);
      ctx.lineTo(x, y - gap - size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + gap);
      ctx.lineTo(x, y + gap + size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - gap, y);
      ctx.lineTo(x - gap - size, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + gap, y);
      ctx.lineTo(x + gap + size, y);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = "#feca57";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw hand with crossfade
    function drawHand(x: number, y: number, transition: number) {
      if (!ctx || !canvas) return;

      const pointSprite = handPointRef.current;
      const okSprite = handOkRef.current;
      if (!pointSprite || !okSprite) return;

      const size = Math.min(canvas.width, canvas.height) * 0.4; // Double size

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0); // Pointing right (no rotation needed)

      // Draw hand-point with opacity (1 - transition)
      if (transition < 1) {
        ctx.globalAlpha = 1 - transition;
        ctx.drawImage(pointSprite, -size / 2, -size / 2, size, size);
      }

      // Draw hand-ok with opacity (transition)
      if (transition > 0) {
        ctx.globalAlpha = transition;
        ctx.drawImage(okSprite, -size / 2, -size / 2, size, size);
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Draw plane
    function drawPlane(x: number, y: number, time: number) {
      if (!ctx) return;

      const frameIndex = Math.floor(time / 100) % 2;
      const sprite = frameIndex === 0 ? planeSprite1Ref.current : planeSprite2Ref.current;
      if (!sprite) return;

      const planeSize = 84;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0); // Flying right

      ctx.drawImage(sprite, -planeSize / 2, -planeSize / 2, planeSize, planeSize);

      // Plane glow
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, planeSize * 0.8);
      glowGradient.addColorStop(0, "rgba(200, 220, 255, 0.3)");
      glowGradient.addColorStop(1, "rgba(200, 220, 255, 0)");
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, planeSize * 0.8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();
    }

    // Draw black hole
    function drawBlackHole(x: number, y: number, time: number, opacity: number) {
      if (!ctx) return;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Outer glow
      const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 150);
      outerGlow.addColorStop(0, "rgba(138, 43, 226, 0.15)");
      outerGlow.addColorStop(0.5, "rgba(75, 0, 130, 0.08)");
      outerGlow.addColorStop(1, "rgba(138, 43, 226, 0)");

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(x, y, 150, 0, 2 * Math.PI);
      ctx.fill();

      // Spiraling particles
      for (let i = 0; i < 20; i++) {
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
      }

      // Central vortex
      const vortexSize = 100 + Math.sin(time * 2) * 10;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, vortexSize);
      gradient.addColorStop(0, "rgba(138, 43, 226, 0.7)");
      gradient.addColorStop(0.5, "rgba(138, 43, 226, 0.3)");
      gradient.addColorStop(1, "rgba(138, 43, 226, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, vortexSize, 0, 2 * Math.PI);
      ctx.fill();

      // Bright core
      const coreSize = 15 + Math.sin(time * 5) * 5;
      ctx.beginPath();
      ctx.arc(x, y, coreSize, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();

      ctx.restore();
    }

    // Main animation loop
    function animate() {
      if (!ctx || !canvas) return;

      const now = performance.now();
      if (animationStartTime === 0) {
        animationStartTime = now;
      }

      const elapsed = (now - animationStartTime) / 1000;
      const cycleTime = 6; // Total cycle: 6 seconds

      if (elapsed >= cycleTime) {
        animationStartTime = now;
      }

      const t = elapsed % cycleTime;
      const time = now / 1000;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animation sequence
      if (t < 2) {
        // Phase 1: Plane flies, crosshair tracks (0-2s)
        const progress = t / 2;
        planeX = lerp(canvas.width * 0.1, canvas.width * 0.7, progress);
        planeY = canvas.height / 2;
        crosshairX = lerp(canvas.width * 0.7, planeX, Math.min(progress * 1.5, 1)); // Crosshair catches up
        crosshairY = canvas.height / 2;
        handTransition = 0; // hand-point
        blackHoleActive = false;
        blackHoleOpacity = 0;
      } else if (t < 2.5) {
        // Phase 2: Hand transitions to OK (2-2.5s = 500ms)
        const progress = (t - 2) / 0.5;
        planeX = canvas.width * 0.7;
        planeY = canvas.height / 2;
        crosshairX = planeX;
        crosshairY = planeY;
        handTransition = progress; // Crossfade to hand-ok
        blackHoleActive = false;
        blackHoleOpacity = 0;
      } else if (t < 4.5) {
        // Phase 3: Black hole appears and sucks plane (2.5-4.5s = 2s)
        const progress = (t - 2.5) / 2;
        handTransition = 1; // hand-ok
        blackHoleActive = true;
        blackHoleOpacity = Math.min(progress * 2, 1); // Fade in quickly

        // Plane gets sucked in
        const suckProgress = Math.pow(progress, 2); // Accelerate towards center
        planeX = lerp(canvas.width * 0.7, crosshairX, suckProgress);
        planeY = lerp(canvas.height / 2, crosshairY, suckProgress);
        crosshairX = canvas.width * 0.7;
        crosshairY = canvas.height / 2;
      } else {
        // Phase 4: Pause before reset (4.5-6s = 1.5s)
        handTransition = 1;
        blackHoleActive = true;
        blackHoleOpacity = Math.max(1 - ((t - 4.5) / 1.5), 0); // Fade out
        planeX = -100; // Plane off-screen (destroyed)
        planeY = canvas.height / 2;
        crosshairX = canvas.width * 0.7;
        crosshairY = canvas.height / 2;
      }

      // Draw elements
      if (planeX > -50 && planeX < canvas.width + 50) {
        drawPlane(planeX, planeY, now);
      }

      drawCrosshair(crosshairX, crosshairY);

      if (blackHoleActive && blackHoleOpacity > 0) {
        drawBlackHole(crosshairX, crosshairY, time, blackHoleOpacity);
      }

      drawHand(handX, handY, handTransition);

      animationFrameId = requestAnimationFrame(animate);
    }

    // Load and start
    loadSprites().then(() => {
      animate();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: "16/9",
        background: "rgba(255, 255, 255, 0.05)",
        border: "2px dashed rgba(255, 255, 255, 0.2)",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
