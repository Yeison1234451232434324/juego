import { GameEntity } from "./GameEntity.js";

/** Achievement — logro discreto. */
export class Achievement extends GameEntity {
  #key; #desc; #icon; #unlocked = false;

  constructor({ key, name, desc, icon }) {
    super(name);
    this.#key = key; this.#desc = desc; this.#icon = icon;
  }
  get key() { return this.#key; }
  get desc() { return this.#desc; }
  get icon() { return this.#icon; }
  get unlocked() { return this.#unlocked; }
  unlock() { if (this.#unlocked) return false; this.#unlocked = true; return true; }
}
