"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
  FaceDetector,
} from "@mediapipe/tasks-vision";
import {
  WASM_FILES_PATH,
  MODEL_PATH,
  HAND_CONNECTIONS,
  EMA_ALPHA,
  FIST_THRESHOLD,
  FIRE_DEBOUNCE_MS,
  FIRE_DISPLAY_MS,
  LANDMARKS,
  CROSSHAIR_SENSITIVITY,
  CROSSHAIR_DEADZONE,
  MAX_PLANES_ALIVE,
  TOTAL_PLANES,
  SPAWN_INTERVAL_MS,
} from "@/lib/mediapipe-config";

type Status = "initializing" | "loading" | "ready" | "error";

interface Duck {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alive: boolean;
  hp: number;
  maxHp: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromDuckId: number;
}

export default function HandTracker() {
  // State
  const [status, setStatus] = useState<Status>("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [hitMessage, setHitMessage] = useState<string | null>(null);
  const [isFistDetected, setIsFistDetected] = useState<boolean>(false);
  const [handsDetected, setHandsDetected] = useState<{
    right: boolean;
    left: boolean;
  }>({ right: false, left: false });
  const [totalSpawned, setTotalSpawned] = useState<number>(0);
  const [planesKilled, setPlanesKilled] = useState<number>(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Shield position (moves to random targets every 5 seconds)
  const shieldPositionRef = useRef<{ x: number; y: number } | null>(null);
  const shieldTargetRef = useRef<{ x: number; y: number } | null>(null);
  const lastShieldMoveRef = useRef<number>(0);

  // Crosshair position (independent from hand position)
  const crosshairPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Smoothed wrist position (EMA for stability)
  const smoothedWristRef = useRef<{ x: number; y: number } | null>(null);

  // FPS calculation
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsUpdateIntervalRef = useRef<number>(0);

  // Fire debounce
  const lastFireTimeRef = useRef<number>(0);
  const isFistClosedRef = useRef<boolean>(false);
  const isFistDetectedRef = useRef<boolean>(false);

  // Ducks ref for access in animation loop
  const ducksRef = useRef<Duck[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const lastShootTimeRef = useRef<Map<number, number>>(new Map());
  const playerHpRef = useRef<number>(100);
  const lastSpawnTimeRef = useRef<number>(0);
  const nextDuckIdRef = useRef<number>(0);
  const factoryProgressRef = useRef<number>(0); // 0 to 1 progress of current plane being built
  const totalSpawnedRef = useRef<number>(0);
  const planesKilledRef = useRef<number>(0);

  // Plane sprites
  const planeSprite1Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite2Ref = useRef<HTMLImageElement | null>(null);
  const spritesLoadedRef = useRef<boolean>(false);

  // Audio
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const engineSoundRef = useRef<HTMLAudioElement | null>(null);
  const damageSoundRef = useRef<HTMLAudioElement | null>(null);
  const explosionSoundRef = useRef<HTMLAudioElement | null>(null);
  const audioInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // Load plane sprites
    const loadSprites = async () => {
      const img1 = new Image();
      const img2 = new Image();

      img1.src = "/sprites/plane-1.png";
      img2.src = "/sprites/plane-2.png";

      await Promise.all([
        new Promise((resolve) => { img1.onload = resolve; }),
        new Promise((resolve) => { img2.onload = resolve; }),
      ]);

      planeSprite1Ref.current = img1;
      planeSprite2Ref.current = img2;
      spritesLoadedRef.current = true;
    };

    // Load audio files
    const loadAudio = () => {
      const bgMusic = new Audio("/sounds/background-music.mp3");
      const engine = new Audio("/sounds/engine.mp3");
      const damage = new Audio("/sounds/damage.mp3");
      const explosion = new Audio("/sounds/explosion.mp3");

      bgMusic.loop = true;
      bgMusic.volume = 0.3;

      engine.loop = true;
      engine.volume = 0;

      damage.volume = 0.5;
      explosion.volume = 0.7;

      backgroundMusicRef.current = bgMusic;
      engineSoundRef.current = engine;
      damageSoundRef.current = damage;
      explosionSoundRef.current = explosion;
    };

    // Initialize audio on first user interaction
    const initAudio = async () => {
      if (audioInitializedRef.current) return;

      try {
        await backgroundMusicRef.current?.play();
        await engineSoundRef.current?.play();
        audioInitializedRef.current = true;
      } catch (e) {
        console.log("Audio autoplay blocked, will retry on interaction");
      }
    };

    async function initialize() {
      try {
        setStatus("loading");

        // Load sprites first
        await loadSprites();

        // Load audio files
        loadAudio();

        // Load MediaPipe FilesetResolver and HandLandmarker
        const vision = await FilesetResolver.forVisionTasks(WASM_FILES_PATH);

        if (!mounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (!mounted) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;

        // Create FaceDetector
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        });

        if (!mounted) {
          faceDetector.close();
          return;
        }

        faceDetectorRef.current = faceDetector;

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;

        // Wait for video metadata to load
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });

        if (!mounted) return;

        // Set canvas dimensions to match video
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Initialize crosshair at center of canvas
          crosshairPositionRef.current = {
            x: canvas.width / 2,
            y: canvas.height / 2,
          };

          // Initialize ducks (target squares)
          initializeDucks(canvas.width, canvas.height);
        }

        setStatus("ready");

        // Start detection loop
        detectHands();
      } catch (error) {
        console.error("Initialization error:", error);
        if (mounted) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to initialize"
          );
        }
      }
    }

    initialize();

    // Cleanup
    return () => {
      mounted = false;

      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close hand landmarker
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }

      // Close face detector
      if (faceDetectorRef.current) {
        faceDetectorRef.current.close();
      }
    };
  }, []);

  // Sync particles state to ref
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  // Sync bullets state to ref
  useEffect(() => {
    bulletsRef.current = bullets;
  }, [bullets]);

  // Sync playerHp state to ref
  useEffect(() => {
    playerHpRef.current = playerHp;
  }, [playerHp]);

  // Sync totalSpawned state to ref
  useEffect(() => {
    totalSpawnedRef.current = totalSpawned;
  }, [totalSpawned]);

  // Sync planesKilled state to ref
  useEffect(() => {
    planesKilledRef.current = planesKilled;
  }, [planesKilled]);

  // Sync ducks state to ref and update score when ducks die
  useEffect(() => {
    const previousDucks = ducksRef.current;
    ducksRef.current = ducks;

    // Check if any ducks died and update score
    if (previousDucks.length > 0) {
      ducks.forEach((duck, index) => {
        const prevDuck = previousDucks[index];

        // Duck died - play explosion
        if (prevDuck && prevDuck.alive && !duck.alive) {
          setScore((prev) => prev + 10);
          setPlanesKilled((prev) => {
            const newKilled = prev + 1;
            // Check for victory
            if (newKilled === TOTAL_PLANES) {
              setVictory(true);
            }
            return newKilled;
          });
          setHitMessage("CONSUMED! +10");
          setTimeout(() => setHitMessage(null), 500);

          // Create explosion particles
          createExplosionParticles(duck.x, duck.y);

          // Play explosion sound
          if (explosionSoundRef.current) {
            explosionSoundRef.current.currentTime = 0;
            explosionSoundRef.current.play().catch(() => {});
          }
        }

        // Duck took damage - play damage sound
        if (prevDuck && duck.alive && prevDuck.hp > duck.hp) {
          if (damageSoundRef.current && Math.random() > 0.7) {
            // 30% chance to play to avoid spam
            damageSoundRef.current.currentTime = 0;
            damageSoundRef.current.play().catch(() => {});
          }
        }
      });
    }

    // Update engine sound volume based on average plane speed
    const alivePlanes = ducks.filter((d) => d.alive);
    if (alivePlanes.length > 0 && engineSoundRef.current) {
      const avgSpeed =
        alivePlanes.reduce((sum, duck) => {
          const speed = Math.sqrt(duck.vx * duck.vx + duck.vy * duck.vy);
          return sum + speed;
        }, 0) / alivePlanes.length;

      // Map speed (2-10) to volume (0.2-0.6)
      const volume = Math.min(0.6, Math.max(0.2, (avgSpeed - 2) / 8 * 0.4 + 0.2));
      engineSoundRef.current.volume = volume;
    }
  }, [ducks]);

  function createExplosionParticles(x: number, y: number) {
    const newParticles: Particle[] = [];
    const colors = ["#ff6b6b", "#ff9f43", "#feca57", "#888888", "#444444"];

    // Create 15-25 particles
    const particleCount = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Slight upward bias
        life: 1.0,
        maxLife: 1.0,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }

  function initializeDucks(canvasWidth: number, canvasHeight: number) {
    // Don't spawn any ducks initially - they'll spawn from factory
    setDucks([]);
    setTotalSpawned(0);
    setPlanesKilled(0);
    totalSpawnedRef.current = 0;
    planesKilledRef.current = 0;
    lastSpawnTimeRef.current = performance.now();
    factoryProgressRef.current = 0;
    console.log("Duck spawning system initialized");
  }

  function spawnDuck(canvasWidth: number, canvasHeight: number) {
    const colors = ["#ff6b6b", "#4ecdc4", "#feca57", "#ff9ff3", "#48dbfb"];

    // Factory position (top-left corner)
    const factoryX = 100;
    const factoryY = 100;

    // Spawn with velocity away from factory (towards center-right)
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5; // 45° ± variance
    const speed = 3 + Math.random() * 2; // 3-5 pixels per frame

    const newDuck: Duck = {
      id: nextDuckIdRef.current++,
      x: factoryX,
      y: factoryY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 84,
      color: colors[nextDuckIdRef.current % colors.length],
      alive: true,
      hp: 100,
      maxHp: 100,
    };

    setDucks((prev) => [...prev, newDuck]);
    setTotalSpawned((prev) => {
      const newTotal = prev + 1;
      totalSpawnedRef.current = newTotal;
      console.log(`Spawned plane #${newDuck.id} (Total spawned: ${newTotal}/${TOTAL_PLANES})`);
      return newTotal;
    });
  }

  function detectHands() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (!video || !canvas || !handLandmarker) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const detect = () => {
      const now = performance.now();

      // Detect hand landmarks
      const results: HandLandmarkerResult = handLandmarker.detectForVideo(
        video,
        now
      );

      // Initialize shield position on first frame
      if (!shieldPositionRef.current) {
        shieldPositionRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
        shieldTargetRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
        lastShieldMoveRef.current = now;
      }

      // Update shield target every 5 seconds
      if (now - lastShieldMoveRef.current > 5000) {
        // Choose new random target position (keep away from edges)
        const margin = 150;
        shieldTargetRef.current = {
          x: margin + Math.random() * (canvas.width - margin * 2),
          y: margin + Math.random() * (canvas.height - margin * 2),
        };
        lastShieldMoveRef.current = now;
      }

      // Smoothly interpolate shield position towards target
      if (shieldTargetRef.current && shieldPositionRef.current) {
        const lerpFactor = 0.02; // Smooth movement speed
        shieldPositionRef.current.x += (shieldTargetRef.current.x - shieldPositionRef.current.x) * lerpFactor;
        shieldPositionRef.current.y += (shieldTargetRef.current.y - shieldPositionRef.current.y) * lerpFactor;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update bullets
      updateBullets(canvas.width, canvas.height);

      // Update particle physics
      updateParticles();

      // Update duck physics (includes shooting)
      updateDuckPhysics(canvas.width, canvas.height);

      // Update factory progress and spawn planes
      const alivePlanes = ducksRef.current.filter((d) => d.alive).length;
      const canBuildMore = alivePlanes < MAX_PLANES_ALIVE && totalSpawnedRef.current < TOTAL_PLANES;

      if (canBuildMore) {
        // Increment factory progress (fills in 3 seconds at 60fps: 1/(3*60) = 0.00556)
        factoryProgressRef.current += 1 / (SPAWN_INTERVAL_MS / 1000 * 60);

        // Spawn when progress complete
        if (factoryProgressRef.current >= 1.0) {
          spawnDuck(canvas.width, canvas.height);
          factoryProgressRef.current = 0;
        }
      } else {
        // Can't build - reset progress
        factoryProgressRef.current = 0;
      }

      // Draw particles
      drawParticles(ctx);

      // Draw bullets
      drawBullets(ctx);

      // Draw ducks
      drawDucks(ctx);

      // Draw factory
      drawFactory(ctx, canvas.width, canvas.height);

      // Draw hand landmarks and process both hands
      if (results.landmarks && results.landmarks.length > 0) {
        let rightHandLandmarks = null;
        let leftHandLandmarks = null;

        // Identify which hand is which based on handedness
        results.landmarks.forEach((landmarks, index) => {
          const handedness = results.handednesses?.[index]?.[0];
          const handLabel = handedness?.categoryName;

          // Draw all hands
          drawConnections(ctx, landmarks, canvas.width, canvas.height);
          drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

          // Assign to right or left hand
          if (handLabel === "Right") {
            rightHandLandmarks = landmarks;
          } else if (handLabel === "Left") {
            leftHandLandmarks = landmarks;
          }
        });

        // Update hands detected state
        setHandsDetected({
          right: rightHandLandmarks !== null,
          left: leftHandLandmarks !== null,
        });

        // LEFT HAND: Controls shooting (fist detection) - PROCESS FIRST
        if (leftHandLandmarks) {
          detectFist(leftHandLandmarks, canvas.width, canvas.height);
        } else {
          // No left hand detected - reset fist state
          isFistDetectedRef.current = false;
          setIsFistDetected(false);
          isFistClosedRef.current = false;
        }

        // RIGHT HAND: Controls aiming (finger direction)
        // Only move crosshair when NOT firing (freeze on shot)
        if (rightHandLandmarks && crosshairPositionRef.current && !isFistDetectedRef.current) {
          const wrist = rightHandLandmarks[LANDMARKS.WRIST];
          const middleTip = rightHandLandmarks[LANDMARKS.MIDDLE_FINGER_TIP];

          // Direction vector (where fingers are pointing)
          const directionX = middleTip.x - wrist.x;
          const directionY = middleTip.y - wrist.y;

          // Normalize the direction vector
          const magnitude = Math.sqrt(
            directionX * directionX + directionY * directionY
          );

          if (magnitude > 0.01) {
            const normalizedX = directionX / magnitude;
            const normalizedY = directionY / magnitude;

            // Move crosshair in the direction fingers are pointing
            crosshairPositionRef.current.x +=
              normalizedX * CROSSHAIR_SENSITIVITY * canvas.width;
            crosshairPositionRef.current.y +=
              normalizedY * CROSSHAIR_SENSITIVITY * canvas.height;

            // Clamp crosshair within canvas bounds
            crosshairPositionRef.current.x = Math.max(
              0,
              Math.min(canvas.width, crosshairPositionRef.current.x)
            );
            crosshairPositionRef.current.y = Math.max(
              0,
              Math.min(canvas.height, crosshairPositionRef.current.y)
            );
          }
        }

        // Draw black hole effect if fist detected
        if (isFistDetectedRef.current && crosshairPositionRef.current) {
          drawBlackHole(
            ctx,
            crosshairPositionRef.current.x,
            crosshairPositionRef.current.y
          );
        }

        // Draw crosshair at independent position
        if (crosshairPositionRef.current) {
          drawCrosshair(
            ctx,
            crosshairPositionRef.current.x,
            crosshairPositionRef.current.y
          );
        }
      } else {
        // No hands detected - keep crosshair at last position
        setIsFistDetected(false);
        isFistClosedRef.current = false;
        setHandsDetected({ right: false, left: false });
      }

      // Draw player shield (on top of everything)
      drawPlayerShield(ctx);

      // Draw "FIRE!" message if firing
      if (isFiring) {
        drawFireMessage(ctx, canvas.width, canvas.height);
      }

      // Draw hit/miss message
      if (hitMessage) {
        drawHitMessage(ctx, canvas.width, canvas.height, hitMessage);
      }

      // Calculate FPS
      frameCountRef.current++;
      const deltaTime = now - lastFrameTimeRef.current;

      if (deltaTime >= 500) {
        // Update FPS every 500ms
        const currentFps = (frameCountRef.current / deltaTime) * 1000;
        setFps(Math.round(currentFps));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  }

  function drawConnections(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) {
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;

    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    });
  }

  function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) {
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;

      // Highlight thumb tip and index tip
      if (
        index === LANDMARKS.THUMB_TIP ||
        index === LANDMARKS.INDEX_FINGER_TIP
      ) {
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillStyle = "#feca57";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }

  function drawBlackHole(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {
    const time = performance.now() / 1000;

    // Draw large pulsing outer glow (see-through)
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 150);
    outerGlow.addColorStop(0, "rgba(138, 43, 226, 0.15)");
    outerGlow.addColorStop(0.5, "rgba(75, 0, 130, 0.08)");
    outerGlow.addColorStop(1, "rgba(138, 43, 226, 0)");

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, 150, 0, 2 * Math.PI);
    ctx.fill();

    // Draw many small spiraling particles (expanded, uniform fill)
    for (let i = 0; i < 60; i++) {
      // More variation in angles to avoid pattern grouping
      const angleOffset = (i * 2.4) + (Math.sin(i * 0.5) * 0.3);
      const angle = (time * 3 + angleOffset) % (Math.PI * 2);

      // Stagger distances more for uniform distribution
      const distanceOffset = (i * 2.3) % 140;
      const distance = 140 - ((time * 80 + distanceOffset) % 140);
      const spiralOffset = Math.sin(distance / 20 + i * 0.1) * 12;

      const px = x + Math.cos(angle) * (distance + spiralOffset);
      const py = y + Math.sin(angle) * (distance + spiralOffset);
      const particleAlpha = (1 - (distance / 140)) * 0.6;
      const particleSize = 1 + (1 - distance / 140) * 2; // Smaller particles

      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(186, 85, 211, ${particleAlpha})`;
      ctx.fill();

      // Smaller glow
      if (distance < 70) {
        ctx.beginPath();
        ctx.arc(px, py, particleSize * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 0, 255, ${particleAlpha * 0.2})`;
        ctx.fill();
      }
    }

    // Draw electric energy lines constantly (not just occasionally)
    const numArcs = 5 + Math.floor(Math.sin(time * 5) * 2);
    for (let i = 0; i < numArcs; i++) {
      const startAngle = time * 2 + i * (Math.PI * 2 / numArcs);
      const arcRadius = 50 + Math.sin(time * 3 + i) * 20;
      const arcLength = 0.4 + Math.sin(time * 4 + i) * 0.3;

      ctx.beginPath();
      ctx.arc(x, y, arcRadius, startAngle, startAngle + arcLength);
      ctx.strokeStyle = `rgba(186, 85, 211, ${0.4 + Math.sin(time * 6 + i) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(138, 43, 226, 0.8)";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw central vortex (larger, more dynamic)
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

    // Draw bright pulsing core
    const coreSize = 15 + Math.sin(time * 5) * 5;
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 100, 255, ${0.6 + Math.sin(time * 7) * 0.3})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 0, 255, 0.8)";
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawCrosshair(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) {
    const size = 20;
    const gap = 10;

    ctx.strokeStyle = "#ff6b6b";
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
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  function updateBullets(canvasWidth: number, canvasHeight: number) {
    setBullets((prevBullets) =>
      prevBullets
        .map((bullet) => {
          const newX = bullet.x + bullet.vx;
          const newY = bullet.y + bullet.vy;

          // Check collision with player shield
          if (!gameOver && shieldPositionRef.current) {
            const shieldX = shieldPositionRef.current.x;
            const shieldY = shieldPositionRef.current.y;
            const dx = newX - shieldX;
            const dy = newY - shieldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 80) {
              // Hit player (shield radius = 80)
              setPlayerHp((prev) => {
                const newHp = Math.max(0, prev - 1);
                if (newHp === 0) setGameOver(true);
                return newHp;
              });
              setHitMessage("HIT! -1 HP");
              setTimeout(() => setHitMessage(null), 500);
              if (damageSoundRef.current) {
                damageSoundRef.current.currentTime = 0;
                damageSoundRef.current.play().catch(() => {});
              }
              return null; // Remove bullet
            }
          }

          return { ...bullet, x: newX, y: newY };
        })
        .filter(
          (b) =>
            b !== null &&
            b.x > 0 &&
            b.x < canvasWidth &&
            b.y > 0 &&
            b.y < canvasHeight
        ) as Bullet[]
    );
  }

  function drawBullets(ctx: CanvasRenderingContext2D) {
    bulletsRef.current.forEach((bullet) => {
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3.5, 0, 2 * Math.PI); // 30% smaller (5 * 0.7 = 3.5)
      ctx.fill();

      // Glow
      ctx.fillStyle = "rgba(255, 107, 107, 0.3)";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 7, 0, 2 * Math.PI); // 30% smaller (10 * 0.7 = 7)
      ctx.fill();
    });
  }

  function drawFactory(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const factoryX = 50;
    const factoryY = 50;
    const factoryWidth = 100;
    const factoryHeight = 80;

    // Factory building (rectangle with angled roof)
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(factoryX, factoryY, factoryWidth, factoryHeight);

    // Factory roof (triangle)
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.moveTo(factoryX - 10, factoryY); // Left edge
    ctx.lineTo(factoryX + factoryWidth + 10, factoryY); // Right edge
    ctx.lineTo(factoryX + factoryWidth / 2, factoryY - 30); // Top point
    ctx.closePath();
    ctx.fill();

    // Factory border
    ctx.strokeStyle = "#1a252f";
    ctx.lineWidth = 3;
    ctx.strokeRect(factoryX, factoryY, factoryWidth, factoryHeight);

    // Progress bar
    const barWidth = 80;
    const barHeight = 12;
    const barX = factoryX + (factoryWidth - barWidth) / 2;
    const barY = factoryY + factoryHeight + 10;

    // Progress bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar fill
    const progress = factoryProgressRef.current;
    const canBuild =
      ducksRef.current.filter((d) => d.alive).length < MAX_PLANES_ALIVE &&
      totalSpawnedRef.current < TOTAL_PLANES;

    ctx.fillStyle = canBuild ? "#3498db" : "#95a5a6";
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Progress bar border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Factory label
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ecf0f1";
    ctx.fillText("FACTORY", factoryX + factoryWidth / 2, factoryY + factoryHeight / 2);

    // Planes killed counter (X/20)
    const killed = planesKilledRef.current;
    ctx.font = "bold 10px system-ui";
    ctx.fillStyle = killed < TOTAL_PLANES ? "#2ecc71" : "#e74c3c";
    ctx.fillText(
      `${killed}/${TOTAL_PLANES}`,
      factoryX + factoryWidth / 2,
      barY + barHeight + 15
    );
  }

  function drawPlayerShield(ctx: CanvasRenderingContext2D) {
    const canvas = canvasRef.current;
    if (!canvas || !shieldPositionRef.current) return;

    const shieldX = shieldPositionRef.current.x;
    const shieldY = shieldPositionRef.current.y;
    const shieldRadius = 80;

    // HP bar above shield (thin bar, no text)
    const barWidth = 160;
    const barHeight = 8;
    const barX = shieldX - barWidth / 2;
    const barY = shieldY - shieldRadius - 20;

    // HP bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP bar fill (using ref for correct value)
    const hpRatio = playerHpRef.current / 100;
    ctx.fillStyle = hpRatio > 0.5 ? "#00ff88" : hpRatio > 0.25 ? "#feca57" : "#ff6b6b";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // HP bar border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Shield circle
    ctx.strokeStyle = "rgba(0, 255, 0, 1.0)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(shieldX, shieldY, shieldRadius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  function updateParticles() {
    setParticles((prevParticles) =>
      prevParticles
        .map((particle) => {
          // Update velocity (apply gravity)
          const newVy = particle.vy + 0.3; // Gravity

          // Update position
          const newX = particle.x + particle.vx;
          const newY = particle.y + newVy;

          // Reduce life
          const newLife = particle.life - 0.02;

          return {
            ...particle,
            x: newX,
            y: newY,
            vy: newVy,
            life: newLife,
          };
        })
        .filter((particle) => particle.life > 0) // Remove dead particles
    );
  }

  function drawParticles(ctx: CanvasRenderingContext2D) {
    particlesRef.current.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      );
      ctx.restore();
    });
  }

  function updateDuckPhysics(canvasWidth: number, canvasHeight: number) {
    setDucks((prevDucks) =>
      prevDucks.map((duck) => {
        if (!duck.alive) return duck;

        let newX = duck.x;
        let newY = duck.y;
        let newVx = duck.vx;
        let newVy = duck.vy;
        let newHp = duck.hp;

        // Apply black hole physics if fist is detected
        if (isFistDetectedRef.current && crosshairPositionRef.current) {
          const blackHoleX = crosshairPositionRef.current.x;
          const blackHoleY = crosshairPositionRef.current.y;

          // Calculate distance to black hole
          const dx = blackHoleX - duck.x;
          const dy = blackHoleY - duck.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Black hole constants
          const BLACK_HOLE_RADIUS = 150; // Influence radius
          const KILL_RADIUS = 5; // Instant kill radius (extremely small)
          const GRAVITY_STRENGTH = 500; // Gravitational constant
          const MAX_FORCE = 2.0; // Cap force to prevent infinite acceleration
          const MAX_DAMAGE_PER_FRAME = 0.8; // Cap damage - slower death

          if (distance < BLACK_HOLE_RADIUS) {
            // Inside black hole influence

            if (distance < KILL_RADIUS) {
              // Too close - instant kill
              return { ...duck, alive: false, hp: 0 };
            }

            // Apply gravitational force: F = k / distance^2
            let force = GRAVITY_STRENGTH / (distance * distance);
            force = Math.min(force, MAX_FORCE); // Cap the force

            // Direction towards black hole (normalized)
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Apply acceleration (F = ma, assuming mass = 1)
            newVx += dirX * force;
            newVy += dirY * force;

            // Apply damage over time (closer = more damage)
            let damageRate = 2.0 / (distance / 10); // More damage when closer
            damageRate = Math.min(damageRate, MAX_DAMAGE_PER_FRAME); // Cap damage
            newHp -= damageRate;

            if (newHp <= 0) {
              return { ...duck, alive: false, hp: 0 };
            }
          }
        }

        // Update position based on velocity
        newX += newVx;
        newY += newVy;

        // Bounce off walls
        if (newX - duck.size / 2 < 0 || newX + duck.size / 2 > canvasWidth) {
          newVx = -newVx;
          newX = Math.max(duck.size / 2, Math.min(canvasWidth - duck.size / 2, newX));
        }
        if (newY - duck.size / 2 < 0 || newY + duck.size / 2 > canvasHeight) {
          newVy = -newVy;
          newY = Math.max(duck.size / 2, Math.min(canvasHeight - duck.size / 2, newY));
        }

        // Apply light friction only when black hole is active
        if (isFistDetectedRef.current) {
          newVx *= 0.98;
          newVy *= 0.98;
        }

        // Maintain minimum speed (keep ducks flying)
        const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
        const MIN_SPEED = 2;
        if (currentSpeed < MIN_SPEED && currentSpeed > 0) {
          const speedRatio = MIN_SPEED / currentSpeed;
          newVx *= speedRatio;
          newVy *= speedRatio;
        }

        // Shoot at player shield occasionally with spread
        const lastShot = lastShootTimeRef.current.get(duck.id) || 0;
        const nowTime = Date.now();
        if (nowTime - lastShot > 3000 && !gameOver && !victory && shieldPositionRef.current) {
          // Shoot towards shield position with cone spread
          const targetX = shieldPositionRef.current.x;
          const targetY = shieldPositionRef.current.y;

          const dx = targetX - duck.x;
          const dy = targetY - duck.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            // Calculate angle to player
            const angleToPlayer = Math.atan2(dy, dx);

            // Add random spread (cone of ±35 degrees = ±0.611 radians)
            const spreadAngle = (Math.random() - 0.5) * 1.222; // ±35 degrees
            const finalAngle = angleToPlayer + spreadAngle;

            const speed = 6;
            setBullets((prev) => [
              ...prev,
              {
                x: duck.x,
                y: duck.y,
                vx: Math.cos(finalAngle) * speed,
                vy: Math.sin(finalAngle) * speed,
                fromDuckId: duck.id,
              },
            ]);
            lastShootTimeRef.current.set(duck.id, nowTime);
          }
        }

        return {
          ...duck,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          hp: newHp,
        };
      })
    );
  }

  function drawDucks(ctx: CanvasRenderingContext2D) {
    if (!spritesLoadedRef.current || !planeSprite1Ref.current || !planeSprite2Ref.current) {
      // Fallback to squares if sprites not loaded
      return;
    }

    const time = performance.now();

    ducksRef.current.forEach((duck) => {
      if (!duck.alive) return;

      const hpRatio = duck.hp / duck.maxHp;

      // Animate propeller: alternate between sprite 1 and 2
      const frameIndex = Math.floor(time / 100) % 2; // Switch every 100ms
      const sprite = frameIndex === 0 ? planeSprite1Ref.current : planeSprite2Ref.current;

      if (!sprite) return;

      ctx.save();

      // Translate to plane position
      ctx.translate(duck.x, duck.y);

      // Rotate based on velocity direction
      const angle = Math.atan2(duck.vy, duck.vx);
      ctx.rotate(angle);

      // Draw plane sprite first
      ctx.drawImage(
        sprite,
        -duck.size / 2,
        -duck.size / 2,
        duck.size,
        duck.size
      );

      // Apply damage tint ONLY to non-transparent pixels
      if (hpRatio < 1.0) {
        const damageAlpha = 0.6 * (1 - hpRatio); // More red when more damaged
        ctx.globalCompositeOperation = "source-atop"; // Only affects existing pixels
        ctx.fillStyle = `rgba(255, 0, 0, ${damageAlpha})`;
        ctx.fillRect(-duck.size / 2, -duck.size / 2, duck.size, duck.size);
        ctx.globalCompositeOperation = "source-over"; // Reset immediately
      }

      ctx.restore();

      // Draw HP bar only if damaged (not rotated)
      if (hpRatio < 1.0) {
        const barWidth = duck.size;
        const barHeight = 6;
        const barX = duck.x - barWidth / 2;
        const barY = duck.y - duck.size / 2 - 12;

        // Background
        ctx.fillStyle = "#333333";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HP fill
        ctx.fillStyle = hpRatio > 0.5 ? "#00ff88" : hpRatio > 0.25 ? "#feca57" : "#ff6b6b";
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        // HP bar border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }
    });
  }

  function detectFist(landmarks: any[], canvasWidth: number, canvasHeight: number) {
    // Detect closed fist by checking if fingertips are close to palm/wrist
    const wrist = landmarks[LANDMARKS.WRIST];
    const indexTip = landmarks[LANDMARKS.INDEX_FINGER_TIP];
    const middleTip = landmarks[LANDMARKS.MIDDLE_FINGER_TIP];
    const ringTip = landmarks[LANDMARKS.RING_FINGER_TIP];
    const pinkyTip = landmarks[LANDMARKS.PINKY_TIP];

    // Calculate distances from fingertips to wrist
    const indexDist = Math.sqrt(
      Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2)
    );
    const middleDist = Math.sqrt(
      Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2)
    );
    const ringDist = Math.sqrt(
      Math.pow(ringTip.x - wrist.x, 2) + Math.pow(ringTip.y - wrist.y, 2)
    );
    const pinkyDist = Math.sqrt(
      Math.pow(pinkyTip.x - wrist.x, 2) + Math.pow(pinkyTip.y - wrist.y, 2)
    );

    // Fist threshold: when all fingertips are close to wrist
    const isFist =
      indexDist < FIST_THRESHOLD &&
      middleDist < FIST_THRESHOLD &&
      ringDist < FIST_THRESHOLD &&
      pinkyDist < FIST_THRESHOLD;

    const now = Date.now();

    // Update visual indicator (both ref and state)
    isFistDetectedRef.current = isFist;
    setIsFistDetected(isFist);

    if (isFist) {
      // Fist closed - black hole active
      if (!isFistClosedRef.current) {
        isFistClosedRef.current = true;
        setIsFiring(true);
      }
    } else {
      // Fist open - deactivate black hole
      if (isFistClosedRef.current) {
        isFistClosedRef.current = false;
        setIsFiring(false);
      }
    }
  }

  function drawFireMessage(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.font = "bold 60px system-ui, sans-serif";
    ctx.fillStyle = "#8a2be2"; // Purple
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = "VOID ACTIVE";
    const x = width / 2;
    const y = height / 2;

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawHitMessage(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    message: string
  ) {
    ctx.save();
    ctx.font = "bold 60px system-ui, sans-serif";

    // Color based on message
    if (message.includes("HIT")) {
      ctx.fillStyle = "#00ff88";
      ctx.strokeStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#ff6b6b";
      ctx.strokeStyle = "#000000";
    }

    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const x = width / 2;
    const y = height / 2 + 80;

    ctx.strokeText(message, x, y);
    ctx.fillText(message, x, y);
    ctx.restore();
  }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        style={{
          display: status === "ready" ? "block" : "none",
          width: "100%",
          maxWidth: "1280px",
          height: "auto",
          transform: "scaleX(-1)", // Mirror video
          borderRadius: "8px",
        }}
        playsInline
        muted
      />

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)", // Mirror canvas
          pointerEvents: "auto",
          cursor: "crosshair",
        }}
        onClick={async () => {
          // Initialize audio on first click
          if (!audioInitializedRef.current) {
            try {
              await backgroundMusicRef.current?.play();
              await engineSoundRef.current?.play();
              audioInitializedRef.current = true;
            } catch (e) {
              console.log("Could not start audio");
            }
          }
        }}
      />

      {/* Status overlay */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          padding: "0.75rem 1rem",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontFamily: "monospace",
        }}
      >
        <div style={{ marginBottom: "0.25rem" }}>
          <strong>Status:</strong>{" "}
          <span
            style={{
              color:
                status === "ready"
                  ? "#00ff88"
                  : status === "error"
                  ? "#ff6b6b"
                  : "#feca57",
            }}
          >
            {status.toUpperCase()}
          </span>
        </div>
        {status === "ready" && (
          <>
            <div>
              <strong>FPS:</strong> {fps}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "1rem", color: "#feca57" }}>
              <strong>Score:</strong> {score}
            </div>
            <div style={{
              marginTop: "0.5rem",
              fontSize: "1rem",
              color: playerHp > 50 ? "#00ff88" : playerHp > 25 ? "#feca57" : "#ff6b6b"
            }}>
              <strong>HP:</strong> {playerHp}
            </div>
            <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#888" }}>
              <strong>Killed:</strong> {planesKilled}/{TOTAL_PLANES}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
              <div style={{ color: handsDetected.right ? "#00ff88" : "#666" }}>
                {handsDetected.right ? "🎯 Right: AIM" : "⚠ Right: Missing"}
              </div>
              <div style={{
                color: isFistDetected ? "#ff6b6b" : (handsDetected.left ? "#00ff88" : "#666"),
                marginTop: "0.25rem"
              }}>
                {handsDetected.left
                  ? (isFistDetected ? "✊ Left: FIRING" : "✋ Left: READY")
                  : "⚠ Left: Missing"}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Victory screen */}
      {victory && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "3rem",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            border: "3px solid #00ff88",
            borderRadius: "12px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <h2 style={{ color: "#00ff88", fontSize: "3rem", marginBottom: "1rem" }}>
            VICTORY!
          </h2>
          <p style={{ fontSize: "1.5rem", color: "#feca57", marginBottom: "1rem" }}>
            All planes destroyed!
          </p>
          <p style={{ fontSize: "1.5rem", color: "#feca57", marginBottom: "2rem" }}>
            Final Score: {score}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.25rem",
              backgroundColor: "#00ff88",
              color: "#000000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Game Over screen */}
      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "3rem",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            border: "3px solid #ff6b6b",
            borderRadius: "12px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <h2 style={{ color: "#ff6b6b", fontSize: "3rem", marginBottom: "1rem" }}>
            GAME OVER
          </h2>
          <p style={{ fontSize: "1.5rem", color: "#feca57", marginBottom: "2rem" }}>
            Final Score: {score}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.25rem",
              backgroundColor: "#ff6b6b",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Error message */}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "2rem",
            backgroundColor: "rgba(255, 0, 0, 0.2)",
            border: "2px solid #ff6b6b",
            borderRadius: "8px",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#ff6b6b", marginBottom: "1rem" }}>Error</h3>
          <p style={{ color: "#ffffff" }}>{errorMessage}</p>
          <p style={{ color: "#aaaaaa", fontSize: "0.875rem", marginTop: "1rem" }}>
            Make sure you've granted camera permissions and are using a
            supported browser.
          </p>
        </div>
      )}

      {/* Loading message */}
      {(status === "initializing" || status === "loading") && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "2rem",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #333",
              borderTop: "4px solid #feca57",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#feca57" }}>
            {status === "initializing"
              ? "Initializing..."
              : "Loading hand tracking model..."}
          </p>
        </div>
      )}

      {/* CSS animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
