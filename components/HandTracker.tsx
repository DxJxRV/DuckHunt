"use client";

import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
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
} from "@/lib/mediapipe-config";

type Status = "initializing" | "loading" | "ready" | "error";

interface Duck {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  alive: boolean;
}

export default function HandTracker() {
  // State
  const [status, setStatus] = useState<Status>("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [score, setScore] = useState<number>(0);
  const [hitMessage, setHitMessage] = useState<string | null>(null);
  const [isFistDetected, setIsFistDetected] = useState<boolean>(false);
  const [handsDetected, setHandsDetected] = useState<{
    right: boolean;
    left: boolean;
  }>({ right: false, left: false });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        setStatus("loading");

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
    };
  }, []);

  // Sync ducks state to ref
  useEffect(() => {
    ducksRef.current = ducks;
  }, [ducks]);

  function initializeDucks(canvasWidth: number, canvasHeight: number) {
    const colors = ["#ff6b6b", "#4ecdc4", "#feca57", "#ff9ff3", "#48dbfb"];
    const newDucks: Duck[] = [];

    // Create 5 ducks at random positions
    for (let i = 0; i < 5; i++) {
      newDucks.push({
        id: i,
        x: Math.random() * (canvasWidth - 100) + 50,
        y: Math.random() * (canvasHeight - 100) + 50,
        size: 60,
        color: colors[i % colors.length],
        alive: true,
      });
    }

    setDucks(newDucks);
    console.log("Ducks initialized:", newDucks);
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

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ducks first (behind everything)
      drawDucks(ctx);

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

  function drawDucks(ctx: CanvasRenderingContext2D) {
    const aliveDucks = ducksRef.current.filter(d => d.alive);

    ducksRef.current.forEach((duck) => {
      if (!duck.alive) return;

      // Draw square
      ctx.fillStyle = duck.color;
      ctx.fillRect(
        duck.x - duck.size / 2,
        duck.y - duck.size / 2,
        duck.size,
        duck.size
      );

      // Draw border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        duck.x - duck.size / 2,
        duck.y - duck.size / 2,
        duck.size,
        duck.size
      );

      // Draw "X" in the center for targeting reference
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      const halfSize = duck.size / 4;
      ctx.beginPath();
      ctx.moveTo(duck.x - halfSize, duck.y - halfSize);
      ctx.lineTo(duck.x + halfSize, duck.y + halfSize);
      ctx.moveTo(duck.x + halfSize, duck.y - halfSize);
      ctx.lineTo(duck.x - halfSize, duck.y + halfSize);
      ctx.stroke();
    });
  }

  function checkCollision(crosshairX: number, crosshairY: number) {
    let hit = false;

    setDucks((prevDucks) =>
      prevDucks.map((duck) => {
        if (!duck.alive) return duck;

        // Check if crosshair is inside the duck's bounding box
        const isHit =
          crosshairX >= duck.x - duck.size / 2 &&
          crosshairX <= duck.x + duck.size / 2 &&
          crosshairY >= duck.y - duck.size / 2 &&
          crosshairY <= duck.y + duck.size / 2;

        if (isHit) {
          hit = true;
          setScore((prev) => prev + 10);
          setHitMessage("HIT! +10");
          setTimeout(() => setHitMessage(null), 500);
          return { ...duck, alive: false };
        }

        return duck;
      })
    );

    if (!hit) {
      setHitMessage("MISS!");
      setTimeout(() => setHitMessage(null), 500);
    }
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
      // Fist closed
      if (
        !isFistClosedRef.current &&
        now - lastFireTimeRef.current > FIRE_DEBOUNCE_MS
      ) {
        // Fire!
        isFistClosedRef.current = true;
        lastFireTimeRef.current = now;
        setIsFiring(true);

        // Check collision with ducks
        if (crosshairPositionRef.current) {
          checkCollision(
            crosshairPositionRef.current.x,
            crosshairPositionRef.current.y
          );
        }

        // Hide "FIRE!" message after delay
        setTimeout(() => {
          setIsFiring(false);
        }, FIRE_DISPLAY_MS);
      }
    } else {
      // Fist open - reset state
      isFistClosedRef.current = false;
    }
  }

  function drawFireMessage(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.font = "bold 80px system-ui, sans-serif";
    ctx.fillStyle = "#ff0000";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = "FIRE!";
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
          pointerEvents: "none",
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
            <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#888" }}>
              <strong>Ducks:</strong> {ducks.filter((d) => d.alive).length}/
              {ducks.length}
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
