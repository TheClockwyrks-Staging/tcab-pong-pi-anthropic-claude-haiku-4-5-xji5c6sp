export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";

export interface Paddle {
  cy: number;
  vy: number;
  drivenVy: number;
  driven: boolean;
}

export interface TrailSample {
  x: number;
  y: number;
  t: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  held: boolean;
  holdTimer: number;
  serveSign: 1 | -1;
  trail: TrailSample[];
}

export interface Obstacle {
  index: 0 | 1;
  cx: number;
  cy: number;
}

export interface GameState {
  // Screens and menus
  screen: Screen;
  mode: Mode;
  menuIndex: number;
  titleIndex: number;
  resumeScreen: "countdown" | "playing";

  // Match state
  score: { p1: number; p2: number };
  winner: Side | null;
  receiver: Side;

  // Paddles
  paddles: {
    left: Paddle;
    right: Paddle;
  };

  // AI
  ai: {
    tracking: boolean;
    movement: boolean;
  };

  // Ball (null when not present)
  ball: Ball | null;

  // Obstacles
  obstacles: Obstacle[];

  // Time
  simTime: number;
  muted: boolean;
}

// Input state
export interface InputState {
  "p1-up": boolean;
  "p1-down": boolean;
  "p2-up": boolean;
  "p2-down": boolean;
  confirm: boolean;
  back: boolean;
  pause: boolean;
  mute: boolean;
  // Pointer/touch
  pointer: { x: number; y: number; pressed: boolean } | null;
  pointerPressed: boolean;
  pointerReleased: boolean;
  touchContacts: Map<number, { x: number; y: number; active: boolean }>;
}

export interface AudioContext {
  muted: boolean;
  play(cue: "paddle-hit" | "wall-bounce" | "obstacle-bounce" | "score"): void;
}

export interface DebugSurface {
  version: number;
  setAutoStep(enabled: boolean): void;
  advance(seconds: number, frames?: number): void;
  clearWorld(): void;
  spawnBall(): void;
  spawnObstacle(index: 0 | 1): void;
  reset(): void;
  reconcile(): void;
  setScreen(screen: Screen): void;
  setMode(mode: Mode): void;
  setMenuIndex(index: number): void;
  setTitleIndex(index: number): void;
  setResumeScreen(screen: "countdown" | "playing"): void;
  setScore(p1: number, p2: number): void;
  setWinner(side: Side | null): void;
  setReceiver(side: Side): void;
  setPaddleCy(side: Side, cy: number): void;
  setPaddleVy(side: Side, vy: number): void;
  setPaddleDriven(side: Side, driven: boolean): void;
  setBallPosition(x: number, y: number): void;
  setBallVelocity(vx: number, vy: number): void;
  setBallSpin(spin: number): void;
  setBallHeld(held: boolean): void;
  setBallHoldTimer(seconds: number): void;
  setBallServeSign(sign: 1 | -1): void;
  drawBallServeSign(): void;
  setAiTracking(enabled: boolean): void;
  setAiMovement(enabled: boolean): void;
  setMuted(muted: boolean): void;
  snapshot(): Snapshot;
  menuItemRect(
    index: number,
  ): { x: number; y: number; w: number; h: number } | null;
}

export interface Snapshot {
  version: number;
  screen: Screen;
  mode: Mode;
  menuIndex: number;
  titleIndex: number;
  resumeScreen: "countdown" | "playing";
  score: { p1: number; p2: number };
  winner: Side | null;
  muted: boolean;
  paddles: {
    left: { cy: number; vy: number; drivenVy: number; driven: boolean };
    right: { cy: number; vy: number; drivenVy: number; driven: boolean };
  };
  ai: { tracking: boolean; movement: boolean };
  receiver: Side;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    spin: number;
    held: boolean;
    holdTimer: number;
    serveSign: 1 | -1;
    trail: { x: number; y: number; t: number }[];
  } | null;
  obstacles: { index: number; cx: number; cy: number }[];
  autoStep: boolean;
  simTime: number;
}

export interface MenuItem {
  label: string;
  action: () => void;
}

export interface MenuLayout {
  items: MenuItem[];
  rects: Array<{ x: number; y: number; w: number; h: number }>;
}
