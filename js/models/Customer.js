import { GameEntity } from "./GameEntity.js";

/** Customer — objeto de valor: un cliente del taller (con su necesidad típica). */
export class Customer extends GameEntity {
  #kind; #pref;
  constructor(name, kind, pref = "") {
    super(name);
    this.#kind = kind;   // cafetería | restaurante | oficina | hotel | particular
    this.#pref = pref;   // "resistentes", "económica", "mesas pequeñas"…
  }
  get kind() { return this.#kind; }
  get pref() { return this.#pref; }
}
