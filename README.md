# FlowWriter IDE

FlowWriter IDE is a reactive writing environment where typing generates live audiovisual feedback and drives a node-based dataflow runtime.

## Gamified Productivity: Evidence-Backed Tactics

This project uses measurable behavioral feedback loops instead of arbitrary gamification:

- typing rhythm and continuity become live signal metrics
- dataflow execution timing is visible as pulse streams and heatmaps
- latency and throughput are surfaced directly in the IDE

The goal is observable cognition: writing -> computation -> visualization -> introspection.

## Stack

- React + TypeScript + Vite
- CodeMirror 6
- Three.js (WebGL)
- WebAudio API
- Zustand
- TailwindCSS

## Implemented MVP Features

1. Core Editor
- CodeMirror editor with live document, cursor, and keystroke capture
- key events feed the signal engine in real time

2. Signal Engine
- smoothed output at animation-frame cadence (~60Hz)
- metrics:
  - chars_per_second
  - inter_keystroke_interval_variance
  - pause_detected
  - backspace_ratio
  - sentence_boundary_detected

3. Flow Engine (Visual)
- Three.js particle system with flow-field behavior
- mappings:
  - speed <- typing velocity
  - turbulence <- backspace/error behavior
  - smoothness <- continuity/stability

4. Audio Engine
- WebAudio synth graph
- mappings:
  - rhythm -> pitch/tempo feel
  - pauses -> ambient filter shift
  - errors -> distortion amount

5. Structure Engine
- sentence and paragraph detection
- exposes a simple document structure tree for outline UI

6. Dataflow Runtime
- custom Graph/Node/Edge runtime
- node types:
  - DocumentSource
  - SentenceSegmenter
  - FilterNode
  - HighlightSink
- automatic execution on document change
- stream event emission

7. Dataflow UI
- draggable nodes
- output-to-input connection creation
- live edge preview while dragging
- add-node controls

8. IDE Panels
- resizable center editor panel
- right outline panel
- bottom dataflow panel

9. Command Palette
- open with Cmd/Ctrl+K
- actions:
  - Toggle Flow
  - Add Node

10. Performance and Non-Blocking Updates
- requestAnimationFrame loops for signal/audio/visual updates
- lightweight runtime profiling and fixed-size stream history buffers

## Live Runtime Inspector (Oscilloscope Layer)

The inspector is now elevated from a history viewer to a true runtime oscilloscope:

- real-time stream pulses
- throughput (packets/sec)
- per-node execution timing (last/avg ms)
- per-edge latency profiling
- stream value preview

### Runtime Profiling Model

- `Profile`
  - `lastExecMs`
  - `avgExecMs`
  - `lastPacketAt`
  - `rate`

- `EdgeProfile`
  - `lastLatency`
  - `avgLatency`
  - `count`

### Edge Latency + Dependency Heatmap

- edge color and stroke width encode latency bands
- node background heat encodes execution cost
- dependency panel shows incoming edge latency per selected node

This enables visual bottleneck detection:

- low rate + high exec time -> heavy nodes
- thicker warmer edges -> slow propagation
- flat pulse lanes -> dead or idle streams

## Why This Matters

Before:

- nodes -> output

Now:

- nodes -> time -> flow -> structure -> performance

The system becomes observable computation, not console-log debugging.

## Project Structure

- `src/core`
  - `appStore.ts`
  - `signalEngine.ts`
- `src/editor`
  - `Editor.tsx`
  - `signalPlugin.ts`
- `src/flow`
  - `FlowCanvas.tsx`
  - `flowField.ts`
  - `audioEngine.ts`
- `src/structure`
  - `structureEngine.ts`
- `src/dataflow`
  - `Graph.ts`
  - `Node.ts`
  - `Edge.ts`
  - `DataflowView.tsx`
  - `NodeInspector.tsx`
  - `StreamOscilloscope.tsx`
- `src/ui`
  - `Panels.tsx`
  - `CommandPalette.tsx`
- `src/App.tsx`

## Run

1. Install dependencies
   - `npm install`
2. Start development server
   - `npm run dev`
3. Build for production
   - `npm run build`

## Next High-Leverage Upgrade

1. Temporal replay and scrubbing
- maintain timeline of packets/executions
- scrub time and replay deterministic flow

2. Branching timelines (what-if simulation)
- fork computational histories and compare outcomes

3. Semantic-to-visual coupling
- feed structure/semantic clusters into flow attractors and overlays

## Notes

- Audio resumes on first user interaction due browser autoplay policy.
- Rendering and signal extraction are throttled by the browser frame clock.
