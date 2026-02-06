// MediaPipe Configuration Constants

export const WASM_FILES_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// EMA (Exponential Moving Average) smoothing factor
// Higher values = more smoothing but more lag (0.0 - 1.0)
export const EMA_ALPHA = 0.3; // Menos suavizado = más responsive

// Fist detection threshold (normalized distance from fingertips to wrist)
export const FIST_THRESHOLD = 0.15;

// Debounce time between shots in milliseconds
export const FIRE_DEBOUNCE_MS = 500;

// Duration to display "FIRE!" message in milliseconds
export const FIRE_DISPLAY_MS = 300;

// Crosshair sensitivity (direction-based - how fast crosshair moves per frame)
export const CROSSHAIR_SENSITIVITY = 0.01; // Velocidad controlable

// Deadzone threshold (circular deadzone around center - prevents drift)
export const CROSSHAIR_DEADZONE = 0.05; // Deadzone pequeño

// Plane spawning system
export const MAX_PLANES_ALIVE = 5; // Maximum planes flying at once
export const TOTAL_PLANES = 20; // Total planes to spawn in the game
export const SPAWN_INTERVAL_MS = 3000; // Time between spawns (3 seconds)

// ROI (Region of Interest) optimization constants
export const ROI_SCALE = 3.0; // Margin around bounding box (increased for stability)
export const ROI_SMOOTH_ALPHA = 0.25; // EMA smoothing for ROI movement (lower = smoother)
export const FULL_RES_WIDTH = 320; // Full frame search resolution width
export const FULL_RES_HEIGHT = 180; // Full frame search resolution height
export const ROI_RES = 256; // ROI tracking resolution (square)

// Detection intervals
export const SEARCH_FULL_INTERVAL = 4; // Detect every N frames in full search (faster reacquire)
export const TRACK_ROI_INTERVAL = 3; // Detect every N frames in ROI tracking (more frequent)
export const LOST_THRESHOLD = 8; // Frames without hand before returning to full search (more patient)

// OK gesture (pinch) thresholds
export const OK_ENTER_THRESHOLD = 0.35; // Normalized distance to activate
export const OK_EXIT_THRESHOLD = 0.45; // Normalized distance to deactivate
export const OK_CONFIRM_FRAMES = 3; // Consecutive frames to confirm gesture

// Hand landmark connections for drawing
// Based on MediaPipe Hand 21 landmarks (0-20)
export const HAND_CONNECTIONS: [number, number][] = [
  // Palm
  [0, 1], [0, 5], [0, 17], [5, 9], [9, 13], [13, 17],

  // Thumb
  [1, 2], [2, 3], [3, 4],

  // Index finger
  [5, 6], [6, 7], [7, 8],

  // Middle finger
  [9, 10], [10, 11], [11, 12],

  // Ring finger
  [13, 14], [14, 15], [15, 16],

  // Pinky
  [17, 18], [18, 19], [19, 20],
];

// Landmark indices for easy reference
export const LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
};
