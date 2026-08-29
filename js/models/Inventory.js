import { Material } from "./Material.js";

/**
 * Inventory — COMPOSICIÓN: el Workshop (y el Player) "tienen" un Inventory de Materials.
 * Encapsula la colección; nadie toca el Map desde fuera.
 */
export class Inventory {
  #slots = new Map();

  constructor(initial = {}) {
    for (const [t, q] of Object.entries(initial)) this.#slots.set(t, new Material(t, q));
  }

  #slot(type) {
    if (!this.#slots.has(type)) this.#slots.set(type, new Material(type, 0));
    return this.#slots.get(type);
  }

  has(type, qty = 1) { return (this.#slots.get(type)?.quantity ?? 0) >= qty; }
  count(type) { return this.#slots.get(type)?.quantity ?? 0; }
  add(type, qty) { this.#slot(type).add(qty); }
  remove(type, qty) { return this.#slot(type).remove(qty); }

  /** Comprueba y consume una receta {wood:4, nails:2}. Devuelve true si pudo. */
  consume(recipe) {
    if (!Object.entries(recipe).every(([t, q]) => this.has(t, q))) return false;
    for (const [t, q] of Object.entries(recipe)) this.remove(t, q);
    return true;
  }

  list() {
    return [...this.#slots.values()]
      .filter((m) => m.quantity > 0)
      .map((m) => ({ type: m.type, name: m.name, quantity: m.quantity, howToGet: m.howToGet }));
  }

  toJSON() {
    const o = {};
    for (const m of this.#slots.values()) if (m.quantity) o[m.type] = m.quantity;
    return o;
  }
}
