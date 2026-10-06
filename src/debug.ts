import { CAROM_DEBUG_VERSION } from "./constants";
import { GameState, DebugSurface, Snapshot } from "./types";
import { getSpeed } from "./physics";
import { getMenuRects } from "./render";
import { RuntimeState } from "./runtime";

export function createDebugSurface(
  state: GameState,
  runtime: RuntimeState,
): DebugSurface {
  let autoStep = true;

  const surface: DebugSurface = {
    version: CAROM_DEBUG_VERSION,

    setAutoStep(enabled: boolean) {
      autoStep = enabled;
    },

    advance(_seconds: number, _frames: number = 1) {
      // This will be called by the main loop to advance the simulation
      // when not in autoStep mode
    },

    clearWorld() {
      state.ball = null;
      state.obstacles = [];
    },

    spawnBall() {
      state.ball = {
        x: 640,
        y: 360,
        vx: 0,
        vy: 0,
        spin: 0,
        held: true,
        holdTimer: 1.0,
        serveSign: Math.random() < 0.5 ? -1 : 1,
        trail: [],
      };
    },

    spawnObstacle(index: 0 | 1) {
      const OBSTACLE_CENTERS = [
        [490, 220],
        [790, 500],
      ] as const;
      const existing = state.obstacles.findIndex((o) => o.index === index);
      if (existing >= 0) {
        state.obstacles[existing] = {
          index,
          cx: OBSTACLE_CENTERS[index][0],
          cy: OBSTACLE_CENTERS[index][1],
        };
      } else {
        state.obstacles.push({
          index,
          cx: OBSTACLE_CENTERS[index][0],
          cy: OBSTACLE_CENTERS[index][1],
        });
      }
    },

    reset() {
      // Reset to initial state
      const titleState = {
        screen: "title" as const,
        mode: "solo" as const,
        menuIndex: 0,
        titleIndex: 0,
        resumeScreen: "playing" as const,
        score: { p1: 0, p2: 0 },
        winner: null,
        receiver: "left" as const,
        paddles: {
          left: { cy: 360, vy: 0, drivenVy: 0, driven: false },
          right: { cy: 360, vy: 0, drivenVy: 0, driven: false },
        },
        ai: { tracking: true, movement: true },
        ball: {
          x: 640,
          y: 360,
          vx: 0,
          vy: 0,
          spin: 0,
          held: true,
          holdTimer: 1.0,
          serveSign: (Math.random() < 0.5 ? -1 : 1) as 1 | -1,
          trail: [],
        },
        obstacles: [
          { index: 0 as const, cx: 490, cy: 220 },
          { index: 1 as const, cx: 790, cy: 500 },
        ],
        simTime: state.simTime,
        muted: state.muted,
      };

      Object.assign(state, titleState);
    },

    reconcile() {
      // Bring readings into agreement with world state
      // This mainly updates speed from velocity
    },

    setScreen(screen) {
      state.screen = screen;
    },

    setMode(mode) {
      state.mode = mode;
    },

    setMenuIndex(index) {
      state.menuIndex = index;
    },

    setTitleIndex(index) {
      state.titleIndex = index;
    },

    setResumeScreen(screen) {
      state.resumeScreen = screen;
    },

    setScore(p1, p2) {
      state.score = { p1, p2 };
    },

    setWinner(side) {
      state.winner = side;
    },

    setReceiver(side) {
      state.receiver = side;
    },

    setPaddleCy(side, cy) {
      state.paddles[side].cy = Math.max(55, Math.min(665, cy));
    },

    setPaddleVy(side, vy) {
      state.paddles[side].drivenVy = vy;
    },

    setPaddleDriven(side, driven) {
      state.paddles[side].driven = driven;
    },

    setBallPosition(x, y) {
      if (!state.ball) throw new Error("No ball present");
      state.ball.x = x;
      state.ball.y = y;
    },

    setBallVelocity(vx, vy) {
      if (!state.ball) throw new Error("No ball present");
      state.ball.vx = vx;
      state.ball.vy = vy;
    },

    setBallSpin(spin) {
      if (!state.ball) throw new Error("No ball present");
      state.ball.spin = spin;
    },

    setBallHeld(held) {
      if (!state.ball) throw new Error("No ball present");
      state.ball.held = held;
    },

    setBallHoldTimer(seconds) {
      if (!state.ball) throw new Error("No ball present");
      state.ball.holdTimer = seconds;
    },

    setBallServeSign(sign) {
      if (!state.ball) throw new Error("No ball present");
      state.ball.serveSign = sign;
    },

    drawBallServeSign() {
      if (!state.ball) throw new Error("No ball present");
      state.ball.serveSign = Math.random() < 0.5 ? -1 : 1;
    },

    setAiTracking(enabled) {
      state.ai.tracking = enabled;
    },

    setAiMovement(enabled) {
      state.ai.movement = enabled;
    },

    setMuted(muted) {
      state.muted = muted;
    },

    snapshot(): Snapshot {
      return {
        version: CAROM_DEBUG_VERSION,
        screen: state.screen,
        mode: state.mode,
        menuIndex: state.menuIndex,
        titleIndex: state.titleIndex,
        resumeScreen: state.resumeScreen,
        score: state.score,
        winner: state.winner,
        muted: state.muted,
        paddles: {
          left: {
            cy: state.paddles.left.cy,
            vy: state.paddles.left.vy,
            drivenVy: state.paddles.left.drivenVy,
            driven: state.paddles.left.driven,
          },
          right: {
            cy: state.paddles.right.cy,
            vy: state.paddles.right.vy,
            drivenVy: state.paddles.right.drivenVy,
            driven: state.paddles.right.driven,
          },
        },
        ai: state.ai,
        receiver: state.receiver,
        ball: state.ball
          ? {
              x: state.ball.x,
              y: state.ball.y,
              vx: state.ball.vx,
              vy: state.ball.vy,
              speed: getSpeed(state.ball.vx, state.ball.vy),
              spin: state.ball.spin,
              held: state.ball.held,
              holdTimer: state.ball.holdTimer,
              serveSign: state.ball.serveSign,
              trail: state.ball.trail,
            }
          : null,
        obstacles: state.obstacles,
        autoStep,
        simTime: state.simTime,
      };
    },

    menuItemRect(index) {
      const rects = getMenuRects(state.screen, runtime);
      if (index < 0 || index >= rects.length) return null;
      return rects[index];
    },
  };

  return surface;
}

export function setupDebugOverlay(state: GameState): void {
  const diagnostics: string[] = [];

  function updateDiagnostics(): void {
    diagnostics.length = 0;
    diagnostics.push(`Screen: ${state.screen}`);
    diagnostics.push(`Mode: ${state.mode}`);
    diagnostics.push(`Score: ${state.score.p1} - ${state.score.p2}`);

    if (state.ball) {
      diagnostics.push(
        `Ball: (${state.ball.x.toFixed(0)}, ${state.ball.y.toFixed(0)})`,
      );
      diagnostics.push(
        `Velocity: (${state.ball.vx.toFixed(0)}, ${state.ball.vy.toFixed(0)})`,
      );
      diagnostics.push(
        `Speed: ${getSpeed(state.ball.vx, state.ball.vy).toFixed(0)}`,
      );
      diagnostics.push(`Spin: ${state.ball.spin.toFixed(0)}`);
    }

    diagnostics.push(
      `P1: cy=${state.paddles.left.cy.toFixed(0)}, vy=${state.paddles.left.vy.toFixed(0)}`,
    );
    diagnostics.push(
      `P2: cy=${state.paddles.right.cy.toFixed(0)}, vy=${state.paddles.right.vy.toFixed(0)}`,
    );
  }

  // This will be called every frame to update diagnostics
  const windowObj = window as unknown as Record<string, unknown>;
  windowObj.__caromUpdateDiagnostics = updateDiagnostics;
}
