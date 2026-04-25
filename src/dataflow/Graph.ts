import { Edge } from "./Edge";
import {
  DocumentSource,
  FilterNode,
  HighlightSink,
  Node,
  Packet,
  SentenceSegmenter,
  NodeType,
} from "./Node";

export type StreamEvent = {
  edgeId: string;
  fromNodeId: string;
  fromPort: string;
  toNodeId: string;
  toPort: string;
  packet: Packet;
};

export type Profile = {
  lastExecMs: number;
  avgExecMs: number;
  lastPacketAt: number;
  rate: number;
};

export type EdgeProfile = {
  lastLatency: number;
  avgLatency: number;
  count: number;
};

export type TapPacket = {
  version: number;
  t: number;
  value: unknown;
};

export class Graph {
  nodes: Node[] = [];
  edges: Edge[] = [];

  private version = 0;
  private subscribers = new Set<(event: StreamEvent) => void>();
  private profiles = new Map<string, Profile>();
  private edgeProfiles = new Map<string, EdgeProfile>();
  private streamHistory = new Map<string, TapPacket[]>();

  subscribe(listener: (event: StreamEvent) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  addNode(node: Node) {
    this.nodes.push(node);
  }

  addEdge(edge: Edge) {
    this.edges.push(edge);
  }

  getNode(nodeId: string): Node | null {
    return this.nodes.find((node) => node.id === nodeId) ?? null;
  }

  getProfile(nodeId: string): Profile {
    return (
      this.profiles.get(nodeId) ?? {
        lastExecMs: 0,
        avgExecMs: 0,
        lastPacketAt: 0,
        rate: 0,
      }
    );
  }

  getEdgeProfile(edgeId: string): EdgeProfile {
    return (
      this.edgeProfiles.get(edgeId) ?? {
        lastLatency: 0,
        avgLatency: 0,
        count: 0,
      }
    );
  }

  getStreamHistory(nodeId: string, port: string): TapPacket[] {
    return this.streamHistory.get(`${nodeId}:${port}`) ?? [];
  }

  moveNode(nodeId: string, x: number, y: number) {
    const node = this.nodes.find((item) => item.id === nodeId);
    if (!node) {
      return;
    }
    node.x = x;
    node.y = y;
  }

  createNode(type: NodeType, x = 120, y = 120): Node {
    const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
    switch (type) {
      case "DocumentSource":
        return new DocumentSource(id, x, y);
      case "SentenceSegmenter":
        return new SentenceSegmenter(id, x, y);
      case "FilterNode":
        return new FilterNode(id, x, y);
      case "HighlightSink":
        return new HighlightSink(id, x, y);
      default:
        return new FilterNode(id, x, y);
    }
  }

  run(documentText: string): Packet<string[]> {
    this.version += 1;

    const source = this.nodes.find((node) => node.type === "DocumentSource") as DocumentSource | undefined;
    if (!source) {
      return {
        value: [],
        version: this.version,
        timestamp: Date.now(),
      };
    }

    const queue: Array<{ nodeId: string; packet: Packet }> = [
      {
        nodeId: source.id,
        packet: {
          value: documentText,
          version: this.version,
          timestamp: performance.now(),
        },
      },
    ];

    let finalHighlightPacket: Packet<string[]> = {
      value: [],
      version: this.version,
      timestamp: performance.now(),
    };

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      const node = this.nodes.find((item) => item.id === current.nodeId);
      if (!node) {
        continue;
      }

      const start = performance.now();
      const output = node.process(current.packet);
      const end = performance.now();
      if (!output) {
        continue;
      }

      const duration = end - start;
      const profile = this.profiles.get(node.id) ?? {
        lastExecMs: 0,
        avgExecMs: 0,
        lastPacketAt: 0,
        rate: 0,
      };

      profile.lastExecMs = duration;
      profile.avgExecMs = profile.avgExecMs ? profile.avgExecMs * 0.9 + duration * 0.1 : duration;

      const dtSeconds = profile.lastPacketAt > 0 ? (end - profile.lastPacketAt) / 1000 : 0;
      if (dtSeconds > 0) {
        const inst = 1 / dtSeconds;
        profile.rate = profile.rate ? profile.rate * 0.9 + inst * 0.1 : inst;
      }
      profile.lastPacketAt = end;
      this.profiles.set(node.id, profile);

      if (node.type === "HighlightSink") {
        finalHighlightPacket = output as Packet<string[]>;
      }

      const outgoing = this.edges.filter((edge) => edge.fromNodeId === node.id);

      for (const edge of outgoing) {
        const emitAt = performance.now();
        const payload: Packet = {
          ...output,
          timestamp: emitAt,
        };

        const tapKey = `${edge.fromNodeId}:${edge.fromPort}`;
        const history = this.streamHistory.get(tapKey) ?? [];
        history.push({
          version: payload.version,
          t: emitAt,
          value: payload.value,
        });
        if (history.length > 180) {
          history.shift();
        }
        this.streamHistory.set(tapKey, history);

        const deliverAt = performance.now();
        const latency = Math.max(0, deliverAt - payload.timestamp);
        const edgeProfile = this.edgeProfiles.get(edge.id) ?? {
          lastLatency: 0,
          avgLatency: 0,
          count: 0,
        };
        edgeProfile.count += 1;
        edgeProfile.lastLatency = latency;
        edgeProfile.avgLatency = edgeProfile.avgLatency ? edgeProfile.avgLatency * 0.9 + latency * 0.1 : latency;
        this.edgeProfiles.set(edge.id, edgeProfile);

        this.subscribers.forEach((listener) => {
          listener({
            edgeId: edge.id,
            fromNodeId: edge.fromNodeId,
            fromPort: edge.fromPort,
            toNodeId: edge.toNodeId,
            toPort: edge.toPort,
            packet: payload,
          });
        });

        queue.push({
          nodeId: edge.toNodeId,
          packet: payload,
        });
      }
    }

    return finalHighlightPacket;
  }

  ensureDefaultPipeline() {
    if (this.nodes.length > 0) {
      return;
    }

    const document = new DocumentSource("doc", 60, 60);
    const sentence = new SentenceSegmenter("sent", 300, 80);
    const filter = new FilterNode("filter", 540, 110);
    const sink = new HighlightSink("highlight", 780, 140);

    this.nodes.push(document, sentence, filter, sink);
    this.edges.push(
      new Edge("e1", document.id, "text", sentence.id, "in"),
      new Edge("e2", sentence.id, "out", filter.id, "in"),
      new Edge("e3", filter.id, "out", sink.id, "in"),
    );
  }
}
