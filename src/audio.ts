import { AudioContext as AudioContextType } from "./types";

interface WebAudioContext {
  currentTime: number;
  destination: AudioNode;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
}

interface OscillatorNode {
  frequency: { value: number };
  type: string;
  connect(destination: AudioNode): void;
  start(when: number): void;
  stop(when: number): void;
}

interface GainNode {
  gain: {
    setValueAtTime(value: number, startTime: number): void;
    exponentialRampToValueAtTime(value: number, endTime: number): void;
  };
  connect(destination: AudioNode): void;
}

interface AudioNode {
  connect?(destination: AudioNode): void;
}

export function createAudioContext(): AudioContextType {
  let audioCtx: WebAudioContext | null = null;
  let muted = false;
  let armed = false;

  function getAudioContext(): WebAudioContext | null {
    if (audioCtx) return audioCtx;

    if (typeof window === "undefined") return null;

    // Try to create an audio context
    const windowObj = window as unknown as Record<string, unknown>;
    const AudioContext = windowObj.AudioContext || windowObj.webkitAudioContext;

    if (typeof AudioContext === "function") {
      try {
        audioCtx = new (AudioContext as { new (): WebAudioContext })();
        return audioCtx;
      } catch {
        return null;
      }
    }

    return null;
  }

  return {
    get muted(): boolean {
      return muted;
    },
    set muted(value: boolean) {
      muted = value;
    },
    play(
      cue: "paddle-hit" | "wall-bounce" | "obstacle-bounce" | "score",
    ): void {
      if (muted) return;

      if (!armed) {
        armed = true;
      }

      const ctx = getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // Different frequencies and durations for each cue
        let freq = 440;
        let duration = 0.05;
        let envelope = 1.0;

        switch (cue) {
          case "paddle-hit":
            freq = 800;
            duration = 0.08;
            envelope = 0.8;
            break;
          case "wall-bounce":
            freq = 600;
            duration = 0.06;
            envelope = 0.6;
            break;
          case "obstacle-bounce":
            freq = 700;
            duration = 0.07;
            envelope = 0.7;
            break;
          case "score":
            freq = 1000;
            duration = 0.15;
            envelope = 0.9;
            break;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = freq;
        osc.type = "sine";

        gain.gain.setValueAtTime(envelope, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch {
        // Ignore audio context errors
      }
    },
  };
}
