"use client";

import { useRef, useEffect } from "react";
import { withBasePath } from "@/lib/basePath";

export default function AimTutorialGif() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handSpriteRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation state
    let handX = 0;
    let handY = 0;
    let handAngle = -90; // Initial: pointing up (original image points right, so -90)
    let crosshairX = 0;
    let crosshairY = 0;

    let animationStartTime = 0;
    let animationFrameId: number;

    // Load hand sprite
    const loadSprite = async () => {
      const img = new Image();
      img.src = withBasePath("/sprites/hand-point.png");
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          handSpriteRef.current = img;
          resolve();
        };
        img.onerror = reject;
      });
    };

    // Responsive canvas sizing
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Reset positions to center
      handX = canvas.width / 2;
      handY = canvas.height / 2;
      crosshairX = canvas.width / 2;
      crosshairY = canvas.height / 2;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Lerp helper (smooth interpolation)
    function lerp(start: number, end: number, t: number): number {
      return start + (end - start) * t;
    }

    // Draw crosshair
    function drawCrosshair(x: number, y: number) {
      if (!ctx || !canvas) return;

      const size = 15; // 25% smaller (20 * 0.75)
      const gap = 7.5; // 25% smaller (10 * 0.75)

      ctx.strokeStyle = "#feca57"; // Yellow color
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      // Top line
      ctx.beginPath();
      ctx.moveTo(x, y - gap);
      ctx.lineTo(x, y - gap - size);
      ctx.stroke();

      // Bottom line
      ctx.beginPath();
      ctx.moveTo(x, y + gap);
      ctx.lineTo(x, y + gap + size);
      ctx.stroke();

      // Left line
      ctx.beginPath();
      ctx.moveTo(x - gap, y);
      ctx.lineTo(x - gap - size, y);
      ctx.stroke();

      // Right line
      ctx.beginPath();
      ctx.moveTo(x + gap, y);
      ctx.lineTo(x + gap + size, y);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = "#feca57"; // Yellow color
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw hand
    function drawHand(x: number, y: number, angle: number) {
      if (!ctx || !canvas) return;

      const sprite = handSpriteRef.current;
      if (!sprite) return;

      const size = Math.min(canvas.width, canvas.height) * 0.2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180); // Convert degrees to radians

      // Draw hand sprite
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    }

    // Main animation loop
    function animate() {
      if (!ctx || !canvas) return;

      const now = performance.now();
      if (animationStartTime === 0) {
        animationStartTime = now;
      }

      const elapsed = (now - animationStartTime) / 1000; // in seconds
      const cycleTime = 8; // Total cycle: 8 seconds

      // Reset cycle
      if (elapsed >= cycleTime) {
        animationStartTime = now;
      }

      const t = elapsed % cycleTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animation sequence
      let targetHandAngle = -90; // pointing up
      let targetCrosshairX = canvas.width / 2;
      let targetCrosshairY = canvas.height / 2;

      if (t < 0.5) {
        // Phase 1: Initial position (0-0.5s)
        targetHandAngle = -90; // pointing up
        targetCrosshairX = canvas.width / 2;
        targetCrosshairY = canvas.height / 2;
      } else if (t < 2.5) {
        // Phase 2: Point right (0.5-2.5s)
        const progress = Math.min((t - 0.5) / 2, 1);
        targetHandAngle = lerp(-90, 0, progress); // from up to right
        targetCrosshairX = lerp(canvas.width / 2, canvas.width - 50, progress);
        targetCrosshairY = canvas.height / 2;
      } else if (t < 4.5) {
        // Phase 3: Point bottom-right (2.5-4.5s)
        const progress = Math.min((t - 2.5) / 2, 1);
        targetHandAngle = lerp(0, 45, progress); // from right to bottom-right
        targetCrosshairX = lerp(canvas.width - 50, canvas.width - 50, progress);
        targetCrosshairY = lerp(canvas.height / 2, canvas.height - 50, progress);
      } else if (t < 7.5) {
        // Phase 4-5: Hand rotates fast continuously (4.5-7.5s = 3 seconds)
        const handProgress = Math.min((t - 4.5) / 3, 1);
        targetHandAngle = lerp(45, -135, handProgress); // Rotate 180° uniformly in 3s

        // Crosshair behavior during this phase
        if (t < 5.5) {
          // Crosshair paused at bottom-right (4.5-5.5s = 1 second)
          targetCrosshairX = canvas.width - 50;
          targetCrosshairY = canvas.height - 50;
        } else {
          // Crosshair moves to top-left (5.5-7.5s = 2 seconds)
          const crosshairProgress = Math.min((t - 5.5) / 2, 1);
          targetCrosshairX = lerp(canvas.width - 50, 50, crosshairProgress);
          targetCrosshairY = lerp(canvas.height - 50, 50, crosshairProgress);
        }
      } else {
        // Phase 6: Pause at top-left (7.5-8s)
        targetHandAngle = -135;
        targetCrosshairX = 50;
        targetCrosshairY = 50;
      }

      // Smooth interpolation for current values
      handAngle = lerp(handAngle, targetHandAngle, 0.1);
      crosshairX = lerp(crosshairX, targetCrosshairX, 0.1);
      crosshairY = lerp(crosshairY, targetCrosshairY, 0.1);

      // Draw crosshair
      drawCrosshair(crosshairX, crosshairY);

      // Draw hand
      drawHand(handX, handY, handAngle);

      animationFrameId = requestAnimationFrame(animate);
    }

    // Load and start
    loadSprite().then(() => {
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
