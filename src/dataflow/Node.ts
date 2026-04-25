export type Packet<T = unknown> = {
  value: T;
  version: number;
  timestamp: number;
};

export type NodeType = "DocumentSource" | "SentenceSegmenter" | "FilterNode" | "HighlightSink";

export abstract class Node {
  readonly id: string;
  readonly type: NodeType;
  x: number;
  y: number;

  protected constructor(id: string, type: NodeType, x = 80, y = 80) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
  }

  abstract process(packet: Packet): Packet | null;

  ports(): { inputs: string[]; outputs: string[] } {
    return { inputs: ["in"], outputs: ["out"] };
  }
}

export class DocumentSource extends Node {
  constructor(id: string, x?: number, y?: number) {
    super(id, "DocumentSource", x, y);
  }

  process(packet: Packet): Packet {
    return packet;
  }

  override ports() {
    return { inputs: [], outputs: ["text"] };
  }
}

export class SentenceSegmenter extends Node {
  constructor(id: string, x?: number, y?: number) {
    super(id, "SentenceSegmenter", x, y);
  }

  process(packet: Packet<string>): Packet<string[]> {
    const sentences = packet.value
      .split(/[.!?]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      ...packet,
      value: sentences,
      timestamp: performance.now(),
    };
  }
}

export class FilterNode extends Node {
  private minLength = 5;

  constructor(id: string, x?: number, y?: number) {
    super(id, "FilterNode", x, y);
  }

  process(packet: Packet<string[]>): Packet<string[]> {
    const filtered = packet.value.filter((sentence) => sentence.length >= this.minLength);
    return {
      ...packet,
      value: filtered,
      timestamp: performance.now(),
    };
  }
}

export class HighlightSink extends Node {
  constructor(id: string, x?: number, y?: number) {
    super(id, "HighlightSink", x, y);
  }

  process(packet: Packet<string[]>): Packet<string[]> {
    return {
      ...packet,
      timestamp: performance.now(),
    };
  }

  override ports() {
    return { inputs: ["in"], outputs: [] };
  }
}
