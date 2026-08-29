import { GameEntity } from "./GameEntity.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * Furniture — CLASE ABSTRACTA de mueble. Base de Chair, Table, Cabinet.
 * POO:
 *  - Herencia: extends GameEntity.
 *  - Encapsulamiento: #price y #materials privados; setPrice() valida (regla de negocio).
 *  - Abstracción: calculateProductionTime() es abstracto.
 *  - Composición: un mueble "tiene" una receta de materiales.
 */
export class Furniture extends GameEntity {
  #price;
  #materials;
  #style;

  constructor(name, price, materials, style = "rústico") {
    if (new.target === Furniture) throw new Error("Furniture es abstracta.");
    super(name);
    this.#materials = { ...materials };
    this.#style = style;
    this.#price = 0;
    this.setPrice(price);
  }

  get price() { return this.#price; }
  get style() { return this.#style; }
  get materials() { return { ...this.#materials }; }

  /** REGLA DE NEGOCIO: el precio no puede ser <= 0 ni menor al coste. */
  setPrice(value) {
    if (typeof value !== "number" || Number.isNaN(value))
      return { ok: false, reason: "El precio debe ser un número." };
    if (value <= 0)
      return { ok: false, reason: "El precio de venta no puede ser menor o igual a cero." };
    this.#price = Math.round(value);
    return { ok: true, reason: "" };
  }

  addMaterial(type, qty) { this.#materials[type] = (this.#materials[type] ?? 0) + qty; }

  productionCost(prices = CONFIG.ECONOMY.buyPrices) {
    return Object.entries(this.#materials).reduce((s, [m, q]) => s + (prices[m] ?? 5) * q, 0);
  }

  canBuildWith(inventory) {
    return Object.entries(this.#materials).every(([m, q]) => inventory.has(m, q));
  }

  /** ABSTRACTO — POLIMORFISMO: cada subclase da su tiempo. */
  calculateProductionTime() { throw new Error("Implementar en la subclase."); }

  describe() {
    return `${this.constructor.name} "${this.name}" · ${this.#style} · $${this.#price} · ${this.calculateProductionTime()}s`;
  }
}
