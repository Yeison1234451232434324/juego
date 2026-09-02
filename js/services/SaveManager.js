import { CONFIG } from "../config/gameConfig.js";

/** SaveManager — persistencia en localStorage (sin backend). save/load/reset. */
export class SaveManager {
  #key = CONFIG.SAVE_KEY;
  #locked = false;   // tras reset/patch se bloquea hasta recargar la página

  hasSave() { try { return !!localStorage.getItem(this.#key); } catch { return false; } }

  save(gameState) {
    if (this.#locked) return false;   // no re-guardar tras "Nueva partida" / reinicio
    try { localStorage.setItem(this.#key, JSON.stringify(gameState.toJSON())); return true; }
    catch (e) { console.warn("save fail", e); return false; }
  }

  load() {
    try { const r = localStorage.getItem(this.#key); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  /** Borra la partida. Bloquea futuros save() para que un flush por
   *  `pagehide`/`beforeunload` (justo antes de recargar) NO la resucite. */
  reset() {
    this.#locked = true;
    try { localStorage.removeItem(this.#key); } catch { /* noop */ }
  }

  /** Fusiona claves sueltas en el guardado (p. ej. reabrir el tutorial sin
      borrar el progreso) y bloquea save() hasta recargar. */
  patch(partial) {
    let ok = false;
    try {
      const r = localStorage.getItem(this.#key);
      if (r) {
        localStorage.setItem(this.#key, JSON.stringify({ ...JSON.parse(r), ...partial }));
        ok = true;
      }
    } catch (e) { console.warn("patch fail", e); }
    this.#locked = true;
    return ok;
  }
}
