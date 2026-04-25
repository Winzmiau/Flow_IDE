import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { keymap, EditorView, drawSelection } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { createSignalPlugin } from "./signalPlugin";
import { SignalEngine } from "../core/signalEngine";

type EditorProps = {
  value: string;
  signalEngine: SignalEngine;
  onKey: (key: string) => void;
  onChange: (value: string) => void;
  onCursorChange: (cursor: { line: number; column: number; offset: number }) => void;
};

export function Editor({ value, signalEngine, onChange, onCursorChange, onKey }: EditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) {
      return;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }

      if (update.selectionSet || update.docChanged) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        onCursorChange({
          line: line.number,
          column: head - line.from + 1,
          offset: head,
        });
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        drawSelection(),
        markdown(),
        createSignalPlugin(signalEngine, onKey),
        updateListener,
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "15px",
            color: "#F2E8CF",
            backgroundColor: "rgba(10, 13, 18, 0.72)",
          },
          ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" },
          ".cm-content": { padding: "14px 16px", minHeight: "100%" },
          ".cm-cursor": { borderLeftColor: "#6AE3FF" },
          ".cm-selectionBackground": { backgroundColor: "rgba(106, 227, 255, 0.2)" },
          ".cm-gutters": {
            backgroundColor: "rgba(8, 10, 14, 0.45)",
            color: "#6d7784",
            border: "none",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });

    viewRef.current = view;
    onCursorChange({ line: 1, column: 1, offset: 0 });

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [onChange, onCursorChange, onKey, signalEngine, value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const current = view.state.doc.toString();
    if (current === value) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className="h-full w-full" />;
}
