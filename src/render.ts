import {
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  NET_X,
  OBSTACLE_HH,
  OBSTACLE_HW,
  PADDLE_H,
  PADDLE_HALF,
  PADDLE_W,
  P1_X0,
  P2_X0,
  BALL_R,
} from "./constants";
import { RuntimeState } from "./runtime";
import { GameState } from "./types";

const FIELD_COLOR = "#1a1a2e";
const PADDLE_LEFT_COLOR = "#00d4ff";
const PADDLE_RIGHT_COLOR = "#ff006e";
const BALL_COLOR = "#ffbe0b";
const OBSTACLE_COLOR = "#3a86ff";
const NET_COLOR = "#444";
const TEXT_COLOR = "#fff";
const TRAIL_COLOR = "rgba(255, 190, 11, 0.3)";

export function renderGame(runtime: RuntimeState, state: GameState): void {
  const { canvas, ctx } = runtime;

  // Clear canvas
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Save context for world transform
  ctx.save();
  ctx.translate(runtime.offsetX, runtime.offsetY);
  ctx.scale(runtime.scale, runtime.scale);

  // Draw field background
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // Draw net
  drawNet(ctx);

  // Draw obstacles
  for (const obstacle of state.obstacles) {
    drawObstacle(ctx, obstacle.cx, obstacle.cy);
  }

  // Draw paddles
  drawPaddle(ctx, P1_X0, state.paddles.left.cy, PADDLE_LEFT_COLOR);
  drawPaddle(ctx, P2_X0, state.paddles.right.cy, PADDLE_RIGHT_COLOR);

  // Draw ball and trail
  if (state.ball) {
    drawBallTrail(ctx, state.ball);
    drawBall(ctx, state.ball.x, state.ball.y);
  }

  // Draw scores and mode label
  if (state.screen === "playing" || state.screen === "countdown") {
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "left";
    ctx.fillText(state.score.p1.toString(), 100, 50);
    ctx.textAlign = "right";
    ctx.fillText(state.score.p2.toString(), FIELD_W - 100, 50);

    // Mode label
    const modeLabel = state.mode === "solo" ? "SOLO" : "VERSUS";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(modeLabel, FIELD_CX, 50);
  }

  ctx.restore();
}

export function renderTitle(
  runtime: RuntimeState,
  state: GameState,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  const { canvas, ctx } = runtime;

  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(runtime.offsetX, runtime.offsetY);
  ctx.scale(runtime.scale, runtime.scale);

  // Draw field dimmed
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // Draw title
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 72px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CAROM", FIELD_CX, 150);

  // Draw menu items
  ctx.font = "24px Arial";
  const items = ["SOLO", "VERSUS", "HOW TO PLAY"];
  items.forEach((item, index) => {
    const rect = menuRects[index];
    const isHighlighted = state.menuIndex === index;

    if (isHighlighted) {
      ctx.fillStyle = "#ffbe0b";
    } else {
      ctx.fillStyle = TEXT_COLOR;
    }

    ctx.textAlign = "center";
    ctx.fillText(item, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8);

    if (isHighlighted) {
      ctx.strokeStyle = "#ffbe0b";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  ctx.restore();
}

export function renderHowTo(
  runtime: RuntimeState,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  const { canvas, ctx } = runtime;

  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(runtime.offsetX, runtime.offsetY);
  ctx.scale(runtime.scale, runtime.scale);

  // Draw background
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(FIELD_CX - 300, FIELD_CY - 250, 600, 500);

  // Draw title
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("HOW TO PLAY", FIELD_CX, 100);

  // Draw instructions
  ctx.font = "16px Arial";
  const lines = [
    "CONTROLS:",
    "P1: W/S to move",
    "P2: Arrow Up/Down to move",
    "",
    "SPIN:",
    "Move your paddle as you hit to curve the ball.",
    "Downward motion adds spin, upward removes it.",
    "",
    "OBSTACLES:",
    "Bank shots off the obstacles in the middle.",
    "First to 11 wins!",
  ];

  let y = 150;
  for (const line of lines) {
    if (line === "") {
      y += 10;
    } else {
      ctx.fillText(line, FIELD_CX, y);
      y += 25;
    }
  }

  // Draw back button
  const rect = menuRects[0];
  ctx.fillStyle = "#ffbe0b";
  ctx.textAlign = "center";
  ctx.font = "20px Arial";
  ctx.fillText("BACK", rect.x + rect.w / 2, rect.y + rect.h / 2 + 8);

  ctx.restore();
}

export function renderPaused(
  runtime: RuntimeState,
  state: GameState,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  const { canvas, ctx } = runtime;

  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(runtime.offsetX, runtime.offsetY);
  ctx.scale(runtime.scale, runtime.scale);

  // Draw background overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // Draw menu
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", FIELD_CX, 150);

  ctx.font = "24px Arial";
  const items = ["RESUME", "RESTART", "QUIT TO MENU"];
  items.forEach((item, index) => {
    const rect = menuRects[index];
    const isHighlighted = state.menuIndex === index;

    if (isHighlighted) {
      ctx.fillStyle = "#ffbe0b";
    } else {
      ctx.fillStyle = TEXT_COLOR;
    }

    ctx.textAlign = "center";
    ctx.fillText(item, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8);

    if (isHighlighted) {
      ctx.strokeStyle = "#ffbe0b";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  ctx.restore();
}

export function renderMatchOver(
  runtime: RuntimeState,
  state: GameState,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  const { canvas, ctx } = runtime;

  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(runtime.offsetX, runtime.offsetY);
  ctx.scale(runtime.scale, runtime.scale);

  // Draw background
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(FIELD_CX - 200, FIELD_CY - 150, 400, 300);

  // Draw result
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  const winner = state.winner === "left" ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!";
  ctx.fillText(winner, FIELD_CX, FIELD_CY - 80);

  // Draw score
  ctx.font = "24px Arial";
  ctx.fillText(
    `${state.score.p1} - ${state.score.p2}`,
    FIELD_CX,
    FIELD_CY - 20,
  );

  // Draw menu
  ctx.font = "20px Arial";
  const items = ["PLAY AGAIN", "MENU"];
  items.forEach((item, index) => {
    const rect = menuRects[index];
    const isHighlighted = state.menuIndex === index;

    if (isHighlighted) {
      ctx.fillStyle = "#ffbe0b";
    } else {
      ctx.fillStyle = TEXT_COLOR;
    }

    ctx.textAlign = "center";
    ctx.fillText(item, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8);

    if (isHighlighted) {
      ctx.strokeStyle = "#ffbe0b";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });

  ctx.restore();
}

function drawNet(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = NET_COLOR;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(NET_X, 0);
  ctx.lineTo(NET_X, FIELD_H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  color: string,
): void {
  ctx.fillStyle = color;
  const y = cy - PADDLE_HALF;

  drawRoundRect(ctx, x, y, PADDLE_W, PADDLE_H, 4);
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  ctx.fillStyle = OBSTACLE_COLOR;
  const x = cx - OBSTACLE_HW;
  const y = cy - OBSTACLE_HH;

  drawRoundRect(ctx, x, y, OBSTACLE_HW * 2, OBSTACLE_HH * 2, 4);
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = OBSTACLE_COLOR;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = OBSTACLE_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = BALL_COLOR;
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBallTrail(
  ctx: CanvasRenderingContext2D,
  ball: { trail: Array<{ x: number; y: number }> },
): void {
  if (ball.trail.length < 2) return;

  ctx.strokeStyle = TRAIL_COLOR;
  ctx.lineWidth = BALL_R * 0.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
  for (let i = 1; i < ball.trail.length; i++) {
    ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
  }
  ctx.stroke();
}

export function getMenuRects(
  screen: string,
  _runtime: RuntimeState,
): Array<{ x: number; y: number; w: number; h: number }> {
  const rects: Array<{ x: number; y: number; w: number; h: number }> = [];

  let items: string[] = [];
  let startY = 0;

  switch (screen) {
    case "title":
      items = ["SOLO", "VERSUS", "HOW TO PLAY"];
      startY = 250;
      break;
    case "howto":
      items = ["BACK"];
      startY = 550;
      break;
    case "paused":
      items = ["RESUME", "RESTART", "QUIT TO MENU"];
      startY = 250;
      break;
    case "matchover":
      items = ["PLAY AGAIN", "MENU"];
      startY = 300;
      break;
  }

  const itemHeight = 60;
  const itemWidth = 200;
  const spacing = 20;

  for (let i = 0; i < items.length; i++) {
    const y = startY + i * (itemHeight + spacing);
    rects.push({
      x: FIELD_CX - itemWidth / 2,
      y,
      w: itemWidth,
      h: itemHeight,
    });
  }

  return rects;
}
