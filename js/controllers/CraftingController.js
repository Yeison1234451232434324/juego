import { BusinessRules } from "../services/BusinessRules.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * CraftingController — CONTROLADOR del Banco de Carpintería.
 * Aplica las reglas de negocio (materiales, trabajador) y ejecuta la
 * fabricación con tiempo real.
 */
export class CraftingController {
  #gs; #bus;
  jobs = [];

  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  /** Info para la Vista (sin decidir nada). */
  status(type) {
    const recipe = CONFIG.RECIPES[type];
    const inv = this.#gs.workshop.inventory;
    return {
      type, recipe,
      have: Object.fromEntries(Object.keys(recipe).map((m) => [m, inv.count(m)])),
      canCraft: BusinessRules.canCraft(recipe, inv).ok,
      workerFree: this.#gs.workshop.worker.isAvailable,
      seconds: this.#craftSeconds(type),
    };
  }

  #craftSeconds(type) {
    const base = CONFIG.CRAFT_SECONDS[type] ?? 15;
    return Math.round(base * (this.#gs.upgrades.has("bench") ? 0.7 : 1));
  }

  craft(type) {
    const recipe = CONFIG.RECIPES[type];
    const r1 = BusinessRules.canCraft(recipe, this.#gs.workshop.inventory);
    if (!r1.ok) return this.#deny(r1);
    const r2 = BusinessRules.workerAvailable(this.#gs.workshop.worker);
    if (!r2.ok) return this.#deny(r2);

    this.#gs.workshop.inventory.consume(recipe);
    this.#gs.workshop.worker.assign();
    const job = { id: `j${Date.now()}`, type, elapsed: 0, total: this.#craftSeconds(type) };
    this.jobs.push(job);
    this.#bus.emit("craft:started", job);
    this.#bus.emit("state:changed");
    return { ok: true, job };
  }

  tick(dt) {
    if (!this.jobs.length) return;
    const finished = [];
    for (const j of this.jobs) {
      j.elapsed += dt;
      this.#bus.emit("craft:progress", { id: j.id, ratio: Math.min(1, j.elapsed / j.total) });
      if (j.elapsed >= j.total) finished.push(j);
    }
    for (const j of finished) this.#finish(j);
  }

  #finish(job) {
    this.jobs = this.jobs.filter((x) => x !== job);
    this.#gs.workshop.worker.release();
    this.#gs.workshop.addStock(job.type);
    this.#gs.player.stats.objectsCreated++;
    const lvls = this.#gs.player.addXp(CONFIG.XP.craft);
    this.#bus.emit("craft:done", job);
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
  }

  #deny(rule) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
}
