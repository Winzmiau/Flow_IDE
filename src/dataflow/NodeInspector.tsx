import { useMemo, useState } from "react";
import { Graph } from "./Graph";
import StreamOscilloscope from "./StreamOscilloscope";

type NodeInspectorProps = {
  runtime: Graph;
};

export default function NodeInspector({ runtime }: NodeInspectorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const nodes = runtime.nodes;
  const edges = runtime.edges;

  const node = selected ? runtime.getNode(selected) : null;
  const profile = selected ? runtime.getProfile(selected) : null;

  const outputPorts = useMemo(() => {
    if (!node) {
      return [] as string[];
    }
    return node.ports().outputs;
  }, [node]);

  return (
    <div className="h-full overflow-auto bg-black/25 p-2 text-sand">
      <h2 className="mb-2 text-sm font-semibold text-cyan">Live Inspector</h2>

      <div className="grid grid-cols-2 gap-2">
        {nodes.map((n) => (
          <button
            key={n.id}
            onClick={() => setSelected(n.id)}
            className="rounded border border-white/20 bg-white/10 px-2 py-1 text-left text-xs hover:bg-cyan/15"
          >
            {n.type}
          </button>
        ))}
      </div>

      {node && profile && (
        <div className="mt-4 text-xs">
          <h3 className="font-semibold text-white">{node.id}</h3>

          <div className="mt-2 space-y-1 rounded border border-white/15 bg-black/35 p-2">
            <div>rate: {profile.rate.toFixed(1)} pkt/s</div>
            <div>last: {profile.lastExecMs.toFixed(2)} ms</div>
            <div>avg: {profile.avgExecMs.toFixed(2)} ms</div>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-cyan">Streams</div>
            {outputPorts.length === 0 && <div className="text-white/60">No output ports.</div>}
            {outputPorts.map((port) => {
              const history = runtime.getStreamHistory(node.id, port);
              return (
                <div key={port} className="mb-2 rounded border border-white/10 bg-black/30 p-2">
                  <div className="mb-1 text-[11px] text-white/80">{port}</div>
                  <StreamOscilloscope history={history} />
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded border border-white/10 bg-black/30 p-2">
            <div className="mb-1 text-cyan">Dependencies</div>
            {edges
              .filter((edge) => edge.toNodeId === node.id)
              .map((edge) => {
                const edgeProfile = runtime.getEdgeProfile(edge.id);
                return (
                  <div key={edge.id} className="text-[11px] text-white/80">
                    {edge.fromNodeId} -> {node.id}
                    <span className="ml-2 text-white/60">{edgeProfile.avgLatency.toFixed(2)} ms</span>
                  </div>
                );
              })}
          </div>

          <div className="mt-3 rounded border border-white/10 bg-black/30 p-2">
            <div className="mb-1 text-cyan">Last Output</div>
            <pre className="max-h-32 overflow-auto text-[10px] text-white/70">
              {JSON.stringify(outputPorts.length > 0 ? runtime.getStreamHistory(node.id, outputPorts[0]).slice(-1)[0]?.value : null, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
