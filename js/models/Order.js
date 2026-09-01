import { GameEntity } from "./GameEntity.js";
import { Customer } from "./Customer.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * Order — pedido de un cliente = un requerimiento del negocio.
 * COMPOSICIÓN: "tiene" un Customer, una lista de productos y requisitos.
 * Estados: open → delivered.
 * Reglas (en BusinessRules): no se acepta si hay demasiados activos; no se
 * entrega si faltan productos.
 */
export class Order extends GameEntity {
  #customer;
  #lines;      // [{ type:'Chair', qty:5, done:0 }]
  #notes;
  #reward;
  #metalReward;
  #status = "open";   // open | delivered
  code;
  isFinal = false;

  constructor({ customer, lines, notes = [], reward, metalReward = 0, code }) {
    super(`Pedido ${customer.name}`);
    this.#customer = customer;
    this.#lines = lines.map((l) => ({ type: l.type, qty: l.qty, done: l.done ?? 0 }));
    this.#notes = [...notes];
    this.#reward = reward;
    this.#metalReward = metalReward;
    this.code = code;
  }

  get customer() { return this.#customer; }
  get lines() { return this.#lines.map((l) => ({ ...l })); }
  get notes() { return [...this.#notes]; }
  get reward() { return this.#reward; }
  get metalReward() { return this.#metalReward; }
  get status() { return this.#status; }
  get isDelivered() { return this.#status === "delivered"; }

  get needed() { return this.#lines.reduce((s, l) => s + l.qty, 0); }
  get provided() { return this.#lines.reduce((s, l) => s + Math.min(l.done, l.qty), 0); }
  get progress() { return this.needed ? this.provided / this.needed : 1; }
  get isFulfilled() { return this.#lines.every((l) => l.done >= l.qty); }

  /** Materiales TOTALES que requiere este pedido (suma de recetas). */
  get materials() {
    const total = {};
    for (const l of this.#lines) {
      const recipe = CONFIG.RECIPES[l.type] ?? {};
      for (const [m, q] of Object.entries(recipe)) total[m] = (total[m] ?? 0) + q * l.qty;
    }
    return total;
  }

  /** Resumen legible: "1 Silla" / "2 Sillas, 1 Mesa". */
  get summary() {
    return this.#lines
      .map((l) => `${l.qty} ${CONFIG.MUEBLE_ES[l.type] ?? l.type}${l.qty > 1 ? "s" : ""}`)
      .join(", ");
  }

  /** Cuántos productos de un tipo faltan. */
  remainingOf(type) {
    const l = this.#lines.find((x) => x.type === type);
    return l ? Math.max(0, l.qty - l.done) : 0;
  }

  addProduct(type) {
    const l = this.#lines.find((x) => x.type === type && x.done < x.qty);
    if (!l) return false;
    l.done++;
    return true;
  }

  deliver() {
    if (this.#status === "open" && this.isFulfilled) { this.#status = "delivered"; return true; }
    return false;
  }

  toJSON() {
    return {
      code: this.code,
      customer: { name: this.#customer.name, kind: this.#customer.kind },
      lines: this.#lines.map((l) => ({ ...l })),
      notes: this.#notes,
      reward: this.#reward,
      metalReward: this.#metalReward,
      status: this.#status,
      isFinal: this.isFinal,
    };
  }

  static fromJSON(d) {
    const o = new Order({
      customer: new Customer(d.customer.name, d.customer.kind),
      lines: d.lines,
      notes: d.notes,
      reward: d.reward,
      metalReward: d.metalReward,
      code: d.code,
    });
    o.setStatus(d.status ?? "open");
    o.isFinal = !!d.isFinal;
    return o;
  }

  /** Solo para rehidratar desde el guardado. */
  setStatus(s) { this.#status = s; }
}
