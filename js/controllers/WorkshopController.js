import { BusinessRules } from "../services/BusinessRules.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * WorkshopController — CONTROLADOR del proveedor Carlos (comprar materiales
 * sueltos en la Zona de Mejoras).
 */
export class WorkshopController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  /** El reloj lo llama cada frame; de momento no hay procesos que actualizar. */
  tick(_dt) { /* noop */ }

  buy(type, qty = 3) {
    const unit = CONFIG.ECONOMY.buyPrices[type] ?? 6;
    const cost = unit * qty;
    const rule = BusinessRules.canAfford(this.#gs.player, cost);
    if (!rule.ok) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
    this.#gs.player.spend(cost);
    this.#gs.workshop.inventory.add(type, qty);
    // comprar materiales es un ATAJO frente a programar → afecta a la calidad
    this.#gs.player.stats.shortcutBuys = (this.#gs.player.stats.shortcutBuys || 0) + 1;
    this.#bus.emit("shop:bought", { type, qty, cost });
    this.#bus.emit("state:changed");
    return { ok: true };
  }
}
