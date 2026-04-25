import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Graph } from "./Graph";
import { Edge } from "./Edge";
import { NodeType } from "./Node";

type ConnectAnchor = {
  nodeId: string;
  port: string;
  x: number;
  y: number;
};

type DataflowViewProps = {
  graph: Graph;
  onGraphChange: () => void;
};

const NODE_TYPES: NodeType[] = ["DocumentSource", "SentenceSegmenter", "FilterNode", "HighlightSink"];

function latencyColor(ms: number): string {
  if (ms < 5) return "#5CF2A3";
  if (ms < 15) return "#6AE3FF";
  if (ms < 30) return "#FFD166";
  return "#FF5C7A";
}

function latencyWidth(ms: number): number {
  return Math.min(6, 1 + ms * 0.1);
}

function nodeHeat(avgExecMs: number): number {
  return Math.min(1, avgExecMs / 30);
}

function heatColor(intensity: number): string {
  const r = Math.floor(255 * intensity);
  const g = Math.floor(255 * (1 - intensity));
  return `rgb(${r},${g},100)`;
}

export function DataflowView({ graph, onGraphChange }: DataflowViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [connecting, setConnecting] = useState<ConnectAnchor | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const nodes = graph.nodes;
  const edges = graph.edges;

  const edgePaths = useMemo(() => {
    return edges
      .map((edge) => {
        const from = nodes.find((node) => node.id === edge.fromNodeId);
        const to = nodes.find((node) => node.id === edge.toNodeId);
        if (!from || !to) {
          return null;
        }
        const x1 = from.x + 176;
        const y1 = from.y + 54;
        const x2 = to.x;
        const y2 = to.y + 54;
        const profile = graph.getEdgeProfile(edge.id);
        return {
          id: edge.id,
          d: `M ${x1} ${y1} C ${x1 + 48} ${y1}, ${x2 - 48} ${y2}, ${x2} ${y2}`,
          color: latencyColor(profile.avgLatency),
          width: latencyWidth(profile.avgLatency),
          labelX: (x1 + x2) / 2,
          labelY: (y1 + y2) / 2,
          latency: profile.avgLatency,
        };
      })
      .filter(Boolean) as Array<{ id: string; d: string; color: string; width: number; labelX: number; labelY: number; latency: number }>;
  }, [edges, graph, nodes]);

  const onAddNode = (type: NodeType) => {
    graph.addNode(graph.createNode(type, 120 + Math.random() * 260, 50 + Math.random() * 190));
    onGraphChange();
  };

  const startDrag = (nodeId: string, event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const originX = node.x;
    const originY = node.y;

    const onMove = (moveEvent: MouseEvent) => {
      const nextX = originX + (moveEvent.clientX - startX);
      const nextY = originY + (moveEvent.clientY - startY);
      graph.moveNode(nodeId, Math.max(10, nextX), Math.max(10, nextY));
      onGraphChange();
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const beginConnect = (event: ReactMouseEvent<HTMLButtonElement>, nodeId: string, port: string) => {
    event.stopPropagation();
    const rootRect = rootRef.current?.getBoundingClientRect();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setConnecting({
      nodeId,
      port,
      x: rect.left - (rootRect?.left ?? 0) + rect.width / 2,
      y: rect.top - (rootRect?.top ?? 0) + rect.height / 2,
    });
  };

  const completeConnect = (event: ReactMouseEvent<HTMLButtonElement>, nodeId: string, port: string) => {
    event.stopPropagation();
    if (!connecting) {
      return;
    }
    if (connecting.nodeId === nodeId) {
      setConnecting(null);
      return;
    }

    const edge = new Edge(
      `e-${Math.random().toString(36).slice(2, 9)}`,
      connecting.nodeId,
      connecting.port,
      nodeId,
      port,
    );

    graph.addEdge(edge);
    setConnecting(null);
    onGraphChange();
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full bg-black/50"
      onMouseMove={(event) => {
        const rect = rootRef.current?.getBoundingClientRect();
        setPointer({
          x: event.clientX - (rect?.left ?? 0),
          y: event.clientY - (rect?.top ?? 0),
        });
      }}
      onMouseLeave={() => setPointer(null)}
      onMouseUp={() => setConnecting(null)}
    >
      <div className="absolute left-2 top-2 z-30 flex flex-wrap gap-2">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-sand hover:bg-cyan/20"
            onClick={() => onAddNode(type)}
          >
            + {type}
          </button>
        ))}
      </div>

      <svg className="absolute inset-0 z-10 h-full w-full pointer-events-none">
        {edgePaths.map((path) => (
          <g key={path.id}>
            <path d={path.d} stroke={path.color} strokeWidth={path.width} fill="none" opacity="0.9" />
            <text x={path.labelX} y={path.labelY} fill="#9ca3af" fontSize="10" textAnchor="middle">
              {path.latency.toFixed(1)} ms
            </text>
          </g>
        ))}

        {connecting && pointer && (
          <path
            d={`M ${connecting.x} ${connecting.y} C ${connecting.x + 60} ${connecting.y}, ${pointer.x - 60} ${pointer.y}, ${pointer.x} ${pointer.y}`}
            stroke="#FF6B6B"
            strokeDasharray="5 4"
            strokeWidth="1.5"
            fill="none"
            opacity="0.9"
          />
        )}
      </svg>

      {nodes.map((node) => {
        const ports = node.ports();
        const profile = graph.getProfile(node.id);
        const heat = nodeHeat(profile.avgExecMs);
        const background = heatColor(heat);
        return (
          <div
            key={node.id}
            className="absolute z-20 w-44 rounded p-2 text-xs text-sand shadow-glow"
            style={{
              left: node.x,
              top: node.y,
              backgroundColor: background,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onMouseDown={(event) => startDrag(node.id, event)}
          >
            <div className="mb-2 font-semibold text-cyan">{node.type}</div>
            <div className="flex justify-between gap-4">
              <div className="flex flex-col gap-2">
                {ports.inputs.map((port) => (
                  <button
                    key={`${node.id}-in-${port}`}
                    type="button"
                    className="rounded border border-coral/70 bg-coral/20 px-2 py-0.5 text-left"
                    onMouseUp={(event) => completeConnect(event, node.id, port)}
                  >
                    {port}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {ports.outputs.map((port) => (
                  <button
                    key={`${node.id}-out-${port}`}
                    type="button"
                    className="rounded border border-cyan/70 bg-cyan/20 px-2 py-0.5 text-left"
                    onMouseDown={(event) => beginConnect(event, node.id, port)}
                  >
                    {port}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
