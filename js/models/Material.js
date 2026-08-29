import { GameEntity } from "./GameEntity.js";
import { CONFIG } from "../config/gameConfig.js";

/** Material — recurso del taller. Encapsula #quantity con validación (>= 0). */
export class Material extends GameEntity {
  #type;
  #quantity;

  constructor(type, quantity = 0) {
    super(CONFIG.MATERIAL_META[type]?.name ?? type);
    this.#type = type;
    this.#quantity = Math.max(0, quantity | 0);
  }

  get type() { return this.#type; }
  get quantity() { return this.#quantity; }
  get howToGet() { return CONFIG.MATERIAL_META[this.#type]?.source ?? ""; }

  add(n) { this.#quantity += Math.max(0, n | 0); }
  remove(n) {
    if (n > this.#quantity) return false;
    this.#quantity -= n;
    return true;
  }
}
