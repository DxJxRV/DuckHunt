"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
  FaceDetector,
} from "@mediapipe/tasks-vision";
import { Volume2, VolumeX, Pause, Play, Hand, Maximize, Minimize, Smartphone, Undo, Redo, Cross, Plane, Star } from "lucide-react";
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
  ROI_SCALE,
  ROI_SMOOTH_ALPHA,
  FULL_RES_WIDTH,
  FULL_RES_HEIGHT,
  ROI_RES,
  SEARCH_FULL_INTERVAL,
  TRACK_ROI_INTERVAL,
  LOST_THRESHOLD,
  OK_ENTER_THRESHOLD,
  OK_EXIT_THRESHOLD,
  OK_CONFIRM_FRAMES,
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

// Empty result for fallback
const EMPTY_RESULT: HandLandmarkerResult = {
  landmarks: [],
  handednesses: [],
  worldLandmarks: [],
  handedness: [],
};

export default function HandTracker({ isPausedProp }: { isPausedProp?: boolean }) {
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
  const [gameOverTime, setGameOverTime] = useState<number>(0);
  const [victoryTime, setVictoryTime] = useState<number>(0);
  const [hitMessage, setHitMessage] = useState<string | null>(null);
  const [isFistDetected, setIsFistDetected] = useState<boolean>(false);
  const [handsDetected, setHandsDetected] = useState<{
    right: boolean;
    left: boolean;
  }>({ right: false, left: false });
  const [totalSpawned, setTotalSpawned] = useState<number>(0);
  const [planesKilled, setPlanesKilled] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null); // Off-screen canvas for low-res MediaPipe detection
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

  // MediaPipe optimization - skip frames
  const detectionFrameCountRef = useRef<number>(0);
  const lastHandResultRef = useRef<HandLandmarkerResult | null>(null);

  // ROI tracking state machine
  const roiStateRef = useRef<'SEARCH_FULL' | 'TRACK_ROI'>('SEARCH_FULL');
  const roiRef = useRef<{x: number, y: number, size: number} | null>(null);
  const lostFramesRef = useRef<number>(0);

  // OK gesture confirmation
  const okConfirmFramesRef = useRef<number>(0);

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
  const factoryPositionRef = useRef<{ x: number; y: number; corner: number } | null>(null);

  // Plane sprites
  const planeSprite1Ref = useRef<HTMLImageElement | null>(null);
  const planeSprite2Ref = useRef<HTMLImageElement | null>(null);
  const spritesLoadedRef = useRef<boolean>(false);

  // Factory sprites
  const factorySprite1Ref = useRef<HTMLImageElement | null>(null);
  const factorySprite2Ref = useRef<HTMLImageElement | null>(null);
  const factorySpritesLoadedRef = useRef<boolean>(false);

  // Shield sprites (angel → demon transformation)
  const shieldSprite1Ref = useRef<HTMLImageElement | null>(null); // 75-100% HP
  const shieldSprite2Ref = useRef<HTMLImageElement | null>(null); // 50-75% HP
  const shieldSprite3Ref = useRef<HTMLImageElement | null>(null); // 25-50% HP
  const shieldSprite4Ref = useRef<HTMLImageElement | null>(null); // 0-25% HP
  const shieldSpritesLoadedRef = useRef<boolean>(false);

  // Audio
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const engineSoundRef = useRef<HTMLAudioElement | null>(null);
  const damageSoundRef = useRef<HTMLAudioElement | null>(null);
  const explosionSoundRef = useRef<HTMLAudioElement | null>(null);
  const audioInitializedRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(false);
  const gameOverRef = useRef<boolean>(false);
  const victoryRef = useRef<boolean>(false);

  // Sync isMuted state to ref
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Sync isPaused state to ref
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Sync gameOver state to ref
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Sync victory state to ref
  useEffect(() => {
    victoryRef.current = victory;
  }, [victory]);

  // Sync isPausedProp to state
  useEffect(() => {
    if (isPausedProp !== undefined) {
      setIsPaused(isPausedProp);
    }
  }, [isPausedProp]);

  // Detect screen size and orientation changes
  useEffect(() => {
    const checkScreen = () => {
      const isMobileSize = window.matchMedia("(max-width: 1280px)").matches;
      const isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
      setIsMobile(isMobileSize);
      setIsPortrait(isPortraitMode);
    };

    // Check initial state
    checkScreen();

    // Listen for changes
    const sizeQuery = window.matchMedia("(max-width: 1280px)");
    const orientationQuery = window.matchMedia("(orientation: portrait)");
    const handler = () => checkScreen();

    sizeQuery.addEventListener("change", handler);
    orientationQuery.addEventListener("change", handler);
    window.addEventListener("resize", handler);

    return () => {
      sizeQuery.removeEventListener("change", handler);
      orientationQuery.removeEventListener("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  // Detect fullscreen changes
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Load plane sprites
    const loadSprites = async () => {
      const img1 = new Image();
      const img2 = new Image();
      const factory1 = new Image();
      const factory2 = new Image();
      const shield1 = new Image();
      const shield2 = new Image();
      const shield3 = new Image();
      const shield4 = new Image();

      img1.src = "/sprites/plane-1.png";
      img2.src = "/sprites/plane-2.png";
      factory1.src = "/sprites/factory-1.png";
      factory2.src = "/sprites/factory-2.png";
      shield1.src = "/sprites/shield-1.png";
      shield2.src = "/sprites/shield-2.png";
      shield3.src = "/sprites/shield-3.png";
      shield4.src = "/sprites/shield-4.png";

      await Promise.all([
        new Promise((resolve) => { img1.onload = resolve; img1.onerror = resolve; }),
        new Promise((resolve) => { img2.onload = resolve; img2.onerror = resolve; }),
        new Promise((resolve) => { factory1.onload = resolve; factory1.onerror = resolve; }),
        new Promise((resolve) => { factory2.onload = resolve; factory2.onerror = resolve; }),
        new Promise((resolve) => { shield1.onload = resolve; shield1.onerror = resolve; }),
        new Promise((resolve) => { shield2.onload = resolve; shield2.onerror = resolve; }),
        new Promise((resolve) => { shield3.onload = resolve; shield3.onerror = resolve; }),
        new Promise((resolve) => { shield4.onload = resolve; shield4.onerror = resolve; }),
      ]);

      planeSprite1Ref.current = img1;
      planeSprite2Ref.current = img2;
      spritesLoadedRef.current = true;

      factorySprite1Ref.current = factory1;
      factorySprite2Ref.current = factory2;
      factorySpritesLoadedRef.current = true;

      shieldSprite1Ref.current = shield1;
      shieldSprite2Ref.current = shield2;
      shieldSprite3Ref.current = shield3;
      shieldSprite4Ref.current = shield4;
      shieldSpritesLoadedRef.current = true;
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

      damage.volume = 0.175; // 35% of 0.5
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
          numHands: 1, // OPTIMIZED: Only right hand (aim + OK gesture)
          minHandDetectionConfidence: 0.7, // Increased from 0.5 for better performance
          minHandPresenceConfidence: 0.7, // Increased from 0.5 for better performance
          minTrackingConfidence: 0.7, // Increased from 0.5 for better performance
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

          // Create off-screen detection canvas (starts as full-frame, switches to ROI)
          const detectionCanvas = document.createElement('canvas');
          detectionCanvas.width = 320;  // Full-frame search resolution
          detectionCanvas.height = 180;
          detectionCanvasRef.current = detectionCanvas;

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
              setVictoryTime(performance.now());
            }
            return newKilled;
          });
          setHitMessage("CONSUMED! +10");
          setTimeout(() => setHitMessage(null), 500);

          // Create explosion particles
          createExplosionParticles(duck.x, duck.y);

          // Play explosion sound
          if (explosionSoundRef.current && !isMutedRef.current) {
            explosionSoundRef.current.currentTime = 0;
            explosionSoundRef.current.play().catch(() => {});
          }
        }

        // Duck took damage - play damage sound
        if (prevDuck && duck.alive && prevDuck.hp > duck.hp) {
          if (damageSoundRef.current && !isMutedRef.current && Math.random() > 0.7) {
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
    } else if (engineSoundRef.current) {
      // No planes alive - silence engine
      engineSoundRef.current.volume = 0;
    }
  }, [ducks]);

  function spawnPlaneAirParticles() {
    // Spawn air particles from random alive plane
    const alivePlanes = ducksRef.current.filter((d) => d.alive);
    if (alivePlanes.length === 0) return;

    const plane = alivePlanes[Math.floor(Math.random() * alivePlanes.length)];
    const angle = Math.atan2(plane.vy, plane.vx);

    // Spawn from back of plane
    const backX = plane.x - Math.cos(angle) * (plane.size / 2);
    const backY = plane.y - Math.sin(angle) * (plane.size / 2);

    const newParticles: Particle[] = [];

    // Create 2-3 air particles
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      newParticles.push({
        x: backX + (Math.random() - 0.5) * 15,
        y: backY + (Math.random() - 0.5) * 15,
        vx: -Math.cos(angle) * (0.5 + Math.random() * 0.5), // Opposite direction
        vy: -Math.sin(angle) * (0.5 + Math.random() * 0.5),
        life: 1.0,
        maxLife: 1.0,
        size: 3 + Math.random() * 3,
        color: `rgba(200, 220, 255, ${0.4 + Math.random() * 0.3})`,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }

  function spawnFactoryParticles() {
    if (!factoryPositionRef.current) return;

    const factoryX = factoryPositionRef.current.x + 100; // Center (double size)
    const factoryY = factoryPositionRef.current.y - 10; // Top of factory (chimney position)

    const newParticles: Particle[] = [];

    // Spawn 2-4 particles
    const particleCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < particleCount; i++) {
      const isSmoke = Math.random() > 0.3; // 70% smoke, 30% sparks

      if (isSmoke) {
        // Smoke particle (gray, goes up slowly)
        newParticles.push({
          x: factoryX + (Math.random() - 0.5) * 30,
          y: factoryY,
          vx: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
          vy: -0.5 - Math.random() * 0.5, // Goes up
          life: 1.0,
          maxLife: 1.0,
          size: 4 + Math.random() * 4,
          color: `rgba(150, 150, 150, ${0.4 + Math.random() * 0.3})`,
        });
      } else {
        // Spark particle (yellow/orange, goes up fast)
        const sparkColor = Math.random() > 0.5 ? "#feca57" : "#ff9f43";
        newParticles.push({
          x: factoryX + (Math.random() - 0.5) * 20,
          y: factoryY + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2, // Goes up fast
          life: 1.0,
          maxLife: 1.0,
          size: 2 + Math.random() * 2,
          color: sparkColor,
        });
      }
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }

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

  async function toggleMute() {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (!newMutedState) {
      // Unmuting - start audio
      if (!audioInitializedRef.current) {
        // Initialize and play
        try {
          await backgroundMusicRef.current?.play();
          await engineSoundRef.current?.play();
          audioInitializedRef.current = true;
        } catch (e) {
          console.log("Could not start audio");
        }
      } else {
        // Resume playing
        try {
          if (backgroundMusicRef.current?.paused) {
            await backgroundMusicRef.current?.play();
          }
          if (engineSoundRef.current?.paused) {
            await engineSoundRef.current?.play();
          }
        } catch (e) {
          console.log("Could not resume audio");
        }
      }
    } else {
      // Muting - pause audio
      backgroundMusicRef.current?.pause();
      engineSoundRef.current?.pause();
    }
  }

  function togglePause() {
    setIsPaused((prev) => {
      const newPausedState = !prev;

      // Pause/resume audio when pausing/resuming game (only if not muted)
      if (!isMutedRef.current && audioInitializedRef.current) {
        if (newPausedState) {
          // Pausing game - pause audio
          backgroundMusicRef.current?.pause();
          engineSoundRef.current?.pause();
        } else {
          // Resuming game - resume audio
          backgroundMusicRef.current?.play().catch(() => {});
          engineSoundRef.current?.play().catch(() => {});
        }
      }

      return newPausedState;
    });
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.log("Could not toggle fullscreen");
    }
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

    // Choose random corner for factory (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
    const corner = Math.floor(Math.random() * 4);
    const factoryWidth = 200; // Double size (was 100)
    const factoryHeight = 160; // Double size (was 80)
    const offsetX = 10; // Horizontal offset to push factory more into edges

    let factoryX, factoryY;
    switch (corner) {
      case 0: // Top-left
        factoryX = -offsetX;
        factoryY = 0;
        break;
      case 1: // Top-right
        factoryX = canvasWidth - factoryWidth + offsetX;
        factoryY = 0;
        break;
      case 2: // Bottom-left
        factoryX = -offsetX;
        factoryY = canvasHeight - factoryHeight;
        break;
      case 3: // Bottom-right
        factoryX = canvasWidth - factoryWidth + offsetX;
        factoryY = canvasHeight - factoryHeight;
        break;
      default:
        factoryX = 0;
        factoryY = 0;
    }

    factoryPositionRef.current = { x: factoryX, y: factoryY, corner };
    console.log(`Factory initialized at corner ${corner}: (${factoryX}, ${factoryY})`);
  }

  function spawnDuck(canvasWidth: number, canvasHeight: number) {
    const colors = ["#ff6b6b", "#4ecdc4", "#feca57", "#ff9ff3", "#48dbfb"];

    if (!factoryPositionRef.current) return;

    // Factory position and spawn point (center of factory)
    const factoryX = factoryPositionRef.current.x + 100; // Center of factory (double size)
    const factoryY = factoryPositionRef.current.y + 80;
    const corner = factoryPositionRef.current.corner;

    // Base angle depends on corner (shoot towards opposite side)
    let baseAngle;
    switch (corner) {
      case 0: // Top-left → shoot towards bottom-right
        baseAngle = Math.PI / 4; // 45°
        break;
      case 1: // Top-right → shoot towards bottom-left
        baseAngle = (3 * Math.PI) / 4; // 135°
        break;
      case 2: // Bottom-left → shoot towards top-right
        baseAngle = -Math.PI / 4; // -45°
        break;
      case 3: // Bottom-right → shoot towards top-left
        baseAngle = (-3 * Math.PI) / 4; // -135°
        break;
      default:
        baseAngle = Math.PI / 4;
    }

    // Add random spread (cone of ±30 degrees = ±0.524 radians)
    const spreadAngle = (Math.random() - 0.5) * 1.047; // ±30 degrees
    const angle = baseAngle + spreadAngle;

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

  function calculateROI(landmarks: any[]) {
    // Calculate bounding box from landmarks
    const xs = landmarks.map((l: any) => l.x);
    const ys = landmarks.map((l: any) => l.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Center and size
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const w = maxX - minX;
    const h = maxY - minY;
    const size = Math.max(w, h) * ROI_SCALE;

    // Square ROI
    let roi = {
      x: Math.max(0, Math.min(1 - size, cx - size / 2)),
      y: Math.max(0, Math.min(1 - size, cy - size / 2)),
      size: Math.min(size, 1),
    };

    // Smooth with EMA
    if (roiRef.current) {
      roi.x = roiRef.current.x * (1 - ROI_SMOOTH_ALPHA) + roi.x * ROI_SMOOTH_ALPHA;
      roi.y = roiRef.current.y * (1 - ROI_SMOOTH_ALPHA) + roi.y * ROI_SMOOTH_ALPHA;
      roi.size = roiRef.current.size * (1 - ROI_SMOOTH_ALPHA) + roi.size * ROI_SMOOTH_ALPHA;
    }

    roiRef.current = roi;
    return roi;
  }

  function remapROICoordinates(
    results: HandLandmarkerResult,
    roi: { x: number; y: number; size: number }
  ): HandLandmarkerResult {
    // Convert landmarks from ROI space to global space
    if (!results.landmarks || results.landmarks.length === 0) {
      return results;
    }

    const remappedLandmarks = results.landmarks.map((hand) =>
      hand.map((landmark) => ({
        ...landmark,
        x: roi.x + landmark.x * roi.size,
        y: roi.y + landmark.y * roi.size,
      }))
    );

    return {
      ...results,
      landmarks: remappedLandmarks,
    };
  }

  function detectHands() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (!video || !canvas || !handLandmarker) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const detect = () => {
      const frameStart = performance.now();
      const now = frameStart;

      // Profiling object
      const timings: Record<string, number> = {};

      // If paused, just redraw and continue loop
      if (isPausedRef.current) {
        // Clear and redraw current state without updating
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawParticles(ctx);
        drawBullets(ctx);
        drawDucks(ctx);
        drawFactory(ctx, canvas.width, canvas.height);
        drawPlayerShield(ctx);

        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Simplified detection (ROI temporarily disabled for debugging)
      detectionFrameCountRef.current++;

      let results: HandLandmarkerResult;
      const t1 = performance.now();

      // Detect every 3 frames (simple skip, no ROI)
      // Skip MediaPipe detection when game over or victory (but keep animations running)
      const shouldDetect = detectionFrameCountRef.current % 3 === 0 && !gameOverRef.current && !victoryRef.current;

      if (shouldDetect) {
        // Simple full-frame detection (ROI disabled for stability)
        const detectionCanvas = detectionCanvasRef.current;
        if (detectionCanvas) {
          const detectionCtx = detectionCanvas.getContext('2d');
          if (detectionCtx) {
            detectionCtx.drawImage(video, 0, 0, FULL_RES_WIDTH, FULL_RES_HEIGHT);
            results = handLandmarker.detectForVideo(detectionCanvas, now);
            lastHandResultRef.current = results;
            timings.mediapipe = performance.now() - t1;
          } else {
            results = lastHandResultRef.current || EMPTY_RESULT;
            timings.mediapipe = 0;
          }
        } else {
          results = lastHandResultRef.current || EMPTY_RESULT;
          timings.mediapipe = 0;
        }
      } else {
        // Skip detection, use cached result
        results = lastHandResultRef.current || EMPTY_RESULT;
        timings.mediapipe = 0;
      }

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
      const t2 = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timings.clear = performance.now() - t2;

      // Update bullets
      const t3 = performance.now();
      updateBullets(canvas.width, canvas.height);
      timings.updateBullets = performance.now() - t3;

      // Update particle physics
      const t4 = performance.now();
      updateParticles();
      timings.updateParticles = performance.now() - t4;

      // Update duck physics (includes shooting)
      const t5 = performance.now();
      updateDuckPhysics(canvas.width, canvas.height);
      timings.updateDuckPhysics = performance.now() - t5;

      // Spawn air particles from planes occasionally
      if (Math.random() > 0.92) {
        spawnPlaneAirParticles();
      }

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
      const t6 = performance.now();
      drawParticles(ctx);
      timings.drawParticles = performance.now() - t6;

      // Draw bullets
      const t7 = performance.now();
      drawBullets(ctx);
      timings.drawBullets = performance.now() - t7;

      // Draw ducks
      const t8 = performance.now();
      drawDucks(ctx);
      timings.drawDucks = performance.now() - t8;

      // Draw factory
      const t9 = performance.now();
      drawFactory(ctx, canvas.width, canvas.height);
      timings.drawFactory = performance.now() - t9;

      // Spawn factory particles (smoke/sparks) when building
      if (canBuildMore && Math.random() > 0.85) {
        spawnFactoryParticles();
      }

      // Process single hand (right hand for aim + OK gesture)
      const t10 = performance.now();
      if (results.landmarks && results.landmarks.length > 0) {
        const handLandmarks = results.landmarks[0]; // First (and only) hand

        // Draw hand
        drawConnections(ctx, handLandmarks, canvas.width, canvas.height);
        drawLandmarks(ctx, handLandmarks, canvas.width, canvas.height);

        // Update hands detected state (always right hand now)
        setHandsDetected({
          right: true,
          left: false,
        });

        // Detect OK gesture (replaces fist detection)
        detectOKGesture(handLandmarks);

        // Update crosshair aim (freeze when OK gesture active)
        if (crosshairPositionRef.current && !isFistDetectedRef.current) {
          const wrist = handLandmarks[LANDMARKS.WRIST];
          const middleTip = handLandmarks[LANDMARKS.MIDDLE_FINGER_TIP];

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
          const t11 = performance.now();
          drawBlackHole(
            ctx,
            crosshairPositionRef.current.x,
            crosshairPositionRef.current.y
          );
          timings.drawBlackHole = performance.now() - t11;
        }

        // Draw crosshair at independent position
        if (crosshairPositionRef.current) {
          drawCrosshair(
            ctx,
            crosshairPositionRef.current.x,
            crosshairPositionRef.current.y
          );
        }

        timings.handProcessing = performance.now() - t10;
      } else {
        // No hands detected - keep crosshair at last position
        setIsFistDetected(false);
        isFistClosedRef.current = false;
        setHandsDetected({ right: false, left: false });
        timings.handProcessing = 0;
      }

      // Draw player shield (on top of everything)
      const t12 = performance.now();
      drawPlayerShield(ctx);
      timings.drawShield = performance.now() - t12;

      // Draw "FIRE!" message if firing
      if (isFiring) {
        drawFireMessage(ctx, canvas.width, canvas.height);
      }

      // Draw hit/miss message
      if (hitMessage) {
        drawHitMessage(ctx, canvas.width, canvas.height, hitMessage);
      }

      // Calculate FPS and log performance metrics
      frameCountRef.current++;
      const deltaTime = now - lastFrameTimeRef.current;

      if (deltaTime >= 500) {
        // Update FPS every 500ms
        const currentFps = (frameCountRef.current / deltaTime) * 1000;
        setFps(Math.round(currentFps));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      // Log performance every 60 frames (~1 second)
      const totalFrameTime = performance.now() - frameStart;
      timings.totalFrame = totalFrameTime;

      if (frameCountRef.current % 60 === 0) {
        console.log("🔍 PERFORMANCE PROFILING:");
        console.log(`├─ MediaPipe Detection: ${timings.mediapipe?.toFixed(2)}ms (${((timings.mediapipe / totalFrameTime) * 100).toFixed(1)}%)`);
        console.log(`├─ Clear Canvas: ${timings.clear?.toFixed(2)}ms`);
        console.log(`├─ Update Bullets: ${timings.updateBullets?.toFixed(2)}ms`);
        console.log(`├─ Update Particles: ${timings.updateParticles?.toFixed(2)}ms`);
        console.log(`├─ Update Duck Physics: ${timings.updateDuckPhysics?.toFixed(2)}ms`);
        console.log(`├─ Draw Particles: ${timings.drawParticles?.toFixed(2)}ms`);
        console.log(`├─ Draw Bullets: ${timings.drawBullets?.toFixed(2)}ms`);
        console.log(`├─ Draw Ducks: ${timings.drawDucks?.toFixed(2)}ms (${((timings.drawDucks / totalFrameTime) * 100).toFixed(1)}%)`);
        console.log(`├─ Draw Factory: ${timings.drawFactory?.toFixed(2)}ms (${((timings.drawFactory / totalFrameTime) * 100).toFixed(1)}%)`);
        console.log(`├─ Hand Processing: ${timings.handProcessing?.toFixed(2)}ms`);
        console.log(`├─ Draw Black Hole: ${timings.drawBlackHole?.toFixed(2) || '0.00'}ms ${timings.drawBlackHole ? `(${((timings.drawBlackHole / totalFrameTime) * 100).toFixed(1)}%)` : ''}`);
        console.log(`├─ Draw Shield: ${timings.drawShield?.toFixed(2)}ms (${((timings.drawShield / totalFrameTime) * 100).toFixed(1)}%)`);
        console.log(`└─ TOTAL FRAME: ${totalFrameTime.toFixed(2)}ms (Target: 16.67ms for 60fps)`);
        console.log(`   Current FPS: ${Math.round(1000 / totalFrameTime)}`);
        console.log("");
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

    // Draw spiraling particles (optimized: reduced from 60 to 30 for performance)
    for (let i = 0; i < 30; i++) {
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
      ctx.strokeStyle = `rgba(186, 85, 211, ${0.5 + Math.sin(time * 6 + i) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.stroke();
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

    // Draw bright pulsing core (optimized: removed shadow blur)
    const coreSize = 15 + Math.sin(time * 5) * 5;
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 100, 255, ${0.7 + Math.sin(time * 7) * 0.3})`;
    ctx.fill();
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
                if (newHp === 0) {
                  setGameOver(true);
                  setGameOverTime(performance.now());
                }
                return newHp;
              });
              setHitMessage("HIT! -1 HP");
              setTimeout(() => setHitMessage(null), 500);
              if (damageSoundRef.current && !isMutedRef.current) {
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
    if (!factoryPositionRef.current) return;

    const factoryX = factoryPositionRef.current.x;
    const factoryY = factoryPositionRef.current.y;
    const factoryWidth = 200; // Double size
    const factoryHeight = 160; // Double size
    const corner = factoryPositionRef.current.corner;
    const centerX = factoryX + factoryWidth / 2;
    const centerY = factoryY + factoryHeight / 2;

    const canBuild =
      ducksRef.current.filter((d) => d.alive).length < MAX_PLANES_ALIVE &&
      totalSpawnedRef.current < TOTAL_PLANES;

    const time = performance.now() / 1000;

    // Draw shadow/base glow beneath factory
    const shadowGradient = ctx.createRadialGradient(
      centerX,
      centerY + factoryHeight / 2,
      0,
      centerX,
      centerY + factoryHeight / 2,
      factoryWidth * 0.8
    );
    shadowGradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    shadowGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
    shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(
      centerX - factoryWidth,
      centerY - factoryHeight / 2,
      factoryWidth * 2,
      factoryHeight * 1.5
    );

    // Draw fog/mist particles around factory (optimized: reduced from 8 to 4)
    for (let i = 0; i < 4; i++) {
      const angle = (time * 0.3 + i * (Math.PI / 2)) % (Math.PI * 2);
      const distance = 80 + Math.sin(time * 0.5 + i) * 20;
      const fogX = centerX + Math.cos(angle) * distance;
      const fogY = centerY + Math.sin(angle) * distance;
      const fogSize = 40 + Math.sin(time * 0.4 + i * 0.5) * 15;
      const fogAlpha = 0.08 + Math.sin(time * 0.6 + i * 0.3) * 0.04;

      const fogGradient = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, fogSize);
      fogGradient.addColorStop(0, `rgba(100, 100, 120, ${fogAlpha})`);
      fogGradient.addColorStop(0.5, `rgba(80, 80, 100, ${fogAlpha * 0.5})`);
      fogGradient.addColorStop(1, "rgba(60, 60, 80, 0)");

      ctx.fillStyle = fogGradient;
      ctx.beginPath();
      ctx.arc(fogX, fogY, fogSize, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Factory glow (orange when active, white-orange when idle)
    if (canBuild && factoryProgressRef.current > 0) {
      // Active glow - bright orange
      const glowIntensity = 0.85 + Math.sin(time * 3) * 0.1; // Range: 0.75 - 0.95
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        factoryWidth * 1.2
      );
      // Orange gradient - bright center, darker edges
      glowGradient.addColorStop(0, `rgba(255, 159, 67, ${glowIntensity})`); // Bright orange center
      glowGradient.addColorStop(0.2, `rgba(255, 140, 66, ${glowIntensity * 0.7})`);
      glowGradient.addColorStop(0.5, `rgba(255, 107, 53, ${glowIntensity * 0.4})`);
      glowGradient.addColorStop(0.8, `rgba(255, 87, 34, ${glowIntensity * 0.15})`);
      glowGradient.addColorStop(1, "rgba(255, 87, 34, 0)"); // Transparent

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, factoryWidth * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Idle glow - warm orange (embers resting) - 30% more orange and prominent
      const idleIntensity = 0.52 + Math.sin(time * 1.5) * 0.1; // 30% more intense: 0.42 - 0.62
      const idleGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        factoryWidth * 1.0
      );
      // Orange gradient - more saturated orange
      idleGradient.addColorStop(0, `rgba(255, 220, 180, ${idleIntensity})`); // Warm orange center
      idleGradient.addColorStop(0.3, `rgba(255, 180, 110, ${idleIntensity * 0.7})`); // Medium orange
      idleGradient.addColorStop(0.6, `rgba(255, 140, 80, ${idleIntensity * 0.4})`); // Deeper orange
      idleGradient.addColorStop(0.85, `rgba(255, 120, 60, ${idleIntensity * 0.15})`);
      idleGradient.addColorStop(1, "rgba(255, 100, 40, 0)"); // Transparent

      ctx.fillStyle = idleGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, factoryWidth * 1.0, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw factory sprite if loaded, otherwise fallback to shapes
    if (factorySpritesLoadedRef.current && factorySprite1Ref.current && factorySprite2Ref.current) {
      const time = performance.now();
      // Animate when building (switch every 200ms)
      const frameIndex = canBuild ? Math.floor(time / 200) % 2 : 0;
      const sprite = frameIndex === 0 ? factorySprite1Ref.current : factorySprite2Ref.current;

      // Apply transformations based on corner
      ctx.save();

      // Translate to factory center
      ctx.translate(factoryX + factoryWidth / 2, factoryY + factoryHeight / 2);

      // Flip based on corner position
      if (corner === 0) {
        // Top-left: only flip vertical
        ctx.scale(1, -1);
      } else if (corner === 1) {
        // Top-right: flip both horizontal and vertical
        ctx.scale(-1, -1);
      } else if (corner === 3) {
        // Bottom-right: only flip horizontal
        ctx.scale(-1, 1);
      }
      // Corner 2 (bottom-left): no flip

      // Draw sprite centered
      ctx.drawImage(sprite, -factoryWidth / 2, -factoryHeight / 2, factoryWidth, factoryHeight);

      ctx.restore();
    } else {
      // Fallback: draw simple shapes
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
    }

    // Progress bar
    const barWidth = 80;
    const barHeight = 12;
    const barX = factoryX + (factoryWidth - barWidth) / 2;

    // Position bar above factory for bottom corners, below for top corners
    const barY = (corner === 2 || corner === 3)
      ? factoryY - barHeight - 10  // Above factory
      : factoryY + factoryHeight + 10; // Below factory

    // Progress bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar fill (orange gradient when building)
    const progress = factoryProgressRef.current;
    if (canBuild && progress > 0) {
      const barGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      barGradient.addColorStop(0, "#ff9f43"); // Bright orange
      barGradient.addColorStop(0.5, "#ff8c42"); // Medium orange
      barGradient.addColorStop(1, "#ff6b35"); // Dark orange
      ctx.fillStyle = barGradient;
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    } else if (!canBuild) {
      ctx.fillStyle = "#95a5a6";
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    // Progress bar border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Planes killed counter (X/20) - position based on bar location
    const killed = planesKilledRef.current;
    const counterY = (corner === 2 || corner === 3)
      ? barY - 5  // Above bar for bottom corners
      : barY + barHeight + 15; // Below bar for top corners

    ctx.font = "bold 10px system-ui";
    ctx.fillStyle = killed < TOTAL_PLANES ? "#2ecc71" : "#e74c3c";
    ctx.textAlign = "center";
    ctx.fillText(
      `${killed}/${TOTAL_PLANES}`,
      factoryX + factoryWidth / 2,
      counterY
    );
  }

  function drawPlayerShield(ctx: CanvasRenderingContext2D) {
    const canvas = canvasRef.current;
    if (!canvas || !shieldPositionRef.current) return;

    const shieldX = shieldPositionRef.current.x;
    const shieldY = shieldPositionRef.current.y;
    const shieldRadius = 80;
    const shieldSize = 160; // Size for sprite (2x radius)

    const time = performance.now() / 1000;
    const hpRatio = playerHpRef.current / 100;

    // Celestial glow - 16-pointed star shape (smaller, better gradient)
    const glowIntensity = 0.85 + Math.sin(time * 2) * 0.1; // Bold pulse: 0.75 - 0.95
    const starSize = shieldSize * 0.5; // Smaller star

    // Draw 2 layers of 16-pointed star (optimized: reduced from 3 to 2 layers)
    for (let layer = 1; layer >= 0; layer--) {
      const layerSize = starSize * (1 + layer * 0.3);
      const layerOpacity = (1 - layer * 0.3) * glowIntensity; // Smooth gradient
      const outerRadius = layerSize;
      const innerRadius = layerSize * 0.55;

      // Smooth gradient color per layer
      if (hpRatio > 0.5) {
        // Angel - gold gradient
        const alpha = layerOpacity * (0.5 - layer * 0.15);
        ctx.fillStyle = `rgba(255, 235, 100, ${alpha})`;
      } else {
        // Demon - red gradient
        const alpha = layerOpacity * (0.5 - layer * 0.15);
        ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
      }

      ctx.beginPath();
      // Draw 16-pointed star
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8 + time * 0.3; // Slower rotation, 16 points
        const nextAngle = ((i + 1) * Math.PI) / 8 + time * 0.3;

        // Outer point (peak)
        const outerX = shieldX + Math.cos(angle) * outerRadius;
        const outerY = shieldY + Math.sin(angle) * outerRadius;

        // Inner point (valley) between peaks
        const innerAngle = (angle + nextAngle) / 2;
        const innerX = shieldX + Math.cos(innerAngle) * innerRadius;
        const innerY = shieldY + Math.sin(innerAngle) * innerRadius;

        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
    }

    // HP bar above shield (thin bar, no text)
    const barWidth = 160;
    const barHeight = 8;
    const barX = shieldX - barWidth / 2;
    const barY = shieldY - shieldRadius - 20;

    // HP bar background
    ctx.fillStyle = "#333333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP bar fill (using ref for correct value)
    ctx.fillStyle = hpRatio > 0.5 ? "#00ff88" : hpRatio > 0.25 ? "#feca57" : "#ff6b6b";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // HP bar border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw shield sprite based on HP, or fallback to circle
    if (
      shieldSpritesLoadedRef.current &&
      shieldSprite1Ref.current &&
      shieldSprite2Ref.current &&
      shieldSprite3Ref.current &&
      shieldSprite4Ref.current
    ) {
      // Select sprite based on HP percentage
      let sprite;
      if (hpRatio > 0.75) {
        sprite = shieldSprite1Ref.current; // Angel happy (75-100%)
      } else if (hpRatio > 0.5) {
        sprite = shieldSprite2Ref.current; // Angel distressed (50-75%)
      } else if (hpRatio > 0.25) {
        sprite = shieldSprite3Ref.current; // Demon revealing (25-50%)
      } else {
        sprite = shieldSprite4Ref.current; // Full demon (0-25%)
      }

      // Always draw normal (no flipping for shield)
      ctx.drawImage(sprite, shieldX - shieldSize / 2, shieldY - shieldSize / 2, shieldSize, shieldSize);
    } else {
      // Fallback: draw simple green circle
      ctx.strokeStyle = "rgba(0, 255, 0, 1.0)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(shieldX, shieldY, shieldRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
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

      // Calculate angle based on velocity
      const angle = Math.atan2(duck.vy, duck.vx);

      // Animate propeller: alternate between sprite 1 and 2
      const frameIndex = Math.floor(time / 100) % 2; // Switch every 100ms
      const sprite = frameIndex === 0 ? planeSprite1Ref.current : planeSprite2Ref.current;

      if (!sprite) return;

      ctx.save();

      // Translate to plane position
      ctx.translate(duck.x, duck.y);

      // Rotate based on velocity direction (angle already calculated above)
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

      // Simple radial glow (optimized: reduced gradient stops from 4 to 2)
      const glowSize = duck.size * 0.8;
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
      glowGradient.addColorStop(0, "rgba(200, 220, 255, 0.3)");
      glowGradient.addColorStop(1, "rgba(200, 220, 255, 0)");

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, 2 * Math.PI);
      ctx.fill();

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

  function detectOKGesture(landmarks: any[]) {
    // Detect OK gesture (pinch) with normalized distance and hysteresis
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexTip = landmarks[LANDMARKS.INDEX_FINGER_TIP];
    const wrist = landmarks[LANDMARKS.WRIST];
    const indexMcp = landmarks[LANDMARKS.INDEX_FINGER_MCP];

    // Calculate pinch distance
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    );

    // Reference scale (hand size)
    const scale = Math.sqrt(
      Math.pow(wrist.x - indexMcp.x, 2) + Math.pow(wrist.y - indexMcp.y, 2)
    );

    const distNorm = distance / Math.max(scale, 0.01); // Avoid division by zero

    // Hysteresis thresholds
    let isOK = false;

    if (!isFistDetectedRef.current) {
      // Currently inactive, check for activation
      if (distNorm < OK_ENTER_THRESHOLD) {
        okConfirmFramesRef.current++;
        if (okConfirmFramesRef.current >= OK_CONFIRM_FRAMES) {
          isOK = true;
        }
      } else {
        okConfirmFramesRef.current = 0;
      }
    } else {
      // Currently active, check for deactivation
      if (distNorm > OK_EXIT_THRESHOLD) {
        okConfirmFramesRef.current++;
        if (okConfirmFramesRef.current >= OK_CONFIRM_FRAMES) {
          isOK = false;
          okConfirmFramesRef.current = 0;
        }
      } else {
        okConfirmFramesRef.current = 0;
        isOK = true;
      }
    }

    // Update state
    isFistDetectedRef.current = isOK;
    setIsFistDetected(isOK);

    if (isOK) {
      if (!isFistClosedRef.current) {
        isFistClosedRef.current = true;
        setIsFiring(true);
      }
    } else {
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
        width: "100%",
        maxWidth: "1280px",
        margin: "0 auto",
      }}
      className="game-container"
    >
      {/* HUD Banner - Above video (desktop) / Right sidebar (mobile) */}
      {status === "ready" && (
        <div
          className="hud-banner"
          style={
            isMobile
              ? {
                  position: "fixed",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "80px",
                  height: "100vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "1.5rem",
                  padding: "1.5rem 0.5rem",
                  backdropFilter: "blur(20px) saturate(180%)",
                  background: "rgba(10, 10, 10, 0.7)",
                  borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  zIndex: 100,
                  overflowY: "auto",
                }
              : {
                  display: "flex",
                  gap: "2rem",
                  padding: "1rem 2rem",
                  backdropFilter: "blur(20px) saturate(180%)",
                  background: "rgba(10, 10, 10, 0.7)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px 8px 0 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  justifyContent: "space-between",
                  alignItems: "center",
                }
          }
        >
          {/* Fullscreen Button - Mobile only, at top */}
          {isMobile && (
            <button
              onClick={toggleFullscreen}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                padding: "0.6rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                color: "#feca57",
                minWidth: "48px",
                minHeight: "48px",
                width: "100%",
                maxWidth: "60px",
              }}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          )}

          {/* Mute Button - at top for mobile */}
          {isMobile && (
            <button
              onClick={toggleMute}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                padding: "0.6rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                color: "#feca57",
                minWidth: "48px",
                minHeight: "48px",
                width: "100%",
                maxWidth: "60px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}

          {/* FPS & Score - Combined in mobile */}
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <Star size={16} color="#feca57" />
              <div style={{ textAlign: "center", color: "#feca57", fontSize: "0.75rem", fontWeight: "bold" }}>
                {fps} / {score}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div>
                <strong>FPS:</strong> <span style={{ color: "#feca57" }}>{fps}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Star size={20} color="#feca57" />
                <span>
                  <strong>Score:</strong> <span style={{ color: "#feca57" }}>{score}</span>
                </span>
              </div>
            </div>
          )}

          {/* Planes Killed & HP - Combined in mobile */}
          {isMobile ? (
            <div className="planes-hp-row" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "1rem", width: "100%" }}>
              {/* Planes */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                <Plane size={16} color="#feca57" />
                <span style={{ fontSize: "0.65rem", color: "#888" }}>{planesKilled}/{TOTAL_PLANES}</span>
              </div>
              {/* HP */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                <Cross size={16} color="#feca57" />
                <span style={{ fontSize: "0.7rem", color: playerHp > 50 ? "#00ff88" : playerHp > 25 ? "#feca57" : "#ff6b6b" }}>
                  {playerHp}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Planes Killed */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Plane size={20} color="#feca57" />
                <span>
                  <strong>Killed:</strong> <span style={{ color: "#888" }}>{planesKilled}/{TOTAL_PLANES}</span>
                </span>
              </div>

              {/* HP */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Cross size={20} color="#feca57" />
                <span>
                  <strong>HP:</strong>{" "}
                  <span style={{ color: playerHp > 50 ? "#00ff88" : playerHp > 25 ? "#feca57" : "#ff6b6b" }}>
                    {playerHp}
                  </span>
                </span>
              </div>
            </>
          )}

          {/* Hand Detection Status */}
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <Hand
                size={22}
                fill={isFistDetected ? "#ff6b6b" : (handsDetected.right ? "#00ff88" : "none")}
                stroke={isFistDetected ? "#ff6b6b" : (handsDetected.right ? "#00ff88" : "#feca57")}
                strokeWidth={2}
              />
              <span style={{ fontSize: "0.65rem", color: isFistDetected ? "#ff6b6b" : (handsDetected.right ? "#00ff88" : "#888") }}>
                {handsDetected.right ? (isFistDetected ? "FIRE" : "AIM") : "✗"}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Hand
                size={24}
                fill={isFistDetected ? "#ff6b6b" : (handsDetected.right ? "#00ff88" : "none")}
                stroke={isFistDetected ? "#ff6b6b" : (handsDetected.right ? "#00ff88" : "#feca57")}
                strokeWidth={2}
              />
              <span style={{ fontSize: "0.75rem", color: isFistDetected ? "#ff6b6b" : (handsDetected.right ? "#00ff88" : "#888") }}>
                {handsDetected.right ? (isFistDetected ? "FIRE" : "AIM") : "✗"}
              </span>
            </div>
          )}

          {/* Mute Button - Desktop only at bottom */}
          {!isMobile && (
            <button
              onClick={toggleMute}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                padding: "0.4rem 0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                transition: "all 0.2s ease",
                color: "#feca57",
              }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
              {isMuted ? "MUTED" : "ON"}
            </span>
          </button>
          )}
        </div>
      )}

      <div
        className="video-container"
        style={
          isMobile
            ? {
                position: "relative",
                width: "calc(100% - 80px)",
                height: "100vh",
                marginRight: "80px",
              }
            : {
                position: "relative",
                width: "100%",
                height: "100vh",
              }
        }
      >
        {/* Video element */}
        <video
        ref={videoRef}
        style={{
          display: status === "ready" ? "block" : "none",
          width: "100%",
          height: "100%",
          objectFit: "cover",
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
      />

      {/* Pause overlay */}
      {isPaused && (
        <>
          {/* Dark overlay background (30% opacity) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 499,
              pointerEvents: "none",
            }}
          />
          {/* Content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              zIndex: 500,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(3rem, 12vw, 6rem)",
                fontWeight: 400,
                background: "linear-gradient(135deg, #feca57, #ff9f43)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              PAUSED
            </h2>
            <button
              onClick={() => setIsPaused(false)}
              style={{
                padding: "1rem 2.5rem",
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                color: "white",
                textDecoration: "none",
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >
              Continuar
            </button>
          </div>
        </>
      )}


      {/* Portrait mode suggestion */}
      {isPortrait && (
        <>
          {/* Dark overlay background (60% opacity) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              zIndex: 1999,
              pointerEvents: "none",
            }}
          />
          {/* Content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              zIndex: 2000,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2rem, 8vw, 4rem)",
                fontWeight: 400,
                background: "linear-gradient(135deg, #feca57, #ff9f43)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                textAlign: "center",
                pointerEvents: "none",
                padding: "0 1rem",
              }}
            >
              Gira tu dispositivo
            </h2>
            {/* Icon container with glassmorphism */}
            <div
              style={{
                padding: "2rem 3rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "2rem",
                pointerEvents: "none",
              }}
            >
              <div style={{ animation: "rotate-phone 2s ease-in-out infinite" }}>
                <div style={{ transform: "rotate(-90deg)" }}>
                  <Undo size={40} strokeWidth={2.5} color="#feca57" />
                </div>
              </div>
              <div style={{ animation: "rotate-phone 2s ease-in-out infinite" }}>
                <Smartphone size={80} strokeWidth={1.5} color="#feca57" />
              </div>
              <div style={{ animation: "rotate-phone 2s ease-in-out infinite" }}>
                <div style={{ transform: "rotate(270deg) scaleY(-1)" }}>
                  <Redo size={40} strokeWidth={2.5} color="#feca57" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Victory screen */}
      {victory && (
        <>
          {/* Dark overlay background (30% opacity) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 999,
              pointerEvents: "none",
            }}
          />
          {/* Content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              zIndex: 1000,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(3rem, 12vw, 6rem)",
                fontWeight: 400,
                background: "linear-gradient(135deg, #00ff88, #feca57)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                textAlign: "center",
              }}
            >
              VICTORY
            </h2>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "1rem 2.5rem",
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                color: "white",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Volver a jugar
            </button>
          </div>
        </>
      )}

      {/* Game Over screen */}
      {gameOver && (
        <>
          {/* Dark overlay background (30% opacity) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 999,
              pointerEvents: "none",
            }}
          />
          {/* Content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              zIndex: 1000,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(3rem, 12vw, 6rem)",
                fontWeight: 400,
                background: "linear-gradient(135deg, #ff6b6b, #feca57)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                textAlign: "center",
              }}
            >
              GAME OVER
            </h2>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "1rem 2.5rem",
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                backdropFilter: "blur(20px)",
                color: "white",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Volver a jugar
            </button>
          </div>
        </>
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

      {/* CSS animations and responsive styles */}
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes rotate-phone {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-15deg);
          }
          75% {
            transform: rotate(15deg);
          }
        }

        /* Mobile landscape responsive styles - HUD becomes right sidebar */
        @media (max-width: 1280px) {
          .game-container {
            max-width: 100vw;
            margin: 0;
            display: flex;
            flex-direction: row;
            align-items: stretch;
          }

          .hud-banner {
            position: fixed !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 80px !important;
            height: 100vh !important;
            max-width: 80px !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            gap: 1.5rem !important;
            padding: 1.5rem 0.5rem !important;
            font-size: 0.7rem !important;
            border-radius: 0 !important;
            border-left: 2px solid #333 !important;
            border-top: none !important;
            border-right: none !important;
            border-bottom: none !important;
            z-index: 100 !important;
            overflow-y: auto !important;
          }

          .hud-banner > div:not(.hands-row):not(.planes-hp-row) {
            flex-direction: column !important;
            gap: 0.6rem !important;
            align-items: center !important;
            width: 100% !important;
          }

          .hud-banner .hands-row,
          .hud-banner .planes-hp-row {
            flex-direction: row !important;
          }

          /* Controls container (pause/mute) also vertical */
          .hud-banner > div:last-of-type {
            flex-direction: column !important;
            gap: 0.8rem !important;
          }

          /* Hide text labels in buttons, show only icons */
          .hud-banner button span {
            display: none !important;
          }

          .hud-banner button {
            padding: 0.6rem !important;
            min-width: 48px !important;
            min-height: 48px !important;
            gap: 0 !important;
            width: 100% !important;
            max-width: 60px !important;
          }

          /* Hide strong labels, show only values */
          .hud-banner strong {
            display: none !important;
          }

          /* Make icons slightly smaller */
          .hud-banner span[style*="fontSize: 1.2rem"] {
            font-size: 1rem !important;
          }

          .hud-banner span[style*="fontSize: 1rem"] {
            font-size: 0.85rem !important;
          }

          /* Adjust video container to account for right sidebar */
          .video-container {
            margin-right: 80px !important;
            width: calc(100% - 80px) !important;
          }
        }

        /* Very small mobile devices */
        @media (max-width: 700px) {
          .hud-banner {
            width: 65px !important;
            font-size: 0.65rem !important;
            padding: 1rem 0.4rem !important;
            gap: 1.2rem !important;
          }

          .hud-banner > div {
            gap: 0.5rem !important;
          }

          .hud-banner button {
            min-width: 44px !important;
            min-height: 44px !important;
            padding: 0.5rem !important;
            max-width: 55px !important;
          }

          .video-container {
            margin-right: 65px !important;
            width: calc(100% - 65px) !important;
          }
        }

        @media (max-width: 500px) {
          .hud-banner {
            width: 55px !important;
            padding: 0.8rem 0.3rem !important;
            gap: 1rem !important;
            font-size: 0.6rem !important;
          }

          .hud-banner button {
            min-width: 42px !important;
            min-height: 42px !important;
            max-width: 50px !important;
          }

          .video-container {
            margin-right: 55px !important;
            width: calc(100% - 55px) !important;
          }
        }

        /* Video container responsive */
        @media (orientation: landscape) {
          .video-container {
            width: 100%;
            max-width: 100%;
          }

          .video-container video,
          .video-container canvas {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        @media (max-width: 1280px) {
          .video-container video,
          .video-container canvas {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
    </div>
  );
}
