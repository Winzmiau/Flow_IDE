import { EditorView, ViewPlugin } from "@codemirror/view";
import { SignalEngine } from "../core/signalEngine";

export function createSignalPlugin(engine: SignalEngine, onKey: (key: string) => void) {
  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        view.dom.addEventListener("keydown", this.onKeyDown);
      }

      onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Backspace") {
          engine.pushKeystroke("backspace", event.key);
        } else if (event.key.length === 1) {
          engine.pushKeystroke("char", event.key);
        } else {
          engine.pushKeystroke("other", event.key);
        }

        onKey(event.key);
      };

      destroy(view: EditorView) {
        view.dom.removeEventListener("keydown", this.onKeyDown);
      }
    },
  );
}
