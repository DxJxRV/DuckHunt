"use client";

import { useEffect, useRef } from "react";

interface HandPreviewProps {
  targetAngle: number;
  isOK: boolean;
}

export default function HandPreview({ targetAngle, isOK }: HandPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handPointRef = useRef<HTMLImageElement | null>(null);
  const handPinchingRef = useRef<HTMLImageElement | null>(null);
  const handOKRef = useRef<HTMLImageElement | null>(null);
  const okProgressRef = useRef<number>(0);

  // Use refs to access latest prop values in animation loop
  const targetAngleRef = useRef(targetAngle);
  const isOKRef = useRef(isOK);

  // Update refs when props change
  targetAngleRef.current = targetAngle;
  isOKRef.current = isOK;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load hand sprites
    const point = new Image();
    const pinching = new Image();
    const ok = new Image();

    point.src = "/sprites/hand-point.png";
    pinching.src = "/sprites/hand-pinching.png";
    ok.src = "/sprites/hand-ok.png";

    point.onload = () => { handPointRef.current = point; };
    pinching.onload = () => { handPinchingRef.current = pinching; };
    ok.onload = () => { handOKRef.current = ok; };

    canvas.width = 500;
    canvas.height = 500;

    let animationFrameId: number;
    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animate OK gesture progress (0 = point, 1 = OK)
      const targetProgress = isOKRef.current ? 1 : 0;
      const speed = 0.06; // Smooth transition
      okProgressRef.current += (targetProgress - okProgressRef.current) * speed;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(targetAngleRef.current);

      const handSize = canvas.width * 0.7;

      // Direct crossfade between point and ok (no intermediate sprite)
      const pointSprite = handPointRef.current;
      const okSprite = handOKRef.current;

      // Draw point sprite (fading out as OK progress increases)
      if (pointSprite) {
        ctx.globalAlpha = 1 - okProgressRef.current;
        ctx.drawImage(pointSprite, -handSize / 2, -handSize / 2, handSize, handSize);
      }

      // Draw OK sprite (fading in as OK progress increases)
      if (okSprite) {
        ctx.globalAlpha = okProgressRef.current;
        ctx.drawImage(okSprite, -handSize / 2, -handSize / 2, handSize, handSize);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup animation loop
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // No dependencies - mount once, cleanup on unmount

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
