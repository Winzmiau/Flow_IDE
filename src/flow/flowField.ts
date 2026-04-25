export class FlowField {
  private readonly seed = Math.random() * 1000;

  getVector(x: number, y: number, t: number): { x: number; y: number } {
    const epsilon = 0.02;

    const n1 = this.noise(x, y + epsilon, t);
    const n2 = this.noise(x, y - epsilon, t);
    const dY = (n1 - n2) / (2 * epsilon);

    const n3 = this.noise(x + epsilon, y, t);
    const n4 = this.noise(x - epsilon, y, t);
    const dX = (n3 - n4) / (2 * epsilon);

    return {
      x: dY,
      y: -dX,
    };
  }

  private noise(x: number, y: number, t: number): number {
    const i = Math.floor(x + t * 0.2);
    const j = Math.floor(y + t * 0.2);
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);

    const a = hash(i, j, this.seed);
    const b = hash(i + 1, j, this.seed);
    const c = hash(i, j + 1, this.seed);
    const d = hash(i + 1, j + 1, this.seed);

    const u = smoothstep(fx);
    const v = smoothstep(fy);

    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
}

function hash(x: number, y: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
