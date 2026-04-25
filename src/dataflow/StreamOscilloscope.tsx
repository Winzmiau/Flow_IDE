import { useEffect, useRef } from "react";
import type { TapPacket } from "./Graph";

type StreamOscilloscopeProps = {
  history: TapPacket[];
};

export default function StreamOscilloscope({ history }: StreamOscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let raf = 0;
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      raf = requestAnimationFrame(draw);

      ctx.fillStyle = "#05070A";
      ctx.fillRect(0, 0, width, height);

      const now = performance.now();

      for (let i = 0; i < history.length; i += 1) {
        const packet = history[i];
        const ageSeconds = (now - packet.t) / 1000;
        if (ageSeconds > 2.0) {
          continue;
        }

        const x = width - ageSeconds * 200;
        const y = height / 2;

        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = "#6AE3FF";
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [history]);

  return <canvas ref={canvasRef} width={260} height={60} className="rounded border border-white/10" />;
}
