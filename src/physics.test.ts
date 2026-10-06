import { describe, it, expect } from "vitest";
import {
  getSpeed,
  addSpin,
  advanceBall,
  serveBall,
  checkScore,
  checkWin,
  updateBallTrail,
} from "./physics";
import { Ball } from "./types";
import { FIELD_W, FIELD_CX, FIELD_CY } from "./constants";

describe("physics", () => {
  describe("getSpeed", () => {
    it("should calculate speed correctly", () => {
      expect(getSpeed(3, 4)).toBe(5);
      expect(getSpeed(0, 0)).toBe(0);
    });
  });

  describe("addSpin", () => {
    it("should decay spin over time", () => {
      const spin = 100;
      const decayed = addSpin(spin, 0.8);
      expect(decayed).toBeLessThan(spin);
      expect(decayed).toBeGreaterThan(0);
    });

    it("should return half spin after one halflife", () => {
      const spin = 100;
      const decayed = addSpin(spin, 0.8);
      expect(decayed).toBeCloseTo(50, 0);
    });
  });

  describe("serveBall", () => {
    it("should serve ball toward left receiver", () => {
      const ball: Ball = {
        x: FIELD_CX,
        y: FIELD_CY,
        vx: 0,
        vy: 0,
        spin: 0,
        held: true,
        holdTimer: 1,
        serveSign: 1,
        trail: [],
      };

      serveBall(ball, "left");

      expect(ball.held).toBe(false);
      expect(ball.vx).toBeLessThan(0);
      expect(ball.trail).toEqual([]);
    });

    it("should serve ball toward right receiver", () => {
      const ball: Ball = {
        x: FIELD_CX,
        y: FIELD_CY,
        vx: 0,
        vy: 0,
        spin: 0,
        held: true,
        holdTimer: 1,
        serveSign: 1,
        trail: [],
      };

      serveBall(ball, "right");

      expect(ball.held).toBe(false);
      expect(ball.vx).toBeGreaterThan(0);
    });
  });

  describe("updateBallTrail", () => {
    it("should add trail sample", () => {
      const ball: Ball = {
        x: 100,
        y: 100,
        vx: 100,
        vy: 0,
        spin: 0,
        held: false,
        holdTimer: 0,
        serveSign: 1,
        trail: [],
      };

      updateBallTrail(ball, 0, 0.13);

      expect(ball.trail.length).toBe(1);
      expect(ball.trail[0].x).toBe(100);
      expect(ball.trail[0].y).toBe(100);
      expect(ball.trail[0].t).toBe(0);
    });

    it("should remove old trail samples", () => {
      const ball: Ball = {
        x: 100,
        y: 100,
        vx: 100,
        vy: 0,
        spin: 0,
        held: false,
        holdTimer: 0,
        serveSign: 1,
        trail: [
          { x: 0, y: 0, t: 0 },
          { x: 50, y: 50, t: 0.05 },
        ],
      };

      updateBallTrail(ball, 0.2, 0.13);

      expect(ball.trail.length).toBeLessThanOrEqual(1);
      expect(ball.trail[ball.trail.length - 1].t).toBe(0.2);
    });
  });

  describe("checkScore", () => {
    it("should detect left score", () => {
      const ball: Ball = {
        x: FIELD_W + 20,
        y: FIELD_CY,
        vx: 100,
        vy: 0,
        spin: 0,
        held: false,
        holdTimer: 0,
        serveSign: 1,
        trail: [],
      };

      expect(checkScore(ball)).toBe("left");
    });

    it("should detect right score", () => {
      const ball: Ball = {
        x: -20,
        y: FIELD_CY,
        vx: -100,
        vy: 0,
        spin: 0,
        held: false,
        holdTimer: 0,
        serveSign: 1,
        trail: [],
      };

      expect(checkScore(ball)).toBe("right");
    });

    it("should detect no score in middle field", () => {
      const ball: Ball = {
        x: FIELD_CX,
        y: FIELD_CY,
        vx: 100,
        vy: 0,
        spin: 0,
        held: false,
        holdTimer: 0,
        serveSign: 1,
        trail: [],
      };

      expect(checkScore(ball)).toBe("none");
    });
  });

  describe("checkWin", () => {
    it("should detect left win at 11-9", () => {
      expect(checkWin(11, 9)).toBe("left");
    });

    it("should detect right win at 9-11", () => {
      expect(checkWin(9, 11)).toBe("right");
    });

    it("should not end at 10-10", () => {
      expect(checkWin(10, 10)).toBe("none");
    });

    it("should end at 12-10 for left", () => {
      expect(checkWin(12, 10)).toBe("left");
    });
  });

  describe("advanceBall", () => {
    it("should hold ball when held flag is true", () => {
      const ball: Ball = {
        x: FIELD_CX,
        y: FIELD_CY,
        vx: 100,
        vy: 100,
        spin: 0,
        held: true,
        holdTimer: 1,
        serveSign: 1,
        trail: [],
      };

      const paddle1 = {
        cy: FIELD_CY,
        vy: 0,
        driven: false,
        drivenVy: 0,
      };
      const paddle2 = {
        cy: FIELD_CY,
        vy: 0,
        driven: false,
        drivenVy: 0,
      };

      const obstacles = [
        { cx: 490, cy: 220 },
        { cx: 790, cy: 500 },
      ];

      const events = advanceBall(ball, paddle1, paddle2, 0.016, obstacles);

      expect(events.length).toBe(0);
      expect(ball.x).toBe(FIELD_CX);
      expect(ball.y).toBe(FIELD_CY);
    });

    it("should advance ball position", () => {
      const ball: Ball = {
        x: FIELD_CX,
        y: FIELD_CY,
        vx: 100,
        vy: 0,
        spin: 0,
        held: false,
        holdTimer: 0,
        serveSign: 1,
        trail: [],
      };

      const paddle1 = {
        cy: FIELD_CY,
        vy: 0,
        driven: false,
        drivenVy: 0,
      };
      const paddle2 = {
        cy: FIELD_CY,
        vy: 0,
        driven: false,
        drivenVy: 0,
      };

      const obstacles = [
        { cx: 490, cy: 220 },
        { cx: 790, cy: 500 },
      ];

      advanceBall(ball, paddle1, paddle2, 0.016, obstacles);

      expect(ball.x).toBeGreaterThan(FIELD_CX);
    });
  });
});
