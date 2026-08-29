/**
 * GameEntity — CLASE BASE ABSTRACTA de todo objeto del dominio.
 * POO: abstracción + encapsulamiento (#id, #name de solo lectura).
 */
let _seq = 0;

export class GameEntity {
  #id;
  #name;

  constructor(name) {
    if (new.target === GameEntity) throw new Error("GameEntity es abstracta.");
    this.#id = `${new.target.name}-${++_seq}`;
    this.#name = name;
  }

  get id() { return this.#id; }
  get name() { return this.#name; }

  /** Polimórfico: cada entidad se describe a su manera. */
  describe() { return `${this.constructor.name}: ${this.#name}`; }
}
