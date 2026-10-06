import {
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
} from "./constants";
import { GameState } from "./types";

export function updateAIPaddle(state: GameState, dt: number): void {
  const ball = state.ball;
  const aiPaddle = state.paddles.right;

  if (!state.ai.tracking || !ball || state.screen !== "playing") {
    // Return to home
    const target = AI_HOME_Y;
    const deadzone = AI_HOME_DEADZONE;

    const diff = target - aiPaddle.cy;
    if (Math.abs(diff) <= deadzone) {
      aiPaddle.vy = 0;
    } else {
      const sign = diff > 0 ? 1 : -1;
      aiPaddle.vy = sign * Math.min(AI_SPEED, Math.abs(diff) / dt);
    }
  } else if (ball.vx > 0) {
    // Ball coming toward AI, predict where it will be
    const target = ball.y - ball.vy * AI_REACT;
    const deadzone = AI_DEADZONE;

    const diff = target - aiPaddle.cy;
    if (Math.abs(diff) <= deadzone) {
      aiPaddle.vy = state.ai.movement ? 0 : aiPaddle.vy;
    } else if (state.ai.movement) {
      const sign = diff > 0 ? 1 : -1;
      aiPaddle.vy = sign * Math.min(AI_SPEED, Math.abs(diff) / dt);
    }
  } else {
    // Return to home
    const target = AI_HOME_Y;
    const deadzone = AI_HOME_DEADZONE;

    const diff = target - aiPaddle.cy;
    if (Math.abs(diff) <= deadzone) {
      aiPaddle.vy = 0;
    } else {
      const sign = diff > 0 ? 1 : -1;
      aiPaddle.vy = sign * Math.min(AI_SPEED, Math.abs(diff) / dt);
    }
  }

  // Integrate and clamp
  const next = Math.max(
    PADDLE_MIN_CY,
    Math.min(PADDLE_MAX_CY, aiPaddle.cy + aiPaddle.vy * dt),
  );
  if (next !== aiPaddle.cy && dt > 0) {
    aiPaddle.vy = (next - aiPaddle.cy) / dt;
  }
  aiPaddle.cy = next;
}
