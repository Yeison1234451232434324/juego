/**
 * AudioManager — efectos SINTETIZADOS con Web Audio API (sin archivos externos,
 * ideal para GitHub Pages). Se activa con la primera interacción del usuario.
 */
export class AudioManager {
  #ctx = null;
  #on = true;
  #vol = 0.5;

  setEnabled(v) { this.#on = v; }
  setVolume(v) { this.#vol = Math.max(0, Math.min(1, v)); }

  #c() {
    if (!this.#ctx) { try { this.#ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (this.#ctx.state === "suspended") this.#ctx.resume().catch(() => {});
    return this.#ctx;
  }

  #beep(freq, dur = 0.08, type = "square", slide = 1) {
    if (!this.#on) return;
    const c = this.#c(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(freq * slide, c.currentTime + dur);
    g.gain.setValueAtTime(this.#vol * 0.28, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }

  play(name) {
    const seq = (arr, d = 90) => arr.forEach((f, i) => setTimeout(() => this.#beep(f, 0.12), i * d));
    switch (name) {
      case "step":    this.#beep(180, 0.03, "triangle"); break;
      case "open":    this.#beep(520, 0.06, "sine", 1.4); break;
      case "type":    this.#beep(880, 0.02, "square"); break;
      case "compile": this.#beep(300, 0.14, "sawtooth", 1.5); break;
      case "ok":      seq([523, 659, 880]); break;
      case "error":   this.#beep(150, 0.22, "square", 0.55); break;
      case "coins":   seq([784, 988, 1175], 60); break;
      case "craft":   this.#beep(260, 0.1, "sawtooth", 1.3); break;
      case "level":   seq([392, 523, 659, 880], 80); break;
      case "achieve": seq([659, 880, 1046], 70); break;
      default: break;
    }
  }
}
