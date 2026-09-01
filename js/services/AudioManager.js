/**
 * AudioManager — MÚSICA de ambiente + efectos, todo SINTETIZADO con Web Audio
 * API. Sin archivos externos → funciona en GitHub Pages sin configurar nada.
 *
 *  - Música: un loop suave estilo taller (bajo + acordes + arpegio).
 *  - Efectos: martillo, sierra, teclado, monedas, éxito, error…
 *  - Foley: sonidos ambientales aleatorios mientras juegas.
 *  - Canales independientes (música / efectos) con volumen y on/off.
 *  - Preferencias en localStorage["codecraft-workshop:audio"].
 *  - Respeta el bloqueo de autoplay: arranca en la 1.ª interacción.
 */
const PREF_KEY = "codecraft-workshop:audio";

export class AudioManager {
  #ctx = null;
  #master = null;
  #musicGain = null;
  #sfxGain = null;
  #musicTimer = null;
  #foleyTimer = null;
  #step = 0;
  #inGame = false;

  prefs = { musicOn: true, sfxOn: true, musicVol: 0.6, sfxVol: 0.7 };

  constructor() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) this.prefs = { ...this.prefs, ...JSON.parse(raw) };
    } catch { /* noop */ }
  }

  // ---------- infraestructura ----------
  #ac() {
    if (!this.#ctx) {
      try {
        this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.#master = this.#ctx.createGain();
        this.#master.gain.value = 0.9;
        this.#master.connect(this.#ctx.destination);
        this.#musicGain = this.#ctx.createGain();
        this.#sfxGain = this.#ctx.createGain();
        this.#musicGain.connect(this.#master);
        this.#sfxGain.connect(this.#master);
        this.#applyVolumes();
      } catch { return null; }
    }
    if (this.#ctx.state === "suspended") this.#ctx.resume().catch(() => {});
    return this.#ctx;
  }

  #applyVolumes() {
    if (!this.#musicGain) return;
    this.#musicGain.gain.value = this.prefs.musicOn ? this.prefs.musicVol * 0.14 : 0;
    this.#sfxGain.gain.value = this.prefs.sfxOn ? this.prefs.sfxVol * 0.9 : 0;
  }

  #savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(this.prefs)); } catch { /* noop */ }
  }

  /** Llamar en la primera interacción real del usuario. */
  unlock() {
    const c = this.#ac();
    if (!c) return false;
    if (c.state === "suspended") c.resume().catch(() => {});
    if (this.prefs.musicOn && !this.#musicTimer) this.startMusic();
    return c.state === "running";
  }

  get blocked() { return !this.#ctx || this.#ctx.state !== "running"; }

  // ---------- ajustes ----------
  setMusicOn(v) { this.prefs.musicOn = !!v; this.#applyVolumes(); this.#savePrefs();
    if (v) this.startMusic(); else this.stopMusic(); }
  setSfxOn(v)   { this.prefs.sfxOn = !!v; this.#applyVolumes(); this.#savePrefs(); }
  setMusicVol(v){ this.prefs.musicVol = clamp(v); this.#applyVolumes(); this.#savePrefs(); }
  setSfxVol(v)  { this.prefs.sfxVol = clamp(v); this.#applyVolumes(); this.#savePrefs(); }

  setInGame(v) {
    this.#inGame = !!v;
    if (v) this.#scheduleFoley();
    else { clearTimeout(this.#foleyTimer); this.#foleyTimer = null; }
  }

  // ---------- MÚSICA ----------
  startMusic() {
    if (!this.prefs.musicOn) return;
    const c = this.#ac(); if (!c) return;
    if (this.#musicTimer) return;
    this.#step = 0;
    const tick = () => {
      this.#musicBar();
      this.#musicTimer = setTimeout(tick, 2000);   // una "casilla" cada 2 s
    };
    tick();
  }

  stopMusic() { clearTimeout(this.#musicTimer); this.#musicTimer = null; }

  /** Progresión I–vi–IV–V en Do (cálida, lenta). */
  #musicBar() {
    const c = this.#ctx; if (!c || this.#musicGain.gain.value <= 0) return;
    const t = c.currentTime;
    const CHORDS = [
      [130.81, 164.81, 196.00],  // C
      [110.00, 130.81, 164.81],  // Am
      [174.61, 220.00, 261.63],  // F
      [196.00, 246.94, 293.66],  // G
    ];
    const chord = CHORDS[this.#step % 4];

    // bajo
    this.#voice(chord[0] / 2, t, 2.1, "sine", 0.5);
    // pad (acorde sostenido, ataque/relajación suaves)
    chord.forEach((f) => this.#voice(f, t, 2.0, "triangle", 0.16, 0.5));
    // arpegio (2 notas por casilla)
    const arp = [chord[2] * 2, chord[1] * 2];
    arp.forEach((f, i) => this.#pluck(f, t + i * 0.9, 0.5));

    this.#step++;
  }

  #voice(freq, when, dur, type, level, attack = 0.05) {
    const c = this.#ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(level, when + attack);
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(this.#musicGain);
    o.start(when); o.stop(when + dur + 0.05);
  }

  #pluck(freq, when, level) {
    const c = this.#ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.value = freq;
    g.gain.setValueAtTime(level, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
    o.connect(g).connect(this.#musicGain);
    o.start(when); o.stop(when + 0.45);
  }

  // ---------- FOLEY (ambiente del taller) ----------
  #scheduleFoley() {
    clearTimeout(this.#foleyTimer);
    const wait = 2500 + Math.random() * 4000;
    this.#foleyTimer = setTimeout(() => {
      if (this.#inGame && this.prefs.sfxOn) {
        const pool = ["hammer", "hammer", "saw", "type", "type", "carry"];
        this.#fx(pool[(Math.random() * pool.length) | 0], 0.4);
      }
      this.#scheduleFoley();
    }, wait);
  }

  // ---------- EFECTOS ----------
  #beep(freq, dur = 0.08, type = "square", slide = 1, level = 0.28) {
    const c = this.#ac(); if (!c || !this.prefs.sfxOn) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), c.currentTime + dur);
    g.gain.setValueAtTime(level, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(this.#sfxGain);
    o.start(); o.stop(c.currentTime + dur + 0.02);
  }

  #noise(dur, filterFreq, level = 0.2) {
    const c = this.#ac(); if (!c || !this.prefs.sfxOn) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = filterFreq; f.Q.value = 6;
    const g = c.createGain(); g.gain.value = level;
    src.connect(f).connect(g).connect(this.#sfxGain);
    src.start();
  }

  #fx(name, scale = 1) {
    const s = scale;
    switch (name) {
      case "hammer": this.#beep(90, 0.06, "square", 0.6, 0.3 * s); this.#noise(0.05, 1800, 0.14 * s); break;
      case "saw":    this.#noise(0.32, 900, 0.16 * s); break;
      case "type":   this.#beep(1400 + Math.random() * 400, 0.015, "square", 1, 0.12 * s); break;
      case "carry":  this.#noise(0.12, 300, 0.14 * s); break;
      default: break;
    }
  }

  /** API pública de efectos (la usa el EventBus vía main.js). */
  play(name) {
    if (!this.prefs.sfxOn) return;
    const seq = (arr, d = 90) => arr.forEach((f, i) => setTimeout(() => this.#beep(f, 0.12), i * d));
    switch (name) {
      case "step":    this.#beep(180, 0.03, "triangle", 1, 0.12); break;
      case "click":
      case "open":    this.#beep(520, 0.06, "sine", 1.4, 0.2); break;
      case "accept":  seq([440, 587], 70); break;
      case "type":    this.#fx("type"); break;
      case "hammer":  this.#fx("hammer"); break;
      case "saw":     this.#fx("saw"); break;
      case "compile": this.#beep(300, 0.14, "sawtooth", 1.5, 0.22); break;
      case "ok":      seq([523, 659, 880]); break;
      case "error":   this.#beep(150, 0.22, "square", 0.55, 0.24); break;
      case "coins":   seq([784, 988, 1175], 60); break;
      case "craft":   this.#fx("hammer"); setTimeout(() => this.#beep(330, 0.12, "sawtooth", 1.4, 0.2), 120); break;
      case "level":   seq([392, 523, 659, 880], 80); break;
      case "achieve": seq([659, 880, 1046], 70); break;
      case "upgrade": seq([523, 659, 784, 1046], 60); break;
      default: break;
    }
  }
}

function clamp(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }
