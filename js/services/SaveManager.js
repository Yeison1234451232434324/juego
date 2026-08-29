import { CONFIG } from "../config/gameConfig.js";

/** SaveManager — persistencia en localStorage (sin backend). save/load/reset. */
export class SaveManager {
  #key = CONFIG.SAVE_KEY;

  hasSave() { try { return !!localStorage.getItem(this.#key); } catch { return false; } }

  save(gameState) {
    try { localStorage.setItem(this.#key, JSON.stringify(gameState.toJSON())); return true; }
    catch (e) { console.warn("save fail", e); return false; }
  }

  load() {
    try { const r = localStorage.getItem(this.#key); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  reset() { try { localStorage.removeItem(this.#key); } catch { /* noop */ } }
}
