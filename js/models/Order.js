import { GameEntity } from "./GameEntity.js";

/**
 * Order — pedido de un cliente = un requerimiento del negocio.
 * COMPOSICIÓN: "tiene" un Customer, una lista de productos y requisitos.
 * Estados: open → delivered.  Regla: no se entrega si faltan productos.
 */
export class Order extends GameEntity {
  #customer;
  #lines;      // [{ type:'Chair', qty:5, done:0 }]
  #notes;      // requisitos de texto
  #reward;
  #metalReward;
  #status = "open";
  code;

  constructor({ customer, lines, notes = [], reward, metalReward = 0, code }) {
    super(`Pedido ${customer.name}`);
    this.#customer = customer;
    this.#lines = lines.map((l) => ({ ...l, done: 0 }));
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

  get needed() { return this.#lines.reduce((s, l) => s + l.qty, 0); }
  get provided() { return this.#lines.reduce((s, l) => s + Math.min(l.done, l.qty), 0); }
  get progress() { return this.needed ? this.provided / this.needed : 1; }
  get isFulfilled() { return this.#lines.every((l) => l.done >= l.qty); }

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
}
