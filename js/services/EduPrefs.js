/**
 * EduPrefs — preferencias EDUCATIVAS (no de partida). Clave propia en
 * localStorage, igual que las de audio: no forma parte de GameState ni del
 * guardado v5/v6, así que no necesita migración.
 */
const KEY = "codecraft-workshop:edu";
const DEFAULTS = Object.freeze({ mvcFlow: true, reduceMotion: false });

export class EduPrefs {
  data = { ...DEFAULTS };

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch { /* noop */ }
  }

  get(k) { return this.data[k]; }
  set(k, v) {
    this.data[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* noop */ }
  }
}
