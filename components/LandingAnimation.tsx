"use client";

import { useEffect, useRef } from "react";

export default function LandingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeSprite1Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite2Ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    console.log(`[MOUNT] 🎬 LandingAnimation montado`);

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
    let planes: { id: number; x: number; y: number; vx: number; vy: number; spawnTime: number; ttl: number }[] = [];
    let nextId = 0;
    let crosshair = { x: canvas.width / 2, y: canvas.height / 2 };
    let blackHole: { x: number; y: number; startTime: number } | null = null;
    let targetPlaneId: number | null = null;
    let okGestureStartTime: number = 0;
    let totalKilled = 0;
    let lastSpawn = 0;

    // Spawn single plane
    function spawnPlane() {
      const edge = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      const speed = 2 + Math.random() * 2;

      if (edge === 0) {
        x = Math.random() * canvas.width;
        y = -50;
        vx = (Math.random() - 0.5) * 2;
        vy = speed;
      } else if (edge === 1) {
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * 2;
      } else if (edge === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
        vx = (Math.random() - 0.5) * 2;
        vy = -speed;
      } else {
        x = -50;
        y = Math.random() * canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * 2;
      }

      const now = performance.now();
      const ttl = 2000 + Math.random() * 2000; // 4-6 seconds lifecycle

      planes.push({
        id: nextId++,
        x, y, vx, vy,
        spawnTime: now,
        ttl,
      });

      console.log(`[SPAWN] Avión #${nextId - 1} | Total vivos: ${planes.length} | TTL: ${Math.round(ttl)}ms`);
    }


    // Draw black hole
    function drawBlackHole(x: number, y: number, time: number) {
      const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 150);
      outerGlow.addColorStop(0, "rgba(138, 43, 226, 0.15)");
      outerGlow.addColorStop(0.5, "rgba(75, 0, 130, 0.08)");
      outerGlow.addColorStop(1, "rgba(138, 43, 226, 0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(x, y, 150, 0, 2 * Math.PI);
      ctx.fill();

      // Spiral particles
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

      // Vortex
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
    let animationFrameId: number;
    function animate() {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn 1 plane at a time (simple pattern)
      if (planes.length === 0 && !blackHole && now - lastSpawn > 3000) {
        spawnPlane();
        lastSpawn = now;
      }

      // Canvas dimensions
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const navbarHeight = 80; // Height of navbar to avoid

      // Update planes

      planes.forEach(plane => {
        plane.x += plane.vx;
        plane.y += plane.vy;

        // Bounce off walls (like in game)
        const margin = 50;
        if (plane.x - margin < 0 || plane.x + margin > canvasWidth) {
          plane.vx = -plane.vx;
          plane.x = Math.max(margin, Math.min(canvasWidth - margin, plane.x));
        }
        if (plane.y - margin < navbarHeight || plane.y + margin > canvasHeight) {
          plane.vy = -plane.vy;
          plane.y = Math.max(navbarHeight + margin, Math.min(canvasHeight - margin, plane.y));
        }
      });

      // Select target plane
      if (targetPlaneId === null && planes.length > 0 && !blackHole) {
        // Target oldest plane
        const oldest = planes.reduce((prev, curr) =>
          curr.spawnTime < prev.spawnTime ? curr : prev
        );
        targetPlaneId = oldest.id;
        okGestureStartTime = 0;
        console.log(`[TARGET] Seleccionado avión #${targetPlaneId} | Edad: ${Math.round(now - oldest.spawnTime)}ms | TTL: ${oldest.ttl}ms`);
      }

      // If target plane was consumed or expired, clear target
      const targetExists = planes.find(p => p.id === targetPlaneId);
      if (targetPlaneId !== null && !targetExists) {
        targetPlaneId = null;
        okGestureStartTime = 0;
      }

      const targetPlane = planes.find(p => p.id === targetPlaneId);

      // Move crosshair toward target
      if (targetPlane) {
        const dx = targetPlane.x - crosshair.x;
        const dy = targetPlane.y - crosshair.y;

        // Fast tracking
        const speed = 0.08;
        crosshair.x += dx * speed;
        crosshair.y += dy * speed;

        // Check if target plane reached its TTL → activate OK gesture
        const planeAge = now - targetPlane.spawnTime;
        if (planeAge >= targetPlane.ttl && okGestureStartTime === 0 && !blackHole) {
          console.log(`[OK GESTURE] Activado para avión #${targetPlaneId} | Edad: ${Math.round(planeAge)}ms >= TTL: ${Math.round(targetPlane.ttl)}ms`);
          okGestureStartTime = now; // Start OK gesture animation
        }

        // After 1 second of OK gesture, activate black hole
        if (okGestureStartTime > 0 && now - okGestureStartTime >= 1000 && !blackHole) {
          console.log(`[BLACK HOLE] Activado en (${Math.round(crosshair.x)}, ${Math.round(crosshair.y)})`);
          blackHole = { x: crosshair.x, y: crosshair.y, startTime: now };
        }
      }

      // Emit state for hand preview
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angleToTarget = Math.atan2(crosshair.y - centerY, crosshair.x - centerX);

      const event = new CustomEvent('landingAnimationState', {
        detail: {
          angle: angleToTarget,
          isOK: okGestureStartTime > 0,
        }
      });
      window.dispatchEvent(event);

      // Draw planes
      planes.forEach(plane => {
        ctx.save();
        ctx.translate(plane.x, plane.y);
        const angle = Math.atan2(plane.vy, plane.vx);
        ctx.rotate(angle);

        const size = 84;
        const sprite = Math.floor(now / 100) % 2 === 0 ? planeSprite1Ref.current : planeSprite2Ref.current;

        if (sprite) {
          ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
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
      });

      // Draw crosshair
      if (planes.length > 0) {
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

        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(crosshair.x, crosshair.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Black hole
      if (blackHole) {
        const time = now / 1000;
        drawBlackHole(blackHole.x, blackHole.y, time);

        // Apply gravity to target plane (guaranteed consumption)
        if (targetPlane) {
          const dx = blackHole.x - targetPlane.x;
          const dy = blackHole.y - targetPlane.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Strong gravity within large radius (always catches)
          if (dist < 300) {
            // Variable force for realistic timing (0.8-2 seconds to consume)
            const baseForce = 400 + Math.random() * 200; // Randomize per plane
            const force = baseForce / (dist * dist);
            const maxForce = 3.0; // Higher max force
            const cappedForce = Math.min(force, maxForce);

            targetPlane.vx += (dx / dist) * cappedForce;
            targetPlane.vy += (dy / dist) * cappedForce;

            // Consume when close (guaranteed)
            if (dist < 15) {
              console.log(`[CONSUME] Avión #${targetPlaneId} consumido | TotalKilled: ${totalKilled + 1} | Quedan: ${planes.length - 1} aviones`);
              planes = planes.filter(p => p.id !== targetPlaneId);
              totalKilled++;
              targetPlaneId = null;
            }
          }
        }

        // Close black hole after consuming
        if (targetPlaneId === null && now - blackHole.startTime > 800) {
          console.log(`[BLACK HOLE CLOSE] Cerrado | TotalKilled: ${totalKilled} | Planes restantes: ${planes.length}`);
          blackHole = null;
          okGestureStartTime = 0;

          // Auto-reset after 4 planes (prevents memory accumulation)
          // Trigger AFTER black hole closes to ensure clean state
          if (totalKilled >= 4) {
            console.log(`[RESET] ⚠️ Reciclando componente después de ${totalKilled} aviones`);
            const resetEvent = new CustomEvent('animationCycleComplete');
            window.dispatchEvent(resetEvent);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      console.log(`[UNMOUNT] 🛑 LandingAnimation desmontado - Cancelando animationFrame #${animationFrameId}`);
      cancelAnimationFrame(animationFrameId);
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
        zIndex: 50, // Por encima de contenido pero debajo de navbar
        pointerEvents: "none",
      }}
    />
  );
}
