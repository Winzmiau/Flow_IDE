export type KeystrokeType = "char" | "backspace" | "other";

export type RawSignal = {
  chars_per_second: number;
  inter_keystroke_interval_variance: number;
  pause_detected: boolean;
  backspace_ratio: number;
  sentence_boundary_detected: boolean;
  continuity: number;
  stability: number;
};

export type SmoothedSignal = RawSignal & {
  timestamp: number;
};

type KeyEvent = {
  type: KeystrokeType;
  key?: string;
  timestamp: number;
};

const HISTORY_LIMIT = 512;
const WINDOW_MS = 2200;
const PAUSE_MS = 650;

export class SignalEngine {
  private events: KeyEvent[] = [];
  private smoothed: SmoothedSignal = {
    chars_per_second: 0,
    inter_keystroke_interval_variance: 0,
    pause_detected: false,
    backspace_ratio: 0,
    sentence_boundary_detected: false,
    continuity: 1,
    stability: 1,
    timestamp: Date.now(),
  };

  pushKeystroke(type: KeystrokeType, key?: string) {
    const now = performance.now();
    this.events.push({ type, key, timestamp: now });
    if (this.events.length > HISTORY_LIMIT) {
      this.events.shift();
    }
  }

  compute(now = performance.now()): SmoothedSignal {
    const recent = this.events.filter((event) => now - event.timestamp <= WINDOW_MS);
    if (recent.length < 2) {
      return this.withTimestamp(this.smoothed);
    }

    const chars = recent.filter((event) => event.type === "char");
    const backspaces = recent.filter((event) => event.type === "backspace");

    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i += 1) {
      intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
    }

    const intervalMean = mean(intervals);
    const intervalVariance = variance(intervals, intervalMean);
    const lastEvent = recent[recent.length - 1];

    const raw: RawSignal = {
      chars_per_second: chars.length / (WINDOW_MS / 1000),
      inter_keystroke_interval_variance: intervalVariance,
      pause_detected: now - lastEvent.timestamp > PAUSE_MS,
      backspace_ratio: backspaces.length / Math.max(1, chars.length + backspaces.length),
      sentence_boundary_detected: this.detectSentenceBoundary(recent),
      continuity: clamp01(1 - intervalMean / 550),
      stability: 1 / (1 + intervalVariance / 12000),
    };

    this.smoothed = smoothSignal(this.smoothed, raw, 0.16);
    return this.withTimestamp(this.smoothed);
  }

  private detectSentenceBoundary(recent: KeyEvent[]): boolean {
    const tail = recent.slice(-8);
    if (tail.length === 0) {
      return false;
    }

    // Sentence boundary heuristic from punctuation key hits near the tail of the event stream.
    const punctuationHit = tail.some((event) => event.key === "." || event.key === "!" || event.key === "?");
    if (!punctuationHit) {
      return false;
    }

    const intervals: number[] = [];
    for (let i = 1; i < tail.length; i += 1) {
      intervals.push(tail[i].timestamp - tail[i - 1].timestamp);
    }

    return mean(intervals) > 120;
  }

  private withTimestamp(signal: Omit<SmoothedSignal, "timestamp"> | SmoothedSignal): SmoothedSignal {
    return {
      ...signal,
      timestamp: Date.now(),
    };
  }
}

function smoothSignal(previous: SmoothedSignal, next: RawSignal, alpha: number): SmoothedSignal {
  return {
    chars_per_second: lerp(previous.chars_per_second, next.chars_per_second, alpha),
    inter_keystroke_interval_variance: lerp(
      previous.inter_keystroke_interval_variance,
      next.inter_keystroke_interval_variance,
      alpha,
    ),
    pause_detected: next.pause_detected,
    backspace_ratio: lerp(previous.backspace_ratio, next.backspace_ratio, alpha),
    sentence_boundary_detected: next.sentence_boundary_detected,
    continuity: lerp(previous.continuity, next.continuity, alpha),
    stability: lerp(previous.stability, next.stability, alpha),
    timestamp: Date.now(),
  };
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function variance(values: number[], valueMean: number): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + (value - valueMean) ** 2, 0) / values.length;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
