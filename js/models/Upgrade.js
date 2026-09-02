import { GameEntity } from "./GameEntity.js";

/**
 * Upgrade — mejora de la Tienda. Encapsula si está comprada.
 * El efecto real lo aplican los servicios/controladores que consultan `key`.
 */
export class Upgrade extends GameEntity {
  #key; #cost; #desc; #category; #owned = false;

  constructor({ key, name, cost, desc, category = "Taller" }) {
    super(name);
    this.#key = key; this.#cost = cost; this.#desc = desc; this.#category = category;
  }

  get key() { return this.#key; }
  get cost() { return this.#cost; }
  get desc() { return this.#desc; }
  get category() { return this.#category; }
  get owned() { return this.#owned; }

  buy() { this.#owned = true; }
}
