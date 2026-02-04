"use client";

import { useRef, useEffect } from "react";

export default function ShieldAngelGif() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sprite refs
  const angelSprite1Ref = useRef<HTMLImageElement | null>(null);
  const angelSprite2Ref = useRef<HTMLImageElement | null>(null);
  const angelSprite3Ref = useRef<HTMLImageElement | null>(null);
  const angelSprite4Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite1Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite2Ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation state (local variables - no state to avoid re-renders)
    let angelHp = 100;
    let angelX = 0;
    let angelY = 0;
    let angelRadius = 60;

    let planes: { x: number; y: number; id: number }[] = [];
    let bullets: { x: number; y: number; vx: number; vy: number }[] = [];

    let lastShootTime = new Map<number, number>();
    let animationStartTime = 0;
    let gameOverTime = 0;
    let isGameOver = false;

    let animationFrameId: number;

    // Helper: Load image
    function loadImage(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    }

    // Responsive canvas sizing
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Reposition elements
      angelX = canvas.width / 2;
      angelY = canvas.height / 2;
      angelRadius = Math.min(canvas.width, canvas.height) * 0.15;

      // Reposition 6 planes in ribbon formation (3 top, 3 bottom)
      planes = [
        // Top row
        { x: canvas.width * 0.2, y: canvas.height * 0.15, id: 0 },
        { x: canvas.width * 0.5, y: canvas.height * 0.15, id: 1 },
        { x: canvas.width * 0.8, y: canvas.height * 0.15, id: 2 },
        // Bottom row
        { x: canvas.width * 0.2, y: canvas.height * 0.85, id: 3 },
        { x: canvas.width * 0.5, y: canvas.height * 0.85, id: 4 },
        { x: canvas.width * 0.8, y: canvas.height * 0.85, id: 5 },
      ];
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Load sprites in parallel
    const loadSprites = async () => {
      const [a1, a2, a3, a4, p1, p2] = await Promise.all([
        loadImage("/sprites/shield-1.png"),
        loadImage("/sprites/shield-2.png"),
        loadImage("/sprites/shield-3.png"),
        loadImage("/sprites/shield-4.png"),
        loadImage("/sprites/plane-1.png"),
        loadImage("/sprites/plane-2.png"),
      ]);

      angelSprite1Ref.current = a1;
      angelSprite2Ref.current = a2;
      angelSprite3Ref.current = a3;
      angelSprite4Ref.current = a4;
      planeSprite1Ref.current = p1;
      planeSprite2Ref.current = p2;
    };

    // Spawn bullets (high frequency attack with 90% accuracy)
    function spawnBullets(now: number) {
      planes.forEach((plane) => {
        const lastShot = lastShootTime.get(plane.id) || 0;

        // Ultra high frequency: shoot every 250ms (2x faster)
        if (now - lastShot > 250) {
          const dx = angelX - plane.x;
          const dy = angelY - plane.y;
          const angleToAngel = Math.atan2(dy, dx);

          // 90% accuracy: only 10% miss with small spread (±5 degrees)
          const spreadAngle = Math.random() < 0.9
            ? (Math.random() - 0.5) * 0.175  // ±5° for accurate shots (90%)
            : (Math.random() - 0.5) * 1.0;   // ±28° for misses (10%)

          const finalAngle = angleToAngel + spreadAngle;

          const speed = 6;

          bullets.push({
            x: plane.x,
            y: plane.y,
            vx: Math.cos(finalAngle) * speed,
            vy: Math.sin(finalAngle) * speed,
          });

          lastShootTime.set(plane.id, now);
        }
      });
    }

    // Update bullets (movement + collision)
    function updateBullets() {
      bullets = bullets.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Collision with angel
        const dx = bullet.x - angelX;
        const dy = bullet.y - angelY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < angelRadius) {
          angelHp = Math.max(0, angelHp - 1);
          return false; // Remove bullet
        }

        // Keep if inside canvas
        return (
          bullet.x > 0 &&
          bullet.x < canvas.width &&
          bullet.y > 0 &&
          bullet.y < canvas.height
        );
      });
    }

    // Draw angel with HP-based sprite
    function drawAngel(now: number) {
      const time = now / 1000;
      const hpRatio = angelHp / 100;

      // Select sprite based on HP
      let sprite;
      if (hpRatio > 0.75) sprite = angelSprite1Ref.current;
      else if (hpRatio > 0.5) sprite = angelSprite2Ref.current;
      else if (hpRatio > 0.25) sprite = angelSprite3Ref.current;
      else sprite = angelSprite4Ref.current;

      // Responsive size
      const size = Math.min(canvas.width, canvas.height) * 0.28;

      // Glow (16-pointed star)
      const glowIntensity = 0.85 + Math.sin(time * 2) * 0.1;
      const starSize = size * 0.4;

      const color =
        hpRatio > 0.5
          ? `rgba(255, 235, 100, ${glowIntensity * 0.25})`
          : `rgba(255, 80, 80, ${glowIntensity * 0.3})`;

      ctx.fillStyle = color;
      ctx.beginPath();

      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8 + time * 0.3;
        const outerX = angelX + Math.cos(angle) * starSize;
        const outerY = angelY + Math.sin(angle) * starSize;

        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
      }

      ctx.fill();

      // Draw sprite
      if (sprite) {
        ctx.drawImage(sprite, angelX - size / 2, angelY - size / 2, size, size);
      }
    }

    // Draw HP bar
    function drawHpBar() {
      const hpRatio = angelHp / 100;

      const barWidth = Math.min(canvas.width * 0.35, 160);
      const barHeight = 8;
      const barX = angelX - barWidth / 2;
      const barY = angelY - angelRadius - 20;

      // Background
      ctx.fillStyle = "#333333";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // HP fill with dynamic color
      ctx.fillStyle =
        hpRatio > 0.5 ? "#00ff88" : hpRatio > 0.25 ? "#feca57" : "#ff6b6b";

      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    // Draw planes
    function drawPlanes(now: number) {
      const spriteIndex = Math.floor(now / 100) % 2;
      const sprite =
        spriteIndex === 0 ? planeSprite1Ref.current : planeSprite2Ref.current;

      if (!sprite) return;

      planes.forEach((plane) => {
        ctx.save();
        ctx.translate(plane.x, plane.y);

        // Rotate towards angel
        const dx = angelX - plane.x;
        const dy = angelY - plane.y;
        const angle = Math.atan2(dy, dx);
        ctx.rotate(angle);

        const size = Math.min(canvas.width, canvas.height) * 0.15;

        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

        // Glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.8);
        glowGradient.addColorStop(0, "rgba(200, 220, 255, 0.35)");
        glowGradient.addColorStop(1, "rgba(200, 220, 255, 0)");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      });
    }

    // Draw bullets
    function drawBullets() {
      bullets.forEach((bullet) => {
        // Bullet core
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Glow
        ctx.fillStyle = "rgba(255, 107, 107, 0.4)";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw Game Over screen
    function drawGameOver(now: number) {
      const elapsed = now - gameOverTime;
      const flashOpacity = Math.max(0, 0.5 - (elapsed / 1000) * 0.5);

      // Red flash background
      ctx.fillStyle = `rgba(255, 0, 0, ${flashOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // "GAME OVER" text
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const fontSize = Math.min(canvas.width, canvas.height) * 0.12;
      ctx.font = `${fontSize}px 'Press Start 2P', monospace`;

      // Gradient text
      const gradient = ctx.createLinearGradient(
        canvas.width / 2 - 150,
        0,
        canvas.width / 2 + 150,
        0
      );
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(1, "#feca57");

      ctx.fillStyle = gradient;
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

      ctx.restore();
    }

    // Reset animation
    function resetAnimation(now: number) {
      angelHp = 100;
      angelX = canvas.width / 2;
      angelY = canvas.height / 2;
      angelRadius = Math.min(canvas.width, canvas.height) * 0.15;

      bullets = [];
      lastShootTime.clear();

      // 6 planes in ribbon formation (3 top, 3 bottom)
      planes = [
        // Top row
        { x: canvas.width * 0.2, y: canvas.height * 0.15, id: 0 },
        { x: canvas.width * 0.5, y: canvas.height * 0.15, id: 1 },
        { x: canvas.width * 0.8, y: canvas.height * 0.15, id: 2 },
        // Bottom row
        { x: canvas.width * 0.2, y: canvas.height * 0.85, id: 3 },
        { x: canvas.width * 0.5, y: canvas.height * 0.85, id: 4 },
        { x: canvas.width * 0.8, y: canvas.height * 0.85, id: 5 },
      ];

      isGameOver = false;
      gameOverTime = 0;
      animationStartTime = now;
    }

    // Main animation loop
    function animate() {
      const now = performance.now();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isGameOver) {
        // Game Over phase (2 seconds)
        if (now - gameOverTime > 2000) {
          resetAnimation(now);
        } else {
          drawGameOver(now);
        }
      } else {
        // Normal gameplay phase
        updateBullets();
        spawnBullets(now);

        // Draw everything
        drawPlanes(now);
        drawBullets();
        drawAngel(now);
        drawHpBar();

        // Check game over
        if (angelHp <= 0 && !isGameOver) {
          isGameOver = true;
          gameOverTime = now;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    // Initialize
    loadSprites().then(() => {
      animationStartTime = performance.now();
      animate();
    });

    // Cleanup
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
        maxHeight: "400px",
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
