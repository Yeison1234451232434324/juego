import { GameEntity } from "./GameEntity.js";

/** Customer — objeto de valor: un cliente del taller. */
export class Customer extends GameEntity {
  #kind;
  constructor(name, kind) {
    super(name);
    this.#kind = kind; // cafetería | restaurante | oficina | hotel...
  }
  get kind() { return this.#kind; }
}
