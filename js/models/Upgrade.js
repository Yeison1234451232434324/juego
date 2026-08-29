import { GameEntity } from "./GameEntity.js";

/**
 * Upgrade — mejora de la Tienda. Encapsula si está comprada.
 * El efecto real lo aplican los servicios/controladores que consultan `key`.
 */
export class Upgrade extends GameEntity {
  #key; #cost; #desc; #owned = false;

  constructor({ key, name, cost, desc }) {
    super(name);
    this.#key = key; this.#cost = cost; this.#desc = desc;
  }

  get key() { return this.#key; }
  get cost() { return this.#cost; }
  get desc() { return this.#desc; }
  get owned() { return this.#owned; }

  buy() { this.#owned = true; }
}
