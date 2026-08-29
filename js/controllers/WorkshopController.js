import { BusinessRules } from "../services/BusinessRules.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * WorkshopController — CONTROLADOR de la Máquina de Corte (transformar
 * materiales) y del proveedor Carlos (comprar materiales).
 */
export class WorkshopController {
  #gs; #bus;
  cutJobs = [];

  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  // ---- Máquina de Corte: 1 madera -> 3 clavos ----
  makeNails() {
    const r = CONFIG.RECIPES.nails;
    if (!this.#gs.workshop.inventory.consume(r.input)) {
      return this.#deny({ reason: "Necesitas al menos 1 madera.",
        rule: "No se puede transformar un material que no tienes." });
    }
    const job = { id: `c${Date.now()}`, elapsed: 0, total: r.seconds };
    this.cutJobs.push(job);
    this.#bus.emit("cut:started", job);
    this.#bus.emit("state:changed");
    return { ok: true };
  }

  tick(dt) {
    if (!this.cutJobs.length) return;
    const done = [];
    for (const j of this.cutJobs) {
      j.elapsed += dt;
      this.#bus.emit("cut:progress", { id: j.id, ratio: Math.min(1, j.elapsed / j.total) });
      if (j.elapsed >= j.total) done.push(j);
    }
    for (const j of done) {
      this.cutJobs = this.cutJobs.filter((x) => x !== j);
      this.#gs.workshop.inventory.add("nails", CONFIG.RECIPES.nails.output.nails);
      this.#bus.emit("cut:done");
      this.#bus.emit("state:changed");
    }
  }

  // ---- Carlos: comprar materiales ----
  buy(type, qty = 3) {
    const unit = CONFIG.ECONOMY.buyPrices[type] ?? 6;
    const cost = unit * qty;
    const rule = BusinessRules.canAfford(this.#gs.player, cost);
    if (!rule.ok) return this.#deny(rule);
    this.#gs.player.spend(cost);
    this.#gs.workshop.inventory.add(type, qty);
    this.#bus.emit("shop:bought", { type, qty, cost });
    this.#bus.emit("state:changed");
    return { ok: true };
  }

  #deny(rule) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
}
