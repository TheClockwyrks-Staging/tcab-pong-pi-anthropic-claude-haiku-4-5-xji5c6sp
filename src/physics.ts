import {
  BALL_R,
  FIELD_H,
  FIELD_W,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  OBSTACLE_HH,
  OBSTACLE_HW,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  SPEED_CAP,
  SPEED_MULT,
} from "./constants";
import { Ball } from "./types";

export interface CollisionEvent {
  type: "paddle-hit" | "wall-bounce" | "obstacle-bounce" | "score";
}

export function getSpeed(vx: number, vy: number): number {
  return Math.hypot(vx, vy);
}

export function addSpin(spin: number, decay: number): number {
  return spin * Math.pow(0.5, decay / SPIN_HALFLIFE);
}

export function advanceBall(
  ball: Ball,
  paddle1: { cy: number; vy: number; driven: boolean; drivenVy: number },
  paddle2: { cy: number; vy: number; driven: boolean; drivenVy: number },
  dt: number,
  obstacles: Array<{ cx: number; cy: number }>,
): CollisionEvent[] {
  if (ball.held) {
    return [];
  }

  const events: CollisionEvent[] = [];
  const speed = getSpeed(ball.vx, ball.vy);
  const n = Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP));
  const h = dt / n;

  for (let i = 0; i < n; i++) {
    // 1. Spin turns velocity
    if (speed > 0) {
      const angle = (ball.spin / speed) * h;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newVx = ball.vx * cos - ball.vy * sin;
      const newVy = ball.vx * sin + ball.vy * cos;
      ball.vx = newVx;
      ball.vy = newVy;
    }

    // 2. Spin decays
    ball.spin = addSpin(ball.spin, h);

    // 3. Advance
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    // 4. Resolve collisions
    resolveWalls(ball, events);
    resolvePaddle(ball, paddle1, "left", events);
    resolvePaddle(ball, paddle2, "right", events);
    resolveObstacle(ball, obstacles[0], events);
    resolveObstacle(ball, obstacles[1], events);

    // Check scoring
    if (ball.x - BALL_R > FIELD_W || ball.x + BALL_R < 0) {
      events.push({ type: "score" });
    }
  }

  return events;
}

function resolveWalls(ball: Ball, events: CollisionEvent[]): void {
  if (ball.y - BALL_R < 0 && ball.vy < 0) {
    ball.y = BALL_R;
    ball.vy = -ball.vy;
    if (!events.some((e) => e.type === "wall-bounce")) {
      events.push({ type: "wall-bounce" });
    }
  } else if (ball.y + BALL_R > FIELD_H && ball.vy > 0) {
    ball.y = FIELD_H - BALL_R;
    ball.vy = -ball.vy;
    if (!events.some((e) => e.type === "wall-bounce")) {
      events.push({ type: "wall-bounce" });
    }
  }
}

function resolvePaddle(
  ball: Ball,
  paddle: { cy: number; vy: number; driven: boolean; drivenVy: number },
  side: "left" | "right",
  events: CollisionEvent[],
): void {
  const x0 = side === "left" ? P1_X0 : P2_X0;
  const x1 = side === "left" ? P1_X1 : P2_X1;
  const y0 = paddle.cy - PADDLE_HALF;
  const y1 = paddle.cy + PADDLE_HALF;

  const collision = resolveCircleRect(ball, { x0, x1, y0, y1 });
  if (collision) {
    if (collision.face === "left" || collision.face === "right") {
      // Paddle hit - apply spin mechanics
      const offset = Math.max(
        -1,
        Math.min(1, (ball.y - paddle.cy) / PADDLE_HALF),
      );
      const theta = offset * MAX_BOUNCE_ANGLE;

      const dir = side === "left" ? 1 : -1;
      const speed = Math.min(
        getSpeed(ball.vx, ball.vy) * SPEED_MULT,
        SPEED_CAP,
      );

      ball.vx = dir * speed * Math.cos(theta);
      ball.vy = speed * Math.sin(theta);

      ball.spin = Math.max(
        -SPIN_CLAMP,
        Math.min(SPIN_CLAMP, ball.spin + paddle.vy * SPIN_FROM_PADDLE),
      );

      ball.x = side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R;

      events.push({ type: "paddle-hit" });
    } else {
      // End cap bounce
      if (collision.face === "top" && ball.vy < 0) {
        ball.y = y0 - BALL_R;
        ball.vy = -ball.vy;
      } else if (collision.face === "bottom" && ball.vy > 0) {
        ball.y = y1 + BALL_R;
        ball.vy = -ball.vy;
      }
      if (!events.some((e) => e.type === "wall-bounce")) {
        events.push({ type: "wall-bounce" });
      }
    }
  }
}

function resolveObstacle(
  ball: Ball,
  obstacle: { cx: number; cy: number },
  events: CollisionEvent[],
): void {
  const x0 = obstacle.cx - OBSTACLE_HW;
  const x1 = obstacle.cx + OBSTACLE_HW;
  const y0 = obstacle.cy - OBSTACLE_HH;
  const y1 = obstacle.cy + OBSTACLE_HH;

  const collision = resolveCircleRect(ball, { x0, x1, y0, y1 });
  if (collision) {
    if (!events.some((e) => e.type === "obstacle-bounce")) {
      events.push({ type: "obstacle-bounce" });
    }
  }
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Collision {
  face: "left" | "right" | "top" | "bottom";
}

function resolveCircleRect(ball: Ball, rect: Rect): Collision | null {
  // Expand rectangle by BALL_R
  const x0 = rect.x0 - BALL_R;
  const x1 = rect.x1 + BALL_R;
  const y0 = rect.y0 - BALL_R;
  const y1 = rect.y1 + BALL_R;

  // Check if ball center is inside expanded rectangle
  if (ball.x <= x0 || ball.x >= x1 || ball.y <= y0 || ball.y >= y1) {
    return null;
  }

  // Compute penetration depths
  const left = ball.x - x0;
  const right = x1 - ball.x;
  const top = ball.y - y0;
  const bottom = y1 - ball.y;

  // Find minimum depth (first of left, right, top, bottom on tie)
  const depths: Array<[number, "left" | "right" | "top" | "bottom"]> = [
    [left, "left"],
    [right, "right"],
    [top, "top"],
    [bottom, "bottom"],
  ];

  const [, face] = depths.reduce((min, current) =>
    current[0] < min[0] ? current : min,
  );

  // Place ball BALL_R off the struck face
  switch (face) {
    case "left":
      ball.x = rect.x0 - BALL_R;
      if (ball.vx > 0) ball.vx = -ball.vx;
      break;
    case "right":
      ball.x = rect.x1 + BALL_R;
      if (ball.vx < 0) ball.vx = -ball.vx;
      break;
    case "top":
      ball.y = rect.y0 - BALL_R;
      if (ball.vy > 0) ball.vy = -ball.vy;
      break;
    case "bottom":
      ball.y = rect.y1 + BALL_R;
      if (ball.vy < 0) ball.vy = -ball.vy;
      break;
  }

  return { face };
}

export function serveBall(ball: Ball, receiver: "left" | "right"): void {
  ball.held = false;
  ball.trail = [];

  const dir = receiver === "left" ? -1 : 1;
  ball.vx = dir * SERVE_SPEED * Math.cos(SERVE_ANGLE);
  ball.vy = ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE);
}

export function updateBallTrail(
  ball: Ball,
  simTime: number,
  trailTime: number,
): void {
  ball.trail.push({ x: ball.x, y: ball.y, t: simTime });

  // Remove samples older than trailTime
  const cutoff = simTime - trailTime;
  while (ball.trail.length > 0 && ball.trail[0].t < cutoff) {
    ball.trail.shift();
  }
}

export function checkScore(ball: Ball): "none" | "left" | "right" {
  if (ball.x - BALL_R > FIELD_W) {
    return "left";
  }
  if (ball.x + BALL_R < 0) {
    return "right";
  }
  return "none";
}

export function checkWin(p1: number, p2: number): "none" | "left" | "right" {
  if (p1 >= 11 && p1 - p2 >= 2) {
    return "left";
  }
  if (p2 >= 11 && p2 - p1 >= 2) {
    return "right";
  }
  return "none";
}
