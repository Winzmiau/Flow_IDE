import { SmoothedSignal } from "../core/signalEngine";

export class AudioEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly osc: OscillatorNode;
  private readonly pulse: OscillatorNode;
  private readonly filter: BiquadFilterNode;
  private readonly distortion: WaveShaperNode;
  private started = false;

  constructor() {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new Ctx();

    this.master = this.context.createGain();
    this.master.gain.value = 0.04;

    this.osc = this.context.createOscillator();
    this.osc.type = "sawtooth";

    this.pulse = this.context.createOscillator();
    this.pulse.type = "triangle";

    this.filter = this.context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 600;

    this.distortion = this.context.createWaveShaper();

    this.osc.connect(this.distortion);
    this.pulse.connect(this.distortion);
    this.distortion.connect(this.filter);
    this.filter.connect(this.master);
    this.master.connect(this.context.destination);

    this.osc.start();
    this.pulse.start();
  }

  resume() {
    if (this.context.state !== "running") {
      void this.context.resume();
    }
    this.started = true;
  }

  update(signal: SmoothedSignal) {
    if (!this.started) {
      return;
    }

    const now = this.context.currentTime;

    const tempoHz = Math.max(0.6, Math.min(8, signal.chars_per_second / 2.4));
    const baseFreq = 100 + signal.chars_per_second * 18;
    const pulseFreq = 40 + tempoHz * 20;

    this.osc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.pulse.frequency.setTargetAtTime(pulseFreq, now, 0.08);

    const ambientCutoff = signal.pause_detected ? 220 : 500 + signal.continuity * 2200;
    this.filter.frequency.setTargetAtTime(ambientCutoff, now, 0.12);

    const distortionAmount = signal.backspace_ratio * 250;
    this.distortion.curve = buildDistortionCurve(distortionAmount);

    const gain = 0.02 + signal.stability * 0.05;
    this.master.gain.setTargetAtTime(gain, now, 0.1);
  }

  dispose() {
    this.osc.disconnect();
    this.pulse.disconnect();
    this.distortion.disconnect();
    this.filter.disconnect();
    this.master.disconnect();
    void this.context.close();
  }
}

function buildDistortionCurve(amount: number): Float32Array {
  const samples = 256;
  const curve = new Float32Array(samples);
  const k = Math.max(1, amount);
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * Math.PI) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
