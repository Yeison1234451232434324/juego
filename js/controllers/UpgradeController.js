import { BusinessRules } from "../services/BusinessRules.js";

/**
 * UpgradeController — CONTROLADOR de la Tienda de Mejoras.
 * Comprar una mejora: valida el dinero y activa el flag; el efecto real lo
 * aplican otros controladores que consultan `upgrades.has(key)`.
 */
export class UpgradeController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  list() { return this.#gs.upgrades.all(); }

  buy(key) {
    const up = this.#gs.upgrades.get(key);
    if (!up || up.owned) return { ok: false };
    const rule = BusinessRules.canAfford(this.#gs.player, up.cost);
    if (!rule.ok) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }

    this.#gs.player.spend(up.cost);
    up.buy();
    this.#bus.emit("upgrade:bought", up);
    this.#bus.emit("state:changed");
    return { ok: true, upgrade: up };
  }
}
