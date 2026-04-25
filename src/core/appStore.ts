import { create } from "zustand";
import { SmoothedSignal } from "./signalEngine";
import { DocumentTree } from "../structure/structureEngine";

export type CursorState = {
  line: number;
  column: number;
  offset: number;
};

type AppState = {
  document: string;
  cursor: CursorState;
  lastKey: string;
  signal: SmoothedSignal;
  structure: DocumentTree | null;
  flowEnabled: boolean;
  setDocument: (value: string) => void;
  setCursor: (cursor: CursorState) => void;
  setLastKey: (value: string) => void;
  setSignal: (signal: SmoothedSignal) => void;
  setStructure: (tree: DocumentTree) => void;
  toggleFlow: () => void;
};

const defaultSignal: SmoothedSignal = {
  chars_per_second: 0,
  inter_keystroke_interval_variance: 0,
  pause_detected: false,
  backspace_ratio: 0,
  sentence_boundary_detected: false,
  continuity: 1,
  stability: 1,
  timestamp: Date.now(),
};

export const useAppStore = create<AppState>((set) => ({
  document: "",
  cursor: { line: 1, column: 1, offset: 0 },
  lastKey: "",
  signal: defaultSignal,
  structure: null,
  flowEnabled: true,
  setDocument: (value) => set({ document: value }),
  setCursor: (cursor) => set({ cursor }),
  setLastKey: (value) => set({ lastKey: value }),
  setSignal: (signal) => set({ signal }),
  setStructure: (tree) => set({ structure: tree }),
  toggleFlow: () => set((state) => ({ flowEnabled: !state.flowEnabled })),
}));
