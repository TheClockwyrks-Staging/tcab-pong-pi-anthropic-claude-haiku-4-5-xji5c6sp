import {
  FIELD_CX,
  FIELD_CY,
  HOLD_TIME,
  OBSTACLE_CENTERS,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
} from "./constants";
import { GameState, Ball, Mode } from "./types";

export function createInitialState(): GameState {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: 0,
    titleIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    paddles: {
      left: {
        cy: FIELD_CY,
        vy: 0,
        drivenVy: 0,
        driven: false,
      },
      right: {
        cy: FIELD_CY,
        vy: 0,
        drivenVy: 0,
        driven: false,
      },
    },
    ai: {
      tracking: true,
      movement: true,
    },
    ball: createBall(),
    obstacles: [
      { index: 0, cx: OBSTACLE_CENTERS[0][0], cy: OBSTACLE_CENTERS[0][1] },
      { index: 1, cx: OBSTACLE_CENTERS[1][0], cy: OBSTACLE_CENTERS[1][1] },
    ],
    simTime: 0,
    muted: false,
  };
}

export function createBall(): Ball {
  return {
    x: FIELD_CX,
    y: FIELD_CY,
    vx: 0,
    vy: 0,
    spin: 0,
    held: true,
    holdTimer: HOLD_TIME,
    serveSign: Math.random() < 0.5 ? -1 : 1,
    trail: [],
  };
}

export function parkBall(_ball: Ball | null): Ball {
  return {
    x: FIELD_CX,
    y: FIELD_CY,
    vx: 0,
    vy: 0,
    spin: 0,
    held: true,
    holdTimer: HOLD_TIME,
    serveSign: Math.random() < 0.5 ? -1 : 1,
    trail: [],
  };
}

export function resetState(current: GameState): GameState {
  return {
    ...createInitialState(),
    simTime: current.simTime,
    muted: current.muted,
  };
}

export function startMatch(state: GameState, mode: Mode): GameState {
  return {
    ...state,
    mode,
    screen: "countdown",
    resumeScreen: "playing",
    menuIndex: 0,
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    paddles: {
      left: {
        ...state.paddles.left,
        cy: FIELD_CY,
        vy: 0,
      },
      right: {
        ...state.paddles.right,
        cy: FIELD_CY,
        vy: 0,
      },
    },
    ball: createBall(),
  };
}

export function returnToTitle(state: GameState): GameState {
  const initial = createInitialState();
  return {
    ...initial,
    titleIndex: state.titleIndex,
    simTime: state.simTime,
    muted: state.muted,
    menuIndex: state.titleIndex,
  };
}

export function clampPaddleVelocity(
  cy: number,
  cy_new: number,
  dt: number,
): number {
  if (cy_new !== cy && dt > 0) {
    return (cy_new - cy) / dt;
  }
  return 0;
}

export function updatePaddleCy(
  paddle: { cy: number; vy: number },
  dt: number,
): void {
  const next = Math.max(
    PADDLE_MIN_CY,
    Math.min(PADDLE_MAX_CY, paddle.cy + paddle.vy * dt),
  );
  paddle.vy = clampPaddleVelocity(paddle.cy, next, dt);
  paddle.cy = next;
}

export function updatePaddleWithAxis(
  paddle: { cy: number; vy: number; driven: boolean; drivenVy: number },
  axis: number,
  dt: number,
): void {
  if (paddle.driven) {
    paddle.vy = paddle.drivenVy;
  } else {
    paddle.vy = axis * 720; // PADDLE_SPEED
  }
  updatePaddleCy(paddle, dt);
}
