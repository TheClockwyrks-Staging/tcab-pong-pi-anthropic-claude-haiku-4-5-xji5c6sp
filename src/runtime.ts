import { FIELD_H, FIELD_W } from "./constants";
import { InputState } from "./types";

export interface RuntimeState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scale: number;
  offsetX: number;
  offsetY: number;
  devicePixelRatio: number;
}

export function initializeRuntime(): RuntimeState {
  const canvas = document.getElementById("stage") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas not found");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  const runtime: RuntimeState = {
    canvas,
    ctx,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  fitCanvas(runtime);
  window.addEventListener("resize", () => fitCanvas(runtime));

  return runtime;
}

export function fitCanvas(runtime: RuntimeState): void {
  const { canvas } = runtime;
  const dpr = window.devicePixelRatio || 1;

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;

  // Calculate uniform scale that preserves aspect ratio
  const scaleX = w / FIELD_W;
  const scaleY = h / FIELD_H;
  const scale = Math.min(scaleX, scaleY);

  // Calculate letterbox offset
  const scaledW = FIELD_W * scale;
  const scaledH = FIELD_H * scale;
  const offsetX = (w - scaledW) / 2;
  const offsetY = (h - scaledH) / 2;

  // Set canvas resolution
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  runtime.scale = scale * dpr;
  runtime.offsetX = offsetX * dpr;
  runtime.offsetY = offsetY * dpr;
  runtime.devicePixelRatio = dpr;
}

export function clearCanvas(runtime: RuntimeState, color: string): void {
  const { canvas, ctx } = runtime;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function screenToWorld(
  runtime: RuntimeState,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  const { scale, offsetX, offsetY, devicePixelRatio } = runtime;
  const x = (screenX * devicePixelRatio - offsetX) / scale;
  const y = (screenY * devicePixelRatio - offsetY) / scale;
  return { x, y };
}

export function beginWorldDraw(runtime: RuntimeState): void {
  const { ctx, scale, offsetX, offsetY } = runtime;
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
}

export function endWorldDraw(runtime: RuntimeState): void {
  runtime.ctx.restore();
}

export class InputHandler {
  private state: InputState;
  private keyMap: Map<string, keyof InputState>;
  private previousFrameState: Partial<InputState>;

  constructor() {
    this.state = {
      "p1-up": false,
      "p1-down": false,
      "p2-up": false,
      "p2-down": false,
      confirm: false,
      back: false,
      pause: false,
      mute: false,
      pointer: null,
      pointerPressed: false,
      pointerReleased: false,
      touchContacts: new Map(),
    };

    this.previousFrameState = { ...this.state };

    this.keyMap = new Map([
      ["KeyW", "p1-up"],
      ["KeyS", "p1-down"],
      ["ArrowUp", "p2-up"],
      ["ArrowDown", "p2-down"],
      ["Enter", "confirm"],
      ["Space", "confirm"],
      ["Escape", "back"],
      ["KeyP", "pause"],
      ["KeyM", "mute"],
    ]);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));

    const canvas = document.getElementById("stage") as HTMLCanvasElement;
    if (canvas) {
      canvas.addEventListener("pointermove", (e) => this.handlePointerMove(e));
      canvas.addEventListener("pointerdown", (e) => this.handlePointerDown(e));
      canvas.addEventListener("pointerup", (e) => this.handlePointerUp(e));
      canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
      canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
      canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.code);
    if (action && typeof action === "string") {
      const state = this.state as unknown as Record<string, boolean>;
      state[action] = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.code);
    if (action && typeof action === "string") {
      const state = this.state as unknown as Record<string, boolean>;
      state[action] = false;
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.state.pointer = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressed: e.buttons !== 0,
    };
  }

  private handlePointerDown(_e: PointerEvent): void {
    const state = this.state as unknown as Record<string, boolean>;
    state.pointerPressed = true;
  }

  private handlePointerUp(_e: PointerEvent): void {
    const state = this.state as unknown as Record<string, boolean>;
    state.pointerReleased = true;
  }

  private handleTouchMove(e: TouchEvent): void {
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.touches) {
      const contact = this.state.touchContacts.get(touch.identifier) || {
        x: 0,
        y: 0,
        active: true,
      };
      contact.x = touch.clientX - rect.left;
      contact.y = touch.clientY - rect.top;
      contact.active = true;
      this.state.touchContacts.set(touch.identifier, contact);
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.changedTouches) {
      this.state.touchContacts.set(touch.identifier, {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true,
      });
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    for (const touch of e.changedTouches) {
      this.state.touchContacts.delete(touch.identifier);
    }
  }

  public getState(): InputState {
    return { ...this.state };
  }

  public getPressEdges(): Partial<InputState> {
    const edges: Partial<InputState> = {};
    const prevState = this.previousFrameState;

    // Check for press edges (false to true transitions)
    if (!prevState["p1-up"] && this.state["p1-up"]) edges["p1-up"] = true;
    if (!prevState["p1-down"] && this.state["p1-down"]) edges["p1-down"] = true;
    if (!prevState["p2-up"] && this.state["p2-up"]) edges["p2-up"] = true;
    if (!prevState["p2-down"] && this.state["p2-down"]) edges["p2-down"] = true;
    if (!prevState.confirm && this.state.confirm) edges.confirm = true;
    if (!prevState.back && this.state.back) edges.back = true;
    if (!prevState.pause && this.state.pause) edges.pause = true;
    if (!prevState.mute && this.state.mute) edges.mute = true;

    this.previousFrameState = { ...this.state };
    this.state.pointerPressed = false;
    this.state.pointerReleased = false;

    return edges;
  }
}

export function createFrameLoop(callback: (dt: number) => void): () => void {
  let lastTime = performance.now();
  let animationId = 0;

  function frame(now: number): void {
    const dt = Math.min((now - lastTime) / 1000, 0.016); // Cap at 60fps
    lastTime = now;
    callback(dt);
    animationId = requestAnimationFrame(frame);
  }

  animationId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(animationId);
  };
}
