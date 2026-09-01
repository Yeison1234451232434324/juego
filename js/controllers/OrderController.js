import { BusinessRules } from "../services/BusinessRules.js";
import { FurnitureFactory } from "../services/FurnitureFactory.js";
import { QualityService } from "../services/QualityService.js";
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

    // completar líneas con el stock disponible (guardando la calidad de cada pieza)
    const taken = [];
    for (const line of o.lines) {
      while (o.remainingOf(line.type) > 0 && this.#gs.workshop.countStock(line.type) > 0) {
        const piece = this.#gs.workshop.takeStock(line.type);
        if (piece) taken.push(piece);
        o.addProduct(line.type);
      }
    }

    const rule = BusinessRules.canDeliver(o, this.#gs.workshop);
    this.#gs.player.stats.rulesTotal++;
    if (!rule.ok) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
    this.#gs.player.stats.rulesRespected++;

    // CALIDAD del pedido = media de las piezas entregadas → recompensa y reputación
    const quality = taken.length
      ? Math.round(taken.reduce((s, p) => s + (Number.isFinite(p.quality) ? p.quality : 70), 0) / taken.length)
      : 70;
    const tier = QualityService.tier(quality);
    const breakdown = QualityService.evaluatePiece(this.#gs).rows;
    const paid = Math.max(1, Math.round(o.reward * tier.mult));
    const rep = Math.max(1, Math.round(CONFIG.ECONOMY.reputationPerOrder * tier.mult) + (quality >= 90 ? 3 : 0));
    const diffXp = o.lines.reduce((s, l) => s + (CONFIG.XP.difficulty[l.type] ?? 0) * l.qty, 0);

    o.deliver();
    this.#gs.workshop.removeOrder(o.id);
    if (this.#gs.focusOrderId === o.id) this.#gs.focusOrderId = this.#gs.workshop.orders[0]?.id ?? null;
    this.#gs.player.earn(paid);
    this.#gs.player.addReputation(rep);
    if (o.metalReward) this.#gs.workshop.inventory.add("metal", o.metalReward);
    this.#gs.player.stats.ordersDelivered++;
    this.#gs.player.learn("MVC");                 // vivió el flujo Vista→Controlador→Modelo
    this.#gs.requirements.complete("RF-007");
    const xp = CONFIG.XP.order + diffXp;
    const lvls = this.#gs.player.addXp(xp);
    if (o.isFinal) this.#gs.player.stats.finalDone = true;

    this.#bus.emit("order:delivered", o);
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, order: o, quality, tier, breakdown, paid, rep, xp,
      stars: Math.round(quality / 20), quote: tier.quote };
  }
}
