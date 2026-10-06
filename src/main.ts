import {
  createInitialState,
  parkBall,
  startMatch,
  returnToTitle,
  updatePaddleWithAxis,
} from "./state";
import { initializeRuntime, createFrameLoop, InputHandler } from "./runtime";
import {
  advanceBall,
  serveBall,
  updateBallTrail,
  checkScore,
  checkWin,
} from "./physics";
import { updateAIPaddle } from "./ai";
import { createAudioContext } from "./audio";
import {
  renderGame,
  renderTitle,
  renderHowTo,
  renderPaused,
  renderMatchOver,
  getMenuRects,
} from "./render";
import { MenuHandler } from "./menu";
import { createDebugSurface } from "./debug";
import { TRAIL_TIME } from "./constants";
import { GameState, InputState } from "./types";

// Initialize all systems
const runtime = initializeRuntime();
const state = createInitialState();
const inputHandler = new InputHandler();
const menuHandler = new MenuHandler();
const audioContext = createAudioContext();
const debugSurface = createDebugSurface(state, runtime);

// Install debug surface
const windowObj = window as unknown as Record<string, unknown>;
windowObj.__carom = debugSurface;

// Track debug mode
let showDiagnostics = false;

// Store menu rects for this frame
let menuRects: Array<{ x: number; y: number; w: number; h: number }> = [];

function update(dt: number): void {
  const input = inputHandler.getState();
  const edges = inputHandler.getPressEdges();

  // Update sim time
  state.simTime += dt;

  // Handle debug overlay toggle
  const edgesObj = edges as unknown as Record<string, boolean>;
  if (edgesObj.backtick) {
    showDiagnostics = !showDiagnostics;
  }

  // Update mute state
  if (edges.mute) {
    audioContext.muted = !audioContext.muted;
    state.muted = audioContext.muted;
  }

  // Get menu rects for current screen
  menuRects = getMenuRects(state.screen, runtime);

  // Handle each screen
  switch (state.screen) {
    case "title":
      handleTitleScreen(state, input, edges, menuRects);
      break;

    case "howto":
      handleHowToScreen(state, input, edges, menuRects);
      break;

    case "countdown":
      handleCountdownScreen(state, input, edges, dt);
      break;

    case "playing":
      handlePlayingScreen(state, input, edges, dt, audioContext);
      break;

    case "paused":
      handlePausedScreen(state, input, edges, menuRects);
      break;

    case "matchover":
      handleMatchOverScreen(state, input, edges, menuRects);
      break;
  }
}

function handleTitleScreen(
  state: GameState,
  input: InputState,
  edges: Partial<InputState>,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  menuHandler.handleMenuInput(state, input, edges, menuRects);

  if (edges.confirm || menuHandler.isMenuItemConfirmed()) {
    state.titleIndex = state.menuIndex;
    const items = ["SOLO", "VERSUS", "HOW TO PLAY"];
    const selected = items[state.menuIndex];

    if (selected === "SOLO") {
      Object.assign(state, startMatch(state, "solo"));
    } else if (selected === "VERSUS") {
      Object.assign(state, startMatch(state, "versus"));
    } else if (selected === "HOW TO PLAY") {
      state.screen = "howto";
      state.menuIndex = 0;
    }
  }
}

function handleHowToScreen(
  state: GameState,
  input: InputState,
  edges: Partial<InputState>,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  menuHandler.handleMenuInput(state, input, edges, menuRects);

  if (edges.confirm || edges.back || menuHandler.isMenuItemConfirmed()) {
    Object.assign(state, returnToTitle(state));
    menuHandler.reset();
  }
}

function handleCountdownScreen(
  state: GameState,
  input: InputState,
  edges: Partial<InputState>,
  dt: number,
): void {
  // Update paddles
  const p1Axis = (input["p1-down"] ? 1 : 0) - (input["p1-up"] ? 1 : 0);
  const p2Axis = (input["p2-down"] ? 1 : 0) - (input["p2-up"] ? 1 : 0);

  updatePaddleWithAxis(state.paddles.left, p1Axis, dt);

  if (state.mode === "versus") {
    updatePaddleWithAxis(state.paddles.right, p2Axis, dt);
  } else {
    updateAIPaddle(state, dt);
  }

  // Countdown and serve
  if (state.ball) {
    state.ball.holdTimer -= dt;
    if (state.ball.holdTimer <= 0) {
      serveBall(state.ball, state.receiver);
      state.screen = "playing";
    }
  }

  // Handle pause
  if (edges.pause) {
    state.resumeScreen = "countdown";
    state.screen = "paused";
    state.menuIndex = 0;
  }
}

function handlePlayingScreen(
  state: GameState,
  input: InputState,
  edges: Partial<InputState>,
  dt: number,
  audioContext: { play(cue: string): void },
): void {
  // Update paddles
  const p1Axis = (input["p1-down"] ? 1 : 0) - (input["p1-up"] ? 1 : 0);
  const p2Axis = (input["p2-down"] ? 1 : 0) - (input["p2-up"] ? 1 : 0);

  updatePaddleWithAxis(state.paddles.left, p1Axis, dt);

  if (state.mode === "versus") {
    updatePaddleWithAxis(state.paddles.right, p2Axis, dt);
  } else {
    updateAIPaddle(state, dt);
  }

  // Advance ball
  if (state.ball && !state.ball.held) {
    const events = advanceBall(
      state.ball,
      state.paddles.left,
      state.paddles.right,
      dt,
      state.obstacles,
    );

    // Play audio cues
    for (const event of events) {
      if (event.type === "score") {
        // Handle scoring after movement
      } else {
        audioContext.play(event.type);
      }
    }

    // Update trail
    updateBallTrail(state.ball, state.simTime, TRAIL_TIME);

    // Check for scoring
    const scorer = checkScore(state.ball);
    if (scorer !== "none") {
      audioContext.play("score");

      if (scorer === "left") {
        state.score.p1++;
      } else {
        state.score.p2++;
      }

      // Check win condition
      const winner = checkWin(state.score.p1, state.score.p2);
      if (winner !== "none") {
        state.winner = winner;
        state.screen = "matchover";
        state.menuIndex = 0;
      } else {
        // Park ball and start countdown
        state.ball = parkBall(state.ball);
        state.receiver = scorer;
        state.screen = "countdown";
      }
    }
  }

  // Handle pause
  if (edges.pause) {
    state.resumeScreen = "playing";
    state.screen = "paused";
    state.menuIndex = 0;
  }
}

function handlePausedScreen(
  state: GameState,
  input: InputState,
  edges: Partial<InputState>,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  if (edges.pause || edges.back) {
    state.screen = state.resumeScreen;
    menuHandler.reset();
    return;
  }

  menuHandler.handleMenuInput(state, input, edges, menuRects);

  if (edges.confirm || menuHandler.isMenuItemConfirmed()) {
    const items = ["RESUME", "RESTART", "QUIT TO MENU"];
    const selected = items[state.menuIndex];

    if (selected === "RESUME") {
      state.screen = state.resumeScreen;
    } else if (selected === "RESTART") {
      Object.assign(state, startMatch(state, state.mode));
    } else if (selected === "QUIT TO MENU") {
      Object.assign(state, returnToTitle(state));
    }
    menuHandler.reset();
  }
}

function handleMatchOverScreen(
  state: GameState,
  input: InputState,
  edges: Partial<InputState>,
  menuRects: Array<{ x: number; y: number; w: number; h: number }>,
): void {
  if (edges.back) {
    Object.assign(state, returnToTitle(state));
    menuHandler.reset();
    return;
  }

  menuHandler.handleMenuInput(state, input, edges, menuRects);

  if (edges.confirm || menuHandler.isMenuItemConfirmed()) {
    const items = ["PLAY AGAIN", "MENU"];
    const selected = items[state.menuIndex];

    if (selected === "PLAY AGAIN") {
      Object.assign(state, startMatch(state, state.mode));
    } else if (selected === "MENU") {
      Object.assign(state, returnToTitle(state));
    }
    menuHandler.reset();
  }
}

function render(): void {
  // Save context state
  const ctx = runtime.ctx;
  ctx.save();

  switch (state.screen) {
    case "title":
      renderTitle(runtime, state, menuRects);
      break;

    case "howto":
      renderHowTo(runtime, menuRects);
      break;

    case "countdown":
    case "playing":
      renderGame(runtime, state);
      break;

    case "paused":
      renderPaused(runtime, state, menuRects);
      break;

    case "matchover":
      renderMatchOver(runtime, state, menuRects);
      break;
  }

  // Draw diagnostics if enabled
  if (showDiagnostics) {
    drawDiagnostics(ctx, state);
  }

  ctx.restore();
}

function drawDiagnostics(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const diagnostics: string[] = [
    `Screen: ${state.screen}`,
    `Mode: ${state.mode}`,
    `Score: ${state.score.p1} - ${state.score.p2}`,
  ];

  if (state.ball) {
    diagnostics.push(
      `Ball: (${state.ball.x.toFixed(0)}, ${state.ball.y.toFixed(0)})`,
    );
    const speed = Math.hypot(state.ball.vx, state.ball.vy);
    diagnostics.push(`Speed: ${speed.toFixed(0)}`);
    diagnostics.push(`Spin: ${state.ball.spin.toFixed(0)}`);
  }

  diagnostics.push(
    `P1: cy=${state.paddles.left.cy.toFixed(0)}, vy=${state.paddles.left.vy.toFixed(0)}`,
  );
  diagnostics.push(
    `P2: cy=${state.paddles.right.cy.toFixed(0)}, vy=${state.paddles.right.vy.toFixed(0)}`,
  );

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, 10, 300, diagnostics.length * 20 + 10);
  ctx.fillStyle = "#0f0";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";

  for (let i = 0; i < diagnostics.length; i++) {
    ctx.fillText(diagnostics[i], 15, 30 + i * 20);
  }

  ctx.restore();
}

// Frame loop
createFrameLoop((dt: number) => {
  update(dt);
  render();
});

// Setup diagnostics key
document.addEventListener("keydown", (e) => {
  if (e.code === "Backquote") {
    showDiagnostics = !showDiagnostics;
  }
});
