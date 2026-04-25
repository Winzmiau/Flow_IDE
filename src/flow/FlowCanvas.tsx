import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SmoothedSignal } from "../core/signalEngine";
import { useAppStore } from "../core/appStore";
import { FlowField } from "./flowField";

type FlowCanvasProps = {
  signalRef: { current: SmoothedSignal };
};

export function FlowCanvas({ signalRef }: FlowCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const flowEnabled = useAppStore((state) => state.flowEnabled);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const count = 2800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color("#6AE3FF"),
      size: 0.38,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const field = new FlowField();
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);

      if (!flowEnabled) {
        renderer.render(scene, camera);
        return;
      }

      const elapsed = clock.getElapsedTime();
      const signal = signalRef.current;
      const pos = geometry.getAttribute("position") as THREE.BufferAttribute;

      const speed = 0.06 + signal.chars_per_second * 0.018;
      const turbulence = signal.backspace_ratio * 1.2;
      const smoothness = Math.max(0.08, signal.continuity);

      for (let i = 0; i < count; i += 1) {
        let x = pos.getX(i);
        let y = pos.getY(i);

        const vec = field.getVector(x * 0.023, y * 0.023, elapsed * 0.35);

        x += vec.x * speed * smoothness;
        y += vec.y * speed * smoothness;

        x += (Math.random() - 0.5) * turbulence;
        y += (Math.random() - 0.5) * turbulence;

        if (x > 75) x = -75;
        if (x < -75) x = 75;
        if (y > 46) y = -46;
        if (y < -46) y = 46;

        pos.setXY(i, x, y);
      }

      pos.needsUpdate = true;
      material.opacity = 0.25 + signal.stability * 0.65;
      material.color.setHSL(0.52 + signal.backspace_ratio * 0.2, 0.7, 0.6);

      renderer.render(scene, camera);
    };

    const onResize = () => {
      if (!mount) {
        return;
      }
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    animate();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [flowEnabled, signalRef]);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
