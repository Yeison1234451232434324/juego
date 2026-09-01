import { BusinessRules } from "../services/BusinessRules.js";
import { FurnitureFactory } from "../services/FurnitureFactory.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * OrderController — CONTROLADOR de pedidos (Tablón de pedidos + Mostrador/Cliente).
 * Aceptar, cancelar y entregar pedidos, aplicando las reglas de negocio.
 */
export class OrderController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  available() { return this.#gs.availableOrders; }
  active() { return this.#gs.workshop.orders; }
  max() { return CONFIG.GAMEPLAY.MAX_ACTIVE_ORDERS; }

  /** La regla decide; la vista solo muestra el resultado. */
  canAccept(id) {
    const o = this.#gs.availableOrders.find((x) => x.id === id);
    return BusinessRules.canAcceptOrder(this.#gs.workshop, o ?? { status: "closed" });
  }

  accept(id) {
    const i = this.#gs.availableOrders.findIndex((o) => o.id === id);
    if (i < 0) return { ok: false, reason: "Ese pedido ya no está en el tablón." };
    const o = this.#gs.availableOrders[i];

    const rule = BusinessRules.canAcceptOrder(this.#gs.workshop, o);
    if (!rule.ok) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }

    this.#gs.availableOrders.splice(i, 1);
    this.#gs.workshop.addOrder(o);
    if (!this.#gs.focusOrderId) this.#gs.focusOrderId = o.id;
    this.#gs.refillOrders();
    this.#bus.emit("order:accepted", o);
    this.#bus.emit("state:changed");
    return { ok: true, order: o };
  }

  /** Cancelar un trabajo activo (libera un espacio). */
  cancel(id) {
    const o = this.#gs.workshop.orders.find((x) => x.id === id);
    if (!o) return { ok: false };
    this.#gs.workshop.cancelOrder(id);
    if (this.#gs.focusOrderId === id) this.#gs.focusOrderId = this.#gs.workshop.orders[0]?.id ?? null;
    this.#bus.emit("order:cancelled", o);
    this.#bus.emit("state:changed");
    return { ok: true };
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

    const rule = BusinessRules.canDeliver(o, this.#gs.workshop);
    this.#gs.player.stats.rulesTotal++;
    if (!rule.ok) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
    this.#gs.player.stats.rulesRespected++;

    o.deliver();
    this.#gs.workshop.removeOrder(o.id);
    if (this.#gs.focusOrderId === o.id) this.#gs.focusOrderId = this.#gs.workshop.orders[0]?.id ?? null;
    this.#gs.player.earn(o.reward);
    this.#gs.player.addReputation(CONFIG.ECONOMY.reputationPerOrder);
    if (o.metalReward) this.#gs.workshop.inventory.add("metal", o.metalReward);
    this.#gs.player.stats.ordersDelivered++;
    this.#gs.player.learn("MVC");                 // vivió el flujo Vista→Controlador→Modelo
    this.#gs.requirements.complete("RF-007");
    const lvls = this.#gs.player.addXp(CONFIG.XP.order);
    if (o.isFinal) this.#gs.player.stats.finalDone = true;

    this.#bus.emit("order:delivered", o);
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, order: o };
  }
}
