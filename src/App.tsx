import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "./core/appStore";
import { SignalEngine } from "./core/signalEngine";
import { buildStructureTree } from "./structure/structureEngine";
import { AudioEngine } from "./flow/audioEngine";
import { FlowCanvas } from "./flow/FlowCanvas";
import { Editor } from "./editor/Editor";
import { Graph } from "./dataflow/Graph";
import { DataflowView } from "./dataflow/DataflowView";
import NodeInspector from "./dataflow/NodeInspector";
import { Panels } from "./ui/Panels";
import { CommandPalette } from "./ui/CommandPalette";

const INITIAL_DOC = `FlowWriter IDE\n\nType here. The flow field, audio texture, and dataflow runtime all react in real time.`;

function App() {
  const document = useAppStore((state) => state.document);
  const cursor = useAppStore((state) => state.cursor);
  const signal = useAppStore((state) => state.signal);
  const structure = useAppStore((state) => state.structure);
  const flowEnabled = useAppStore((state) => state.flowEnabled);
  const setDocument = useAppStore((state) => state.setDocument);
  const setCursor = useAppStore((state) => state.setCursor);
  const setSignal = useAppStore((state) => state.setSignal);
  const setLastKey = useAppStore((state) => state.setLastKey);
  const setStructure = useAppStore((state) => state.setStructure);
  const toggleFlow = useAppStore((state) => state.toggleFlow);

  const [highlightPreview, setHighlightPreview] = useState<string[]>([]);
  const [graphTick, setGraphTick] = useState(0);

  const signalEngineRef = useRef(new SignalEngine());
  const signalRef = useRef(signal);
  const graphRef = useRef(new Graph());
  const audioRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    if (!document) {
      setDocument(INITIAL_DOC);
    }
  }, [document, setDocument]);

  useEffect(() => {
    graphRef.current.ensureDefaultPipeline();
    setGraphTick((value) => value + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = graphRef.current.subscribe(() => {
      // Stream events are available for future inspector expansion.
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const nextSignal = signalEngineRef.current.compute();
      signalRef.current = nextSignal;
      setSignal(nextSignal);
      audioRef.current?.update(nextSignal);
      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, [setSignal]);

  useEffect(() => {
    audioRef.current = new AudioEngine();
    return () => audioRef.current?.dispose();
  }, []);

  useEffect(() => {
    const tree = buildStructureTree(document);
    setStructure(tree);

    let raf = requestAnimationFrame(() => {
      const result = graphRef.current.run(document);
      setHighlightPreview(result.value.slice(0, 8));
    });

    return () => cancelAnimationFrame(raf);
  }, [document, graphTick, setStructure]);

  const commands = useMemo(
    () => [
      {
        id: "toggle-flow",
        label: "Toggle Flow",
        run: () => toggleFlow(),
      },
      {
        id: "add-node",
        label: "Add Node",
        run: () => {
          graphRef.current.addNode(graphRef.current.createNode("FilterNode", 120 + Math.random() * 280, 40 + Math.random() * 210));
          setGraphTick((value) => value + 1);
        },
      },
    ],
    [toggleFlow],
  );

  const centerPanel = (
    <div className="relative h-full w-full">
      {flowEnabled && <FlowCanvas signalRef={signalRef} />}
      <div className="absolute inset-0 z-10 p-3">
        <div className="panel grain h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/70">
            <div>
              Cursor {cursor.line}:{cursor.column}
            </div>
            <div>cps {signal.chars_per_second.toFixed(2)}</div>
            <div>backspace {Math.round(signal.backspace_ratio * 100)}%</div>
          </div>
          <div className="h-[calc(100%-38px)]">
            <Editor
              value={document}
              signalEngine={signalEngineRef.current}
              onKey={(key) => {
                setLastKey(key);
                audioRef.current?.resume();
              }}
              onChange={setDocument}
              onCursorChange={setCursor}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const outlinePanel = (
    <div className="h-full p-3 text-sm text-sand">
      <div className="mb-2 border-b border-white/10 pb-2 text-xs uppercase tracking-wide text-cyan">Outline</div>
      <div className="mb-3 rounded border border-white/10 bg-black/35 p-2 text-xs">
        <div>Paragraphs: {structure?.paragraphs.length ?? 0}</div>
        <div>Sentences: {structure?.sentenceCount ?? 0}</div>
      </div>
      <div className="space-y-2 overflow-auto pb-24 text-xs">
        {(structure?.paragraphs ?? []).map((paragraph) => (
          <div key={paragraph.id} className="rounded border border-white/10 bg-black/35 p-2">
            <div className="font-semibold text-cyan">{paragraph.id}</div>
            <div className="mt-1 text-white/75">{paragraph.text.slice(0, 110) || "(empty)"}</div>
            <div className="mt-1 text-white/55">sentences: {paragraph.sentences.length}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const dataflowPanel = (
    <div className="grid h-full grid-cols-[1fr_320px]">
      <DataflowView graph={graphRef.current} onGraphChange={() => setGraphTick((value) => value + 1)} />
      <div className="grid grid-rows-[1fr_180px] border-l border-white/10">
        <NodeInspector runtime={graphRef.current} />
        <div className="border-t border-white/10 p-2 text-xs text-sand">
          <div className="mb-2 text-cyan">Pipeline Output</div>
          <div className="space-y-1 overflow-auto">
            {highlightPreview.map((sentence, index) => (
              <div key={`${sentence}-${index}`} className="rounded border border-white/10 bg-black/35 px-2 py-1">
                {sentence}
              </div>
            ))}
            {highlightPreview.length === 0 && <div className="text-white/60">No sentences emitted yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full">
      <Panels center={centerPanel} right={outlinePanel} bottom={dataflowPanel} />
      <CommandPalette commands={commands} />
    </div>
  );
}

export default App;
