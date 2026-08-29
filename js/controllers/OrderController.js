import { BusinessRules } from "../services/BusinessRules.js";
import { FurnitureFactory } from "../services/FurnitureFactory.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * OrderController — CONTROLADOR de pedidos (Mesa de Pedidos + Mostrador de Ventas).
 * Aceptar un pedido y entregarlo si está cumplido, cobrando la recompensa.
 */
export class OrderController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  available() { return this.#gs.availableOrders; }
  active() { return this.#gs.workshop.orders; }

  accept(id) {
    const i = this.#gs.availableOrders.findIndex((o) => o.id === id);
    if (i < 0) return { ok: false };
    const [o] = this.#gs.availableOrders.splice(i, 1);
    this.#gs.workshop.addOrder(o);
    this.#gs.refillOrders();
    this.#bus.emit("order:accepted", o);
    this.#bus.emit("state:changed");
    return { ok: true, order: o };
  }

  /** Precio de venta validado por la regla de negocio (no puede ser <= 0). */
  validateSellPrice(type, value) {
    const f = FurnitureFactory.create(type);
    const r = BusinessRules.validatePrice(f, value);
    this.#gs.player.stats.rulesTotal++;
    if (r.ok) this.#gs.player.stats.rulesRespected++;
    else { this.#bus.emit("rule:blocked", r); this.#gs.player.learn("encapsulamiento"); }
    return r;
  }

  deliver(id) {
    const o = this.#gs.workshop.orders.find((x) => x.id === id);
    if (!o) return { ok: false };

    // completar líneas con el stock disponible
    for (const line of o.lines) {
      while (o.remainingOf(line.type) > 0 && this.#gs.workshop.countStock(line.type) > 0) {
        this.#gs.workshop.takeStock(line.type);
        o.addProduct(line.type);
      }
    }

    const rule = BusinessRules.canDeliver(o);
    this.#gs.player.stats.rulesTotal++;
    if (!rule.ok) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
    this.#gs.player.stats.rulesRespected++;

    o.deliver();
    this.#gs.workshop.removeOrder(o.id);
    this.#gs.player.earn(o.reward);
    this.#gs.player.addReputation(CONFIG.ECONOMY.reputationPerOrder);
    this.#gs.workshop.inventory.add("metal", o.metalReward);
    this.#gs.player.stats.ordersDelivered++;
    const lvls = this.#gs.player.addXp(CONFIG.XP.order);
    if (o.isFinal) this.#gs.player.stats.finalDone = true;

    this.#bus.emit("order:delivered", o);
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, order: o };
  }
}
