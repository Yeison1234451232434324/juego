import { Inventory } from "./Inventory.js";
import { Worker } from "./Worker.js";
import { Order } from "./Order.js";

/**
 * Workshop — COMPOSICIÓN central del MODELO.
 * "tiene" un Inventory, un Worker, una lista de muebles terminados (stock) y
 * los pedidos activos.
 */
export class Workshop {
  #inventory = new Inventory({});
  #worker = new Worker("Mario");
  #stock = [];        // [{ type, style }]  muebles fabricados sin entregar
  #orders = [];       // pedidos aceptados

  get inventory() { return this.#inventory; }
  get worker() { return this.#worker; }
  get stock() { return this.#stock; }
  get orders() { return this.#orders; }

  addStock(type, style = "rústico", quality = 70) { this.#stock.push({ type, style, quality }); }
  /** Saca una pieza del stock y la devuelve (o null). */
  takeStock(type) {
    const i = this.#stock.findIndex((s) => s.type === type);
    if (i < 0) return null;
    return this.#stock.splice(i, 1)[0];
  }
  countStock(type) { return this.#stock.filter((s) => s.type === type).length; }

  addOrder(o) { this.#orders.push(o); }
  removeOrder(id) { this.#orders = this.#orders.filter((o) => o.id !== id); }
  hasOrder(id) { return this.#orders.some((o) => o.id === id); }
  cancelOrder(id) {
    const before = this.#orders.length;
    this.#orders = this.#orders.filter((o) => o.id !== id);
    return this.#orders.length < before;
  }

  hydrate(d) {
    if (!d) return;
    this.#inventory = new Inventory(d.inventory ?? {});
    // MIGRACIÓN v5→v6: las piezas antiguas no tenían calidad → 70 por defecto.
    this.#stock = (d.stock ?? []).map((s) => ({
      type: s.type, style: s.style ?? "rústico", quality: Number.isFinite(s.quality) ? s.quality : 70,
    }));
    this.#worker = new Worker("Mario");   // siempre libre al recargar
    this.#orders = (d.orders ?? []).map((od) => Order.fromJSON(od));
  }

  toJSON() {
    return {
      inventory: this.#inventory.toJSON(),
      stock: this.#stock,
      orders: this.#orders.map((o) => o.toJSON()),
    };
  }
}
