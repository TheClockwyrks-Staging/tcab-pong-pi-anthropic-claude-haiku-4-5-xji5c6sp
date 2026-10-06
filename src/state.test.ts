import { describe, it, expect } from "vitest";
import {
  createInitialState,
  createBall,
  parkBall,
  resetState,
  startMatch,
  returnToTitle,
} from "./state";
import { FIELD_CY, HOLD_TIME } from "./constants";

describe("state", () => {
  describe("createInitialState", () => {
    it("should create initial state", () => {
      const state = createInitialState();

      expect(state.screen).toBe("title");
      expect(state.mode).toBe("solo");
      expect(state.score.p1).toBe(0);
      expect(state.score.p2).toBe(0);
      expect(state.winner).toBe(null);
    });

    it("should have both paddles centered", () => {
      const state = createInitialState();

      expect(state.paddles.left.cy).toBe(FIELD_CY);
      expect(state.paddles.right.cy).toBe(FIELD_CY);
    });

    it("should have both obstacles present", () => {
      const state = createInitialState();

      expect(state.obstacles.length).toBe(2);
      expect(state.obstacles[0].index).toBe(0);
      expect(state.obstacles[1].index).toBe(1);
    });
  });

  describe("createBall", () => {
    it("should create ball at home point", () => {
      const ball = createBall();

      expect(ball.x).toBe(640);
      expect(ball.y).toBe(360);
      expect(ball.held).toBe(true);
      expect(ball.holdTimer).toBe(HOLD_TIME);
    });

    it("should have zero velocity and spin", () => {
      const ball = createBall();

      expect(ball.vx).toBe(0);
      expect(ball.vy).toBe(0);
      expect(ball.spin).toBe(0);
    });
  });

  describe("parkBall", () => {
    it("should reset ball to home point", () => {
      const ball = parkBall(null);

      expect(ball.x).toBe(640);
      expect(ball.y).toBe(360);
      expect(ball.held).toBe(true);
      expect(ball.holdTimer).toBe(HOLD_TIME);
    });
  });

  describe("startMatch", () => {
    it("should start solo match", () => {
      const state = createInitialState();
      const matchState = startMatch(state, "solo");

      expect(matchState.screen).toBe("countdown");
      expect(matchState.mode).toBe("solo");
      expect(matchState.score.p1).toBe(0);
      expect(matchState.score.p2).toBe(0);
    });

    it("should start versus match", () => {
      const state = createInitialState();
      const matchState = startMatch(state, "versus");

      expect(matchState.screen).toBe("countdown");
      expect(matchState.mode).toBe("versus");
    });

    it("should reset scores", () => {
      const state = createInitialState();
      state.score.p1 = 5;
      state.score.p2 = 3;

      const matchState = startMatch(state, "solo");

      expect(matchState.score.p1).toBe(0);
      expect(matchState.score.p2).toBe(0);
    });
  });

  describe("returnToTitle", () => {
    it("should return to title screen", () => {
      const state = createInitialState();
      state.screen = "playing";

      const titleState = returnToTitle(state);

      expect(titleState.screen).toBe("title");
    });

    it("should preserve simTime", () => {
      const state = createInitialState();
      state.simTime = 100;

      const titleState = returnToTitle(state);

      expect(titleState.simTime).toBe(100);
    });
  });

  describe("resetState", () => {
    it("should reset to initial state but preserve simTime", () => {
      const state = createInitialState();
      state.screen = "playing";
      state.simTime = 100;

      const resetted = resetState(state);

      expect(resetted.screen).toBe("title");
      expect(resetted.simTime).toBe(100);
    });
  });
});
