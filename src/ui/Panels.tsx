import { useEffect, useRef, useState } from "react";

type PanelsProps = {
  center: React.ReactNode;
  right: React.ReactNode;
  bottom: React.ReactNode;
};

export function Panels({ center, right, bottom }: PanelsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragModeRef = useRef<"right" | "bottom" | null>(null);
  const [rightWidth, setRightWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(210);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragModeRef.current) {
        return;
      }

      if (dragModeRef.current === "right") {
        const rect = root.getBoundingClientRect();
        const width = rect.right - event.clientX;
        setRightWidth(Math.max(240, Math.min(500, width)));
      }

      if (dragModeRef.current === "bottom") {
        const rect = root.getBoundingClientRect();
        const height = rect.bottom - event.clientY;
        setBottomHeight(Math.max(160, Math.min(420, height)));
      }
    };

    const onPointerUp = () => {
      dragModeRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative grid h-full w-full" style={{ gridTemplateRows: `1fr 6px ${bottomHeight}px` }}>
      <div className="grid overflow-hidden" style={{ gridTemplateColumns: `1fr 6px ${rightWidth}px` }}>
        <div className="relative overflow-hidden">{center}</div>
        <div
          className="splitter col-start-2 cursor-col-resize"
          onPointerDown={() => {
            dragModeRef.current = "right";
          }}
        />
        <div className="panel overflow-auto">{right}</div>
      </div>

      <div
        className="splitter row-start-2 cursor-row-resize"
        onPointerDown={() => {
          dragModeRef.current = "bottom";
        }}
      />
      <div className="panel row-start-3 overflow-hidden">{bottom}</div>
    </div>
  );
}
