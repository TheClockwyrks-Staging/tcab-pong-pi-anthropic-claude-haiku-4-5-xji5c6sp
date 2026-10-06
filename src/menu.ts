import { InputState, GameState } from "./types";

export class MenuHandler {
  private clickedThisFrame = false;
  private pointerStart: { x: number; y: number } | null = null;
  private touchStart: Map<number, { x: number; y: number }> = new Map();

  public handleMenuInput(
    state: GameState,
    input: InputState,
    edges: Partial<InputState>,
    menuRects: Array<{ x: number; y: number; w: number; h: number }>,
  ): void {
    // Handle keyboard navigation
    if (edges["p1-up"] || edges["p2-up"]) {
      state.menuIndex =
        (state.menuIndex - 1 + menuRects.length) % menuRects.length;
    }
    if (edges["p1-down"] || edges["p2-down"]) {
      state.menuIndex = (state.menuIndex + 1) % menuRects.length;
    }

    // Handle pointer input
    if (input.pointer) {
      const px = input.pointer.x;
      const py = input.pointer.y;

      // Check which menu item the pointer is over
      for (let i = 0; i < menuRects.length; i++) {
        const rect = menuRects[i];
        if (
          px >= rect.x &&
          px < rect.x + rect.w &&
          py >= rect.y &&
          py < rect.y + rect.h
        ) {
          state.menuIndex = i;
          break;
        }
      }

      // Handle pointer click
      if (input.pointerPressed && !this.clickedThisFrame) {
        this.pointerStart = { x: px, y: py };
      }
      if (input.pointerReleased && this.pointerStart) {
        for (let i = 0; i < menuRects.length; i++) {
          const rect = menuRects[i];
          if (
            px >= rect.x &&
            px < rect.x + rect.w &&
            py >= rect.y &&
            py < rect.y + rect.h &&
            this.pointerStart.x >= rect.x &&
            this.pointerStart.x < rect.x + rect.w &&
            this.pointerStart.y >= rect.y &&
            this.pointerStart.y < rect.y + rect.h
          ) {
            state.menuIndex = i;
            this.clickedThisFrame = true;
          }
        }
        this.pointerStart = null;
      }
    }

    // Handle touch input
    for (const [id, touch] of input.touchContacts) {
      const startTouch = this.touchStart.get(id);
      if (!startTouch) {
        this.touchStart.set(id, { x: touch.x, y: touch.y });
      }

      // Check which menu item touch is over
      for (let i = 0; i < menuRects.length; i++) {
        const rect = menuRects[i];
        if (
          touch.x >= rect.x &&
          touch.x < rect.x + rect.w &&
          touch.y >= rect.y &&
          touch.y < rect.y + rect.h
        ) {
          state.menuIndex = i;
          break;
        }
      }

      if (!touch.active) {
        const start = this.touchStart.get(id);
        for (let i = 0; i < menuRects.length; i++) {
          const rect = menuRects[i];
          if (
            touch.x >= rect.x &&
            touch.x < rect.x + rect.w &&
            touch.y >= rect.y &&
            touch.y < rect.y + rect.h &&
            start &&
            start.x >= rect.x &&
            start.x < rect.x + rect.w &&
            start.y >= rect.y &&
            start.y < rect.y + rect.h
          ) {
            state.menuIndex = i;
            this.clickedThisFrame = true;
          }
        }
        this.touchStart.delete(id);
      }
    }
  }

  public isMenuItemConfirmed(): boolean {
    const result = this.clickedThisFrame;
    this.clickedThisFrame = false;
    return result;
  }

  public reset(): void {
    this.clickedThisFrame = false;
    this.pointerStart = null;
    this.touchStart.clear();
  }
}
